# Repository Agent Guide (nextjs-starter)

This document is for agentic coding assistants working in this repo. Follow it exactly to stay aligned with tooling, style, and CI expectations.

## ⚠️ CRITICAL GIT RULES — READ FIRST ⚠️

### Branch Naming Convention

**Format: `<type>/<initials>/<feature-description>`**

| Component | Format | Examples |
|-----------|--------|----------|
| **Type** | Lowercase | `feat`, `fix`, `refactor`, `perf`, `chore` |
| **Initials** | 2-3 lowercase letters | `msf`, `ak`, `rm` |
| **Feature Description** | Kebab-case | `db-schema`, `contact-form`, `admin-auth` |

**Examples:**
- `feat/msf/db-schema` — Feature by MSF for database schema
- `fix/ak/build-error` — Bug fix by AK for build
- `refactor/rm/layer-architecture` — Refactor by RM for architecture

### NEVER COMMIT OR PUSH WITHOUT EXPLICIT PERMISSION

**ABSOLUTE RULE: DO NOT run `git commit`, `git push`, or ANY git write commands unless the user EXPLICITLY asks for it in their LATEST prompt.**

This means:
- ❌ NEVER commit "to save progress"
- ❌ NEVER commit "as part of wrapping up"
- ❌ NEVER commit because "the work is done"
- ❌ NEVER commit with `--amend`, `--no-verify`, or any other flags
- ❌ NEVER run `gh pr create` without permission
- ❌ NEVER run `git push` (including `--force`) without permission
- ❌ NEVER run `git stash` in a way that loses work

**ONLY commit when:**
- ✅ User says "commit this"
- ✅ User says "go ahead and commit"
- ✅ User explicitly requests it in the current message

When in doubt: **STOP and ASK** before committing.

#### ⛔ MANDATORY PRE-COMMIT VERIFICATION GATE ⛔

**Before running ANY git write command (`commit`, `push`, `pr create`, `merge`, `rebase`, `amend`), you MUST execute this exact self-check:**

```
┌─────────────────────────────────────────────────────┐
│ PRE-COMMIT VERIFICATION GATE                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ DID THE USER EXPLICITLY SAY TO COMMIT?              │
│                                                      │
│ Check their LATEST message for:                      │
│   □ "commit this"/"commit that"                      │
│   □ "go ahead and commit"                            │
│   □ "push this"                                      │
│   □ "create a PR"                                    │
│                                                      │
│ ❌ "work on" → NOT permission                        │
│ ❌ "start working on" → NOT permission               │
│ ❌ "implement" → NOT permission                      │
│ ❌ "build" → NOT permission                          │
│ ❌ "create" → NOT permission (unless "create a PR")  │
│ ❌ "add feature X" → NOT permission                  │
│ ❌ User said it in a PREVIOUS message, not latest    │
│                                                      │
│ IF NONE CHECKED → DO NOT COMMIT. STOP. ASK.         │
└─────────────────────────────────────────────────────┘
```

**This check is MANDATORY. No exceptions. No shortcuts.**

### Atomic Commits

One logical change per commit. A commit should tell one story. A reviewer should understand what changed and why from the commit message alone.

```
GOOD:   "feat: add JWT authentication middleware"
        → adds auth middleware, exports types, wires into route

BAD:    "feat: add JWT auth and fix navbar padding and refactor utils"
        → three unrelated concerns in one commit

GOOD:   "fix: correct off-by-one error in date range picker"
        → 1 file, focused fix

GOOD:   "feat: add contact form"
        → 6 files (schema + types + component + action + service + page)
        → ALL part of ONE feature — correctly grouped
```

**File count is irrelevant.** Split by **feature boundary**, not by file count.

| Good to combine | Bad to combine |
|----------------|----------------|
| Component + its types + its action | Data mapping change + UI change |
| Interface + its implementation | Bug fix + refactor |
| Migration + its schema change | Feature A + Feature B |
| Utility + its only consumer | API change + unrelated documentation |

