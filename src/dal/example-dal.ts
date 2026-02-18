import "server-only";

import { desc } from "drizzle-orm";
import { type Result, ResultAsync, err, ok } from "neverthrow";

import { getDb } from "@/db";
import { examples } from "@/db/schema";
import { ErrorCode } from "@/lib/enums";
import { type IAppError, createError } from "@/lib/errors";
import type { IExampleRecord } from "@/lib/types";

export interface IListExamplesOptions {
  limit?: number;
}

export async function listExamples(
  options: IListExamplesOptions = {},
): Promise<Result<IExampleRecord[], IAppError<ErrorCode.DbListFailed>>> {
  const db = getDb();
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));

  return ResultAsync.fromPromise(
    db.select().from(examples).orderBy(desc(examples.createdAt)).limit(limit),
    (error: unknown) =>
      createError(ErrorCode.DbListFailed, "Failed to list examples.", error),
  );
}

export async function createExample(
  name: string,
): Promise<Result<IExampleRecord, IAppError<ErrorCode.DbCreateFailed>>> {
  const db = getDb();
  const createResult = await ResultAsync.fromPromise(
    db.insert(examples).values({ name }).returning(),
    (error: unknown) =>
      createError(ErrorCode.DbCreateFailed, "Failed to create example.", error),
  );

  if (createResult.isErr()) {
    return err(createResult.error);
  }

  const [created] = createResult.value;
  if (!created) {
    return err(
      createError(ErrorCode.DbCreateFailed, "Failed to create example."),
    );
  }

  return ok(created);
}
