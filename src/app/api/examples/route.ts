import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { env } from "@/lib/config";
import { ErrorCode } from "@/lib/enums";
import { createExampleSchema } from "@/lib/examples-schema";
import type { IError } from "@/lib/types";
import {
  createExampleService,
  listExamplesService,
} from "@/services/example-service";

export const revalidate = 60;

function ensureDatabaseConfigured() {
  if (!env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  return null;
}

function toErrorResponse(error: IError, fallbackStatus: number) {
  const status =
    error.code === ErrorCode.ValidationError ? 400 : fallbackStatus;

  return NextResponse.json({ error: error.message }, { status });
}

export async function GET() {
  const databaseError = ensureDatabaseConfigured();
  if (databaseError) {
    return databaseError;
  }

  const examplesResult = await listExamplesService();
  if (examplesResult.isErr()) {
    return toErrorResponse(examplesResult.error, 500);
  }

  return NextResponse.json({ data: examplesResult.value });
}

export async function POST(request: Request) {
  const databaseError = ensureDatabaseConfigured();
  if (databaseError) {
    return databaseError;
  }

  const body = await request.json();
  const parsed = createExampleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const createdResult = await createExampleService(parsed.data);
  if (createdResult.isErr()) {
    return toErrorResponse(createdResult.error, 500);
  }

  revalidatePath("/");

  return NextResponse.json({ data: createdResult.value }, { status: 201 });
}
