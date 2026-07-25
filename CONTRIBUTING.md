# Contributing Guide

This project enforces strict data-access boundaries, server action policies, and code quality tooling. Follow these rules to keep the stack consistent.

## Quick Start

```bash
cp .env.example .env
bun install
bun run dev
```

## Tooling

- **Formatter/Linter**: Biome
  - `bun run lint` → `biome check .`
  - `bun run format` → `biome format --write .`
- **Type-check**: `bun run type-check` (tsc --noEmit)
- **Test**: `bun test` (Vitest)

### Drizzle (database tooling)

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

> Requires `DATABASE_URL` in your `.env` (see `.env.example`).

## Git Workflow & Branch Naming

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

### Commit Guidelines

Follow atomic commits — split by feature, one logical change per commit. The commit message format is `<type>: <imperative present tense description>`:

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

## Data Flow

```text
Database (Postgres)
  → src/dal/ (Data Access Layer — raw queries)
  → src/services/ (Business logic, DTO mapping)
  → src/actions/ (Server Actions — mutations, via createAction)
  → src/app/api/ (API routes — cacheable GET reads)
  → Server Components / Client Components (UI)
```

## Data Access Layers (DAL) Structure

We enforce a strict layering model. **UI must never import DB or DAL directly.**

```text
src/db/          -> DB client + schema
src/dal/         -> pure data access (no auth/validation)
src/services/    -> business logic, auth, transactions
src/actions/     -> server actions (mutations only)
src/app/api/     -> route handlers (external APIs + GET cache)
```

### 1) DB Client (server-only)

File: `src/db/index.ts`

- Initializes Drizzle and exposes `getDb()`.
- Returns error via neverthrow Result, never throws.

### 2) Schema

File: `src/db/schema.ts`

- Tables only. No queries.

### 3) DAL (Repository)

File: `src/dal/example-dal.ts`

- **Only** database queries.
- Returns `Result<T, IAppError>` — never throws.
- No validation or auth.

### 4) Services (Use-cases)

File: `src/services/example-service.ts`

- Business logic, validation, orchestration.
- Returns DTOs for UI/API.
- Calls DAL functions, maps results to domain types.

### 5) Interface Layer

#### Server Actions (mutations only)

File: `src/actions/example-actions.ts`

- Use the `createAction` wrapper from `src/actions/action-base.ts`.
- Parse inputs with Zod, revalidate paths/tags after writes.
- Return `Result<T, IAppError>` from actions, `{ success, error }` for form actions.

#### Route Handlers (external APIs + GET reads)

File: `src/app/api/examples/route.ts`

- Use `GET` for cacheable reads.
- Map errors to structured JSON with appropriate HTTP status codes.

### Client Fetch Example

File: `src/components/app/compounds/examples-client-panel.tsx`

- Client components **read data via API routes**.
- Use the type-safe `fetcher()` from `src/helpers/api.ts`.

## Server Actions vs API Routes

**Server Actions (use for mutations only):**
- UI-triggered writes (forms, buttons)
- Internal only (not for external clients)
- POST only; not cacheable
- Use `createAction` factory for consistent parse → handle → error wrap

**Route Handlers (use for reads and external APIs):**
- External consumers, webhooks, or public APIs
- Cacheable GET responses
- Explicit HTTP semantics with status codes

## Security Requirements (Server Actions)

Server actions are public endpoints. Treat them like APIs:

- Always validate input (Zod)
- Enforce auth/authorization (use the action wrapper)
- Revalidate cache after mutations

The wrapper in `src/actions/action-base.ts` provides a central place to enforce auth and context extraction for every action.

## Error Handling Standard

We strictly avoid `throw` for expected failures. Use the **Result pattern** (via `neverthrow`) to handle errors as values.

### Layered Return Types

| Layer | Return Type | Pattern |
|-------|-------------|---------|
| **DAL / Services** | `Result<T, IAppError>` | Logical operations returning results |
| **Server Actions** | `Result<T, IAppError>` | Created via `createAction` factory |
| **Form Actions** | `{ success: boolean, error?: string }` | Wrapper for React's `useActionState` |
| **API Routes** | JSON `{ data: T } \| { error: string }` | Structured JSON with HTTP status |

### Core Types

- **Result<T, E>**: Represents success (`ok(data)`) or failure (`err(error)`).
- **ResultAsync<T, E>**: For asynchronous operations.
- **IAppError**: Standardized error structure with `code`, `message`, and `context`.

Use `ErrorCode` from `src/lib/enums.ts` for all error codes so they stay consistent across layers.

## Naming Conventions (Enforced)

| Element | Convention | Example |
|---------|------------|---------|
| Interfaces | `I` prefix | `IUser`, `IApiResponse` |
| Types | `T` prefix | `TExampleRecord`, `TRenderStrategy` |
| Enums | PascalCase | `ErrorCode`, `HttpVerb` |

All enums live in `src/lib/enums.ts`.
All types/interfaces live in `src/lib/types.ts`.
All constants live in `src/lib/constants.ts`.

