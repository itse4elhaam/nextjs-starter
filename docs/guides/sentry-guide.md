# Sentry Implementation Guide for Next.js Applications

A comprehensive guide to implementing production-ready error tracking with Sentry in Next.js applications.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Usage Patterns](#usage-patterns)
6. [Context & Tags](#context--tags)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

### Philosophy

This Sentry implementation is designed around these core principles:

1. **Comprehensive context**: Every error includes actionable data for debugging
2. **Severity mapping**: Log levels automatically map to Sentry severity levels
3. **Type-safe tags**: Enum-based tagging prevents typos and ensures consistency
4. **Environment-aware**: Different sampling rates for dev vs production
5. **Server-only protection**: Sensitive error handling code is never bundled to client

### Key Features

- Automatic integration with Next.js (App Router, API Routes)
- Server and Client runtime support
- Type-safe error context with enums
- Automatic severity level mapping from LogLevel
- Zod validation error handling
- Performance monitoring (traces sampling)
- User-friendly error sanitization

## Architecture

### File Structure

```
project-root/
├── sentry.server.config.ts        # Server runtime config
├── sentry.edge.config.ts          # Edge runtime config
├── src/
│   ├── instrumentation-client.ts  # Client runtime config
│   ├── instrumentation.ts         # Server/edge init + onRequestError hook
│   └── lib/
│       ├── error-handler.ts       # Core Sentry integration (server-only)
│       ├── client-errors.ts       # Client error forwarding to Sentry
│       ├── enums.ts               # LogLevel, SentryTag, SentryContext enums
│       └── types.ts               # ISentryLogConfig interface
```

## Installation & Setup

### Step 1: Install Sentry

```bash
npm install @sentry/nextjs
```

### Step 2: Initialize Sentry

**`sentry.server.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Enable Spotlight for local debugging
  spotlight: process.env.NODE_ENV === "development",
});
```

**`sentry.edge.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
});
```

**`src/instrumentation.ts`:**
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
```

### Step 3: Environment Variables

```bash
# .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
# Optional: for source map uploads
SENTRY_AUTH_TOKEN=your-auth-token
```

## Configuration

### Production vs Development

| Setting | Development | Production |
|---------|-------------|------------|
| `tracesSampleRate` | 0 (no traces) | 0.1 (10% sampled) |
| `spotlight` | true | false |
| Error reporting | Console only | Sentry |

## Usage Patterns

### Capturing Errors in Server Actions

```typescript
import { captureAndLogError } from "@/lib/error-handler";
import { SentryTag, SentryContext } from "@/lib/enums";

export async function createItem(formData: FormData) {
  try {
    const result = await performMutation(formData);
    return { success: true, data: result };
  } catch (error) {
    await captureAndLogError(error, {
      tags: { [SentryTag.MODULE]: SentryContext.ACTION },
      context: { formData: sanitizeFormData(formData) },
    });
    return { success: false, error: "Failed to create item" };
  }
}
```

### Capturing Errors in API Routes

```typescript
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json({ data });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("endpoint", "/api/data");
      scope.setContext("request", {
        url: request.url,
        method: request.method,
      });
      Sentry.captureException(error);
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Error Handler Module (`src/lib/error-handler.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import type { ISentryLogConfig } from "@/lib/types";

/**
 * Capture an error to Sentry with structured context.
 * Server-only — never import in client code.
 */
export async function captureAndLogError(
  error: unknown,
  config?: ISentryLogConfig,
): Promise<void> {
  // Log locally
  logger.error(config?.context?.module ?? "system", "Error captured", {
    error: error instanceof Error ? error.message : String(error),
    ...config?.context,
  });

  // Send to Sentry
  Sentry.withScope((scope) => {
    // Apply tags
    if (config?.tags) {
      for (const [key, value] of Object.entries(config.tags)) {
        scope.setTag(key, value);
      }
    }

    // Apply context
    if (config?.context) {
      scope.setContext("error_context", config.context);
    }

    // Set severity level
    if (config?.level) {
      scope.setLevel(config.level);
    }

    Sentry.captureException(error);
  });
}
```

### Client Error Tracking (`src/lib/client-errors.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";

/**
 * Report a client-side error to Sentry.
 * Safe to use in Client Components.
 */
export function reportClientError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("client_context", context);
    }
    scope.setTag("source", "client");
    Sentry.captureException(error);
  });
}
```

## Context & Tags

> **Important**: Sentry tags (`SentryTag`) and context identifiers (`SentryContext`) are defined as const objects in `src/lib/enums.ts`. Always import them instead of hardcoding strings — this ensures consistent tagging across all error reports and enables effective filtering in Sentry dashboard.

### Type-Safe Tags (defined in enums.ts)

```typescript
export const SentryTag = {
  MODULE: "module",
  ACTION: "action",
  ERROR_CODE: "error_code",
  SOURCE: "source",
} as const;

export const SentryContext = {
  ACTION: "action",
  API: "api",
  SERVICE: "service",
  DB: "db",
  AUTH: "auth",
} as const;
```

### Setting Context

```typescript
// Transaction-style grouping
Sentry.withScope((scope) => {
  scope.setTag(SentryTag.MODULE, SentryContext.API);
  scope.setTag(SentryTag.ACTION, "getUserData");
  scope.setTag(SentryTag.ERROR_CODE, errorCode);

  scope.setContext("request", {
    url: "/api/users",
    method: "GET",
  });

  scope.setLevel("error");
  Sentry.captureException(error);
});
```

## Best Practices

### 1. Always Add Context

```typescript
// ✅ GOOD: Rich context for debugging
await captureAndLogError(error, {
  tags: { module: "api", action: "createUser" },
  context: { userId: user.id, input: sanitizedInput },
});

// ❌ AVOID: No context
Sentry.captureException(error);
```

### 2. Don't Capture Expected Errors (Result Pattern)

```typescript
// ✅ GOOD: Only capture unexpected errors
const result = await service();
if (result.isErr()) {
  // Expected error — log but don't send to Sentry
  logger.warn("Service returned error", { error: result.error });
  return { success: false, error: result.error.message };
}

// ✅ GOOD: Unexpected errors go to Sentry
try {
  const result = await riskyOperation();
} catch (error) {
  await captureAndLogError(error, { tags: { module: "service" } });
}
```

### 3. Sanitize Before Sending

```typescript
// ✅ GOOD: Remove sensitive data
function sanitizeErrorContext(context: Record<string, unknown>) {
  const sensitiveKeys = ["password", "token", "secret", "authorization"];
  const sanitized = { ...context };
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}
```

### 4. Use Performance Monitoring Sparingly

```typescript
// ✅ GOOD: Only for critical transactions
const transaction = Sentry.startTransaction({
  name: "data-heavy-operation",
  op: "db.query",
});

try {
  const result = await expensiveQuery();
  transaction.setStatus("ok");
  return result;
} finally {
  transaction.finish();
}
```

## Troubleshooting

### Sentry Not Reporting Errors

**Solution:**
1. Verify `SENTRY_DSN` is set correctly in `.env`
2. Check `sentry.server.config.ts` initializes correctly
3. Verify `src/instrumentation.ts` imports the config
4. Check browser console for CORS issues

### Source Maps Not Uploading

**Solution:**
1. Ensure `SENTRY_AUTH_TOKEN` is set
2. Verify `sentry.properties` exists if using `sentry-cli`
3. Check Next.js build output for source map creation
