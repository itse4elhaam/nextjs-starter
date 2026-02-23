import "server-only";

import { err, ok, type Result } from "neverthrow";
import { headers } from "next/headers";

import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import type {
  IActionContext,
  IActionDefinition,
  IAuthenticatedContext,
  IError,
  TAuthErrorCodes,
} from "@/lib/types";

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

export function requireAuthContext(
  context: IActionContext,
): Result<IAuthenticatedContext, IError<TAuthErrorCodes>> {
  if (!context.userId) {
    return err(createError(ErrorCode.Unauthorized, "Login required."));
  }

  return ok({ userId: context.userId, role: context.role });
}

export function createAction<TInput, TOutput, TCode extends ErrorCode>(
  definition: IActionDefinition<TInput, TOutput, TCode>,
): (
  rawInput: unknown,
) => Promise<
  Result<TOutput, IError<TCode | TAuthErrorCodes | ErrorCode.InternalError>>
> {
  return async (
    rawInput: unknown,
  ): Promise<
    Result<TOutput, IError<TCode | TAuthErrorCodes | ErrorCode.InternalError>>
  > => {
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
      return err(createError(ErrorCode.InternalError, message, error));
    }
  };
}
