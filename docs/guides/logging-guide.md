# Logging Implementation Guide for Next.js Applications

A comprehensive guide to implementing production-ready logging in Next.js applications.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Usage Patterns](#usage-patterns)
5. [Error Handling Integration](#error-handling-integration)
6. [Best Practices](#best-practices)

## Overview

### Philosophy

This logging system is designed around these core principles:

1. **Environment-aware**: Different behavior for development vs production
2. **Structured logging**: Consistent format with metadata for filtering/searching
3. **Server/Client separation**: Clear distinction between server-side and client-side logs
4. **Type-safe contexts**: Enum-based log contexts prevent typos and ensure consistency
5. **Integration-ready**: Works seamlessly with Sentry and other monitoring tools

### Key Features

- Unified logging interface for server and client
- Automatic timestamp and environment tagging
- Type-safe log contexts using enums
- Metadata support for structured logging
- Development-only debug logs
- Sentry integration with severity mapping

## Architecture

### File Structure

```
src/
├── lib/
│   ├── logger.ts              # Main server/client logger
│   ├── enums.ts              # LogLevel, LogContext enums
│   └── types.ts              # ILogMetadata, ILoggerConfig
```

## Core Components

> **Important**: Log levels (`LogLevel`) and log contexts (`LogContext`) are defined as const objects in `src/lib/enums.ts`. Always import and use them instead of hardcoded strings — this prevents typos and enables consistent filtering across the codebase.

### 1. Logger (`src/lib/logger.ts`)

The main logging interface that works on both server and client.

```typescript
import { LogLevel, LogContext } from "./enums";
import { ILogMetadata } from "./types";

function isServerSide(): boolean {
  return typeof window === "undefined";
}

function isDevelopment(): boolean {
  if (isServerSide()) {
    const { env } = require("./env");
    return env.NODE_ENV !== "production";
  }
  return true;
}

function formatLog(
  level: string,
  context: string,
  message: string,
  metadata?: Record<string, unknown>,
): string {
  const timestamp = new Date().toISOString();
  const env = isServerSide() ? "server" : "client";
  const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : "";

  return `[${timestamp}] [${level.toUpperCase()}] [${env}] [${context}] ${message}${metaStr}`;
}

export const logger = {
  debug(context: string, message: string, metadata?: Record<string, unknown>) {
    if (isDevelopment()) {
      console.debug(formatLog("debug", context, message, metadata));
    }
  },

  info(context: string, message: string, metadata?: Record<string, unknown>) {
    console.info(formatLog("info", context, message, metadata));
  },

  warn(context: string, message: string, metadata?: Record<string, unknown>) {
    console.warn(formatLog("warn", context, message, metadata));
  },

  error(context: string, message: string, metadata?: Record<string, unknown>) {
    console.error(formatLog("error", context, message, metadata));
  },
};
```

### 2. Log Levels

Defined in `src/lib/enums.ts`:

```typescript
export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export const LogContext = {
  SYSTEM: "system",
  AUTH: "auth",
  API: "api",
  DB: "db",
  SERVICE: "service",
  ACTION: "action",
} as const;
```

## Usage Patterns

### Basic Logging

```typescript
import { logger } from "@/lib/logger";
import { LogContext } from "@/lib/enums";

// Info log
logger.info(LogContext.SYSTEM, "Application started");

// Warning with metadata
logger.warn(LogContext.API, "Slow response", {
  durationMs: 3500,
  endpoint: "/api/data",
});

// Error with context
logger.error(LogContext.DB, "Query failed", {
  query: "SELECT ...",
  error: err.message,
});
```

### Server Actions with Logging

```typescript
import { logger } from "@/lib/logger";
import { LogContext } from "@/lib/enums";

export async function createItem(formData: FormData) {
  logger.info(LogContext.ACTION, "Creating item", {
    fields: Array.from(formData.keys()),
  });

  const result = await performMutation(formData);

  if (result.isErr()) {
    logger.error(LogContext.ACTION, "Failed to create item", {
      error: result.error,
    });
    return { success: false, error: result.error.message };
  }

  logger.info(LogContext.ACTION, "Item created successfully");
  return { success: true };
}
```

### API Routes with Logging

```typescript
import { logger } from "@/lib/logger";
import { LogContext } from "@/lib/enums";

export async function GET(request: NextRequest) {
  const start = Date.now();

  const result = await getData();

  const duration = Date.now() - start;
  logger.info(LogContext.API, "GET /api/data", { durationMs: duration });

  if (result.isErr()) {
    logger.error(LogContext.API, "GET /api/data failed", {
      error: result.error,
    });
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.value });
}
```

## Error Handling Integration

### Logging with Result Pattern

```typescript
import { logger } from "@/lib/logger";
import { LogContext } from "@/lib/enums";

const result = await service();

if (result.isErr()) {
  logger.error(LogContext.SERVICE, "Service operation failed", {
    code: result.error.code,
    message: result.error.message,
    details: result.error.details,
  });
}

// Log before returning
return result.mapErr((error) => {
  logger.error(LogContext.SERVICE, "Operation failed", { error });
  return error;
});
```

## Best Practices

### 1. Always Use LogContext

```typescript
// ✅ GOOD: Use typed context
logger.info(LogContext.AUTH, "User logged in");

// ❌ AVOID: Raw string context
logger.info("auth_stuff", "User logged in");
```

### 2. Add Relevant Metadata

```typescript
// ✅ GOOD: Useful context for debugging
logger.error(LogContext.DB, "Query timeout", {
  query: "SELECT * FROM items",
  durationMs: 30000,
  connectionId: conn.id,
});

// ❌ AVOID: No context
logger.error(LogContext.DB, "Something went wrong");
```

### 3. Development-Only Debug Logs

```typescript
// Only logs in development
logger.debug(LogContext.SYSTEM, "Processing item", { itemId: id });

// Always logs
logger.info(LogContext.SYSTEM, "Item processed", { itemId: id });
```

### 4. Don't Log Sensitive Data

```typescript
// ❌ AVOID: Logging passwords, tokens, PII
logger.info(LogContext.AUTH, "Login attempt", {
  password: "secret123",  // NEVER
  token: "eyJ...",        // NEVER
});

// ✅ GOOD: Log safe identifiers
logger.info(LogContext.AUTH, "Login attempt", {
  userId: user.id,
  ipCountry: geo.country,
});
```

### 5. Structured Over Concatenated

```typescript
// ✅ GOOD: Structured metadata
logger.info(LogContext.API, "Request processed", {
  method: "GET",
  path: "/api/data",
  durationMs: 150,
});

// ❌ AVOID: String concatenation
logger.info(LogContext.API, `GET /api/data processed in 150ms`);
```
