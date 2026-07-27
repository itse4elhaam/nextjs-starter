import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../.env.local"), override: true });

// Import triggers Zod validation via @t3-oss/env-core
require("../src/lib/env");
