import "server-only";

import { headers } from "next/headers";

import type { IActionContext, IActionDefinition } from "@/lib/types";

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
    let context = await getActionContext();

    if (definition.requireAuth) {
      context = requireAuthContext(context);
    }

    const input = definition.parse(rawInput);

    return definition.handler({ input, context });
  };
}
