import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
              Kontak Author
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
            PERENCANAAN KULIAH | OLEH MAHASISWA | UNTUK MAHASISWA
          </p>
          <div className="flex items-center gap-2 font-mono text-caps uppercase text-muted-foreground">
            <span>KRSan 2026</span>
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

export function HowToUseDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { t } = useLanguage();
  const steps = [
    { title: t("howtouse.step1_title"), desc: t("howtouse.step1_desc") },
    { title: t("howtouse.step2_title"), desc: t("howtouse.step2_desc") },
    { title: t("howtouse.step3_title"), desc: t("howtouse.step3_desc") },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <FooterLinkTrigger icon="help" label={t("footer.howtouse")} />
        )}
      </DialogTrigger>
      <DialogContent hideClose size="2xl" padded={false}>
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-headline">{t("howtouse.title")}</DialogTitle>
            <DialogClose className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="space-y-4 p-4">
          {steps.map((step, i) => (
            <div key={i} className="space-y-1.5">
              <h3 className="flex items-center gap-2 text-body font-bold text-foreground">
                <span className="text-caption text-primary">{'\u2022'}</span>
                {step.title}
              </h3>
              <p className="text-caption text-muted-foreground">
                {step.desc}
              </p>
            </div>
          ))}
          <div className="rounded-card border-l-2 border-l-primary border-border bg-muted p-4">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="sparkles" size={14} />
              <h4 className="text-caption font-bold uppercase">
                {t("howtouse.premium_title")}
              </h4>
            </div>
            <p className="mt-1 text-caption text-muted-foreground">
              {t("howtouse.premium_desc")}
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
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-headline">{t("about.title")}</DialogTitle>
            <DialogClose className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="space-y-4 p-4 text-body text-muted-foreground">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <Icon name="sparkles" className="shrink-0 text-primary" size={16} />
              {t("about.background_title")}
            </h3>
            <p>{t("about.background_desc")}</p>
          </div>

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <Icon name="info" className="shrink-0 text-primary" size={16} />
              {t("about.mission_title")}
            </h3>
            <p>{t("about.mission_desc")}</p>
          </div>

          <p className="rounded-card border-l-2 border-l-primary border-border bg-muted p-4 text-caption italic">
            {t("about.quote")}
          </p>

          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <Icon name="shield" className="shrink-0 text-primary" size={16} />
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
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-headline">Dukung KRSan</DialogTitle>
            <DialogClose className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
        </DialogHeader>

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
              Salin Nomor Rekening
            </Button>
          </div>

          <p className="text-center text-caption italic text-muted-foreground">
            Donasi dipakai untuk biaya server dan API Groq supaya AI scheduler
            tetap gratis untuk semua mahasiswa. Terima kasih.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
