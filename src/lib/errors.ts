import type { ErrorCode } from "@/lib/enums";
import type { IError, TResult } from "@/lib/types";

export async function tryCatch<T, E = Error>(
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
