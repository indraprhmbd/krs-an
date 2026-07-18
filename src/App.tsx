import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScheduleMaker } from "./components/ScheduleMaker";
import { AdminDashboard } from "./components/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { TutorialVideosDialog } from "./components/layout/Footer";
import { toast } from "sonner";

import { SharePage } from "./components/SharePage";
import { PrivacyPage } from "./components/PrivacyPage";
import { TermsPage } from "./components/TermsPage";
import { usePlanArchive } from "./hooks/usePlanArchive";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useLanguage } from "./context/LanguageContext";
import { SessionProvider } from "./context/SessionContext";

function App() {
  const { t } = useLanguage();
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const ensureUser = useMutation(api.users.ensureUser);
  const { pendingMigrationCount, migrateLocalPlans } = usePlanArchive();

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

  // First-visit nudge toward the tutorial videos. One-time: marked seen the
  // moment the toast is shown, not just when the action is clicked, so a
  // dismissed toast never reappears -- but an emptied localStorage (Hapus
  // Sesi, clearing site data, a new device) is treated as a genuinely new
  // visit and shows it again, which is fine.
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hasSeenTutorialNudge, setHasSeenTutorialNudge] = useLocalStorage(
    "has_seen_tutorial_nudge",
    false,
  );
  const tutorialNudgeShown = useRef(false);
  useEffect(() => {
    if (hasSeenTutorialNudge || tutorialNudgeShown.current) return;
    tutorialNudgeShown.current = true;
    setHasSeenTutorialNudge(true);
    toast(t("toast.tutorial_nudge_title"), {
      description: t("toast.tutorial_nudge_desc"),
      duration: 10000,
      action: {
        label: t("toast.tutorial_nudge_action"),
        onClick: () => setIsTutorialOpen(true),
      },
    });
  }, [hasSeenTutorialNudge, setHasSeenTutorialNudge, t]);

  return (
    <div className="h-[100dvh] flex flex-col bg-background font-sans overflow-hidden">
      <Toaster />
      <TutorialVideosDialog
        isOpen={isTutorialOpen}
        onOpenChange={setIsTutorialOpen}
      />

      <Routes>
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/*"
          element={
            <SessionProvider>
              <Navbar userData={userData as never} />

              <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <Routes>
                  <Route
                    path="/"
                    element={<ScheduleMaker userData={userData as never} />}
                  />
                  {/* AdminDashboard gates itself; no route guard needed. */}
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </main>
            </SessionProvider>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
