# Dialog card design: more personal, less AI-gen

## Problem

Identical `DialogBanner` (solid `bg-primary` blue strip) across 4 dialogs — the most recognisable SaaS template pattern. Sequential `01`/`02`/`03` step pills add to the templated feel.

## Changes

### 1. Delete `DialogBanner` component (Footer.tsx)
Replace with inline card-style header: `bg-card`, no colored band, close button in top-right. Applied to:

- **AboutDialog** — header + sections with icon markers (not `01`/`02`), quote with left border
- **HowToUseDialog** — single column, bullet indicators, premium box with accent left border
- **DonateDialog** — no banner, account number right away

### 2. ShareDialog
Remove blue banner. Use compact card header with icon + title + close.

### 3. ContactDialog
Already personal (avatar). Minor spacing polish.

### Design tokens
All use: `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `rounded-card`, `shadow-overlay`. No palette colours, no emoji, no em/en dashes.
