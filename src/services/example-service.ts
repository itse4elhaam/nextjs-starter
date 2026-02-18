import "server-only";

import { createExample, listExamples } from "@/dal/example-dal";
import { createExampleSchema } from "@/lib/examples-schema";
import type {
  IExampleDto,
  IExampleRecord,
  TCreateExampleInput,
} from "@/lib/types";

function toExampleDto(record: IExampleRecord): IExampleDto {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listExamplesService(
  limit?: number,
): Promise<IExampleDto[]> {
  const records = await listExamples({ limit });

  return records.map(toExampleDto);
}

export async function createExampleService(
  input: TCreateExampleInput | unknown,
): Promise<IExampleDto> {
  const parsed = createExampleSchema.parse(input);
  const record = await createExample(parsed.name);

  return toExampleDto(record);
}