**The test**: Can you write a single, specific commit message that accurately describes ALL changes?
- Yes → one commit
- No → split until each commit has a specific message

**Commit order**: Types → Services → Actions/API → Components/Pages

**Commit message format**: `<type>: <imperative present tense description>`

| Type | When to use |
|------|-------------|
| `feat` | New feature or enhancement |
| `fix` | Bug fix |
| `refactor` | Code restructuring without feature change |
| `perf` | Performance improvement |
| `chore` | Tooling, config, docs, non-code changes |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |

**Body**: Explain **what** changed and **why** — not how (the diff shows how). Wrap at 72 characters.

**Staging**: Stage only what the commit message describes. Run `git diff --staged --stat` before committing.

**Authorship**: Commits must be authored by the person whose work is being committed. Never add AI-agent attribution, tool signatures, or co-author tags referencing automation tools.

### Before Pushing

Export CI variables to prevent interactive prompts:
```bash
export CI=true DEBIAN_FRONTEND=noninteractive GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never HOMEBREW_NO_AUTO_UPDATE=1 GIT_EDITOR=: EDITOR=: VISUAL='' GIT_SEQUENCE_EDITOR=: GIT_MERGE_AUTOEDIT=no GIT_PAGER=cat PAGER=cat npm_config_yes=true PIP_NO_INPUT=1 YARN_ENABLE_IMMUTABLE_INSTALLS=false
```

Then verify: `bun run lint` (zero errors), `bun run type-check` (zero errors), review the log.

## ⚠️ ZERO-TOLERANCE: LINT & TYPE ERRORS — FIX IMMEDIATELY

**ABSOLUTE RULE: ANY lint error, warning, or type error found in the codebase MUST be solved immediately without hesitation or second thoughts.**

This includes:
- ✅ Lint errors: Fix immediately (no "pre-existing" excuses)
- ✅ Lint warnings: Fix immediately (warnings are errors in this repo)
- ✅ Type errors: Fix immediately (no `@ts-ignore`, `@ts-expect-error`, `as any`, or `// biome-ignore`)
- ✅ Pre-existing issues: If found, fix them immediately before proceeding
- ✅ Generated type errors (`.next/types`): Rebuild to auto-heal; if persistent, fix the source

**Process:**
1. Run `bun run lint` → fix ALL issues before continuing
2. Run `bun run type-check` → fix ALL errors before continuing
3. If you find ANY issues (old or new), fix them immediately
4. Never proceed to the next task with broken checks
5. Never commit code that fails lint/type-check
6. When in doubt about pre-existing vs. new: FIX IT ANYWAY

**This is non-negotiable.** Code quality is the foundation of everything.

