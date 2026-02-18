import "server-only";

import { desc } from "drizzle-orm";

import { getDb } from "@/db";
import { examples } from "@/db/schema";
import type { IExampleRecord } from "@/lib/types";

export interface IListExamplesOptions {
  limit?: number;
}

export async function listExamples(
  options: IListExamplesOptions = {},
): Promise<IExampleRecord[]> {
  const db = getDb();
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));

  return db
    .select()
    .from(examples)
    .orderBy(desc(examples.createdAt))
    .limit(limit);
}

export async function createExample(name: string): Promise<IExampleRecord> {
  const db = getDb();
  const [created] = await db.insert(examples).values({ name }).returning();

  if (!created) {
    throw new Error("Failed to create example record.");
  }

  return created;
}
