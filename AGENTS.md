# Repository Agent Guide (nextjs-starter)

This document is for agentic coding assistants working in this repo. Follow it
exactly to stay aligned with tooling, style, and CI expectations.

## Quick Commands

Install dependencies:

```bash
bun install
```

Run dev server:

```bash
bun run dev
```

Build production bundle:

```bash
bun run build
```

Start production server (requires .env):

```bash
bun run start
```

Lint (Biome):

```bash
bun run lint
```

Type-check (tsc):

```bash
bun run type-check
```

Format (Biome):

```bash
bun run format
```

### Single-test Commands

No test runner is configured in this repository yet. There are no Jest/Vitest/
Playwright/Cypress configs and CI only runs lint + type-check. If a test runner
is added, update this section with “run one test” commands.

## CI / Git Hooks

- CI (GitHub Actions) runs `bun run lint` and `bun run type-check`.
- Husky hooks:
  - pre-commit: runs Biome format on staged files.
  - pre-push: runs `bun lint` (Biome check).

## Tech Stack

- Next.js App Router (Next 16)
- React 19
- TypeScript (strict, noEmit)
- Tailwind CSS v4 + shadcn/ui
- Zod + @t3-oss/env-core for env validation
- Drizzle ORM (Postgres) + drizzle-kit

## Project Structure

- `src/` is the app root.
- UI components follow atomic design under:
  `src/components/app/atoms`, `molecules`, `compounds`.
- Utilities live in `src/lib/` (e.g., `utils.ts`, `types.ts`, `config.ts`).

## Formatting (Biome)

Biome config lives in `biome.json`:

- Indentation: 2 spaces
- Line width: 80

Run `bun run format` before pushing changes that touch formatting.

## Linting (Biome)

Biome enforces recommended rules for linting and formatting. Keep naming
conventions consistent:

- Interfaces: PascalCase with `I` prefix (e.g., `IUser`)
- Type aliases: PascalCase with `T` prefix (e.g., `TUser`)

## TypeScript Settings

From `tsconfig.json`:

- `strict: true` and `noEmit: true`
- `moduleResolution: bundler`
- `jsx: react-jsx`
- `target: ES2017`
- `isolatedModules: true`
- Path alias: `@/*` → `./src/*`

Follow strict typing conventions. Avoid implicit `any` (TypeScript will fail).

## Imports

- Prefer absolute imports via `@/` when referencing `src/`.
- Keep imports grouped by:
  1) external packages
  2) internal `@/` imports
  3) relative imports

## Naming Conventions

- Interfaces: `I` prefix (e.g., `IUser`, `IFetchResponse`).
- Types: `T` prefix (e.g., `TUser`, `TStatus`).
- React components: PascalCase.
- Variables/functions: camelCase.
- Constants: UPPER_SNAKE_CASE only when truly constant.

## Error Handling & API Requests

- Prefer the shared fetcher in `src/helpers/api.ts`.
- Use the `IFetchResponse<T>` return shape for consistent error handling.
- When handling errors, return structured error messages (no empty catches).

## Environment Variables

- Use `src/lib/config.ts` with `createEnv` + Zod for validation.
- Client env vars must use the `NEXT_PUBLIC_` prefix.
- Use `process.env` through the centralized config, not ad-hoc reads.
- Database connection uses `DATABASE_URL` (see `.env.example`).

## Tailwind / UI

- Use Tailwind v4 utilities for styling.
- Prefer shared utilities like `cn(...)` in `src/lib/utils.ts` for class merging.
- Follow existing shadcn/ui patterns for components.

## Performance & Quality

- Keep functions small and focused.
- Avoid deeply nested control flow; use early returns.
- Respect the 600-line per file rule.
- Run `bun run lint` and `bun run type-check` before pushing.

## Cursor / Copilot Rules

- No `.cursorrules` or `.cursor/rules/` found.
- No `.github/copilot-instructions.md` found.

If these files are added later, update this document to mirror their rules.