## Single Source of Truth: No Hardcoded Strings

**NEVER hardcode app-level strings, numbers, or configuration values inline.** Every value that couples two pieces of code — form field names, route paths, cookie names, HTTP status codes, query params, storage keys, durations, page sizes — must be defined in `src/lib/constants.ts` or `src/lib/enums.ts` and imported where used.

### Bad vs Good

```typescript
// ❌ BAD — hardcoded strings everywhere
formData.get("email");                           // form field
fetch("/api/users");                              // route
cookies().set("auth-token", token);               // cookie name
return res.status(404);                           // HTTP status

// ✅ GOOD — single source of truth
import { FORM_FIELDS, ROUTES, COOKIE_NAMES, HTTP_STATUS } from "@/lib/constants";

formData.get(FORM_FIELDS.login.email);
fetch(ROUTES.api.users);
cookies().set(COOKIE_NAMES.authToken, token);
return res.status(HTTP_STATUS.NOT_FOUND);
```

This applies to **ALL** app-level semantic values — see the dedicated section in `AGENTS.md` for the complete pattern reference with examples.

## Code Quality Gate

Run before every push:

```bash
bun run lint
bun run type-check
```

## Testing

- Framework: Vitest
- Tests live in `src/__tests__/` following the same directory structure as `src/`
- Run tests: `bun test`
- Watch mode: `bun test:watch`
- Coverage: `bun test:coverage`

### Testing Rules

- Never use `as any`, `@ts-ignore`, `@ts-expect-error` in tests either
- Prefer `function` declarations over arrow functions for test functions
- Test behavior, not implementation — verify rendered output, not internal state
- One logical assertion per test — don't batch unrelated assertions
- Use descriptive test names that read like user stories

## Examples Included

- DB schema: `src/db/schema.ts`
- DB client: `src/db/index.ts`
- DAL: `src/dal/example-dal.ts`
- Services: `src/services/example-service.ts`
- Server action: `src/actions/example-actions.ts`
- API route: `src/app/api/examples/route.ts`
- Server component: `src/components/app/compounds/examples-server-panel.tsx`
- Client component: `src/components/app/compounds/examples-client-panel.tsx`

## Notes on Barrel Files

- Avoid global barrels for server-only modules.
- Local barrels are OK if they do not cross server/client boundaries.

## Animation & Motion System

All animations follow a **CSS-first approach** — CSS transitions driven by `IntersectionObserver`, no JS animation libraries.

### Quick Reference

| What | Where |
|------|-------|
| Motion design tokens (CSS) | `src/app/globals.css` (`.reveal`, `.reveal-stagger` classes) |
| Motion constants (JS) | `src/lib/constants.ts` → `MOTION` |
| Scroll reveal hook | `src/hooks/useReveal.ts` |
| SVG draw-on hook | `src/hooks/useDrawOn.ts` |
| Reveal wrapper component | `src/components/app/atoms/Reveal.tsx` |

### Rules (MUST FOLLOW)

- **CSS transitions + IntersectionObserver only** — no Framer Motion, GSAP, or similar
- **GPU-only properties**: Only animate `transform` and `opacity`. Never `width`, `height`, `top`, `left`, `margin`, `padding`
- **One-shot**: Scroll animations trigger once and disconnect the observer
- **Reduced motion**: `prefers-reduced-motion: reduce` is respected globally
- **`useReveal()`**: Adds `.reveal` + `.is-visible` classes to element. Use on any element that should fade up on scroll.
- **`useDrawOn()`**: Animates SVG `stroke-dashoffset` when element scrolls into view. Use for decorative SVGs.
- **`<Reveal>` component**: Thin wrapper around `useReveal()`. Supports `stagger` prop for sequenced children animations.

## SEO & AEO Requirements

Every new page MUST follow these SEO/AEO rules:

- **Metadata**: Export `generateMetadata()` using `buildSeoMetadata()` with title, description, URL route.
- **JSON-LD**: Add relevant structured data via `<JsonLd>` or `<Breadcrumbs>` component. Use schema generators from `@/lib/seo`.
- **Semantic HTML**: Use `<header>`, `<main>`, `<article>`, `<section>`, `<nav>`, `<footer>`. One `<h1>` per page.
- **Images**: Every image must have descriptive `alt` text. LCP images get `priority`.
- **AEO**: The `/llms.txt` route must be updated when new pages are added. AI crawler rules in `robots.ts` use `AI_CRAWLERS` constants.

See `AGENTS.md` (# SEO Requirements) and `docs/guides/seo-guide.md` for the full checklist.

## Guides (MUST READ)

| Guide | Purpose |
|-------|---------|
| `docs/guides/seo-guide.md` | SEO requirements for all pages |
| `docs/guides/performance-guide.md` | Performance best practices |
| `docs/guides/error-handling-guide.md` | Error handling with Result pattern |
| `docs/guides/logging-guide.md` | Logging infrastructure |
| `docs/guides/sentry-guide.md` | Sentry integration |
| `docs/guides/testing-guide.md` | Testing strategy, patterns, and conventions |
