import "server-only";

import { err, ok, type Result } from "neverthrow";
import { headers } from "next/headers";

import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import type { IActionContext, IActionDefinition, IError } from "@/lib/types";

export async function getActionContext(): Promise<IActionContext> {
  const requestHeaders = await headers();

  // ⚠️ EXAMPLE ONLY: These headers are set by the client and are NOT
  // verified by the server. In production, derive the user identity from
  // a validated session token (e.g. JWT, NextAuth session, Clerk, etc.)
  // rather than trusting arbitrary request headers.
  return {
    userId: requestHeaders.get("x-user-id"),
    role: requestHeaders.get("x-user-role"),
  };
}

export type TAuthErrorCodes = ErrorCode.Unauthorized;

export function requireAuthContext(
  context: IActionContext,
): Result<IActionContext, IError<TAuthErrorCodes>> {
  if (!context.userId) {
    return err(createError(ErrorCode.Unauthorized, "Login required."));
  }

  return ok(context);
}

export function createAction<TInput, TOutput, TCode extends ErrorCode>(
  definition: IActionDefinition<TInput, TOutput, TCode>,
): (
  rawInput: unknown,
) => Promise<Result<TOutput, IError<TCode | TAuthErrorCodes>>> {
  return async (
    rawInput: unknown,
  ): Promise<Result<TOutput, IError<TCode | TAuthErrorCodes>>> => {
    try {
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      return err(
        createError(
          ErrorCode.InternalError as TCode & ErrorCode.InternalError,
          message,
          error,
        ),
      );
    }
  };
}
