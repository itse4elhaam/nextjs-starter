"use server";

import "server-only";

import { err, ok, type Result } from "neverthrow";
import { revalidatePath } from "next/cache";

import { createAction } from "@/actions/action-base";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import { createExampleSchema } from "@/lib/examples-schema";
import type { IError, IExampleDto, TCreateExampleInput } from "@/lib/types";
import { createExampleService } from "@/services/example-service";

type TExampleActionErrorCodes =
  | ErrorCode.InvalidForm
  | ErrorCode.ValidationError
  | ErrorCode.DbCreateFailed;

function parseExampleFormData(
  rawInput: unknown,
): Result<
  TCreateExampleInput,
  IError<ErrorCode.InvalidForm | ErrorCode.ValidationError>
> {
  if (!(rawInput instanceof FormData)) {
    return err(createError(ErrorCode.InvalidForm, "Invalid form payload."));
  }

  const name = rawInput.get("name");

  if (typeof name !== "string") {
    return err(createError(ErrorCode.InvalidForm, "Invalid name field."));
  }

  const parsed = createExampleSchema.safeParse({ name });
  if (!parsed.success) {
    return err(
      createError(
        ErrorCode.ValidationError,
        "Invalid example name.",
        parsed.error,
      ),
    );
  }

  return ok(parsed.data);
}

export const createExampleAction = createAction<
  TCreateExampleInput,
  IExampleDto,
  TExampleActionErrorCodes
>({
  parse: parseExampleFormData,
  handler: async ({ input }) => {
    const createdResult = await createExampleService(input);
    if (createdResult.isErr()) {
      return err(createdResult.error);
    }

    revalidatePath("/");

    return ok(createdResult.value);
  },
});

export async function createExampleFormAction(
  formData: FormData,
): Promise<void> {
  await createExampleAction(formData);
}
