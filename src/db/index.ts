import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/config";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb(): ReturnType<typeof drizzle> {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize the database.");
  }

  if (!dbInstance) {
    const queryClient = postgres(env.DATABASE_URL, {
      max: 1,
    });
    dbInstance = drizzle(queryClient);
  }

  return dbInstance;
}
