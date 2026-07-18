![KRSan](public/og-image.png)

# KRSan v3

KRSan is a course schedule (KRS) planning application built for Indonesian university students. It replaces manual, error-prone semester planning with an automated workflow: pick courses, and the app generates conflict-free schedule permutations, either through a local backtracking search or through an AI-assisted generator.

The application is public by default. Configuring a profile, selecting courses, generating schedules, and archiving plans all work without an account. An account is only required for the three actions that spend a server-side resource: sharing a plan, Smart Generate (AI), and expanding the plan limit.

## Contents

1. [Overview](#1-overview)
2. [Core Features](#2-core-features)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Getting Started](#5-getting-started)
6. [Available Scripts](#6-available-scripts)
7. [Architecture Notes](#7-architecture-notes)
8. [Contributing](#8-contributing)
9. [License and Attribution](#9-license-and-attribution)

## 1. Overview

The planner works as a four-step flow: Configuration, Selection, Visualization, and Archive.

Configuration sets the academic parameters used everywhere downstream: university, study program (prodi), semester, and a maximum SKS (credit) target.

Selection pulls from a master course catalog, either loaded automatically from the prodi and semester's curriculum, or added manually from a searchable catalog dialog.

Visualization presents generated schedule permutations, scored on day spread, daily load, and other heuristics, with support for manual editing, sharing, and PDF-style printing.

Archive stores saved plans, either in Convex (signed in) or in local storage (anonymous), capped at 30 plans per user.

## 2. Core Features

Local schedule generation is a backtracking search over course sections with conflict pruning, free of charge and requiring no account.

Smart Generate is an AI-assisted generator that produces three diverse, scored schedule variations from a natural-language preference (preferred lecturers, days off, custom instructions). It costs one credit, is rate limited to one request per 30 seconds, and is capped at 5 credits per day, reset at midnight WIB.

Curriculum auto-load is a single action that loads every course belonging to the student's prodi and semester directly from the admin-maintained curriculum table.

Draft persistence keeps the selection step (courses, checked codes, locked class choices, and the configuration profile) intact across a page refresh, and clears it only through an explicit reset action.

Plan archive and sharing lets saved plans be renamed, deleted, exported, or shared through a public link, the last of which requires an account.

The admin panel covers master course catalog management, curriculum management, and an AI-assisted Intelligence Scraper for turning unstructured schedule text into structured course rows.

## 3. Technology Stack

Runtime and language: Node.js, TypeScript in strict mode, React 19 on Vite with Rolldown.

Styling: Tailwind CSS v4, wired through the Vite plugin rather than PostCSS, with a token layer (OKLCH color values, a typographic role scale, and semantic utility naming) defined in `src/index.css`.

UI primitives: Radix UI, wrapped as local shadcn-style components in `src/components/ui`.

Icons: a small vendored set of 36 icons in `src/components/ui/icon.tsx`, generated from `lucide-react`, which is a development-only dependency and is not shipped to the client.

Backend: Convex, used for the database, real-time subscriptions, serverless queries and mutations, and scheduled actions.

Authentication: Clerk, integrated with Convex through `ConvexProviderWithClerk`.

AI provider: Groq (`groq-sdk`), split across a primary and a secondary model from a different size class so one deprecation cannot take down Smart Generate entirely. The response is validated against a Zod schema before it is trusted. LangChain was removed from the stack; it added significant bundle weight for a single API call and did not otherwise contribute to the AI flow.

Data validation: Zod v4, including its native `z.toJSONSchema()` for generating structured-output schemas.

## 4. Project Structure

```
convex/
  schema.ts            Database schema and indexes
  ai.ts                Smart Generate action and AI provider chain
  admin.ts             Admin queries, mutations, and checkAdmin guard
  users.ts             User lifecycle, credits, identity recovery
  plans.ts             Plan archive queries and mutations
  lib.ts               Shared server-side helpers (auth, day normalization)
  auth.config.ts       Clerk JWT issuer configuration

src/
  components/
    layout/            Navbar, Footer, page chrome
    maker/              Configuration, Selection, Visualization, Archive screens
    admin/              Admin panel screens and data hooks
    ui/                 Local component primitives (Radix wrappers, icon set)
  context/              LanguageContext, SessionContext
  hooks/                 Shared hooks (useLocalStorage, useTutorial, usePlanArchive)
  hooks/maker/           Schedule-session, smart-generate, share, and archive hooks
  lib/                   Scheduler, rules, formatting, prodi overrides, period logic
  types/                 Shared TypeScript types

scripts/
  check-contrast.mjs     WCAG contrast guard on design tokens
  check-typography.mjs   Type scale guard
  check-i18n.mjs         Translation key guard
  gen-icons.mjs          Icon set generator

public/
  assets/                Static assets, illustrations, fonts
```

## 5. Getting Started

### Prerequisites

Node.js version 22 or later, npm, a Convex account and project, and a Clerk account and application.

### Installation

Clone the repository.

```bash
git clone https://github.com/indraprhmbd/krs-an.git
cd krs-an
```

Install dependencies.

```bash
npm install
```

Create `.env.local` in the project root.

```env
VITE_CONVEX_URL=
VITE_CLERK_PUBLISHABLE_KEY=

# Optional, only needed for the Intelligence Scraper's external cleanup service.
VITE_AI_API_URL=
```

Set the following as a Convex deployment environment variable, through the Convex dashboard rather than `.env.local`, since it is read server-side inside a Convex action.

```
GROQ_API_KEY
```

### Running the app

Two processes run side by side during development.

Terminal 1, the frontend:

```bash
npm run dev
```

Terminal 2, the backend sync and code generation:

```bash
npx convex dev
```

Both must run. `convex/_generated/` is produced by `npx convex dev`, and stale or missing `api.*` types usually mean that process is not running.

## 6. Available Scripts

`npm run dev`, Vite development server, frontend only.

`npx convex dev`, backend sync and code generation, run alongside `npm run dev`.

`npm run build`, type-checks with `tsc -b` and then builds with Vite.

`npm run build:cf`, a Vite-only build for Cloudflare Pages deployment, skipping the separate typecheck step.

`npm run lint`, runs ESLint across the project.

`npm run check:contrast`, asserts WCAG 2.1 contrast ratios on the color tokens in `src/index.css`.

`npm run check:typography`, asserts the type scale is used consistently, with no arbitrary sizes and no banned font weights.

`npm run check:i18n`, asserts every translation key used in the source is defined, and every placeholder is supplied at its call sites.

`npm run gen:icons`, regenerates `src/components/ui/icon.tsx` from the installed `lucide-react` package.

`npm run preview`, serves the production build locally.

Note that `npm run build` and `npx convex dev` type-check against different `tsconfig` files, `tsconfig.app.json` and `convex/tsconfig.json`. A type error in `convex/` can pass one while failing the other, so run both before considering a change verified.

## 7. Architecture Notes

The app is Indonesian-only. There is no language toggle; all user-facing copy lives in a single translation map in `src/context/LanguageContext.tsx`. Source code, identifiers, and comments remain in English.

Day-of-week values are normalized to a canonical English form, `Mon` through `Sun`, at every write path, both client-side and server-side, and rendered back into Indonesian only at the display layer, through `src/lib/schedule-format.ts`.

Course schedule generation is either local, which is free and lives in `src/lib/scheduler.ts`, or AI-assisted, which costs a credit and lives in `convex/ai.ts`. Both paths converge on the same `Plan` shape.

The user lifecycle, `ensureUser` in `convex/users.ts`, includes a three-tier identity recovery path, so migrating Clerk domains does not orphan existing accounts.

Design tokens, typography, and icons are governed by the automated guard scripts listed in section 6, rather than by convention alone, since arbitrary values otherwise creep back in silently.

## 8. Contributing

Fork the repository, then create a feature branch from `main`.

Make changes, and run `npm run build`, `npm run lint`, and the relevant `check:*` scripts before opening a pull request.

Keep commit messages focused on the reason for a change, not just its mechanics.

Open a pull request against `main` with a clear description of the change and its testing.

## 9. License and Attribution

This project is an independent, non-commercial educational tool. Course data is sourced from public university portals.

Copyright 2026, KRSan.

Built by Indra Prihambada (https://github.com/indraprhmbd).
