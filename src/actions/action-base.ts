import "server-only";

import { headers } from "next/headers";

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

export async function getActionContext(): Promise<IActionContext> {
  const requestHeaders = await headers();

  return {
    userId: requestHeaders.get("x-user-id"),
    role: requestHeaders.get("x-user-role"),
  };
}

export function requireAuthContext(context: IActionContext): IActionContext {
  if (!context.userId) {
    throw new Error("Unauthorized");
  }

  return context;
}

export function createAction<TInput, TOutput>(
  definition: IActionDefinition<TInput, TOutput>,
): (rawInput: unknown) => Promise<TOutput> {
  return async (rawInput: unknown): Promise<TOutput> => {
    const context = await getActionContext();

    if (definition.requireAuth) {
      requireAuthContext(context);
    }

    const input = definition.parse(rawInput);

    return definition.handler({ input, context });
  };
}
