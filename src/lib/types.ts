import type { HTTP_VERBS } from "./constants";

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

export interface IActionDefinition<TInput, TOutput> {
  parse: (rawInput: unknown) => TInput;
  handler: (payload: IActionPayload<TInput>) => Promise<TOutput>;
  requireAuth?: boolean;
}

export interface IExamplesResponse {
  data: IExampleDto[];
}

export type TCreateExampleInput = {
  name: string;
};
