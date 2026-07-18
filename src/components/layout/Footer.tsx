import { useState } from "react";
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
import { cn } from "@/lib/utils";
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
    { title: t("howtouse.step4_title"), desc: t("howtouse.step4_desc") },
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TutorialSection {
  title: string;
  desc: string;
  youtubeId?: string; // filled in once a video is uploaded; omitted = placeholder
}

function TutorialVideoFrame({ section }: { section: TutorialSection }) {
  const { t } = useLanguage();
  if (section.youtubeId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-card border border-border bg-muted">
        <iframe
          src={`https://www.youtube.com/embed/${section.youtubeId}`}
          title={section.title}
          className="h-full w-full"
          loading="lazy"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-muted">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
        <Icon name="sparkles" size={18} />
      </span>
      <p className="text-caption text-muted-foreground">
        {t("tutorial_video.placeholder")}
      </p>
    </div>
  );
}

export function TutorialVideosDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const sections: TutorialSection[] = [
    {
      title: t("tutorial_video.section1_title"),
      desc: t("tutorial_video.section1_desc"),
    },
    {
      title: t("tutorial_video.section2_title"),
      desc: t("tutorial_video.section2_desc"),
    },
    {
      title: t("tutorial_video.section3_title"),
      desc: t("tutorial_video.section3_desc"),
    },
    {
      title: t("tutorial_video.section4_title"),
      desc: t("tutorial_video.section4_desc"),
    },
    {
      title: t("tutorial_video.section5_title"),
      desc: t("tutorial_video.section5_desc"),
    },
    {
      title: t("tutorial_video.section6_title"),
      desc: t("tutorial_video.section6_desc"),
    },
  ];

  const active = sections[activeIndex];

  return (
    <Dialog onOpenChange={(open) => open && setActiveIndex(0)}>
      <DialogTrigger asChild>
        {trigger || (
          <FooterLinkTrigger icon="bookmark" label={t("nav.tutorial")} />
        )}
      </DialogTrigger>
      <DialogContent
        hideClose
        size="3xl"
        padded={false}
        className="flex max-h-[85vh] flex-col overflow-hidden"
      >
        <DialogHeader className="shrink-0 p-4 pb-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-headline">
              {t("tutorial_video.title")}
            </DialogTitle>
            <DialogClose className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Desktop: sidebar list + content pane */}
        <div className="hidden flex-1 gap-4 overflow-hidden p-4 md:flex">
          <div className="w-56 shrink-0 space-y-1 overflow-y-auto custom-scrollbar">
            {sections.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "w-full rounded-control px-3 py-2 text-left text-caption font-medium transition-colors",
                  i === activeIndex
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
            <TutorialVideoFrame section={active} />
            <div className="space-y-1">
              <h3 className="text-body font-bold text-foreground">
                {active.title}
              </h3>
              <p className="text-caption text-muted-foreground">
                {active.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: carousel, same prev/next pill pattern as the plan pager */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 md:hidden">
          <TutorialVideoFrame section={active} />
          <div className="space-y-1">
            <h3 className="text-body font-bold text-foreground">
              {active.title}
            </h3>
            <p className="text-caption text-muted-foreground">
              {active.desc}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1 rounded-control bg-muted p-0.5 self-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                setActiveIndex((prev) =>
                  prev > 0 ? prev - 1 : sections.length - 1,
                )
              }
            >
              <Icon name="chevron-left" size={12} />
            </Button>
            <span className="px-1 font-mono text-caption font-bold">
              {activeIndex + 1}/{sections.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                setActiveIndex((prev) =>
                  prev < sections.length - 1 ? prev + 1 : 0,
                )
              }
            >
              <Icon name="chevron-right" size={12} />
            </Button>
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
          <p>{t("about.personal")}</p>
          <p>{t("about.how")}</p>
          <p className="rounded-card border border-border bg-muted p-4 text-caption">
            {t("about.legal")}
          </p>
          <p className="text-caption text-muted-foreground">
            <a
              href="https://storyset.com/idea"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {t("about.illustration_credit")}
            </a>
          </p>
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
