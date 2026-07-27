# Maintenance & Project Metadata Guide

This document ensures project metadata remains accurate across the codebase and documentation. **Any changes to project identity, tech stack, or configuration must be updated in ALL listed locations.**

## Critical Project Metadata

| Field | Value | Source of Truth |
|-------|-------|-----------------|
| **Project Name** | `[project-name]` | `package.json` |
| **Description** | `[project-description]` | `README.md` |
| **Repository** | `[project-repository-url]` | `README.md`, git config |
| **Tech Stack** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (New York), Drizzle ORM (Postgres), Biome, Bun | `README.md`, `package.json` |

## Locations to Update When Project Metadata Changes

### CRITICAL (Must Update Immediately)

| File | What to Update | When |
|------|----------------|------|
| `package.json` | `name`, `description`, `repository.url`, `author`, `license` | Name/identity change |
| `README.md` | Project title, tagline, description, tech stack badges, clone URL | Any project info change |
| `src/lib/env.ts` | Public/private env variable definitions, validation schema | When adding/removing env vars |
| `.env.example` | All required env vars with dummy/placeholder values | When env vars change |

### IMPORTANT (Keeps Documentation Aligned)

| File | What to Update | When |
|------|----------------|------|
| `README.md` — Environment Variables section | Required/Optional var lists | When `env.ts` changes |
| `docs/architecture.md` | Project description, tech stack, architectural decisions | When major tech decisions change |
| `AGENTS.md` | Project name, repo URL, tech stack, tooling commands | When processes change |
| `CONTRIBUTING.md` | Development standards, patterns, env var requirements | When code standards change |

### REFERENCE (Information Only)

| File | What | Notes |
|------|------|-------|
| `docs/guides/seo-guide.md` | SEO implementation requirements | Reference for page builds |
| `docs/guides/performance-guide.md` | Performance requirements | Reference for optimization |
| `docs/guides/*.md` | Verify setup instructions match current project state | Reference |
| `src/app/globals.css` | Theme variables, font imports, Tailwind config overrides | Update when adding new motion tokens or animation classes |
| `src/lib/constants.ts` | App-wide constants (routes, form fields, durations, MOTION, etc.) | Update when adding new constants |
| `src/hooks/useReveal.ts` | Scroll-triggered reveal animation hook | Update when modifying |
| `src/hooks/useDrawOn.ts` | SVG draw-on animation hook | Update when modifying |
| `src/components/app/atoms/Reveal.tsx` | Scroll reveal Client wrapper | Update when modifying |
| `bun.lock` | Dependency lock file | Auto-generated, don't edit manually |

## Checklist for Common Updates

### Adding a New Environment Variable

1. **Define in `src/lib/env.ts`** — Add to `server` or `client` object with Zod validation. If it's a new integration (Sentry, GA, etc.), add a comment group.
2. **Document in `.env.example`** — Add with description and marked as REQUIRED or optional. Include inline comments explaining what it's used for.
3. **Update `README.md`** — Add to Environment Variables section (server-side required, client-side required, or optional).
4. **Update relevant `docs/guides/*.md`** — If tied to a specific feature or integration (e.g., Sentry, analytics), update the corresponding guide.

**Verification**: Run `bun run type-check` — must pass cleanly.

### Adding a New shadcn/ui Component

