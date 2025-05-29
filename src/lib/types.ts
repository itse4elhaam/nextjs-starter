import { HTTP_VERBS } from "./constants";

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
