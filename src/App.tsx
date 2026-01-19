import { SignInButton, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScheduleMaker } from "./components/ScheduleMaker";
import { AdminDashboard } from "./components/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { useLanguage } from "./context/LanguageContext";

import { SharePage } from "./components/SharePage";

function App() {
  const { isSignedIn, isLoaded } = useUser();
  const { t } = useLanguage();
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const ensureUser = useMutation(api.users.ensureUser);

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

  if (!isLoaded) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50/30 font-sans overflow-hidden">
      <Toaster position="top-center" />

      <Routes>
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route
          path="/*"
          element={
            !isSignedIn ? (
              <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
                <div className="mb-12 text-center space-y-6">
                  <div className="w-48 h-48 bg-white/50 backdrop-blur rounded-3xl overflow-hidden flex items-center justify-center mx-auto mb-8 shadow-2xl transition-transform hover:scale-105 border border-white/20">
                    <img
                      src="/assets/logo.webp"
                      alt="KRSan Logo"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed">
                    {t("landing.tagline")}
                  </p>
                </div>

                <Card className="w-full max-w-md shadow-2xl border-none p-2 bg-white/80 backdrop-blur">
                  <CardHeader className="text-center pb-8 pt-6">
                    <CardTitle className="text-xl font-display font-semibold">
                      {t("landing.welcome")}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {t("landing.sub_welcome")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <SignInButton mode="modal">
                      <Button className="w-full h-12 text-base font-medium bg-blue-700 hover:bg-blue-800 text-white transition-all font-sans rounded-lg shadow-lg shadow-blue-200">
                        {t("landing.continue")}
                      </Button>
                    </SignInButton>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <Navbar
                  userData={userData as any}
                  step={makerStep}
                  setStep={handleStepChange}
                  onRestoreArchitect={() => setMakerStep(lastArchitectStep)}
                />

                <main className="flex-1 min-h-0 overflow-hidden">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ScheduleMaker
                          externalStep={makerStep}
                          onStepChange={handleStepChange}
                          userData={userData as any}
                        />
                      }
                    />
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Routes>
                </main>
              </>
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
