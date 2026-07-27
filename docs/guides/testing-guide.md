# Testing Guide

> A practical guide for writing tests in this project. Follow these patterns for consistent, maintainable test coverage.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Setup & Configuration](#setup--configuration)
3. [Writing Unit Tests](#writing-unit-tests)
4. [Writing Integration Tests](#writing-integration-tests)
5. [Writing Component Tests](#writing-component-tests)
6. [Writing E2E Tests](#writing-e2e-tests)
7. [Test Rules & Conventions](#test-rules--conventions)
8. [What to Test](#what-to-test)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Testing Philosophy

We follow the **Testing Trophy** (Kent C. Dodds) — integration tests get the most investment because they give the best confidence-to-effort ratio:

```
         E2E (Playwright)
         Few — critical user journeys
       INTEGRATION
       MOST effort — service + component tests
     UNIT
     Moderate — complex business logic
   STATIC
   Heavy — TypeScript, Biome (already done)
```

| Layer | Investment | Purpose |
|-------|------------|---------|
| **Static** (TypeScript, Biome) | Heavy | Catch type errors, formatting |
| **Unit** | Moderate | Complex logic in isolation |
| **Integration** | **MOST** (60%) | How units work together |
| **E2E** | Few (10%) | Critical user journeys |

---

## Setup & Configuration

### Framework

This project uses **Vitest** with `globals: true`:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### File Structure

Tests mirror the source directory:

```
src/__tests__/
├── lib/
│   ├── errors.test.ts
│   └── utils.test.ts
├── services/
│   └── example.test.ts
├── components/
│   └── ExampleComponent.test.tsx
├── mocks/
│   └── server-only.ts
├── setup.ts
└── helpers.ts
```

---

## Writing Unit Tests

Unit tests verify a single function or module in isolation. They should be **fast, deterministic, and test behavior not implementation**.

### What Makes a Good Unit Test

```typescript
// ✅ GOOD — tests a pure function with clear input/output
it("formats a valid slug correctly", () => {
  expect(formatSlug("Hello World")).toBe("hello-world");
});

it("returns empty string for empty input", () => {
  expect(formatSlug("")).toBe("");
});

// ✅ GOOD — tests error creation
it("creates error with correct code and message", () => {
  const error = createAppError(ErrorCode.NotFound, "Resource not found");
  expect(error.code).toBe(ErrorCode.NotFound);
  expect(error.message).toBe("Resource not found");
});

// ❌ BAD — tests implementation details (brittle)
it("calls the internal helper function with correct args", () => {
  const spy = vi.spyOn(internalModule, "helper");
  formatSlug("Hello");
  expect(spy).toHaveBeenCalledWith("Hello");
});
```

### Unit Test Examples

**Testing utilities (`src/__tests__/lib/utils.test.ts`):**
```typescript
import { cn, isClientSide, formatSlug } from "@/lib/utils";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("removes conflicting tailwind classes", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});
```

**Testing errors (`src/__tests__/lib/errors.test.ts`):**
```typescript
import { createError, tryCatch, createAppError } from "@/lib/errors";
import { ok, err } from "neverthrow";
import { ErrorCode } from "@/lib/enums";

describe("createAppError", () => {
  it("creates error with code and message", () => {
    const error = createAppError(ErrorCode.NotFound, "Item not found", { id: 42 });
    expect(error.code).toBe(ErrorCode.NotFound);
    expect(error.message).toBe("Item not found");
    expect(error.details).toEqual({ id: 42 });
  });
});

describe("tryCatch", () => {
  it("returns ok for successful promise", async () => {
    const result = await tryCatch(Promise.resolve("data"));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("data");
  });

  it("returns err for rejected promise", async () => {
    const result = await tryCatch(Promise.reject(new Error("fail")));
    expect(result.isErr()).toBe(true);
  });
});
```

---

## Writing Integration Tests

Integration tests verify that multiple units work together. This is where the **highest return on investment** lives.

### Service Integration Tests

Mock at the **DAL/API boundary**, not at the HTTP level:

```typescript
// src/__tests__/services/example.test.ts
import { ok, err } from "neverthrow";
import { processData } from "@/services/example-service";
import * as dal from "@/dal/example-dal";
import { createAppError } from "@/lib/errors";
import { ErrorCode } from "@/lib/enums";

// Mock the DAL layer
vi.mock("@/dal/example-dal");

describe("processData", () => {
  it("returns DTO when DAL succeeds", async () => {
    vi.mocked(dal.getData).mockResolvedValue(
      ok({ id: "1", name: "Test Item" })
    );

    const result = await processData("1");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        id: "1",
        displayName: "Test Item", // DTO mapping applied
      });
    }
  });

  it("propagates not-found error from DAL", async () => {
    vi.mocked(dal.getData).mockResolvedValue(
      err(createAppError(ErrorCode.NotFound, "Item not found", { id: "999" }))
    );

    const result = await processData("999");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.NotFound);
    }
  });

  it("handles DAL failure gracefully", async () => {
    vi.mocked(dal.getData).mockResolvedValue(
      err(createAppError(ErrorCode.DatabaseError, "Connection failed"))
    );

    const result = await processData("1");
    expect(result.isErr()).toBe(true);
  });
});
```

### Mocking Server-Only Modules

```typescript
// src/__tests__/mocks/server-only.ts
// Make Vitest ignore "server-only" imports
const serverOnlyMock = new Proxy(
  {},
  {
    get: () => serverOnlyMock,
    apply: () => serverOnlyMock,
  },
);

export default serverOnlyMock;
```

---

## Writing Component Tests

Component tests verify rendered output — **never internal state**.

### Setup

```typescript
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
```

### Component Test Examples

```typescript
// src/__tests__/components/ExampleComponent.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { ExampleComponent } from "@/components/app/atoms/ExampleComponent";

describe("ExampleComponent", () => {
  it("renders with required props", () => {
    render(<ExampleComponent name="Test" description="A test component" />);

    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("A test component")).toBeInTheDocument();
  });

  it("renders with correct heading hierarchy", () => {
    render(<ExampleComponent name="Test" description="Desc" />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Test");
  });

  it("shows fallback when name is empty", () => {
    render(<ExampleComponent name="" description="" />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });
});
```

### Component Test Rules

- Query by **accessible roles and text** — never by CSS class names or DOM structure
- Test **error states** (empty data, API failure, missing props) — not just happy path
- All clickable elements must have `cursor-pointer`
- Use `userEvent` over `fireEvent` for realistic interaction simulation

---

## Writing E2E Tests

E2E tests simulate real user journeys in a real browser. Use Playwright sparingly for critical paths.

### Setup

```bash
bun install -d @playwright/test
bunx playwright install chromium
```

**`playwright.config.ts`:**
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run build && bun run start",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/homepage.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads with all sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("navigation links work correctly", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Home" }).click();

  expect(page.url()).toBe("http://localhost:3000/");
});
```

### E2E Test Rules

- Tests must be **independent** — no shared state
- Use `data-testid` **sparingly** — prefer accessible queries (`getByRole`, `getByText`)
- One user journey per spec file
- Keep under 10 E2E tests total

---

## Test Rules & Conventions

### Hard Rules

| # | Rule | Reason |
|---|------|--------|
| 1 | NEVER use `as any`, `@ts-ignore`, `@ts-expect-error` in tests | Type safety applies everywhere |
| 2 | Prefer `function` declarations over arrow functions for test blocks | Consistent style |
| 3 | Test **behavior, not implementation** | Implementation changes break tests unnecessarily |
| 4 | One logical assertion per test | Isolates failures, clear intent |
| 5 | Use descriptive test names that read like user stories | `"shows price on card"` not `"extractPriceInfo returns value"` |

### Naming Conventions in Tests

- Follow the same project conventions: interfaces with `I`, types with `T`, enums with PascalCase
- Import types from `@/lib/types`, enums from `@/lib/enums`, constants from `@/lib/constants`
- Never hardcode strings that exist as constants — import them:
  ```typescript
  // ✅ GOOD
  import { ErrorCode } from "@/lib/enums";
  expect(result.error.code).toBe(ErrorCode.NotFound);

  // ❌ BAD
  expect(result.error.code).toBe("NOT_FOUND");
  ```

### Mocking Rules

- Mock at the **module boundary** (DAL, API client), not at the HTTP level
- Use `vi.mocked()` for typed mocks
- Reset mocks between tests with `beforeEach(() => vi.clearAllMocks())`
- For `server-only` modules, create mock files in `src/__tests__/mocks/`

---

## What to Test

### Priority Order

1. **Pure functions** (utilities, formatters, validators) — easiest, most stable
2. **Service layer** (business logic, DTO mapping) — highest ROI
3. **Error paths** (what happens when API fails, data is missing, input is invalid)
4. **Component rendering** (output verification, not internal state)
5. **Critical user journeys** (E2E)

### What NOT to Test

- ❌ Third-party library internals (they test their own code)
- ❌ Configuration files (biome.json, next.config.ts)
- ❌ Type definitions (TypeScript catches this at compile time)
- ❌ Simple getters or pass-through functions (tested implicitly)
- ❌ CSS classes and styling (snapshot tests for UI are brittle)

### Test Coverage Targets

| Module | Target |
|--------|--------|
| `src/lib/errors.ts` | 90%+ |
| `src/lib/utils.ts` | 90%+ |
| `src/lib/retry.ts` | 80%+ |
| `src/lib/guards.ts` | 90%+ |
| `src/services/*.ts` | 70%+ |
| Key components | 70%+ |

---

## Implementation Roadmap

### Phase 1 — Infrastructure & Utilities

| Task | Effort |
|------|--------|
| Configure Vitest (jsdom for components) | 1h |
| Create `src/__tests__/setup.ts` | 30m |
| Create `src/__tests__/mocks/server-only.ts` | 15m |
| Write `lib/errors.test.ts` (5 tests) | 1h |
| Write `lib/utils.test.ts` (5 tests) | 1h |
| Write `lib/retry.test.ts` (3 tests) | 30m |
| Write `lib/guards.test.ts` (3 tests) | 30m |

### Phase 2 — Services & Components (HIGHEST PRIORITY)

| Task | Tests | Effort |
|------|-------|--------|
| Service tests (success + error paths) | 10 | 3h |
| Component tests (render, empty, error states) | 15 | 5h |

### Phase 3 — E2E (One per Critical Journey)

| Task | Tests | Effort |
|------|-------|--------|
| Homepage loads correctly | 1 | 1h |
| Navigation flow | 1 | 1h |
| Critical form/action flow | 1 | 2h |
