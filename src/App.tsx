import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScheduleMaker } from "./components/ScheduleMaker";
import { AdminDashboard } from "./components/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { toast } from "sonner";

import { SharePage } from "./components/SharePage";
import { usePlanArchive } from "./hooks/usePlanArchive";
import { useLanguage } from "./context/LanguageContext";

function App() {
  const { t } = useLanguage();
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const ensureUser = useMutation(api.users.ensureUser);
  const { pendingMigrationCount, migrateLocalPlans } = usePlanArchive();

  // State shared with Navbar for global navigation
  const [makerStep, setMakerStep] = useState<
    "config" | "select" | "view" | "archive"
  >("config");
  const [lastArchitectStep, setLastArchitectStep] = useState<
    "config" | "select" | "view"
  >("config");

  const handleStepChange = (step: "config" | "select" | "view" | "archive") => {
    setMakerStep(step);
    if (step !== "archive") {
      setLastArchitectStep(step);
    }
  };

  // Sync user to Convex
  useEffect(() => {
    if (isAuthenticated) {
      ensureUser().catch((err) => console.error("Sync user error:", err));
    }
  }, [isAuthenticated, ensureUser]);

  // Offer to import plans built before signing in. Prompted, never automatic:
  // the plans are the user's, and silently moving them is not ours to decide.
  const migrationOffered = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || pendingMigrationCount === 0) return;
    if (migrationOffered.current) return;
    migrationOffered.current = true;

    const count = pendingMigrationCount;
    toast(t("toast.migrate_title"), {
      description: t("toast.migrate_desc", { count }),
      duration: Infinity,
      action: {
        label: t("toast.migrate_action"),
        onClick: () => {
          void migrateLocalPlans()
            .then((n) => {
              if (n > 0) toast.success(t("toast.plans_imported", { count: n }));
              if (n < count) {
                toast.warning(
                  t("toast.import_partial", { imported: n, total: count }),
                );
              }
            })
            .catch((err) =>
              toast.error(t("toast.import_failed", { error: err.message })),
            );
        },
      },
    });
  }, [isAuthenticated, pendingMigrationCount, migrateLocalPlans, t]);

  return (
    <div className="h-[100dvh] flex flex-col bg-background font-sans overflow-hidden">
      <Toaster position="top-center" />

      <Routes>
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route
          path="/*"
          element={
            <>
              <Navbar
                userData={userData as never}
                step={makerStep}
                setStep={handleStepChange}
                onRestoreArchitect={() => setMakerStep(lastArchitectStep)}
              />

              <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ScheduleMaker
                        externalStep={makerStep}
                        onStepChange={handleStepChange}
                        userData={userData as never}
                      />
                    }
                  />
                  {/* AdminDashboard gates itself; no route guard needed. */}
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </main>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
