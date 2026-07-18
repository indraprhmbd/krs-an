import { useCallback, useMemo } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { ArchivedPlan, Plan, RawArchivedPlan } from "@/types";
import { useLocalStorage } from "./useLocalStorage";

/**
 * The plan archive, with two interchangeable backends.
 *
 * Signed in: Convex (`plans` table), shareable, survives devices.
 * Anonymous: localStorage, not shareable, migrated into Convex on sign-in.
 *
 * Call sites should not branch on auth. They read `plans` and call
 * save/delete/rename, and this hook routes to the right backend. `isLocal`
 * exists only for the few places that must say something different to an
 * anonymous user (sharing, mainly).
 */

export const LOCAL_ARCHIVE_KEY = "krs-local-archive";

/** Mirrors the server-side cap in convex/plans.ts. */
export const ARCHIVE_LIMIT = 30;

export interface SavePlanArgs {
  name: string;
  plan: Plan;
  isSmartGenerated?: boolean;
  generatedBy?: string;
}

/**
 * A row is usable only if its data actually parsed into something with courses.
 *
 * Convex hands back `data: null` for a corrupt row, and localStorage can hold
 * anything a previous version wrote. Both are filtered here so the two backends
 * agree on their output shape, including when they fail. Without this, a single
 * unparseable row took down the whole archive screen with a TypeError on
 * `plan.data.courses`.
 *
 * Also requires at least one course. Older saves (predating guards added to
 * commitSmartPlans/handleSaveManualPlan) or a shared plan that was emptied out
 * via the manual editor before being shared could persist `courses: []` --
 * structurally valid, functionally useless. "Muat ke Penampil" on one of these
 * faithfully loads nothing, which reads as a bug even though the archive did
 * exactly what was asked. Treating it the same as a corrupt row (filtered,
 * counted in corruptCount) surfaces it instead of silently showing an empty
 * viewer.
 */
function isUsable(plan: RawArchivedPlan): plan is ArchivedPlan {
  return (
    plan?.data != null &&
    typeof plan.data === "object" &&
    Array.isArray(plan.data.courses) &&
    plan.data.courses.length > 0
  );
}

export interface PlanArchive {
  plans: ArchivedPlan[] | undefined;
  /** True when plans live in localStorage rather than Convex. */
  isLocal: boolean;
  /** Rows dropped this render because their data could not be read. */
  corruptCount: number;
  /** Local plans waiting to be migrated. Always 0 when anonymous. */
  pendingMigrationCount: number;
  savePlan: (args: SavePlanArgs) => Promise<string>;
  deletePlan: (planId: string) => Promise<void>;
  renamePlan: (planId: string, newName: string) => Promise<void>;
  /** Copy local plans into Convex, then clear local. Returns count imported. */
  migrateLocalPlans: () => Promise<number>;
}

export function usePlanArchive(): PlanArchive {
  const { isAuthenticated } = useConvexAuth();

  const [localPlans, setLocalPlans] = useLocalStorage<RawArchivedPlan[]>(
    LOCAL_ARCHIVE_KEY,
    [],
  );

  // listPlans returns [] rather than throwing when unauthenticated, but skip
  // anyway so an anonymous session sends no pointless request.
  // Typed Raw, not ArchivedPlan: the previous cast asserted data was non-null
  // when the server can return null, which is exactly what hid the crash.
  const remotePlans = useQuery(
    api.plans.listPlans,
    isAuthenticated ? {} : "skip",
  ) as RawArchivedPlan[] | undefined;

  const savePlanMutation = useMutation(api.plans.savePlan);
  const deletePlanMutation = useMutation(api.plans.deletePlan);
  const renamePlanMutation = useMutation(api.plans.renamePlan);

  const savePlan = useCallback(
    async ({ name, plan, isSmartGenerated, generatedBy }: SavePlanArgs) => {
      if (isAuthenticated) {
        return (await savePlanMutation({
          name,
          data: JSON.stringify(plan),
          isSmartGenerated,
          generatedBy,
        })) as string;
      }

      if (localPlans.length >= ARCHIVE_LIMIT) {
        throw new Error(
          `Maximum limit of ${ARCHIVE_LIMIT} plans reached. Please delete some plans to save a new one.`,
        );
      }

      const entry: RawArchivedPlan = {
        _id: crypto.randomUUID(),
        name,
        data: plan,
        createdAt: Date.now(),
        isSmartGenerated,
        generatedBy,
      };
      setLocalPlans((prev) => [entry, ...prev]);
      return entry._id;
    },
    [isAuthenticated, localPlans.length, savePlanMutation, setLocalPlans],
  );

  const deletePlan = useCallback(
    async (planId: string) => {
      if (isAuthenticated) {
        await deletePlanMutation({ planId: planId as never });
        return;
      }
      setLocalPlans((prev) => prev.filter((p) => p._id !== planId));
    },
    [isAuthenticated, deletePlanMutation, setLocalPlans],
  );

  const renamePlan = useCallback(
    async (planId: string, newName: string) => {
      if (isAuthenticated) {
        await renamePlanMutation({ planId: planId as never, newName });
        return;
      }
      setLocalPlans((prev) =>
        prev.map((p) => (p._id === planId ? { ...p, name: newName } : p)),
      );
    },
    [isAuthenticated, renamePlanMutation, setLocalPlans],
  );

  const migrateLocalPlans = useCallback(async () => {
    if (!isAuthenticated || localPlans.length === 0) return 0;

    // Oldest first so the archive keeps its original ordering once imported.
    // Unreadable rows are skipped rather than uploaded: pushing a corrupt plan
    // into Convex would just recreate the same problem server-side.
    const ordered = [...localPlans]
      .filter(isUsable)
      .sort((a, b) => a.createdAt - b.createdAt);
    const imported: string[] = [];

    for (const entry of ordered) {
      try {
        await savePlanMutation({
          name: entry.name,
          data: JSON.stringify(entry.data),
          isSmartGenerated: entry.isSmartGenerated,
          generatedBy: entry.generatedBy,
        });
        imported.push(entry._id);
      } catch (err) {
        // Most likely the server-side 30 cap. Keep whatever did not import so
        // the user does not lose work, and stop trying.
        console.warn("Plan migration stopped:", err);
        break;
      }
    }

    setLocalPlans((prev) => prev.filter((p) => !imported.includes(p._id)));
    return imported.length;
  }, [isAuthenticated, localPlans, savePlanMutation, setLocalPlans]);

  return useMemo(() => {
    const raw = isAuthenticated ? remotePlans : localPlans;
    // `undefined` means "still loading" and must survive the filter, otherwise
    // the archive flashes its empty state before the query resolves.
    const plans = raw?.filter(isUsable);
    const usableCount = plans?.length ?? 0;

    return {
      plans,
      isLocal: !isAuthenticated,
      corruptCount: (raw?.length ?? 0) - usableCount,
      pendingMigrationCount: isAuthenticated
        ? localPlans.filter(isUsable).length
        : 0,
      savePlan,
      deletePlan,
      renamePlan,
      migrateLocalPlans,
    };
  }, [
    isAuthenticated,
    remotePlans,
    localPlans,
    savePlan,
    deletePlan,
    renamePlan,
    migrateLocalPlans,
  ]);
}
