# Architecture

This document explains the architectural decisions behind this Next.js starter
template. It's meant for maintainers who want to understand *why* things are set
up this way — not just *what* is configured.

Every choice here is deliberate. If you're thinking of changing something, read
the rationale first.

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 16 (App Router) | Full-stack React with server components, streaming, and file-based routing out of the box |
| **Language** | TypeScript (strict) | Non-negotiable. Catches entire categories of bugs at compile time |
| **Styling** | Tailwind CSS v4 | Utility-first with JIT compilation; no dead CSS, no context switching |
| **UI Components** | shadcn/ui (New York style) | Copy-paste, fully-owned components. No dependency black box, no version lock-in |
| **ORM** | Drizzle ORM | Type-safe SQL with a thin layer over Postgres. No query builder magic — you write real SQL semantics |
| **Error Tracking** | Sentry | Industry standard for observability; configured with source maps and environment contexts |
| **Linting / Formatting** | Biome | Unified tool — no more ESLint + Prettier plugin soup. Single binary, single config, 10x faster |
| **Git Hooks** | Husky | Enforces lint and format checks before code reaches CI |

---

## Architectural Decisions

### Full-Stack Next.js (No Separate Backend)

There is no Express server, no Fastify API, no separate backend repository. The
template uses Next.js as a full-stack framework. This is not a compromise — it's
a deliberate choice backed by the App Router's capabilities.

API Routes handle cacheable GET requests (data fetching for client components,
external API proxies). Server Actions handle mutations (form submissions, auth,
data writes). Together they replace what a separate backend would do, without
the operational overhead of maintaining two deployments, two CI pipelines, and a
contract layer between them.

**When to break this rule:** If you need long-running background workers,
WebSocket servers, or a public API consumed by third parties, extract those into
separate services. Everything else stays in Next.js.

### Atomic Design for Components

Components live under `src/components/app/` and follow atomic design:

- **atoms/** — The smallest building blocks: buttons, inputs, labels, badges.
  These are generic and project-agnostic.
- **molecules/** — Composites of atoms: form fields, search bars, cards. These
  combine atoms into small meaningful units.
- **compounds/** — Feature-specific components: signup forms, data tables,
  navigation menus. These are the largest units and often compose molecules.

`src/components/ui/` is reserved for shadcn/ui base components, which are
treated as a vendor directory (excluded from linting, rarely modified).

This structure scales. Small projects use only atoms and a few compounds. Large
projects with multiple feature domains group compounds by domain
(`compounds/auth/`, `compounds/dashboard/`). The hierarchy prevents
component sprawl without enforcing rigid folder-per-component overhead.

### Data Flow: DB → DAL → Services → Actions / API

Data moves through four strict layers:

```
Database (Postgres)
  ↓
src/db/         ← Drizzle schema definitions + client singleton
  ↓
src/dal/        ← Data Access Layer (raw queries, neverthrow Result)
  ↓
src/services/   ← Business logic, validation, DTO mapping
  ↓
src/actions/    ← Server Actions (mutations via "use server")
src/app/api/    ← API Routes (GET reads)
```

Each layer has a single responsibility and never skips the next one:

| Layer | Responsibility | Never does |
|-------|---------------|------------|
| `db/schema.ts` | Define tables, columns, relations | — |
| `dal/*.ts` | Run queries against the database | Call services or actions |
| `services/*.ts` | Validate input, map records to DTOs, combine DAL calls | Import from actions or call the DB directly |
| `actions/*.ts` | Handle form submissions, revalidate cache, return UI-friendly responses | Read data (that's the API's job) |
| `api/*/route.ts` | Expose cacheable GET endpoints | Mutate data (that's an action's job) |

The direction is always **downward**: actions import services, services import
DAL, DAL imports the DB client. Reversing this (a DAL calling a service) is a
layering violation and will be caught in code review.

### Server Components by Default

Every component starts as a Server Component. The `"use client"` directive is
added only when a component genuinely needs:

- React hooks (`useState`, `useEffect`, `useActionState`)
- Browser-only APIs (`localStorage`, `addEventListener`)
- Event handlers (`onClick`, `onSubmit`)
- Context providers

This is not an optimization — it's the default architecture. Server Components
can import services directly, access the database, and render without shipping
JavaScript to the client. Client Components are the exception, not the rule.

**Pattern for data flow:** A Server Component fetches data and passes it as
props to a Client Component. Never pass `React.ComponentType` from server to
client — always pass serializable data.

### neverthrow Result Pattern Over Exceptions

The template never throws exceptions in application code. Every operation that
can fail returns a `Result` type from [neverthrow](https://github.com/supermacro/neverthrow):

```typescript
// Instead of:
function getUser(id: string): IUser {
  throw new Error("not found");
}

