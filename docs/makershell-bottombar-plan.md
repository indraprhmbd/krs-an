# MakerShell: consolidate into one bottom command bar (desktop) + mobile tab bar

## Context

Live feedback on the shipped `MakerShell` (screenshot: `_temp/airy-desktop-navigator.png`):
title ("Partial Plan 1", "7 SKS") sits top-left, while the back button and plan pager float
top-right with a huge dead gap between them. That is a direct consequence of the current
split: `MakerShell` renders a top header row (back + title + description on the left,
`actions` on the right) and a *separate* bottom `footer` row for primary actions. On a wide
desktop viewport, two disconnected horizontal bands (top header, bottom footer) read as
loosely related toolbars rather than one control surface — exactly the "airy, floating"
complaint, and it is the same root cause as the earlier config-hero "seems off" report:
splitting related controls across distant regions of the screen.

The fix the user wants: collapse everything -- title, back, contextual actions, and the
primary footer actions -- into **one bottom bar** on desktop, the same way it is already one
bar on mobile (the tab bar shipped in the last pass). Not two components to maintain, one
`MakerShell` that renders its single command-bar data differently per breakpoint:

- **Mobile** (already shipped, keep as-is): title/back stay in a slim top strip (there is not
  enough width for title + all actions in one row); primary actions render as the fixed
  bottom icon-over-label tab bar.
- **Desktop** (the actual change): title and back move OUT of the top and INTO the bottom
  bar, alongside the contextual `actions` and the primary `footer` actions -- one horizontal
  band, icon+label buttons (explicit ask: "desktop: button with text"), title anchored at the
  bar's left edge next to Back, everything else flowing right of it in reading order:
  Back + Title -> contextual actions -> primary actions.

## Decision

Single `MakerShell` component, one `MakerBarAction` data shape shared by both "actions" and
"footer" (they were always the same concept -- "a labeled button with an icon" -- just
rendered in two places for historical reasons). Route slightly different content into a
single bottom bar on `sm:` and up; keep the existing top strip + fixed tab bar below `sm:`
where width does not allow one row.

### Bottom bar layout (desktop, `sm:` and up)

```
[ < Back ]  Partial Plan 1 · 7 SKS   |   [pager]  [icon add-course]   |   [Shuffle] [Expand] [Save]
  \_ leading (back+title) _/           \_ contextual actions _/          \_ primary footer actions _/
```

One `<div className="hidden sm:flex items-center justify-between border-t ...">` replaces
today's separate top header row and bottom footer row. Rail (step 1/2/3 progress) stays at
the very top -- that is orientation/progress, not "functionality", and the user's ask was
specifically about functionality + title consolidating to the bottom.

### Mobile (`<sm`, unchanged from the last shipped pass)

Top strip: back + compact title only (no room for actions here). Fixed bottom tab bar:
primary actions, icon-over-label, evenly spaced -- this part already shipped correctly and
is not being redone, only reused as the "mobile branch" of the same component.

## API changes to `src/components/maker/MakerShell.tsx`

- Rename/merge the two action concepts into one exported type (`MakerBarAction`), reusing
  the existing `MakerFooterAction` shape (`key, label, icon, onClick, disabled, variant,
  loading, tooltip, disabledReason`) -- `actions` (today's `ReactNode`) becomes an array of
  the same shape so both slots render through one `renderAction()` helper instead of two
  divergent code paths (raw JSX for actions vs structured for footer).
- Keep `onBack` / `backLabel` (just shipped) -- reused as the bar's leading element on
  desktop instead of sitting in the old top-right actions cluster.
- Keep `title` / `description` -- rendered inline next to Back in the bar on desktop,
  compact top strip on mobile.
- `rail` unchanged (still the top progress indicator on both breakpoints).
- Internally: one `bar = [...contextualActions, ...primaryFooterActions]`-style render, with
  a visual `h-5 w-px bg-border` divider between the contextual group and the primary group so
  the bar doesn't read as one undifferentiated row of buttons.

## Call sites to update

- `ScheduleViewer.tsx`: currently passes `actions` (pager + inventory trigger, JSX) and
  `footer` (Shuffle/Expand/Fix Conflicts/Reset/Save, `MakerFooterAction[]`). The inventory
  trigger becomes a `MakerBarAction`. The pager (`< 1/12 >`) is **not** forced into that shape
  -- locked decision: `MakerShell` gets one additional `extra?: ReactNode` slot rendered
  between the contextual-actions group and the primary-actions group, used only for this
  pill widget. Keeps the pager visually compact instead of bloating it into two full buttons.
- `ScheduleSelector.tsx`: currently passes `actions` (Add course button, JSX) and `footer`
  (Quick Build/Smart Generate/Plotter, `MakerFooterAction[]`). Convert Add course to a
  `MakerBarAction`.
- `ScheduleConfig.tsx`, `ScheduleArchive.tsx`: no footer/actions today (or minimal) -- confirm
  they degrade gracefully with an empty bar (no dead border/space when there is nothing to
  show).

## Verification

- `npx tsc -b --force`, `npx convex codegen`, `npm run build`, `npm run lint` (baseline 106),
  `check:contrast`/`check:typography`/`check:i18n`.
- Manual, desktop width: Viewer step reads as one bar (Back + "Partial Plan 1 · 7 SKS" on the
  left, pager + inventory trigger in the middle, Shuffle/Expand/Save on the right) with no
  dead gap; Selector step same pattern (Add course, then Quick Build/Smart Generate/Plotter).
- Manual, mobile width (360px): top strip still just back+title, bottom tab bar still the
  icon-over-label primary actions -- confirm this pass did not regress the just-shipped
  mobile behavior.
