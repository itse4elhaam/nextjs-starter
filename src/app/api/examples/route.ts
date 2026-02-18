import { NextResponse } from "next/server";

import { env } from "@/lib/config";
import { createExampleSchema } from "@/lib/examples-schema";
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

export async function GET() {
  const databaseError = ensureDatabaseConfigured();
  if (databaseError) {
    return databaseError;
  }

  try {
    const examples = await listExamplesService();

    return NextResponse.json({ data: examples });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const databaseError = ensureDatabaseConfigured();
  if (databaseError) {
    return databaseError;
  }

  try {
    const body = await request.json();
    const parsed = createExampleSchema.parse(body);
    const created = await createExampleService(parsed);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
