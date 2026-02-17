import { z } from "zod";

export const createExampleSchema = z.object({
  name: z.string().min(2).max(256),
});

export type TCreateExampleInput = z.infer<typeof createExampleSchema>;
