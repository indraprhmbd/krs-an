import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "../context/LanguageContext";

export function TermsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 border-b border-border bg-card">
        <div className="container mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Kembali ke beranda"
            onClick={() => navigate("/")}
          >
            <Icon name="chevron-left" size={20} />
          </Button>
          <h1 className="text-title text-foreground md:text-headline">
            {t("terms.title")}
          </h1>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto">
        <main className="container mx-auto max-w-3xl space-y-4 px-4 py-8">
          <div className="rounded-card border border-border bg-card p-4">
            <p className="text-body text-muted-foreground">
              {t("terms.intro")}
            </p>
          </div>

          <div className="space-y-2 rounded-card border border-border bg-card p-4">
            <h2 className="text-title text-foreground">
              {t("terms.usage_title")}
            </h2>
            <p className="text-body text-muted-foreground">
              {t("terms.usage")}
            </p>
          </div>

          <div className="space-y-2 rounded-card border border-border bg-card p-4">
            <h2 className="text-title text-foreground">
              {t("terms.credits_title")}
            </h2>
            <p className="text-body text-muted-foreground">
              {t("terms.credits")}
            </p>
          </div>

          <p className="rounded-card border border-border bg-muted p-4 text-caption text-muted-foreground">
            {t("terms.no_warranty")}
          </p>
        </main>
      </div>
    </div>
  );
}