## Quick Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (Turbopack)
bun run build        # Production build
bun run start        # Start production server (requires .env)
bun run lint         # Biome check (lint + format validation)
bun run type-check   # TypeScript strict check
bun run format       # Biome format (auto-fix)
bun run test         # Run all tests (Vitest)
bun run test:watch   # Watch mode
bun run test:coverage # Run with coverage report
bun run db:generate  # Generate Drizzle migration
bun run db:migrate   # Apply pending migrations
bun run db:push      # Push schema to DB (dev only)
```

## CI / Git Hooks

- CI (GitHub Actions) runs `bun run lint` and `bun run type-check`.
- Husky hooks:
  - pre-commit: runs Biome format on staged files.
  - pre-push: runs `bun lint` (Biome check).

## Tech Stack

- Next.js App Router (Next 16)
- React 19
- TypeScript (strict, noEmit)
- Tailwind CSS v4 + shadcn/ui (New York)
- Zod + @t3-oss/env-core for env validation
- Drizzle ORM (Postgres) + drizzle-kit
- neverthrow for Result-based error handling
- Sentry for error monitoring
- Biome for linting/formatting
- Husky for git hooks
- Bun as package manager
- Vitest for testing

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (GET reads only)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── actions/                # Server Actions (mutations only)
│   ├── action-base.ts     # createAction() factory
│   └── example-actions.ts # Example action
├── components/
│   ├── app/               # Feature components (atomic design)
│   │   ├── atoms/         # Basic building blocks
│   │   ├── molecules/     # Composite components
│   │   └── compounds/     # Complex feature components
│   └── ui/                # shadcn/ui base components
├── dal/                    # Data Access Layer
│   └── example-dal.ts     # DB queries (neverthrow)
├── db/                     # Database
│   ├── index.ts           # getDb() singleton
│   ├── schema.ts          # Drizzle table definitions
│   └── migrations/        # Generated migrations
├── helpers/                # Utility helpers
│   ├── api.ts             # Type-safe fetch wrapper
│   ├── cookies.ts         # Cookie helpers
│   └── storage.ts         # localStorage helpers
├── hooks/                  # Custom React hooks
│   ├── index.ts           # Barrel export
│   ├── useReveal.ts       # Scroll-triggered fade-up animation
│   └── useDrawOn.ts       # SVG stroke draw-on animation
├── lib/                    # Core utilities
│   ├── constants.ts       # ALL app constants
│   ├── enums.ts           # ALL enums
│   ├── env.ts             # Environment validation
│   ├── errors.ts          # Error handling (neverthrow)
│   ├── types.ts           # ALL interfaces and types (single file)
│   ├── utils.ts           # Utility functions (cn, etc.)
│   ├── seo.ts             # SEO utilities
│   ├── logger.ts          # Console logger singleton
│   ├── guards.ts          # Type guard utilities
│   ├── retry.ts           # Exponential backoff retry helper
│   ├── batch.ts           # Batched async processing
│   ├── dates.ts           # Date formatting (formatDate, timeAgo)
│   ├── error-handler.ts   # Server-side Sentry error handler
│   ├── client-errors.ts   # Client-side Sentry error reporting
│   ├── cookie-consent.ts  # Analytics consent check
│   ├── analytics/         # GA4 analytics system
│   │   ├── client.ts      # Client-side GA4 tracking
│   │   ├── server.ts      # Server-side Measurement Protocol
│   │   ├── utm.ts         # UTM extraction & persistence
│   │   ├── deduplication.ts # Event deduplication
│   │   ├── debug.ts       # Dev-mode analytics logger
│   │   └── web-vitals.ts  # Web Vitals tracking hook
│   └── index.ts           # Barrel export
└── services/               # Business logic layer
    └── example-service.ts # Services, DTO mapping
```

## ⚠️ Single Source of Truth: Constants & Enums (MUST FOLLOW)

**NEVER hardcode strings, numbers, or configuration values inline.** Every app-level semantic value must be defined in its designated file and imported where needed. This prevents silent breakage when values change in one place but not another.

### What Goes Where

| File | What it owns | Examples |
|------|-------------|----------|
| `src/lib/constants.ts` | ALL app constants — route paths, form field names, cookie names, HTTP status codes, API endpoints, durations, page sizes, query param keys, storage keys, motion tokens, regex patterns | `ROUTES`, `FORM_FIELDS`, `HTTP_STATUS`, `COOKIE_NAMES`, `DURATION`, `PAGINATION` |
| `src/lib/enums.ts` | ALL enums — error codes, HTTP verbs, log levels, status values, fixed domain sets | `ErrorCode`, `HttpVerb`, `LogLevel`, `FormStatus` |
| `src/lib/types.ts` | ALL interfaces and type aliases | `IUser`, `TActionResult` |

### Concrete Examples (from `src/lib/constants.ts`)

