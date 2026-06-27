import { ErrorCode } from "@/lib/enums";
import type { IAppError, IError, TResult } from "@/lib/types";

export async function tryCatch<T, E = unknown>(
  promise: Promise<T>,
): Promise<TResult<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export function createError<TCode extends ErrorCode>(
  code: TCode,
  message: string,
  details?: unknown,
): IError<TCode> {
  return { code, message, details };
}

export function createAppError(
  code: ErrorCode,
  message: string,
  context?: Record<string, unknown>,
): IAppError {
  return { code, message, context };
}

export function mapErrorStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.Unauthorized:
      return 401;
    case ErrorCode.Forbidden:
      return 403;
    case ErrorCode.NotFound:
      return 404;
    case ErrorCode.Conflict:
      return 409;
    case ErrorCode.ValidationError:
    case ErrorCode.InvalidForm:
      return 422;
    case ErrorCode.DatabaseError:
    case ErrorCode.DbListFailed:
    case ErrorCode.DbCreateFailed:
    case ErrorCode.InternalError:
    case ErrorCode.NotImplemented:
      return 500;
    default:
      return 500;
  }
}