// We do:
function getUser(id: string): Result<IUser, IError> {
  const user = db.find(id);
  if (!user) return err(createError(ErrorCode.NotFound, "User not found"));
  return ok(user);
}
```

This is not stylistic preference. Exceptions create invisible control flow:
a `throw` in a deeply nested function can unwind the entire stack, skip cleanup
code, and leave state inconsistent. With `Result`, every failure path is
explicit in the type signature. The compiler forces callers to handle both
success and error cases. Dead code paths auditable at a glance.

**The tradeoff:** You can't ignore a `Result`. That's the point.

### Barrel Exports at Specific Boundaries

Barrel files (`index.ts`) exist only at module boundaries where consumers should
not care about internal file structure:

- `src/lib/index.ts` — Exports constants, enums, types, utils, logger, retry.
  Does **not** export env/config, errors, SEO helpers, or schema validators.
- `src/helpers/index.ts` — Exports cookies and storage helpers.
  Does **not** export the API fetcher (`api.ts`).

Barrels are not used inside `src/components/`, `src/services/`, `src/dal/`, or
`src/actions/`. Those directories use direct file imports. This prevents hidden
circular dependencies and keeps the dependency graph explicit.

The rule: barrel at the **public API boundary** of a module, not at every folder.

---

## Data Layer

### Schema Definition (`src/db/schema.ts`)

Drizzle schemas define the database shape. Tables, columns, types, and relations
live here. This is the source of truth that Drizzle Kit uses to generate
migrations.

```typescript
export const examples = pgTable("examples", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

The schema file does not contain queries, business logic, or validation. It is
purely structural. The inferred type (`typeof examples.$inferSelect`) is
exported to `src/lib/types.ts` as `TExampleRecord` — the raw database shape.

### Database Client (`src/db/index.ts`)

A singleton `getDb()` function returns the Drizzle client instance. On first
call it creates a Postgres connection pool using the URL from validated
environment variables. Subsequent calls reuse the existing instance.

Serverless deployments should set `DATABASE_POOL_SIZE=1` to avoid connection
exhaustion. Traditional server environments default to 10 connections.

### Data Access Layer (`src/dal/*.ts`)

The DAL owns all database interaction. Every function:

1. Imports `"server-only"` to prevent accidental client usage.
2. Uses `ResultAsync.fromThrowable()` to convert Drizzle calls into typed
   `Result` values.
3. Returns `ResultAsync<T, IError<ErrorCode>>` — never raw data, never throws.

```typescript
export function listExamples(
  options: IListExamplesOptions = {},
): ResultAsync<TExampleRecord[], IError<ErrorCode.DbListFailed>> {
  return ResultAsync.fromThrowable(
    async () =>
      getDb()
        .select()
        .from(examples)
        .orderBy(desc(examples.createdAt))
        .limit(limit),
    (error: unknown) =>
      createError(ErrorCode.DbListFailed, "Failed to list examples.", error),
  )();
}
```

All queries use explicit column selection (`select({ col1: table.col1 })`)
unless every column is genuinely needed. Bare `select()` is the exception, not
the rule.

### Service Layer (`src/services/*.ts`)

Services contain business logic. They:

1. Validate inputs with Zod schemas (`safeParse`, never `parse`).
2. Map raw database records to DTOs (Data Transfer Objects) — flattened,
   serialized shapes that the UI consumes.
3. Combine multiple DAL calls when a single operation needs data from several
   tables.
4. Return `Result<IExampleDto, IError<...>>` — success is always a DTO.

Services never import from actions. They never call `revalidatePath` or handle
HTTP concerns. They are pure business logic.

### Actions (`src/actions/*.ts`)

Server Actions use the `"use server"` directive and handle all mutations:

- Form submissions: parse `FormData`, validate, call service, return
  `{ success, error }` for `useActionState`.
- Auth: login, logout, session checks.
- Writes: create, update, delete operations.

Actions use the `createAction()` factory from `action-base.ts`, which provides:

- Auth context extraction from request headers.
- Automatic input parsing via a `parse` function.
- A catch-all error handler that converts uncaught exceptions to typed errors.

Form actions in particular return `IFormActionResponse` (`{ success: boolean,
error?: string, fieldErrors?: Record<string, string[]> }`) — a shape designed
for `useActionState` in client components.

### API Routes (`src/app/api/*/route.ts`)

API Routes are **GET-only** and handle cacheable data access:

- Fetching data for client components via `fetcher()`.
- External API proxies (forwarding requests to third-party services).
- SSR-safe endpoints that Server Components could also call directly.

API Routes never mutate data. If you need a POST/PUT/DELETE, that belongs in a
Server Action. This boundary is strict and enforced by convention.

---

## Environments

| Environment | Env File | Env Sourcing | Notes |
|-------------|----------|-------------|-------|
| **Local** | `.env` (not tracked) | Copy from `.env.example` | `bun dev` reads via `env-cmd`; database runs locally or via Docker |
| **Staging** | Project-level env vars in deployment platform | CI/CD injects staging values | Used for preview deployments, integration tests, and UAT |
| **Production** | Project-level env vars in deployment platform | CI/CD injects production values | Secrets managed through platform UI (Vercel, Railway, etc.) — never in repo |

All environment variables are validated at startup by `@t3-oss/env-core` with
Zod schemas in `src/lib/env.ts`. If a required variable is missing or
malformed, the application fails immediately with a clear error — not silently
at runtime with `undefined`.

Server-only variables (`DATABASE_URL`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, etc.)
are never prefixed with `NEXT_PUBLIC_`. Client-safe variables
(`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`) are explicitly prefixed so
Next.js knows to inline them into the client bundle.

**Key rules:**
- Never commit `.env` files (already in `.gitignore`).
- Keep `.env.example` in sync with the actual schema in `src/lib/env.ts`.
- Add new variables to both places (schema + example) before using them.