```typescript
// ❌ NEVER hardcode these inline:
fetch("/api/users");                  // route path
formData.get("email");                // form field name
cookies().set("session", token);      // cookie name
res.status(404);                      // HTTP status
localStorage.setItem("theme", "dark"); // storage key
revalidate: 3600                      // duration/interval

// ✅ ALWAYS define in constants.ts and import:
import { ROUTES, FORM_FIELDS, COOKIE_NAMES, HTTP_STATUS, STORAGE_KEYS, DURATION } from "@/lib/constants";

fetch(ROUTES.api.users);                          // "/api/users"
formData.get(FORM_FIELDS.login.email);            // "email"
cookies().set(COOKIE_NAMES.session, token);       // "session"
res.status(HTTP_STATUS.NOT_FOUND);                // 404
localStorage.setItem(STORAGE_KEYS.theme, "dark");  // "theme"
revalidate: DURATION.hour                         // 3600
```

### Pattern Reference (Samsu-style)

The constants file uses sectioned `as const` objects:

```typescript
// src/lib/constants.ts

// ─── HTTP ──────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const HTTP_CONTENT_TYPE = {
  JSON: "application/json",
  HTML: "text/html",
  TEXT: "text/plain",
} as const;

// ─── Routes ─────────────────────────────────────
export const ROUTES = {
  home: "/",
  login: "/login",
  api: {
    users: "/api/users",
    items: "/api/items",
  },
} as const;

// ─── Form Fields ────────────────────────────────
export const FORM_FIELDS = {
  login: {
    email: "email",
    password: "password",
  },
  contact: {
    name: "name",
    message: "message",
  },
} as const;

// ─── Cookies ────────────────────────────────────
export const COOKIE_NAMES = {
  session: "session",
  theme: "theme",
} as const;

// ─── Storage ────────────────────────────────────
export const STORAGE_KEYS = {
  theme: "theme",
  preferences: "user-preferences",
} as const;

// ─── Duration ───────────────────────────────────
export const DURATION = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
} as const;

// ─── Pagination ─────────────────────────────────
export const PAGINATION = {
  pageSize: 20,
  maxPageSize: 100,
} as const;
```

### How This Prevents Bugs

- **Route mismatch**: Updating `/api/users` to `/api/v2/users` in constants.ts fixes every consumer automatically
- **Form field rename**: Changing `"email"` to `"emailAddress"` in `FORM_FIELDS.login.email` updates server validation AND client JSX simultaneously
- **HTTP status change**: Centralized mapping means you never return 404 when you meant 403
- **Cookie/session key change**: One constant change propagates to all `cookies().set()`, `cookies().get()`, and `cookies().delete()` calls

This is **non-negotiable** — hardcoded strings are the #1 source of silent production bugs.

## File Organization — CRITICAL RULES

**ALL code must be placed in the correct dedicated location. NEVER create inline definitions.**

| What | Where | Examples | Rules |
|------|-------|----------|-------|
| **Type Definitions** | `src/lib/types.ts` | `IExampleDto`, `TExampleRecord`, `IActionContext` | **ALL** interfaces/types in ONE file with section comments |
| **Enums** | `src/lib/enums.ts` | `ErrorCode`, `HttpVerb`, `ChangeFrequency` | **ALL** enums go here |
| **Zod Schemas** | `src/lib/*-schema.ts` | `examples-schema.ts` | API boundary validation |
| **Constants** | `src/lib/constants.ts` | `DEFAULT_SEO`, `ROUTES`, `FORM_FIELDS` | App-wide constants |
| **Errors** | `src/lib/errors.ts` | `createError()`, `tryCatch()`, `createAppError()` | Error handling utilities |
| **Utilities** | `src/lib/utils.ts` | `cn()`, `isClientSide()` | Simple 1-5 line helpers |
| **Services** | `src/services/` | `example-service.ts` | Business logic |
| **DAL** | `src/dal/` | `example-dal.ts` | DB queries |

## Formatting & Linting (Biome)

Biome config lives in `biome.json`:
- Indentation: 2 spaces
- Line width: 80
- Quotes: double quotes
- Semicolons: always

Run `bun run format` before every commit. Run `bun run lint` before push.

## TypeScript Settings

From `tsconfig.json`:
- `strict: true` and `noEmit: true`
- `moduleResolution: bundler`
- `jsx: react-jsx`
- `target: ES2022`
- `isolatedModules: true`
- Path alias: `@/*` → `./src/*`

