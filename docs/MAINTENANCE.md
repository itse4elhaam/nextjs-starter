# Maintenance & Project Metadata Guide

This document ensures project metadata remains accurate across the codebase and
documentation. Any changes to project identity, tech stack, or configuration
must be updated in ALL listed locations.

## Critical Project Metadata

| Field | Value |
|---|---|
| **Project Name** | `[project-name]` |
| **Description** | `[project-description]` |
| **Repository** | `[project-repository-url]` |
| **Tech Stack** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (New York), Drizzle ORM (Postgres), Biome, Bun |

## Locations to Update

### CRITICAL (Must Update Immediately)

| Location | What to Update |
|---|---|
| `package.json` | `name`, `description`, `repository.url`, `author`, `license` |
| `README.md` | Project title, tagline, description, tech stack badges |
| `src/lib/env.ts` | Public/private env variable definitions, validation schema |
| `.env.example` | All required env vars with dummy/placeholder values |

### IMPORTANT (Keeps Documentation Aligned)

| Location | What to Update |
|---|---|
| `README.md` — env vars section | Document each variable, its purpose, and where to obtain it |
| `docs/architecture.md` | Project description, tech stack, architectural decisions |
| `AGENTS.md` | Project name, repo URL, tech stack, tooling commands |
| `CONTRIBUTING.md` | Setup instructions, env var requirements, dev workflow guidance |

### REFERENCE (Information Only)

| Location | Notes |
|---|---|
| `docs/guides/*.md` | Verify setup instructions match current project state |
| `src/app/globals.css` | Theme variables, font imports, Tailwind config overrides |
| `src/lib/constants.ts` | App-wide constants (routes, form fields, durations, etc.) |
| `src/hooks/useReveal.ts` / `useDrawOn.ts` | Scroll animation thresholds, observer configuration |
| `src/components/app/atoms/Reveal.tsx` | Animation timing, effect configuration |

## Checklist for Common Updates

### Adding a New Environment Variable

1. **Define in `src/lib/env.ts`** — Add the variable to the validation schema with
   the correct type, default, and `NEXT_PUBLIC_` prefix if client-accessible.
2. **Document in `.env.example`** — Add a commented entry with a placeholder value
   and a brief description of where to obtain the real value.
3. **Update `README.md`** — Add the variable to the Environment Variables table
   with its purpose and required/optional status.
4. **Update relevant docs/guide** — If the variable is tied to a specific feature
   or integration (e.g., auth, database, email), update the corresponding guide
   in `docs/guides/`.

### Adding a New shadcn/ui Component

1. Run `bunx shadcn@latest add [component-name]` to install the component.
2. The component is placed in `src/components/ui/` — do not rename or move it.
3. If the component needs project-specific styling, override via className props
   or update the component directly (it's yours once added).
4. Export from `src/components/ui/index.ts` if a barrel file is maintained.
5. Update `docs/architecture.md` if adding a significantly new UI pattern.

### Adding a New Page Route

1. Create the route directory under `src/app/` following the App Router
   convention (e.g., `src/app/about/page.tsx`).
2. Add the route path to `src/lib/constants.ts` under the `ROUTES` object if it
   needs to be referenced elsewhere.
3. Update navigation components (`SiteHeader`, footer, etc.) if the page appears
   in primary navigation.
4. If the page uses dynamic segments or search params, document the expected URL
   structure in `docs/architecture.md`.

## Deployment Checklist

Before deploying to any environment:

- [ ] **Build check** — Run `bun run build` locally and confirm zero errors
- [ ] **Lint & type check** — Run `bun run lint` and `bun run type-check`; both
      must pass with zero errors
- [ ] **Environment variables** — Verify ALL env vars are set in the target
      environment and match `src/lib/env.ts` schema
- [ ] **Migrations** — If the database schema changed, run `bun run db:generate`
      and `bun run db:migrate` against the target database
- [ ] **Sentry** — Confirm `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` is configured
      for error monitoring in the target environment
- [ ] **CI status** — Verify the latest CI run passes on the target branch
