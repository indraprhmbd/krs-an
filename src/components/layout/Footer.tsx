import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

/**
 * One source of truth for the donation account. The displayed number and the
 * one the copy button wrote had drifted apart, so anyone using the button was
 * sending money to a different account than the one on screen. Render and copy
 * both read from here; the copy strips the display spacing.
 */
const ACCOUNT_NUMBER = "9010 8876 8893";
const ACCOUNT_HOLDER = "ARSYADI INDRA";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Brand section */}
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start">
              <img
                src="/assets/logo.webp"
                alt="KRSan"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="mx-auto max-w-xs text-caption text-muted-foreground md:mx-0">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              <AboutDialog />
              <HowToUseDialog />
              <DonateDialog />
              <a
                href="mailto:indraprhmbd@gmail.com"
                className="group flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-card border border-border bg-muted transition-colors group-hover:bg-accent">
                  <Icon name="message" size={18} />
                </span>
                <span className="text-caps uppercase">
                  {t("footer.feedback")}
                </span>
              </a>
            </div>
          </div>

          {/* Connect section */}
          <div className="space-y-3 text-center md:text-right">
            <h4 className="text-caps uppercase text-muted-foreground">
              Connect with Author
            </h4>
            <div className="flex justify-center gap-2 md:justify-end">
              <SocialIcon
                icon="instagram"
                label="Instagram"
                href="https://instagram.com/indraprhmbd_"
              />
              <SocialIcon
                icon="github"
                label="GitHub"
                href="https://github.com/indraprhmbd"
              />
              <SocialIcon
                icon="mail"
                label="Email"
                href="mailto:indraprhmbd@gmail.com"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-6 md:flex-row">
          <p className="font-mono text-caption tracking-tighter text-muted-foreground">
            ELEGANT PLANNING | AI DRIVEN | ACADEMIC TOOL
          </p>
          <div className="flex items-center gap-2 font-mono text-caps uppercase text-muted-foreground">
            <span>Copyright 2026 KRSan Production</span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <span>Built by Indra</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** The three footer entries share one shape; only the icon and label differ. */
function FooterLinkTrigger({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <button className="group flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
      <span className="flex h-10 w-10 items-center justify-center rounded-card border border-border bg-muted transition-colors group-hover:bg-accent">
        <Icon name={icon} size={18} />
      </span>
      <span className="text-caps uppercase">
        {label}
      </span>
    </button>
  );
}

/** The coloured band every footer dialog opens with. */
function DialogBanner({
  title,
  description,
  descriptionHidden,
}: {
  title: string;
  description: string;
  descriptionHidden?: boolean;
}) {
  return (
    <DialogHeader className="p-0">
      <div className="relative bg-primary p-4 text-left text-primary-foreground">
        <DialogTitle className="mb-1 text-headline">
          {title}
        </DialogTitle>
        <DialogDescription
          className={
            descriptionHidden
              ? "hidden"
              : "text-body italic text-primary-foreground/80"
          }
        >
          {description}
        </DialogDescription>
        <DialogClose className="absolute right-3 top-3 rounded-full p-2 transition-colors hover:bg-primary-foreground/10">
          <Icon name="close" size={18} label="Close" />
        </DialogClose>
      </div>
    </DialogHeader>
  );
}

export function HowToUseDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { t } = useLanguage();
  const steps = [
    { n: "01", title: t("howtouse.step1_title"), desc: t("howtouse.step1_desc") },
    { n: "02", title: t("howtouse.step2_title"), desc: t("howtouse.step2_desc") },
    { n: "03", title: t("howtouse.step3_title"), desc: t("howtouse.step3_desc") },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <FooterLinkTrigger icon="help" label={t("footer.howtouse")} />
        )}
      </DialogTrigger>
      <DialogContent hideClose size="2xl" padded={false}>
        <DialogBanner
          title={t("howtouse.title")}
          description="Guide on how to use KRSan application."
          descriptionHidden
        />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.n} className="space-y-1.5">
                <h3 className="flex items-center gap-2 text-body font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-control bg-muted text-caption text-primary">
                    {step.n}
                  </span>
                  {step.title}
                </h3>
                <p className="text-caption text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3 self-start rounded-card border border-border bg-muted p-4">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="sparkles" size={14} />
              <h4 className="text-caption font-bold uppercase">
                {t("howtouse.premium_title")}
              </h4>
            </div>
            <p className="text-caption text-muted-foreground">
              {t("howtouse.premium_desc")}
            </p>
            <p className="border-t border-border pt-3 text-caption italic text-muted-foreground">
              Pro tip: Lock matkul favoritmu sebelum generate untuk hasil yang
              lebih spesifik!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SocialIcon({
  icon,
  href,
  label,
}: {
  icon: IconName;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
    >
      <Icon name={icon} label={label} />
    </a>
  );
}

export function AboutDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <FooterLinkTrigger icon="info" label={t("footer.about")} />}
      </DialogTrigger>
      <DialogContent hideClose size="2xl" padded={false}>
        <DialogBanner
          title={t("about.title")}
          description={'"Simplicity in Complexity"'}
        />
        <div className="space-y-4 p-4 text-body text-muted-foreground">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-control bg-muted text-caption text-primary">
                01
              </span>
              {t("about.background_title")}
            </h3>
            <p>{t("about.background_desc")}</p>
          </div>

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-control bg-muted text-caption text-primary">
                02
              </span>
              {t("about.mission_title")}
            </h3>
            <p>{t("about.mission_desc")}</p>
          </div>

          <p className="rounded-card border-l-2 border-l-primary border-border bg-muted p-4 text-caption italic">
            {t("about.quote")}
          </p>

          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <Icon name="shield" className="text-primary" />
              {t("about.legal_title")}
            </h3>
            <p className="rounded-card border border-border bg-muted p-4 text-caption">
              {t("about.legal_desc")}
            </p>
            <p className="text-caption text-muted-foreground">
              {t("about.illustration_credit")}{" "}
              <a
                href="https://storyset.com/idea"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Storyset
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DonateDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <FooterLinkTrigger icon="coffee" label={t("footer.donate")} />
        )}
      </DialogTrigger>
      <DialogContent hideClose size="md" padded={false}>
        <DialogBanner
          title="Support Author"
          description="Dukung pengembangan KRSan agar tetap gratis dan tanpa iklan."
        />

        <div className="space-y-4 p-4">
          <div className="space-y-3 rounded-card border border-dashed border-border-strong bg-muted p-4 text-center">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
              <img
                src="https://cdn.brandfetch.io/idZQucmeCy/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764515058001"
                alt="SeaBank"
                className="h-4"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="text-caption font-bold text-muted-foreground">
                SEABANK
              </span>
            </div>

            <div className="space-y-1">
              <p className="font-mono text-headline text-foreground sm:text-display">
                {ACCOUNT_NUMBER}
              </p>
              <p className="text-caps uppercase text-muted-foreground">
                A/N {ACCOUNT_HOLDER}
              </p>
            </div>

            <Button
              onClick={() => {
                navigator.clipboard.writeText(ACCOUNT_NUMBER.replace(/\s/g, ""));
                toast.success(t("toast.account_copied"));
              }}
              className="h-10 w-full text-caption font-bold"
            >
              Copy Account Number
            </Button>
          </div>

          <p className="text-center text-caption italic text-muted-foreground">
            Donasi Anda akan digunakan untuk biaya server dan API Groq agar AI
            scheduler tetap bisa diakses gratis oleh semua mahasiswa. Terima
            kasih!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
