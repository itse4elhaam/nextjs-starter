import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const typesDir = resolve(__dirname, "../.next/types");
const devTypesDir = resolve(__dirname, "../.next/dev/types");

mkdirSync(typesDir, { recursive: true });

const routeTypes = `import type { ReactNode } from "react";

export type AppRoutes = string;
export type AppRouteHandlerRoutes = string;
export type LayoutRoutes = string;
export type ParamMap = Record<string, Record<string, string>>;

export type LayoutProps<
  Route extends LayoutRoutes = LayoutRoutes,
> = {
  params: Promise<ParamMap[Route]>;
  children: ReactNode;
};

declare global {
  type LayoutProps<
    Route extends LayoutRoutes = LayoutRoutes,
  > = {
    params: Promise<ParamMap[Route]>;
    children: ReactNode;
  };
}
`;

writeFileSync(resolve(typesDir, "routes.d.ts"), routeTypes, "utf-8");

try {
  rmSync(devTypesDir, { recursive: true, force: true });
} catch {
  // Empty catch — directory may not exist on fresh clones
}
