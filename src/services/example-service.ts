import "server-only";

import { err, ok, type Result } from "neverthrow";

import { createExample, listExamples } from "@/dal/example-dal";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import { createExampleSchema } from "@/lib/examples-schema";
import type {
  IError,
  IExampleDto,
  IExampleRecord,
  TCreateExampleInput,
} from "@/lib/types";

function toExampleDto(record: IExampleRecord): IExampleDto {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listExamplesService(
  limit?: number,
): Promise<Result<IExampleDto[], IError<ErrorCode.DbListFailed>>> {
  const recordsResult = await listExamples({ limit });
  if (recordsResult.isErr()) {
    return err(recordsResult.error);
  }

  return ok(recordsResult.value.map(toExampleDto));
}

export async function createExampleService(
  input: TCreateExampleInput | unknown,
): Promise<
  Result<
    IExampleDto,
    IError<ErrorCode.DbCreateFailed | ErrorCode.ValidationError>
  >
> {
  const parsed = createExampleSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      createError(
        ErrorCode.ValidationError,
        "Invalid example input.",
        parsed.error,
      ),
    );
  }

  const recordResult = await createExample(parsed.data.name);
  if (recordResult.isErr()) {
    return err(recordResult.error);
  }

  return ok(toExampleDto(recordResult.value));
}
