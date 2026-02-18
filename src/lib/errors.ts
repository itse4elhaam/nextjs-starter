import type { ErrorCode } from "@/lib/enums";

export type TSuccess<T> = {
  data: T;
  error: null;
};

export type TFailure<E> = {
  data: null;
  error: E;
};

export type TResult<T, E = Error> = TSuccess<T> | TFailure<E>;

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

export interface IAppError<TCode extends ErrorCode = ErrorCode> {
  code: TCode;
  message: string;
  details?: unknown;
}

export function createError<TCode extends ErrorCode>(
  code: TCode,
  message: string,
  details?: unknown,
): IAppError<TCode> {
  return { code, message, details };
}
