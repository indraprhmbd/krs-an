import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { cn } from "@/lib/utils";
import { useSession, type MakerStep } from "@/context/SessionContext";

/**
 * The one shared spine every maker step renders through.
 *
 * Before this, each of the four steps (config/select/view/archive) invented
 * its own header: a hero block, a dense info bar, a toolbar, a plain flex row.
 * That became one eyebrow/title/description/actions header plus a separate
 * footer row -- an improvement, but on a wide desktop viewport it still read
 * as two disconnected toolbars: title floating top-left, back button and
 * actions stranded top-right with a dead gap between them (screenshot:
 * docs/makershell-bottombar-plan.md).
 *
 * The fix: one command bar. `actions` and `footer` were always the same
 * concept -- a labeled icon button -- rendered through two divergent code
 * paths for historical reasons. They are one `MakerBarAction[]` now, and on
 * `sm:` and up they render as a single bottom bar: Back + title, then
 * contextual actions, then primary actions, left to right. Below `sm:` there
 * is not enough width for title + every action in one row, so the mobile
 * layout keeps a slim top strip (back + title + contextual actions) and a
 * fixed bottom tab bar for the primary actions -- unchanged from the last
 * shipped pass.
 */

export interface MakerRailStep {
  id: MakerStep;
  label: string;
  canNavigate: boolean;
}

export interface MakerBarAction {
  key: string;
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  /** Shown as a hover title on desktop when disabled, e.g. "pick a course
   * first". Buttons that are merely `disabled` give no reason on their own. */
  disabledReason?: string;
  /** "highlight" marks an AI-powered action (Smart Generate, Expand, Fix
   * Conflicts) so it carries the brand's orange affordance consistently. */
  variant?: "default" | "outline" | "highlight";
  /** Spins the icon (an in-flight AI call) rather than a generic pulse. */
  loading?: boolean;
  tooltip?: { titleKey: string; descKey: string };
}

/** @deprecated use MakerBarAction -- kept as an alias so existing imports
 * don't need to change name in the same pass that changes their shape. */
export type MakerFooterAction = MakerBarAction;

interface MakerShellProps {
  /** Small caps label above the title, e.g. the period or a step counter.
   * Desktop only -- there is no room for it once title moves into the bar. */
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Icon+label "Back" button, rendered as the bar's leading element next to
   * the title (desktop) or in the top strip (mobile) -- never floated apart
   * from the title it navigates away from. */
  onBack?: () => void;
  backLabel?: string;
  /** Contextual actions for this step (e.g. "Add course"). Rendered in the
   * bar between the title and the primary actions on desktop; in the mobile
   * top strip next to the title. */
  actions?: MakerBarAction[];
  /** A non-button widget slotted between contextual and primary actions in
   * the bar (e.g. the plan pager pill) -- not every control is a labeled
   * icon button, and forcing one into that shape would only make it worse. */
  extra?: ReactNode;
  /** The step's primary action(s): Generate, Save, and similar. Renders as
   * the rightmost group in the desktop bar, and as the fixed mobile tab bar
   * (icon-over-label, evenly spaced) below `sm:`. */
  footer?: MakerBarAction[];
  /** The step rail (progress, not "functionality") -- stays at the very top
   * on both breakpoints. Omitted on the archive screen, which is reached
   * from the Navbar rather than being part of the config->select->view
   * sequence. */
  rail?: MakerRailStep[];
  /** False for a step that manages its own internal scroll regions (the
   * schedule grid + inventory split view) rather than scrolling as a whole. */
  scrollBody?: boolean;
  children: ReactNode;
}

function BarButton({
  action,
  size = 14,
}: {
  action: MakerBarAction;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={action.onClick}
        disabled={action.disabled}
        title={action.disabled ? action.disabledReason : undefined}
        variant={action.variant === "highlight" ? undefined : action.variant}
        className={cn(
          action.variant === "highlight" &&
            "bg-highlight text-highlight-foreground hover:bg-highlight/90 disabled:bg-muted disabled:text-muted-foreground",
        )}
      >
        <Icon
          name={action.icon}
          size={size}
          className={action.loading ? "animate-spin" : undefined}
        />
        {action.label}
      </Button>
      {action.tooltip && (
        <HelpTooltip
          titleKey={action.tooltip.titleKey}
          descKey={action.tooltip.descKey}
        />
      )}
    </div>
  );
}

