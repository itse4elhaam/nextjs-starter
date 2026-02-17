# Contributing Guide

This project enforces strict data-access boundaries, server action policies, and
code quality tooling. Follow these rules to keep the stack consistent.

## Quick Start

```bash
bun install
bun run dev
```

## Tooling

- **Formatter/Linter**: Biome
  - `bun run lint` → `biome check .`
  - `bun run format` → `biome format --write .`
- **Type-check**: `bun run type-check`

### Drizzle (database tooling)

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

> Requires `DATABASE_URL` in your `.env` (see `.env.example`).

## Data Access Layers (DAL) Structure

We enforce a strict layering model. **UI must never import DB or DAL directly.**

```
src/db/          -> DB client + schema
src/dal/         -> pure data access (no auth/validation)
src/services/    -> business logic, auth, transactions
src/actions/     -> server actions (mutations only)
src/app/api/     -> route handlers (external APIs + GET cache)
```

### 1) DB Client (server-only)
File: `src/db/index.ts`

- Initializes Drizzle and exposes `getDb()`.
- Throws if `DATABASE_URL` is missing.

### 2) Schema
File: `src/db/schema.ts`

- Tables only. No queries.

### 3) DAL (Repository)
File: `src/dal/example-dal.ts`

- **Only** database queries.
- No validation or auth.

### 4) Services (Use-cases)
File: `src/services/example-service.ts`

- Business logic, validation, orchestration.
- Returns DTOs for UI/API.

### 5) Interface Layer

#### Server Actions (mutations only)
File: `src/actions/example-actions.ts`

- Use the `createAction` wrapper from `src/actions/action-base.ts`.
- Parse inputs and revalidate paths/tags after writes.

#### Route Handlers (external APIs + GET reads)
File: `src/app/api/examples/route.ts`

- Use `GET` for cacheable reads.
- Use `POST` for external writes.

### Client Fetch Example
File: `src/components/app/compounds/examples-client-panel.tsx`

- Client components **read data via API routes**.
- Client reads should use GET to preserve caching semantics.

## Server Actions vs API Routes

**Server Actions (use for mutations only):**
- UI-triggered writes (forms, buttons)
- Internal only (not for external clients)
- POST only; not cacheable

**Route Handlers (use for reads and external APIs):**
- External consumers, webhooks, or public APIs
- Cacheable GET responses
- Explicit HTTP semantics

### Why this split?
- **Server actions are POST-only** and cannot leverage browser/HTTP caching.
- **GET route handlers** allow cache headers and CDN/browser caching.

## Security Requirements (Server Actions)

Server actions are public endpoints. Treat them like APIs:

- Always validate input (Zod)
- Enforce auth/authorization (use the action wrapper)
- Revalidate cache after mutations

The wrapper in `src/actions/action-base.ts` provides a central place to enforce
auth and context extraction for every action.

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
