# Error Handling Guide

> Comprehensive reference for error handling patterns using the Result pattern and neverthrow library.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Error Types](#error-types)
3. [Service Layer Pattern](#service-layer-pattern)
4. [API Routes Pattern](#api-routes-pattern)
5. [Server Actions Pattern](#server-actions-pattern)
6. [Error Recovery](#error-recovery)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Core Concepts

This codebase uses the **Result pattern** via `neverthrow` library to handle errors as values instead of exceptions.

### Why Result Pattern?

| Aspect | Exceptions | Result Pattern |
|--------|-----------|------------------|
| **Error visibility** | Hidden in catch blocks | Explicit in return type |
| **Type safety** | Runtime unknown | Compiler enforced |
| **Exhaustiveness** | Can forget catches | Must handle both paths |
| **Error propagation** | Uncontrolled throw | Explicit `err()` |
| **Happy path clarity** | Mixed with catches | Clear `ok()` path |

### Core Types

```typescript
import type { Result, ResultAsync } from "neverthrow";

// Result<SuccessType, ErrorType>
Result<IData[], IAppError>  // Synchronous result
ResultAsync<IData[], IAppError>  // Asynchronous result
```

---

## Error Types

### IAppError (Standard Application Error)

All errors conform to the `IAppError` interface defined in `src/lib/types.ts`:

```typescript
export interface IAppError {
  code: string;  // ErrorCode enum value
  message: string;  // User-friendly error message
  details?: unknown;  // Optional debugging details
}
```

### Error Codes (defined in `src/lib/enums.ts`)

All error codes come from the `ErrorCode` enum — **never hardcode string literals**:

```typescript
import { ErrorCode } from "@/lib/enums";

// ✅ GOOD — typed, consistent, refactorable
const error = createAppError(ErrorCode.NotFound, "Resource not found");

// ❌ BAD — hardcoded string, typo-prone, inconsistent
const error = createAppError("NOT_FOUND", "Resource not found");
```

| Enum Value | Use Case | HTTP Status |
|------------|----------|-------------|
| `ErrorCode.ValidationError` | Invalid input (Zod parse failure) | 400 |
| `ErrorCode.Unauthorized` | Missing or invalid auth | 401 |
| `ErrorCode.Forbidden` | Insufficient permissions | 403 |
| `ErrorCode.NotFound` | Resource doesn't exist | 404 |
| `ErrorCode.Conflict` | Resource already exists | 409 |
| `ErrorCode.RateLimitExceeded` | Too many requests | 429 |
| `ErrorCode.InternalServerError` | Unexpected error | 500 |
| `ErrorCode.ServiceUnavailable` | External service down | 503 |

> **Important**: Error codes MUST be imported from `src/lib/enums.ts` (`ErrorCode` enum), never hardcoded as strings. This ensures type safety and prevents typos across the codebase.

### Creating Application Errors

Use the `createAppError` function from `src/lib/errors.ts`:

```typescript
import { createAppError } from "@/lib/errors";
import { ErrorCode } from "@/lib/enums";

// Explicit error with typed code
const error = createAppError(ErrorCode.NotFound, "Resource not found", {
  resourceId: id,
});

// Inferred error
const error = createAppError(ErrorCode.InternalServerError);
```

---

## Service Layer Pattern

Services handle business logic and return `Result<T, IAppError>`.

### Basic Service

```typescript
// src/services/example-service.ts
import { ok, err } from "neverthrow";
import { createAppError } from "@/lib/errors";
import { ErrorCode } from "@/lib/enums";     // ALWAYS import from enums
import type { IData, IAppError } from "@/lib/types";

/**
 * Fetch single item by slug.
 * Returns Result of data or app error.
 */
export async function getItemBySlug(
  slug: string,
): Promise<Result<IData, IAppError>> {
  try {
    // Validate input
    if (!slug || slug.trim().length === 0) {
      return err(createAppError(ErrorCode.ValidationError, "Slug is required"));
    }

    // Fetch from API
    const item = await fetchItem(slug);
    if (!item) {
      return err(
        createAppError(ErrorCode.NotFound, "Item not found", { slug }),
      );
    }

    // Map to domain type
    return ok(item);
  } catch (error) {
    return err(
      createAppError(
        ErrorCode.InternalServerError,
        "Failed to fetch item",
        { originalError: error },
      ),
    );
  }
}
```

### Service Error Handling Patterns

**Pattern 1: Catch and Convert**

```typescript
try {
  const data = await externalApi.fetch();
  return ok(data);
} catch (error) {
  return err(createAppError(ErrorCode.InternalServerError, "API failed"));
}
```

**Pattern 2: Chain Results**

```typescript
const result1 = await service1();
if (result1.isErr()) {
  return err(result1.error);  // Propagate typed error
}

const result2 = await service2(result1.value);
return result2;
```

**Pattern 3: Map Success Path**

```typescript
return result
  .map((data) => transformData(data))  // Success path
  .mapErr((error) => ({
    ...error,
    details: { ...error.details, timestamp: Date.now() },
  }));  // Error path
```

---

## API Routes Pattern

API routes handle HTTP requests and convert Results to JSON responses.

### GET Route Handler

```typescript
// src/app/api/examples/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getItemBySlug } from "@/services/example-service";
import { HTTP_STATUS } from "@/lib/constants";      // constants, not magic numbers
import { ErrorCode } from "@/lib/enums";             // enums, not magic strings
import type { IAppError } from "@/lib/types";

interface ApiResponse {
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  const slug = request.nextUrl.searchParams.get("slug");

  const result = await getItemBySlug(slug ?? "");

  if (result.isErr()) {
    const error = result.error as IAppError;
    const statusCode = mapErrorStatus(error.code);

    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: statusCode },
    );
  }

  return NextResponse.json({ data: result.value });
}

function mapErrorStatus(code: string): number {
  switch (code) {
    case ErrorCode.NotFound:
      return HTTP_STATUS.NOT_FOUND;
    case ErrorCode.ValidationError:
      return HTTP_STATUS.BAD_REQUEST;
    case ErrorCode.Unauthorized:
      return HTTP_STATUS.UNAUTHORIZED;
    case ErrorCode.Forbidden:
      return HTTP_STATUS.FORBIDDEN;
    case ErrorCode.InternalServerError:
    default:
      return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}
```

### Pattern: Cached GET Route

```typescript
// src/app/api/examples/route.ts
export const revalidate = 3600;  // ISR: Revalidate every hour

export async function GET(): Promise<NextResponse<{ data: IData[] }>> {
  const result = await getAllItems();

  if (result.isErr()) {
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: result.value });
}
```

---

## Server Actions Pattern

Server Actions use the `createAction` factory for consistent error handling.

### Base Factory (src/actions/action-base.ts)

```typescript
import { ok, err } from "neverthrow";
import { createAppError } from "@/lib/errors";
import { ErrorCode } from "@/lib/enums";   // enum, not hardcoded string
import type { IAppError } from "@/lib/types";

type ParseResult = { success: boolean; data?: unknown; error?: unknown };

interface ActionConfig {
  parse: (input: unknown) => ParseResult;
  handler: (input: { input: unknown }) => Promise<Result<unknown, IAppError>>;
}

export function createAction(config: ActionConfig) {
  return async function (input: unknown): Promise<Result<unknown, IAppError>> {
    // 1. Validate input
    const parseResult = config.parse(input);
    if (!parseResult.success) {
      return err(
        createAppError(
          ErrorCode.ValidationError,     // typed enum value
          "Invalid input",
          { parseError: parseResult.error },
        ),
      );
    }

    // 2. Execute handler (returns Result)
    return config.handler({ input: parseResult.data });
  };
}
```

### Server Action Implementation

```typescript
// src/actions/example-actions.ts
import { z } from "zod";
import { performMutation } from "@/services/example-service";
import { createAction } from "./action-base";

const schema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().optional(),
});

/**
 * Server Action: Perform example mutation.
 * Returns Result of operation or error.
 */
export const exampleAction = createAction({
  parse: (input) => schema.safeParse(input),
  handler: async ({ input }) => {
    const result = await performMutation(input);
    return result;  // Propagate Result from service
  },
});

/**
 * Form Action Wrapper: For use with useActionState.
 * Converts Result to form action response shape.
 */
export async function exampleFormAction(
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) {
  const email = formData.get("email");
  const name = formData.get("name");

  const result = await exampleAction({ email, name });

  if (result.isErr()) {
    return { success: false, error: result.error.message };
  }

  return { success: true };
}
```

### Using Server Actions in Components

```typescript
"use client";

import { useActionState } from "react";
import { exampleFormAction } from "@/actions/example-actions";

export function ExampleForm() {
  const [state, formAction, isPending] = useActionState(
    exampleFormAction,
    { success: false },
  );

  return (
    <form action={formAction}>
      <input type="email" name="email" required />
      <button type="submit" disabled={isPending}>
        Submit
      </button>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">Success!</p>}
    </form>
  );
}
```

---

## Error Recovery

### Retry Strategies

**Exponential Backoff** (see `src/lib/retry.ts`):

```typescript
import { retry } from "@/lib/retry";

const result = await retry(
  () => fetchData(),
  { maxRetries: 3, baseDelayMs: 1000 },
);
```

### User-Friendly Error Messages

```typescript
function getUserFriendlyMessage(error: IAppError): string {
  switch (error.code) {
    case "NOT_FOUND":
      return "We couldn't find what you're looking for.";
    case "VALIDATION_ERROR":
      return "Please check your information and try again.";
    case "UNAUTHORIZED":
      return "You need to sign in first.";
    case "RATE_LIMIT_EXCEEDED":
      return "Too many requests. Please wait a moment.";
    case "INTERNAL_SERVER_ERROR":
    default:
      return "Something went wrong. Please try again later.";
  }
}
```

---

## Best Practices

### 1. Always Return Result from Services

```typescript
// ✅ GOOD: Explicit Result type
export async function fetchData(): Promise<Result<IData, IAppError>> {
  // ...
}

// ❌ AVOID: Throwing exceptions
export async function fetchData(): Promise<IData> {
  // ...
}
```

### 2. Provide Context in Errors

```typescript
// ✅ GOOD: Detailed context
return err(
  createAppError("NOT_FOUND", "Item not found", {
    itemId: id,
    searchedAt: new Date(),
  }),
);

// ❌ POOR: No context
return err(createAppError("NOT_FOUND", "Not found"));
```

### 3. Handle All Result Paths

```typescript
// ✅ GOOD: Both paths handled
const result = await service();
if (result.isErr()) {
  return NextResponse.json({ error: result.error }, { status: 500 });
}
return NextResponse.json({ data: result.value });

// ❌ AVOID: Ignoring error path
const result = await service();
return NextResponse.json({ data: result.value });  // Crashes if isErr()
```

### 4. Chain Results with map/mapErr

```typescript
// ✅ GOOD: Functional chaining
return result
  .map((items) => items.filter((c) => c.available))
  .mapErr((error) => ({
    ...error,
    message: "Failed to filter items",
  }));
```

### 5. Log Errors Appropriately

```typescript
// ✅ GOOD: Log for debugging, send user-friendly message
if (result.isErr()) {
  console.error("[Service Error]", result.error);  // Server logs
  return err(
    createAppError(
      result.error.code,
      "User-friendly message",  // Sent to client
    ),
  );
}
```

---

## Troubleshooting

### Result Type Confusion

**Problem**: TypeScript error: "Cannot access value on Result"

**Cause**: Forgot to check `isOk()` or `isErr()` before accessing

**Solution**:
```typescript
// ❌ WRONG
const data = result.value;

// ✅ CORRECT
if (result.isOk()) {
  const data = result.value;
}
```

### Error Not Propagating

**Problem**: Error caught and logged but not returned

**Solution**:
```typescript
// ❌ WRONG
try {
  const data = await api.fetch();
} catch (error) {
  console.error(error);  // Error logged but not returned
}

// ✅ CORRECT
try {
  const data = await api.fetch();
  return ok(data);
} catch (error) {
  return err(createAppError("INTERNAL_SERVER_ERROR", "Failed"));
}
```

### Forgetting to Check Result

**Solution**:
```typescript
// ❌ WRONG
const result = await service();
return NextResponse.json({ data: result.value });  // Crashes if error

// ✅ CORRECT
const result = await service();
if (result.isErr()) {
  return NextResponse.json({ error: result.error }, { status: 500 });
}
return NextResponse.json({ data: result.value });
```

---

## Related

- [`src/lib/errors.ts`](../../src/lib/errors.ts) — Error creation utilities
- [`src/lib/types.ts`](../../src/lib/types.ts) — IAppError interface
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md#error-handling-standard) — Error handling patterns guide
- [neverthrow Documentation](https://github.com/supermacro/neverthrow) — Library reference
