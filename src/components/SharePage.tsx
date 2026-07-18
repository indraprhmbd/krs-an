import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleGrid } from "./ScheduleGrid";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";
import { useState } from "react";
import { SignInButton } from "@clerk/clerk-react";
import { getProdiConfig } from "../lib/prodi";
import { formatSchedule } from "../lib/schedule-format";
import { useLanguage } from "../context/LanguageContext";

export function SharePage() {
  const { t } = useLanguage();
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  // Clerk's isSignedIn resolves before Convex has an authenticated client, so
  // importing on it would fire an unauthenticated mutation. See CLAUDE.md.
  const { isAuthenticated } = useConvexAuth();
  const [isImporting, setIsImporting] = useState(false);

  const sharedPlan = useQuery(api.plans.getSharedPlan, {
    shareId: shareId || "",
  });

  const savePlanMutation = useMutation(api.plans.savePlan);

  const isCourseCentric = sharedPlan?.data?.courses?.[0]?.prodi
    ? getProdiConfig(sharedPlan.data.courses[0].prodi).isCourseCentric
    : false;

  const handleImport = async () => {
    if (!sharedPlan) return;
    if (!sharedPlan.data.courses || sharedPlan.data.courses.length === 0) {
      toast.warning(t("toast.share_empty"));
      return;
    }

    setIsImporting(true);
    try {
      await savePlanMutation({
        name: `${sharedPlan.name} (Shared)`,
        data: JSON.stringify(sharedPlan.data),
        isSmartGenerated: sharedPlan.isSmartGenerated,
        generatedBy: sharedPlan.generatedBy,
      });
      toast.success(t("toast.share_imported"));
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      toast.error(t("toast.import_failed", { error: err.message }));
    } finally {
      setIsImporting(false);
    }
  };

  if (sharedPlan === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Icon name="spinner" size={28} className="animate-spin text-primary" />
          <p className="text-body text-muted-foreground">
            Fetching shared plan...
          </p>
        </div>
      </div>
    );
  }

  if (sharedPlan === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md overflow-hidden">
          <div className="bg-primary p-6 text-center text-primary-foreground">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-card bg-primary-foreground/10">
              <Icon name="share" size={24} />
            </span>
            <h1 className="text-headline">Plan Not Found</h1>
            <p className="mt-1.5 text-body text-primary-foreground/80">
              The link might be expired or incorrect.
            </p>
          </div>
          <CardContent className="p-4">
            <Button className="h-12 w-full font-bold" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSKS = sharedPlan.data.courses.reduce(
    (sum: number, c: any) => sum + (c.sks || 0),
    0,
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 border-b border-border bg-card">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to planner"
              onClick={() => navigate("/")}
            >
              <Icon name="chevron-left" size={20} />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate pr-4 text-body text-foreground md:text-title">
                {sharedPlan.name}
              </h1>
              <p className="hidden font-mono text-caps uppercase text-muted-foreground md:block">
                SHARED KRS PLAN | {sharedPlan.data.courses.length} MATKUL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <SignInButton mode="modal">
                <Button className="h-9 gap-2 px-3 text-caption font-bold md:px-4">
                  <Icon name="user" size={14} />
                  <span className="hidden md:inline">Login to Import</span>
                  <span className="md:hidden">Login</span>
                </Button>
              </SignInButton>
            ) : (
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="h-9 gap-2 px-3 text-caption font-bold md:px-4"
              >
                <Icon name="bookmark" size={14} />
                <span className="hidden md:inline">
                  {isImporting ? "Importing..." : "Add to My Archive"}
                </span>
                <span className="md:hidden">
                  {isImporting ? "..." : "Import"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto">
        <main className="container mx-auto max-w-5xl space-y-4 px-4 py-4">
          {/*
            Two banners, one shape. The AI variant was a violet gradient panel
            and the manual one a near-black slab; they were rival accents for
            the same slot.
          */}
          <section className="flex flex-col justify-between gap-3 rounded-card border border-border bg-card p-4 md:flex-row md:items-center">
            <div className="min-w-0">
              {sharedPlan.isSmartGenerated ? (
                <>
                  <div className="mb-1.5 flex items-center gap-2 text-primary">
                    <Icon name="sparkles" size={14} />
                    <span className="text-caps uppercase">
                      AI Optimized Schedule
                    </span>
                  </div>
                  <p className="max-w-md text-body text-foreground">
                    Generated with <strong>Architect Engine</strong> for maximum
                    time efficiency.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-1.5 flex items-center gap-2 text-muted-foreground">
                    <Icon name="user" size={14} />
                    <span className="text-caps uppercase">
                      Manual KRS Plan
                    </span>
                  </div>
                  <p className="max-w-md text-body text-foreground">
                    Curated by a fellow student.
                  </p>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-baseline gap-1.5 border-t border-border pt-3 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <span className="text-caps uppercase text-muted-foreground">
                Total
              </span>
              <span className="text-display text-foreground">
                {totalSKS}
              </span>
              <span className="text-body font-bold text-muted-foreground">
                SKS
              </span>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <div className="h-[70vh] rounded-card border border-border bg-card p-2 lg:h-[calc(100vh-16rem)]">
                <ScheduleGrid
                  courses={sharedPlan.data.courses}
                  isCourseCentric={isCourseCentric}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted px-4 py-3">
                  <div>
                    <CardTitle className="text-body">
                      Inventory
                    </CardTitle>
                    <p className="text-caption text-muted-foreground">
                      {sharedPlan.data.courses.length} courses total
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="no-print h-8 text-caption font-bold"
                  >
                    Print Report
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
                    {sharedPlan.data.courses.map((c: any, i: number) => (
                      <div key={i} className="p-3 transition-colors hover:bg-accent">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <span className="font-mono text-caption uppercase text-muted-foreground">
                            {c.code} |{" "}
                            {isCourseCentric ? `Class ${c.class}` : c.class}
                          </span>
                          <Badge
                            variant="outline"
                            className="h-4 shrink-0 text-grid"
                          >
                            {c.sks} SKS
                          </Badge>
                        </div>
                        <p className="mb-1 text-caption font-bold text-foreground">
                          {isCourseCentric
                            ? `${formatSchedule(c.schedule)} @ ${c.room || "TBA"}`
                            : c.name}
                        </p>
                        {isCourseCentric ? (
                          <p className="text-caption font-bold text-muted-foreground">
                            {c.name}
                          </p>
                        ) : (
                          <p className="truncate text-caption font-bold text-muted-foreground">
                            {c.lecturer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2 rounded-card border border-border bg-muted p-4">
                <h4 className="flex items-center gap-2 font-bold text-foreground">
                  <Icon name="history" className="text-primary" />
                  Want to make your own?
                </h4>
                <p className="text-caption text-muted-foreground">
                  Join 1,000+ students using KRSan to eliminate conflicts and
                  maximize academic efficiency.
                </p>
                <Button
                  variant="ghost"
                  className="h-auto justify-start p-0 text-caption font-bold text-primary hover:bg-transparent"
                  onClick={() => navigate("/")}
                >
                  Get Started for Free
                </Button>
              </div>
            </div>
          </div>
        </main>

        <footer className="container mx-auto max-w-5xl border-t border-border px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img
                src="/assets/logo.webp"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="tracking-tighter text-foreground">
                KRSan
              </span>
            </div>
            <p className="font-mono text-caps uppercase text-muted-foreground">
              Copyright 2026 Academic Optimization Systems
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
