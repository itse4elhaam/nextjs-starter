import { NextResponse } from "next/server";

import { env } from "@/lib/config";
import { createExampleSchema } from "@/lib/examples-schema";
import {
  createExampleService,
  listExamplesService,
} from "@/services/example-service";

export const revalidate = 60;

export async function GET() {
  if (!env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  const examples = await listExamplesService();

  return NextResponse.json({ data: examples });
}

export async function POST(request: Request) {
  if (!env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const parsed = createExampleSchema.parse(body);
  const created = await createExampleService(parsed);

  return NextResponse.json({ data: created }, { status: 201 });
}
