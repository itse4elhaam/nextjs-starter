# 🚀 Next.js Starter Template

> A production-ready Next.js 16 starter template with TypeScript, Tailwind CSS v4, shadcn/ui, and modern best practices.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Bun](https://img.shields.io/badge/Bun-Latest-f472b6?logo=bun)](https://bun.sh/)

## 📋 Table of Contents

- [Why This Template?](#-why-this-template)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Key Features & Examples](#-key-features--examples)
- [Scripts Reference](#-scripts-reference)
- [Environment Variables](#-environment-variables)
- [Code Standards](#-code-standards)
- [Git Hooks & CI/CD](#-git-hooks--cicd)
- [Adding UI Components](#-adding-ui-components)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

## 🎯 Why This Template?

This isn't just another Next.js starter. It's a **battle-tested, production-ready foundation** that saves you hours of setup time and enforces best practices from day one.

**What makes it different:**

- ✅ **Type-safe environment variables** with runtime validation (Zod + T3 Env)
- ✅ **Atomic design pattern** for scalable component architecture
- ✅ **Strict naming conventions** (Interfaces: `IUser`, Types: `TApiResponse`)
- ✅ **Pre-configured utilities** (type-safe API fetcher, storage helpers)
- ✅ **Automated code quality** (Biome + Husky hooks)
- ✅ **CI/CD ready** (GitHub Actions with lint + type-check)
- ✅ **Modern stack** (Next.js 16, React 19, Tailwind v4, Bun)
- ✅ **DAL layering examples** (DB → DAL → Services → Actions/API)
- ✅ **shadcn/ui integration** with New York style variants

## ✨ Features

- 🎨 **Tailwind CSS v4** - Latest CSS framework with JIT compilation
- 🧩 **shadcn/ui** - Beautiful, accessible components built on Radix UI
- 📦 **Bun** - Lightning-fast package manager and runtime
- ⚡ **Turbopack** - Next-generation bundler for development
- 🔒 **Type Safety** - End-to-end TypeScript with strict mode
- 🌍 **Environment Validation** - Runtime validation with Zod
- 🎯 **Atomic Design** - Scalable component architecture (atoms/molecules/compounds)
- 🔧 **Utility Helpers** - Pre-built helpers for API calls, storage, cookies
- 🎨 **Code Formatting** - Biome with automatic formatting on commit
- 📏 **Linting** - Biome check (lint + formatting)
- 🪝 **Git Hooks** - Husky pre-commit (format) and pre-push (lint)
- 🚀 **CI/CD** - GitHub Actions workflow for automated testing
- 📱 **Responsive** - Mobile-first design approach

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5.x |
| **Package Manager** | Bun |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui (New York style) |
| **Icons** | Lucide React |
| **Validation** | Zod |
| **Environment** | @t3-oss/env-core |
| **Linting** | Biome |
| **Git Hooks** | Husky |
| **ORM** | Drizzle ORM + drizzle-kit |
| **CI/CD** | GitHub Actions |

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.0 ([Install Bun](https://bun.sh/))
- **Node.js** >= 20.x (for compatibility)
- **Git** for version control

### Installation

1. **Clone or use this template:**

```bash
# Clone the repository
git clone https://github.com/yourusername/nextjs-starter.git my-project
cd my-project

# Or use as GitHub template
# Click "Use this template" button on GitHub
```

2. **Install dependencies:**

```bash
bun install
```

3. **Set up environment variables:**

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
```

4. **Start the development server:**

```bash
bun dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
nextjs-starter/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline (lint + type-check)
├── .husky/
│   ├── pre-commit              # Auto-format staged files
│   └── pre-push                # Lint before push
├── public/                     # Static assets
│   ├── *.svg                   # SVG icons and images
│   └── ...
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles + Tailwind imports
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Home page
│   │   └── api/examples/route.ts # Route handler example
│   ├── components/
│   │   ├── app/               # Application-specific components
│   │   │   ├── atoms/         # Basic building blocks
│   │   │   ├── molecules/     # Composite components
│   │   │   └── compounds/     # Complex feature components
│   │   │       ├── examples-server-panel.tsx
│   │   │       └── examples-client-panel.tsx
│   │   └── ui/                # shadcn/ui components
│   │       └── button.tsx     # Example: Button component
│   ├── actions/               # Server actions (mutations)
│   │   ├── action-base.ts
│   │   └── example-actions.ts
│   ├── dal/                   # Data access layer
│   │   └── example-dal.ts
│   ├── db/                    # DB client + schema
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── helpers/               # Utility helpers
│   │   ├── api.ts            # Type-safe fetch wrapper
│   │   ├── cookies.ts        # Client-side cookie management
│   │   ├── storage.ts        # localStorage/sessionStorage helpers
│   │   └── index.ts          # Barrel export
│   ├── hooks/                # Custom React hooks
│   │   └── index.ts          # Barrel export
│   ├── services/             # Business logic layer
│   │   └── example-service.ts
│   └── lib/                  # Core utilities & configuration
│       ├── config.ts         # Environment validation (Zod + T3 Env)
│       ├── constants.ts      # App constants (HTTP_VERBS, etc.)
│       ├── types.ts          # TypeScript interfaces/types
│       ├── examples-schema.ts
│       ├── examples-types.ts
│       ├── utils.ts          # Utility functions (cn, isClientSide)
│       └── index.ts          # Barrel export
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore rules
├── biome.json                # Biome configuration
├── components.json           # shadcn/ui configuration
├── drizzle.config.ts          # Drizzle config
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
├── postcss.config.mjs        # PostCSS configuration
├── README.md                 # This file
└── tsconfig.json             # TypeScript configuration
```

### Component Architecture (Atomic Design)

```
components/app/
├── atoms/          # Basic, reusable UI elements
│   ├── Input.tsx
│   ├── Label.tsx
│   └── Badge.tsx
├── molecules/      # Combinations of atoms
│   ├── FormField.tsx
│   ├── SearchBar.tsx
│   └── UserAvatar.tsx
└── compounds/      # Complex, feature-specific components
    ├── LoginForm.tsx
    ├── DataTable.tsx
    └── NavigationMenu.tsx
```

## 🔑 Key Features & Examples

### 1. Type-Safe Environment Variables

**File:** `src/lib/config.ts`

```typescript
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["production", "development"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

// Usage:
// import { env } from "@/lib/config";
// const apiUrl = env.NEXT_PUBLIC_API_BASE_URL;
```

**Benefits:**
- ✅ Runtime validation on startup
- ✅ Type-safe access throughout your app
- ✅ Clear separation of server/client variables
- ✅ Automatic error messages for missing/invalid vars

### 2. Type-Safe API Fetcher

**File:** `src/helpers/api.ts`

```typescript
import { fetcher } from "@/helpers/api";

// Example: Fetch user data
const response = await fetcher<never, { id: string; name: string }>({
  url: `${env.NEXT_PUBLIC_API_BASE_URL}/users/1`,
  method: "GET",
  token: "your-auth-token", // Optional
});

if (response.ok) {
  console.log(response.data); // Typed as { id: string; name: string }
} else {
  console.error(response.error);
}

// Example: Create user
const createResponse = await fetcher<
  { name: string; email: string },
  { id: string }
>({
  url: `${env.NEXT_PUBLIC_API_BASE_URL}/users`,
  method: "POST",
  body: { name: "John", email: "john@example.com" },
  token: "your-auth-token",
});
```

**Features:**
- ✅ Generic type parameters for request/response
- ✅ Automatic Bearer token handling
- ✅ Consistent error handling
- ✅ JSON parsing with content-type detection

### 3. Client-Side Storage Helpers

**File:** `src/helpers/storage.ts`

```typescript
import { getLocalStorage, setLocalStorage } from "@/helpers/storage";

// Type-safe localStorage
interface IUserPreferences {
  theme: "light" | "dark";
  language: string;
}

const prefs = getLocalStorage<IUserPreferences>("user-prefs");
setLocalStorage("user-prefs", { theme: "dark", language: "en" });
```

**File:** `src/helpers/cookies.ts`

```typescript
import { setCookie, getCookie, deleteCookie } from "@/helpers/cookies";

// Set cookie (expires in 7 days)
setCookie("auth-token", "abc123", 7);

// Get cookie
const token = getCookie("auth-token");

// Delete cookie
deleteCookie("auth-token");
```

### 4. Utility Functions

**File:** `src/lib/utils.ts`

```typescript
import { cn, isClientSide, isServerSide } from "@/lib/utils";

// Merge Tailwind classes intelligently
const buttonClass = cn(
  "px-4 py-2 rounded",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50"
);

// Environment detection
if (isClientSide()) {
  // Code runs only in browser
  window.addEventListener("resize", handleResize);
}

if (isServerSide()) {
  // Code runs only on server
  const data = await fetchServerData();
}
```

### 5. DAL + Server Action Examples

**Files:**
- `src/db/schema.ts` (schema)
- `src/db/index.ts` (db client)
- `src/dal/example-dal.ts` (DAL)
- `src/services/example-service.ts` (services)
- `src/actions/example-actions.ts` (server action)
- `src/app/api/examples/route.ts` (route handler)
- `src/components/app/compounds/examples-server-panel.tsx` (server component)
- `src/components/app/compounds/examples-client-panel.tsx` (client fetch)

### 6. shadcn/ui Integration

**Add components:**

```bash
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add card
```

**Use components:**

```typescript
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <Button variant="default" size="lg">
      Click me
    </Button>
  );
}
```

**Available variants:**
- `variant`: default, destructive, outline, secondary, ghost, link
- `size`: default, sm, lg, icon

## 📜 Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `bun dev` | Start development server with Turbopack |
| **build** | `bun build` | Create production build |
| **start** | `bun start` | Start production server |
| **lint** | `bun lint` | Run Biome checks |
| **type-check** | `bun type-check` | Run TypeScript type checking |
| **format** | `bun format` | Format code with Biome |
| **db:generate** | `bun run db:generate` | Generate migrations |
| **db:migrate** | `bun run db:migrate` | Run migrations |
| **db:push** | `bun run db:push` | Push schema to database |
| **db:studio** | `bun run db:studio` | Drizzle Studio |
| **prepare** | `bun prepare` | Install Husky git hooks (auto-runs on install) |

### Development Workflow

```bash
# Start development
bun dev

# Check for issues before committing
bun lint
bun type-check

# Format code manually (auto-runs on git commit)
bun format
```

## 🌍 Environment Variables

Create a `.env` file in the root directory:

```env
# Server-side only (NOT exposed to browser)
DATABASE_URL=postgres://user:password@localhost:5432/app_db
PORT=3000
NODE_ENV=development

# Client-side (exposed to browser, must use NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**Important:**
- ✅ Server variables are only accessible in Server Components and API routes
- ✅ Client variables (prefixed with `NEXT_PUBLIC_`) are bundled and exposed to the browser
- ✅ All variables are validated at build time using Zod schemas in `src/lib/config.ts`
- ✅ Missing or invalid variables will cause build failures with clear error messages

**Adding new variables:**

1. Update `.env` and `.env.example`
2. Add validation schema in `src/lib/config.ts`
3. Restart the dev server

```typescript
// src/lib/config.ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(), // Add this
  },
  client: {
    NEXT_PUBLIC_FEATURE_FLAG: z.boolean(), // Add this
  },
  runtimeEnv: process.env,
});
```

## 📏 Code Standards

### Biome Rules

Biome enforces recommended rules. We also follow naming conventions:

- Interfaces: Must start with `I` (e.g., `IUser`, `IApiResponse`)
- Types: Must start with `T` (e.g., `TUserRole`, `TApiError`)

### TypeScript Configuration

**File:** `tsconfig.json`

- ✅ **Strict mode enabled** - Maximum type safety
- ✅ **Path aliases** - Import with `@/*` instead of relative paths
- ✅ **ESNext modules** - Modern JavaScript features
- ✅ **JSX preserved** - Handled by Next.js

### Biome Configuration

**File:** `biome.json`

- Indentation: 2 spaces
- Line width: 80

## 🪝 Git Hooks & CI/CD

### Husky Git Hooks

**Pre-commit** (`.husky/pre-commit`):
- Automatically formats staged files with Biome
- Runs before each commit
- Ensures consistent code style

**Pre-push** (`.husky/pre-push`):
- Runs Biome check on all files
- Prevents pushing code with linting errors
- Saves CI/CD time by catching issues early

### GitHub Actions CI/CD

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Pull requests to `main` and `dev` branches

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install Bun
4. Install dependencies (`bun install`)
5. Run linting (`bun lint`)
6. Run type checking (`bun type-check`)

**Benefits:**
- ✅ Automated code quality checks
- ✅ Prevents merging broken code
- ✅ Fast feedback on PRs

## 🎨 Adding UI Components

This template uses [shadcn/ui](https://ui.shadcn.com/) with the New York style variant.

### Install a component:

```bash
bunx shadcn@latest add <component-name>
```

### Available components:

```bash
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add card
bunx shadcn@latest add dialog
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add form
bunx shadcn@latest add table
bunx shadcn@latest add toast
# ... and many more
```

### Component configuration:

**File:** `components.json`

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

### Customization:

Components are installed in `src/components/ui/` and can be customized directly. They're just regular React components!

## 🐛 Troubleshooting

### Bun installation issues

**Problem:** `bun: command not found`

**Solution:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or with npm
npm install -g bun
```

### Environment variable errors

**Problem:** `Environment variable validation failed`

**Solution:**
1. Check `.env` file exists and is not empty
2. Compare with `.env.example` for required variables
3. Ensure server variables don't have `NEXT_PUBLIC_` prefix
4. Ensure client variables DO have `NEXT_PUBLIC_` prefix
5. Restart the dev server after changes

### ESLint naming convention errors

**Problem:** `Interface 'User' incorrectly named, must match the pattern '^I[A-Z]'`

**Solution:**
```typescript
// ❌ Wrong
interface User {}
type ApiResponse = {};

// ✅ Correct
interface IUser {}
type TApiResponse = {};
```

### Husky hooks not running

**Problem:** Git hooks don't execute on commit/push

**Solution:**
```bash
# Reinstall Husky hooks
bun run prepare

# Or manually
bunx husky install
```

### Prettier not formatting on commit

**Problem:** Files aren't auto-formatted

**Solution:**
1. Ensure Husky is installed: `bun run prepare`
2. Check `.husky/pre-commit` exists and is executable
3. Manually format: `bun format`

### TypeScript errors in IDE

**Problem:** TypeScript errors in editor but not in terminal

**Solution:**
1. Reload VS Code TypeScript server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
2. Ensure using workspace TypeScript: Check status bar
3. Delete `.next` folder: `rm -rf .next`

### Tailwind CSS not working

**Problem:** Tailwind classes don't apply styles

**Solution:**
1. Ensure `globals.css` imports Tailwind directives
2. Check `tailwind.config.ts` content paths
3. Restart dev server: `Ctrl+C` then `bun dev`
4. Clear `.next` cache: `rm -rf .next`

## 🗺 Roadmap

Future enhancements planned for this template:

- [ ] **Testing Setup** - Vitest + React Testing Library
- [x] **API Route Examples** - REST API patterns
- [x] **Server Actions Examples** - Next.js server actions
- [x] **Database Integration** - Drizzle ORM setup
- [ ] **Authentication** - NextAuth.js v5 example
- [ ] **Error Boundary** - Custom error handling component
- [ ] **Loading States** - Suspense and loading UI examples
- [ ] **Middleware** - Auth and redirect examples
- [ ] **Docker Setup** - Containerization for deployment
- [ ] **Storybook** - Component documentation
- [ ] **i18n** - Internationalization setup
- [ ] **SEO Components** - Metadata API helpers
- [ ] **Analytics** - Google Analytics / Vercel Analytics
- [ ] **Monitoring** - Sentry error tracking

**Want to contribute?** See [Contributing](#-contributing) below!

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

1. Check if the issue already exists
2. Use issue templates (bug, feature request)
3. Provide detailed reproduction steps
4. Include environment details (OS, Node version, Bun version)

### Submitting Changes

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes:**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
4. **Commit with conventional commits:**
   ```bash
   git commit -m "feat: add amazing feature"
   git commit -m "fix: resolve issue with API fetcher"
   git commit -m "docs: update README examples"
   ```
5. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request:**
   - Describe your changes
   - Link related issues
   - Ensure CI checks pass

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style

- ✅ Use TypeScript strict mode
- ✅ Follow naming conventions (Interfaces: `I*`, Types: `T*`)
- ✅ Keep files under 600 lines
- ✅ Write descriptive variable names
- ✅ Add comments for complex logic
- ✅ Use `@/*` path aliases, not relative imports

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Credits

Built with these amazing technologies:

- [Next.js](https://nextjs.org/) - The React Framework
- [React](https://react.dev/) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Bun](https://bun.sh/) - Package Manager
- [T3 Env](https://env.t3.gg/) - Environment Validation
- [Zod](https://zod.dev/) - Schema Validation

---

**Made with ❤️ for the Next.js community**

If this template helped you, please consider giving it a ⭐️ on GitHub!
