import "server-only";

import { createExample, listExamples } from "@/dal/example-dal";
import type { TCreateExampleInput } from "@/lib/examples-schema";
import type { IExampleDto, IExampleRecord } from "@/lib/examples-types";

function toExampleDto(record: IExampleRecord): IExampleDto {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listExamplesService(): Promise<IExampleDto[]> {
  const records = await listExamples();

  return records.map(toExampleDto);
}

export async function createExampleService(
  input: TCreateExampleInput,
): Promise<IExampleDto> {
  const record = await createExample(input.name);

  return toExampleDto(record);
}