Follow strict typing conventions. Avoid implicit `any` (TypeScript will fail).

## Imports

- Prefer absolute imports via `@/` when referencing `src/`.
- Keep imports grouped by:
  1) external packages
  2) internal `@/` imports
  3) relative imports

## Naming Conventions (Biome-enforced)

| Element | Convention | Example |
|---------|------------|---------|
| Interfaces | `I` prefix, PascalCase | `IUser`, `IFetchResponse` |
| Type aliases | `T` prefix, PascalCase | `TUser`, `TActionResult` |
| Enums | PascalCase | `ErrorCode`, `HttpVerb` |
| React components | PascalCase | `ContactForm`, `SiteHeader` |
| Variables/functions | camelCase | `getDb()`, `createAction()` |
| Constants | UPPER_SNAKE_CASE | Only when truly constant |
| File names | kebab-case | `example-dal.ts`, `example-service.ts` |

## Function Style & Code Structure

- **Prefer `function` declarations** over arrow function expressions unless `this` binding or lexical scoping is explicitly required. Use `export function foo()` not `export const foo = () =>`.
- **Export on declaration**: Always export on the declaration itself. Use `export function foo()` or `export async function foo()`. Never use a bare `function foo()` with a separate `export { foo }` at the bottom.
- **Guard clauses are MANDATORY** — Use early `return`/`continue` to exit for edge cases, invalid states, and empty conditions. Never nest the happy path inside `if` blocks. The happy path must be at the lowest indentation level.
  - GOOD: `if (!items?.length) return [];` → process items at top level
  - BAD: `if (items?.length) { /* entire logic nested inside if */ }`
- **Extract named helpers**: When a loop body or conditional block grows beyond a few lines, extract a named helper function. When 3+ variables are passed together, bundle them into an object with an interface in `types.ts`.
- **Object params for 3+ params**: When a function needs more than two parameters, use an object parameter with a named interface defined in `types.ts`.

## Error Handling & Result Pattern

- **Never throw exceptions** in application code. Use neverthrow `Result`/`ResultAsync`.
- Use `tryCatch()` from `src/lib/errors.ts` for wrapping APIs that throw.
- Use `createError()` from `src/lib/errors.ts` for typed error creation.
- Use `createAppError()` from `src/lib/errors.ts` for rich application errors with context.
- Error codes defined in `ErrorCode` enum in `src/lib/enums.ts`.
- DTOs: always `I*Dto` naming (e.g., `IExampleDto`).
- Form actions return `{ success: boolean, error?: string }` for `useActionState`.

## Architecture Layering (strict)

```
src/db/schema.ts           ← Drizzle table definitions
       ↓
src/dal/*.ts               ← Data Access Layer (raw queries, Result)
       ↓
src/services/*.ts          ← Business logic, validation, DTO mapping
       ↓
src/actions/*.ts           ← Server Actions (mutations only)
src/app/api/*/route.ts     ← API Routes (GET reads only)
```

### ⚠️ Hard Rule: API Routes vs Server Actions (NEVER mix)

| Concern | Use |
|---------|-----|
| **Cacheable reads** (GET data for client components) | `src/app/api/*/route.ts` — GET only |
| **External API proxies** | `src/app/api/*/route.ts` — any method |
| **Mutations** (form submissions, DB writes, auth) | `src/actions/*.ts` — via `createAction()` |
| **Direct RSC data fetching** | Import services/DAL directly |

**FORBIDDEN:**
- ❌ Mutations (POST/PUT/DELETE) in API routes
- ❌ Reads in Server Actions
- ❌ Calling `createAction()` from API route handlers
- ❌ Mixing "use server" with API route handlers

## Performance & Quality

- Keep functions small and focused.
- Avoid deeply nested control flow; use early returns.
- Files under 600 lines — split if longer.
- Server Components by default, Client Components only when absolutely required.

## Environment Variables

