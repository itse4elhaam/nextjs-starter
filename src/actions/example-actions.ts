"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { createAction } from "@/actions/action-base";
import { createExampleSchema } from "@/lib/examples-schema";
import type { TCreateExampleInput } from "@/lib/examples-schema";
import type { IExampleDto } from "@/lib/examples-types";
import { createExampleService } from "@/services/example-service";

function parseExampleFormData(rawInput: unknown): TCreateExampleInput {
  if (!(rawInput instanceof FormData)) {
    throw new Error("Invalid form payload.");
  }

  const name = rawInput.get("name");

  if (typeof name !== "string") {
    throw new Error("Invalid name field.");
  }

  return createExampleSchema.parse({ name });
}

export const createExampleAction = createAction<
  TCreateExampleInput,
  IExampleDto
>({
  parse: parseExampleFormData,
  handler: async ({ input }) => {
    const created = await createExampleService(input);
    revalidatePath("/");

    return created;
  },
});

export async function createExampleFormAction(
  formData: FormData,
): Promise<void> {
  await createExampleAction(formData);
}
