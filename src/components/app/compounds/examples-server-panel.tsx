import { createExampleFormAction } from "@/actions/example-actions";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/config";
import type { IExampleDto } from "@/lib/types";
import { listExamplesService } from "@/services/example-service";

export async function ExamplesServerPanel() {
  const databaseReady = Boolean(env.DATABASE_URL);
  let examples: IExampleDto[] = [];
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  });

  if (databaseReady) {
    try {
      examples = await listExamplesService();
    } catch {
      examples = [];
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white/70 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Server Action Example
        </h2>
        <p className="text-sm text-slate-600">
          Mutations only. Reads come from services in a Server Component.
        </p>
      </div>

      {!databaseReady ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Set <code>DATABASE_URL</code> to enable Drizzle examples.
        </p>
      ) : (
        <form action={createExampleFormAction} className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="example-name">
            Example name
          </label>
          <input
            id="example-name"
            name="name"
            placeholder="Example name"
            required
            className="w-full min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <Button type="submit">Create Example</Button>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">
          Existing Examples
        </h3>
        {examples.length === 0 ? (
          <p className="text-sm text-slate-500">No rows yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-700">
            {examples.map((example) => (
              <li key={example.id} className="flex items-center gap-2">
                <span className="font-medium">{example.name}</span>
                <span className="text-xs text-slate-400">
                  {dateFormatter.format(new Date(example.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