- Use `src/lib/env.ts` with Zod + @t3-oss/env-core for validation.
- Client env vars must use the `NEXT_PUBLIC_` prefix.
- Use `process.env` through the centralized config, not ad-hoc reads.
- Database connection uses `DATABASE_URL` (see `.env.example`).

## Tailwind / UI

- Use Tailwind v4 utilities for styling.
- Prefer shared utilities like `cn(...)` in `src/lib/utils.ts` for class merging.
- Follow existing shadcn/ui patterns for components.

## Strict Validation (NON-NEGOTIABLE)

Every single change MUST pass ALL validation gates before being committed or pushed. No compromises, no exceptions.

### Gate 1 — Before Every Commit

```bash
bun run format   # Biome format — fixes formatting automatically
bun run lint     # Biome check — must show "No fixes applied" (exit 0)
bun run type-check  # tsc — must pass with zero errors
```

**Rules:**
- `bun run format` is NOT optional. Run it before every commit or use `git add` + husky pre-commit.
- `bun run lint` must exit with code 0. If it fails, fix ALL issues — never bypass.
- `bun run type-check` must exit with code 0. No `@ts-ignore`, `@ts-expect-error`, or `as any` allowed.
- Treat lint warnings as errors — fix them, don't ignore them.
- If CI would fail the change, the commit is not ready.

### Gate 2 — Pre-Push Hook (Husky)

The pre-push hook runs `bun run lint` (biome check). **This is non-negotiable.**
- If the hook blocks your push, fix the issues — never run `git push --no-verify`.
- Always run `bun run format` before pushing to ensure formatting is clean.
- The hook protects the remote branch from broken code.

### Gate 3 — CI (GitHub Actions)

CI runs `bun run lint` + `bun run type-check`. PRs that fail CI must not be merged.
- Local validation must match CI validation exactly — no divergence allowed.

### Auto-Generated Files

Drizzle Kit migration files (`src/db/migrations/*.sql`, `src/db/migrations/meta/*.json`) are auto-generated tool output and are excluded from Biome formatting/linting (see `biome.json` ignores). All other files are subject to full validation.

**Rule:** After running `bun run db:generate`, always run `bun run format` to ensure any other changed files (schema.ts, etc.) are formatted.

## Must follow rules (HARD BLOCKS — never violate)

| # | Rule | Consequence |
|---|------|-------------|
| 1 | NEVER use `throw` — use the neverthrow Result pattern | Lint error + review failure |
| 2 | All types must be in `src/lib/types.ts` | Architectural violation |
| 3 | All enums must be in `src/lib/enums.ts` | Architectural violation |
| 4 | All constants must be in `src/lib/constants.ts` | Architectural violation |
| 5 | NEVER run `db:push`, `db:migrate`, or `db:generate` without explicit user permission | Data loss risk — hard block |
| 6 | NEVER suppress type errors with `as any`, `@ts-ignore`, `@ts-expect-error` | TypeScript strict mode violation |
| 7 | NEVER commit if `bun run lint` or `bun run type-check` fails | CI will fail anyway |
| 8 | NEVER use `git push --no-verify` to bypass hooks | Bypasses quality gates |
| 9 | NEVER use `throw` in catch blocks — always return `Result` | Pattern violation |
| 10 | NEVER mix API Route methods (GET only for reads, Server Actions for mutations) | Architecture violation |
| 11 | NEVER commit, push, or create PRs without explicit user permission | Trust violation |
| 12 | NEVER ignore lint warnings — treat them as errors | Zero-tolerance policy |
| 13 | NEVER use arrow functions for top-level exports — use `function` declarations | Style violation |
| 14 | NEVER nest the happy path inside `if` blocks — use guard clauses | Readability violation |
| 15 | NEVER define types/interfaces outside `src/lib/types.ts` | File organization violation |
| 16 | NEVER define app-level semantic strings, numeric constants, or configuration values outside `src/lib/constants.ts` (includes but not limited to: form field names, route paths, cookie names, JWT algorithms, query params, storage keys, durations/TTLs, page sizes) — define them in `src/lib/constants.ts` | Brittle code — mismatch silently breaks functionality |
| 17 | NEVER use bare `select()` in Drizzle queries — always specify columns explicitly via `select({ col1: table.col1, ... })`. Only use bare `select()` when ALL columns are genuinely needed and explicit listing would harm readability | Maintains explicit data contracts; prevents unintended column exposure |
| 18 | NEVER repeat the same pattern across files — extract shared logic into named helper functions/components. DRY violations include: repeated form field parsing, repeated DTO mapping, repeated filter/query building | Duplicated code rots independently — fixes miss copies silently |

