import type { NextConfig } from "next";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);

async function runEnvValidation() {
  await jiti.import("./src/lib/config");
}
runEnvValidation();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
