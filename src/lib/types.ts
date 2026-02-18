import type { Result as NeverthrowResult } from "neverthrow";

import type { HTTP_VERBS } from "./constants";
import type { ErrorCode } from "./enums";
import type { TCreateExampleInput } from "./examples-schema";

export interface IFetchOptions<TBody = unknown> {
  url: string;
  method: HTTP_VERBS;
  token?: string;
  body?: TBody;
  headers?: Record<string, string>;
}

export interface IFetchResponse<T = unknown> {
  data: T | null;
  ok: boolean;
  status: number;
  error: string | null;
}

export interface IExampleRecord {
  id: number;
  name: string;
  createdAt: Date;
}

export interface IExampleDto {
  id: number;
  name: string;
  createdAt: string;
}

export interface IActionContext {
  userId: string | null;
  role: string | null;
}

export interface IActionPayload<TInput> {
  input: TInput;
  context: IActionContext;
}

export interface IActionDefinition<
  TInput,
  TOutput,
  TCode extends ErrorCode = ErrorCode,
> {
  parse: (rawInput: unknown) => NeverthrowResult<TInput, IError<TCode>>;
  handler: (
    payload: IActionPayload<TInput>,
  ) => Promise<NeverthrowResult<TOutput, IError<TCode>>>;
  requireAuth?: boolean;
}

export type TActionResult<
  TOutput,
  TCode extends ErrorCode = ErrorCode,
> = TResult<TOutput, IError<TCode>>;

export interface IExamplesResponse {
  data: IExampleDto[];
}

export type { TCreateExampleInput };

export interface ISuccess<T> {
  data: T;
  error: null;
}

export interface IFailure<E> {
  data: null;
  error: E;
}

export type TResult<T, E = Error> = ISuccess<T> | IFailure<E>;

export interface IError<TCode extends ErrorCode = ErrorCode> {
  code: TCode;
  message: string;
  details?: unknown;
}