## Anti-Patterns (NEVER do these)

### ❌ Type Definitions Outside `types.ts`
- Never: Define `interface IFoo {}` or `type TFoo = ...` in components, services, actions, or any file other than `src/lib/types.ts`.
- Always: Define in `src/lib/types.ts` under the appropriate section comment, then import from `@/lib/types`.

### ❌ Inline `import()` Type Annotations
- Never: Use `import("module").Type` as an inline type annotation.
- Always: Use top-level `import type { IFoo } from "module"`.

### ❌ Mixing Server/Client Components
- Never: Import a Server Component into a Client Component.
- Never: Pass `React.ComponentType` as props from Server to Client Components.
- Always: Pass data as props from Server → Client.

### ❌ Unnecessary "use client"
- Never: Add `"use client"` to components that only render UI with props.
- Always: Server Components by default, Client Components only when required (hooks, event handlers, browser APIs).

### ❌ Direct Cookie Manipulation
- Never: `cookies().set("foo", "bar")`.
- Use proper cookie helpers if needed.

### ❌ Hardcoded Magic Strings for Field/Param Names
- Never: `formData.get("email")` or `name="email"` with a raw string literal.
- Always: Define the name in `FORM_FIELDS` in `src/lib/constants.ts` and reference it:
  - Server: `formData.get(FORM_FIELDS.login.email)`
  - JSX: `name={FORM_FIELDS.login.email}`
- This applies to ALL app-level semantic strings, numeric constants, and configuration values: form field names, route paths, cookie names, JWT algorithms, query parameters, localStorage/sessionStorage keys, durations/TTLs, page sizes, and any other value that couples two pieces of code or represents app configuration.
- The `FORM_FIELDS`, `ROUTES`, `SESSION`, and equivalent objects in `constants.ts` are the single source of truth.

## Barrel Export Rules

- `src/lib/index.ts` exports: constants, enums, types, utils, errors, logger, retry
- `src/lib/index.ts` does NOT export: env/config, seo, *-schema
- `src/helpers/index.ts` exports: cookies, storage
- `src/helpers/index.ts` does NOT export: api.ts (fetcher)

## Server-Only Files (must use "server-only" import guard)

- src/lib/seo.ts
- src/db/index.ts
- src/dal/*.ts
- src/services/*.ts
- src/actions/*.ts (also "use server" directive)

## Documentation

Key guides are available in `docs/guides/`:

| Guide | Purpose |
|-------|---------|
| `docs/guides/seo-guide.md` | SEO requirements for all pages |
| `docs/guides/performance-guide.md` | Performance best practices |
| `docs/guides/error-handling-guide.md` | Error handling with Result pattern |
| `docs/guides/logging-guide.md` | Logging infrastructure |
| `docs/guides/sentry-guide.md` | Sentry integration |
| `docs/guides/testing-guide.md` | Testing strategy, patterns, and conventions |

## PR Creation — Body & Quality Standards

When `gh pr create` is explicitly permitted, every PR MUST include:
- **Description**: Brief summary of changes. Link to the issue with `Closes #N`.
- **Proposed Changes**: Bulleted list of key functional changes.
- **Type of Change**: Bug fix, feature, breaking change, or refactor.
- **How Has This Been Tested**: Step-by-step verification instructions.
- **Visuals**: Screenshots for any UI changes.
- Every PR MUST pass `bun run lint` and `bun run type-check` before opening.
