import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { ContactDialog } from "../maker/ContactDialog";
import { useLanguage } from "../../context/LanguageContext";
import { useSession } from "../../context/SessionContext";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AboutDialog, HowToUseDialog, DonateDialog } from "./Footer";
import { usePlanArchive, ARCHIVE_LIMIT } from "../../hooks/usePlanArchive";

interface NavbarProps {
  userData?: {
    isAdmin?: boolean;
    credits?: number;
  };
}

/** One row in the utility grid. */
function MenuItem({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-caption font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
      <Icon name={icon} size={14} className="shrink-0 text-muted-foreground" />
      {label}
    </span>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full disabled:cursor-not-allowed disabled:opacity-50"
    >
      <MenuItem icon={icon} label={label} />
    </button>
  );
}

export function Navbar({ userData }: NavbarProps) {
  const { isSignedIn, user } = useUser();
  const { t } = useLanguage();
  const { step, setStep, restoreArchitectStep, requestTutorial } =
    useSession();
  const isArchitect = step === "config" || step === "select" || step === "view";
  const isArchive = step === "archive";

  const { plans } = usePlanArchive();
  const archiveCount = plans?.length ?? 0;

  const credits = userData?.credits ?? 0;

  /**
   * Language, tutorial and the info dialogs used to live inside the signed-in
   * popover, so anonymous users could not reach them at all. They are now in
   * the shared section below, which renders regardless of auth.
   */
  const utilities: ReactNode = (
    <div className="grid grid-cols-2 gap-0.5">
      <MenuButton
        icon="bookmark"
        label={t("nav.tutorial")}
        disabled
        onClick={() => {
          restoreArchitectStep();
          requestTutorial();
        }}
      />
      <AboutDialog
        trigger={
          <button type="button" className="w-full">
            <MenuItem icon="info" label={t("footer.about")} />
          </button>
        }
      />
      <HowToUseDialog
        trigger={
          <button type="button" className="w-full">
            <MenuItem icon="help" label={t("footer.howtouse")} />
          </button>
        }
      />
      <DonateDialog
        trigger={
          <button type="button" className="w-full">
            <MenuItem icon="coffee" label={t("footer.donate")} />
          </button>
        }
      />
      <a href="mailto:indraprhmbd@gmail.com" className="w-full">
        <MenuItem icon="message" label={t("footer.feedback")} />
      </a>
      <ContactDialog
        trigger={
          <button type="button" className="w-full">
            <MenuItem icon="user" label={t("nav.contact")} />
          </button>
        }
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        {/* Logo & Admin */}
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <img
              src="/assets/logo.webp"
              alt="KRSan"
              width="96"
              height="36"
              className="h-8 w-20 object-contain sm:w-24"
            />
          </Link>

          {userData?.isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1 rounded-control border border-border px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon name="shield" size={12} />
              <span className="hidden font-mono text-caps uppercase xs:inline">
                {t("nav.admin")}
              </span>
            </Link>
          )}
        </div>

        {/* Architect / Archive toggle. Was absolutely centred, which collided
            with the logo on narrow screens; it is now part of the flex row. */}
        <div
          role="tablist"
          className="flex shrink-0 gap-0.5 rounded-control border border-border p-0.5"
        >
          <Button
            role="tab"
            aria-selected={isArchitect}
            variant={isArchitect ? "secondary" : "ghost"}
            size="sm"
            onClick={() => restoreArchitectStep()}
          >
            <Icon name="clock" size={14} />
            <span className="hidden xs:inline">{t("nav.architect")}</span>
          </Button>
          <Button
            role="tab"
            aria-selected={isArchive}
            variant={isArchive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStep("archive")}
          >
            <Icon name="history" size={14} />
            <span className="hidden xs:inline">{t("nav.archive")}</span>
            <span className="hidden xs:inline ml-1 font-mono text-caps text-muted-foreground">
              {archiveCount}/{ARCHIVE_LIMIT}
            </span>
          </Button>
        </div>

        {/* Menu + auth */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              {isSignedIn ? (
                <button
                  type="button"
                  aria-label="Account menu"
                  className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img
                    src={user?.imageUrl}
                    width="32"
                    height="32"
                    className="size-8 rounded-full border border-border object-cover"
                    alt=""
                  />
                </button>
              ) : (
                <Button variant="outline" size="icon" aria-label="Menu">
                  <Icon name="list" size={16} />
                </Button>
              )}
            </PopoverTrigger>

            <PopoverContent align="end" className="w-72 p-0">
              {isSignedIn && (
                <div className="flex items-center gap-2.5 border-b border-border p-3">
                  <img
                    src={user?.imageUrl}
                    className="size-9 rounded-full border border-border"
                    alt=""
                  />
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-foreground">
                      {user?.fullName}
                    </p>
                    <p className="truncate font-mono text-caption text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 p-3">
                {isSignedIn && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-caption">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Icon
                            name="database"
                            size={14}
                            className="text-muted-foreground"
                          />
                          {t("nav.tokens")}
                          <HelpTooltip
                            titleKey="help.tokens_title"
                            descKey="help.tokens_desc"
                          />
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {credits}/5 {t("nav.tokens_used")}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={credits}
                        aria-valuemin={0}
                        aria-valuemax={5}
                        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className={`h-full transition-all duration-500 ${
 credits <= 1 ? "bg-destructive" : "bg-primary"
 }`}
                          style={{
                            width: `${Math.max(0, Math.min((credits / 5) * 100, 100))}%`,
                          }}
                        />
                      </div>
                      <p className="text-caption text-muted-foreground">
                        {t("nav.tokens_reset")}
                      </p>
                    </div>
                    <div className="h-px bg-border" />
                  </>
                )}

                {utilities}
              </div>

              <div className="border-t border-border p-1.5">
                {isSignedIn ? (
                  <SignOutButton>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Icon name="log-out" size={14} />
                      {t("nav.signout")}
                    </Button>
                  </SignOutButton>
                ) : (
                  <SignInButton mode="modal">
                    <Button size="sm" className="w-full">
                      Sign in
                    </Button>
                  </SignInButton>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Kept outside the menu for anonymous users: signing in is the
              conversion action, so it should not be hidden behind a click. */}
          {!isSignedIn && (
            <SignInButton mode="modal">
              <Button size="sm" className="hidden xs:inline-flex">
                Sign in
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
