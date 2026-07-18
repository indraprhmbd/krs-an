# KRSan — actual layout/IA redesign of the 4 step views

## Context

Prior work this session (all shipped, verified, committed-ready): Convex backend hardening
(auth helpers, credit-race fix, invocation cuts), a `SessionContext` replacing the prop-drill
and window-event hack, `ScheduleMaker.tsx` dissolved from 832 lines into hooks, and a palette
retune (brand-accurate primary + new `--highlight` orange token, contrast-guard verified).

That work was real but it was **tokens and state, not layout**. The user's correct pushback:
nothing about the actual page structure, hierarchy, or flow-to-flow cohesion changed. The four
step views (`ScheduleConfig`, `ScheduleSelector`, `ScheduleViewer`, `ScheduleArchive`) still
have their original, independently-invented layouts:

- **No shared visual grammar between steps.** Config uses a 12-col grid with a big display
  headline. Selector uses a dense card-list with a sticky action header. Viewer is a
  toolbar-plus-grid split view. Archive is a tabbed card grid. Each reinvents its own header
  treatment, spacing rhythm, and card chrome. Moving from one step to the next reads as
  landing on a different app, which is exactly the "lack of consistency" complaint.
- **No shared step header.** Config's header is a hero (badge + display headline + subtext).
  Selector's is a dense info bar (back button + title + SKS counter). Viewer's is a toolbar.
  Archive's is a plain flex row. A student has no consistent "where am I / what do I do here"
  anchor across the flow.
- **The sidebar step rail (`ScheduleMaker.tsx`) is disconnected from the content it labels.**
  It floats in its own aside with its own numbered-circle treatment that nothing else in the
  four views echoes.

## Decision: cohesive flow via one shared shell + rebuilt per-step content, not a repaint

Build a real shared layout primitive and put each step's actual content redesign inside it,
rather than continuing to patch each view's bespoke markup independently.

### 1. `MakerShell` primitive (new: `src/components/maker/MakerShell.tsx`)

One component every step renders through:

```
<MakerShell
  eyebrow="Step 1 of 3"          // small caps label, consistent position every step
  title={...}                     // the one place a step names itself
  description={...}               // optional one-line context
  actions={...}                   // right-aligned header actions (Add course, Save, etc.)
  footer={...}                    // optional sticky bottom action bar (Generate, Smart Generate)
>
  {children}                      // the step's actual content, scrollable
</MakerShell>
```

This becomes the *one* place that decides: header padding, title role token, the
eyebrow/title/description stack, how actions sit relative to the title, and the
scroll-container behavior. Every step stops inventing its own header. This directly answers
"cohesive" — not by making every screen look identical, but by making them share a spine.

### 2. Redesigned step rail, wired into the shell

Move the numbered step rail out of `ScheduleMaker.tsx`'s standalone `aside` and make it the
top region of `MakerShell` itself (a slim horizontal rail on all breakpoints, not a desktop
sidebar + mobile top-strip split as two different layouts). One rail, one place, same
component every step reads its `isActive`/`isPast` state from `useSession()`'s `step` — no
more passing `STEPS`/`STEP_ORDER` down from `ScheduleMaker`.

### 3. Per-step content redesign (real layout changes, not just tokens)

- **`ScheduleConfig`**: currently a hero + separate config card, disconnected from each other
  visually (one is airy hero copy, the other a dense form card). Redesign as one continuous
  flow inside `MakerShell`: eyebrow = period label, title = the config question itself,
  content = the form. Drop the redundant academic-year badge (now the eyebrow) and the
  separate hero headline that duplicates what the shell's title already says.
- **`ScheduleSelector`**: keep the dense list (it earns its density), but its header duplicates
  what `MakerShell` will now own (back button, title, SKS counter). Pull the counter into the
  shell's `description` slot so it renders in the same position as every other step's context
  line. Actions (Add course / Quick Build / Smart Generate / Plotter) move into the shell's
  sticky `footer` instead of a horizontally-scrolling button cluster in the header — this is
  the actual UX fix: on mobile these 4 buttons currently scroll off-screen with no affordance
  that more exist.
- **`ScheduleViewer`**: the toolbar (back, plan pager, shuffle/expand/fix, SKS, inventory
  trigger) is doing too many jobs in one row. Split via the shell: title = plan name, actions
  slot = plan pager + inventory trigger, footer = shuffle/expand/save (the primary actions a
  student is actually here to take, currently buried among five same-weight buttons).
- **`ScheduleArchive`**: header (icon + title + storage bar) maps directly to shell
  title/description; the AI/Saved tabs and cards are the `children`. No structural change
  needed beyond adopting the shell, since its content organization (tabs + grid) is already
  the right shape for this step specifically.

### 4. What does NOT change

- The 4-step flow itself (config -> select -> view -> archive) — still the locked decision.
- `scheduler.ts`/`rules.ts`, Convex backend, `SessionContext` — untouched, already correct.
- The `--highlight` AI-affordance work already done stays; it becomes part of the shell/step
  redesign rather than being redone.

## Files

- New: `src/components/maker/MakerShell.tsx`.
- Rewritten (structure, not just classes): `ScheduleConfig.tsx`, `ScheduleSelector.tsx`,
  `ScheduleViewer.tsx`, `ScheduleArchive.tsx`.
- Trimmed: `ScheduleMaker.tsx` loses the inline sidebar/rail JSX (moves into `MakerShell`).

## Verification

- `npx tsc -b --force` + `npx convex codegen`, `npm run build`, `npm run lint` (baseline 106),
  `check:contrast`/`check:typography`/`check:i18n`.
- Manual: walk config -> select -> view -> archive and confirm the header/rail/action
  placement now reads as one system, not four; mobile width (360px) specifically for the
  selector's action footer (the concrete bug the redesign fixes) and the viewer's split view.
