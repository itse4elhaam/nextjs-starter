import "server-only";

import { type Result, err, ok } from "neverthrow";
import { headers } from "next/headers";

import { ErrorCode } from "@/lib/enums";
import { type IAppError, createError } from "@/lib/errors";
import type { IActionContext, IActionDefinition } from "@/lib/types";

export async function getActionContext(): Promise<IActionContext> {
  const requestHeaders = await headers();

  return {
    userId: requestHeaders.get("x-user-id"),
    role: requestHeaders.get("x-user-role"),
  };
}

export type TAuthErrorCodes = ErrorCode.Unauthorized;

export function requireAuthContext(
  context: IActionContext,
): Result<IActionContext, IAppError<TAuthErrorCodes>> {
  if (!context.userId) {
    return err(createError(ErrorCode.Unauthorized, "Login required."));
  }

  return ok(context);
}

export function createAction<TInput, TOutput, TCode extends ErrorCode>(
  definition: IActionDefinition<TInput, TOutput, TCode>,
): (
  rawInput: unknown,
) => Promise<Result<TOutput, IAppError<TCode | TAuthErrorCodes>>> {
  return async (
    rawInput: unknown,
  ): Promise<Result<TOutput, IAppError<TCode | TAuthErrorCodes>>> => {
    const context = await getActionContext();

    if (definition.requireAuth) {
      const authResult = requireAuthContext(context);
      if (authResult.isErr()) {
        return err(authResult.error);
      }
    }

    const inputResult = definition.parse(rawInput);
    if (inputResult.isErr()) {
      return err(inputResult.error);
    }

    return definition.handler({ input: inputResult.value, context });
  };
}
