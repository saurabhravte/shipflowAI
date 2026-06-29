import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
