"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        Please try again. If the issue persists, contact support.
      </p>
      <button
        type="button"
        className="mx-auto rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        onClick={() => reset()}
      >
        Try again
      </button>
    </section>
  );
}
