import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
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
import { LogOut, CalendarRange } from "lucide-react";
import { ScheduleMaker } from "./components/ScheduleMaker";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";

function App() {
  const { isSignedIn, user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const ensureUser = useMutation(api.users.ensureUser);

  // Sync user to Convex
  useEffect(() => {
    if (isAuthenticated) {
      ensureUser().catch((err) => console.error("Sync user error:", err));
    }
  }, [isAuthenticated, ensureUser]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
        <Toaster position="top-center" />
        <div className="mb-8 text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <CalendarRange className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            KRS Planner AI
          </h1>
          <p className="text-slate-500 max-w-sm">
            The smartest way to plan your university schedule. Optimized by AI,
            crafted by you.
          </p>
        </div>

        <Card className="w-full max-w-sm shadow-xl border-none">
          <CardHeader className="text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in to start planning your semester
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton mode="modal">
              <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 transition-all">
                Continue with Clerk
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 max-w-6xl mx-auto items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CalendarRange className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              KRS Planner
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold">{user?.fullName}</span>
              <span className="text-xs text-slate-500">
                Credits: {userData?.credits ?? 0}/5
              </span>
            </div>

            <img
              src={user?.imageUrl}
              className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
            />

            <SignOutButton>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-red-50 hover:text-red-500"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <ScheduleMaker />
      </main>

      <footer className="py-6 border-t bg-white">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-slate-400">
          © 2026 KRS Planner AI • Built for Students with 0 Rupiah Cost
        </div>
      </footer>
    </div>
  );
}

export default App;