1. Run `bunx shadcn@latest add [component-name]` to install the component.
2. The component is placed in `src/components/ui/` — do not rename or move it.
3. If the component needs project-specific styling, override via className props or update the component directly (it's yours once added).
4. Export from `src/components/ui/index.ts` if a barrel file is maintained.
5. Update `docs/architecture.md` if adding a significantly new UI pattern.

### Adding a New Page Route

1. Create the route directory under `src/app/` following the App Router convention (e.g., `src/app/about/page.tsx`).
2. Add the route path to `src/lib/constants.ts` under the `ROUTES` object if it needs to be referenced elsewhere.
3. Update navigation components (`SiteHeader`, footer, etc.) if the page appears in primary navigation.
4. If the page uses dynamic segments or search params, document the expected URL structure in `docs/architecture.md`.

### Updating Technology Stack

If upgrading Next.js, React, TypeScript, or dependencies:

1. Update `package.json` (auto via `bun add`)
2. Update badges in `README.md`
3. Update `docs/architecture.md` with new version numbers

**Examples:**
- Next.js 16 → 17: Update README + architecture.md
- React 19 → 20: Update README + architecture.md

### Fixing Outdated Documentation

If you find outdated references (like old project names or repository URLs):

1. **Search codebase** with grep for the old value
2. **Update ALL occurrences** in the locations listed above
3. **Verify in places that reference each other**:
   - `README.md` and `package.json` must match on project name
   - `env.ts` and `.env.example` must be in sync

**Example**: Renaming the project from "nextjs-starter" to "my-project"
```bash
# Search all files
grep -r "nextjs-starter" src/ docs/ *.json *.md

# Update:
# - package.json (name field)
# - README.md (intro line, clone URL)
# - Any other references
```

## Zero-Tolerance: Lint Errors & Type Errors

**All code changes MUST pass `bun run lint` and `bun run type-check` with zero errors and zero warnings before being committed.**

This is non-negotiable. The CI pipeline enforces both checks, and Husky pre-push hooks run `bun lint`. Any failures block the commit/push.

### Rules

- **No suppression**: Never use `@ts-ignore`, `@ts-expect-error`, `as any`, or Biome `// biome-ignore` comments to silence errors or warnings. Fix the root cause.
- **No pre-existing excuse**: If you encounter pre-existing errors unrelated to your changes, fix them or document them — never use them as justification for introducing new ones.
- **Warnings are errors**: Treat lint warnings with the same urgency as errors.
- **Verify before declaring done**: Every PR, every commit, every task — run both checks and confirm zero output before marking complete.

### Verification Commands

```bash
# Must both exit 0 with no output
bun run lint
bun run type-check
```

### What to Do When Checks Fail

1. **Type errors**: Fix the type properly. If the type system is wrong, update `src/lib/types.ts`. Never cast away the problem.
2. **Lint errors**: Follow Biome's suggestion. If the rule seems wrong for this codebase, discuss changing `biome.json` — don't suppress inline.
3. **Pre-existing failures**: If you discover failures that existed before your changes, fix them if trivial. If non-trivial, file an issue — but your own changes must still be clean.

## Verification Checklist

Before committing any metadata changes:

- [ ] `bun run type-check` passes (zero errors, zero warnings)
- [ ] `bun run lint` passes (zero errors, zero warnings)
- [ ] `.env.example` is not committed with real secrets
- [ ] All related documentation files are updated
- [ ] Project name is consistent across `package.json`, `README.md`
- [ ] Tech stack badges in README match actual dependencies
- [ ] Environment variable lists match `env.ts` exactly

## Deployment Checklist

Before deploying to any environment:

- [ ] **Build check** — Run `bun run build` locally and confirm zero errors
- [ ] **Lint & type check** — Run `bun run lint` and `bun run type-check`; both must pass with zero errors
- [ ] **Environment variables** — Verify ALL env vars are set in the target environment and match `src/lib/env.ts` schema
- [ ] **Migrations** — If the database schema changed, run `bun run db:generate` and `bun run db:migrate` against the target database
- [ ] **Sentry** — Confirm `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` is configured for error monitoring in the target environment
- [ ] **CI status** — Verify the latest CI run passes on the target branch

## When to Reference This Guide

This guide should be referenced when:
- **Onboarding new developers** — so they know where to look
- **Updating environment configuration** — env vars appear in multiple files
- **Upgrading dependencies** — tech stack appears in multiple places
- **Finding outdated references** — use the mapping above to find all locations
- **Creating project documentation** — ensure it's added to the lists above

**Keep this file updated as project structure evolves.**