export function MakerShell({
  eyebrow,
  title,
  description,
  onBack,
  backLabel = "Back",
  actions,
  extra,
  footer,
  rail,
  scrollBody = true,
  children,
}: MakerShellProps) {
  const { step, setStep } = useSession();

  const hasBar =
    (actions && actions.length > 0) || extra || (footer && footer.length > 0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {rail && rail.length > 0 && (
        <ol className="mb-2 flex shrink-0 items-center justify-center gap-1 overflow-x-auto no-scrollbar">
          {rail.map((s, i) => {
            const isActive = step === s.id;
            const isPast = rail.findIndex((r) => r.id === step) > i;
            return (
              <li key={s.id} className="flex shrink-0 items-center gap-1.5">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px w-4 shrink-0 md:w-8",
                      isPast || isActive ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
                <button
                  type="button"
                  disabled={isActive || !s.canNavigate}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => {
                    if (isActive || !s.canNavigate) return;
                    setStep(s.id);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-control px-1.5 py-0.5 transition-colors",
                    s.canNavigate && !isActive && "hover:bg-accent",
                    !s.canNavigate && !isActive && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border font-mono text-grid font-bold transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isPast
                          ? "border-primary bg-card text-primary"
                          : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {isPast ? <Icon name="check" size={9} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-caption font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {/* Mobile top strip: back + title + contextual actions only. Primary
          actions live in the fixed bottom tab bar instead -- no room for
          everything in one row below sm:. Hidden entirely on desktop, where
          all of this moves into the single bottom bar below. */}
      <div className="mb-2 flex shrink-0 flex-col gap-2 sm:hidden">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex shrink-0 items-center rounded-control p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon name="chevron-left" size={16} />
            </button>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-caps font-mono uppercase text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h1 className="text-title text-foreground">{title}</h1>
            {description && (
              <div className="text-body-sm text-muted-foreground">
                {description}
              </div>
            )}
          </div>
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-1.5">
            {actions.map((a) => (
              <BarButton key={a.key} action={a} />
            ))}
          </div>
        )}
        {extra}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          scrollBody ? "overflow-y-auto pr-1" : "overflow-hidden",
          footer && footer.length > 0 && "pb-16 sm:pb-0",
        )}
      >
        {children}
      </div>

      {/* Desktop: everything in one bottom bar -- Back+title, then
          contextual actions, then primary actions, left to right. */}
      {(hasBar || onBack) && (
        <div className="mt-3 hidden shrink-0 items-center gap-3 border-t border-border pt-3 sm:flex md:mt-4">
          <div className="flex min-w-0 items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex shrink-0 items-center gap-1 rounded-control px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon name="chevron-left" size={16} />
                <span className="text-caption font-medium">{backLabel}</span>
              </button>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-caps font-mono uppercase text-muted-foreground">
                  {eyebrow}
                </p>
              )}
              <h1 className="truncate text-title text-foreground">{title}</h1>
              {description && (
                <div className="truncate text-body-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
          </div>

          {actions && actions.length > 0 && (
            <>
              <div className="h-5 w-px shrink-0 bg-border" />
              <div className="flex shrink-0 items-center gap-1.5">
                {actions.map((a) => (
                  <BarButton key={a.key} action={a} />
                ))}
              </div>
            </>
          )}

          {extra && (
            <>
              <div className="h-5 w-px shrink-0 bg-border" />
              {extra}
            </>
          )}

          {footer && footer.length > 0 && (
            <>
              <div className="h-5 w-px shrink-0 bg-border" />
              <div className="ml-auto flex shrink-0 items-center gap-1">
                {footer.map((a) => (
                  <BarButton key={a.key} action={a} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile: a real tab bar, fixed to the viewport bottom -- icon over
          label, evenly spaced -- for the primary actions only. */}
      {footer && footer.length > 0 && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
          aria-label="Primary actions"
        >
          {footer.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-grid font-medium transition-colors",
                action.disabled
                  ? "text-muted-foreground/50"
                  : action.variant === "highlight"
                    ? "text-highlight"
                    : "text-foreground active:bg-accent",
              )}
            >
              <Icon
                name={action.icon}
                size={18}
                className={action.loading ? "animate-spin" : undefined}
              />
              <span className="truncate px-1">{action.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
