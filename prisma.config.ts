// Prisma 6 config. Loads .env so `prisma db push` / `db seed` see DATABASE_URL.
import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` runs on `npm install` and does not need a database, so a
// missing DATABASE_URL falls back to a placeholder instead of throwing.
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://not-configured:copy-env-example-to-env@localhost:5432/app";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: DATABASE_URL,
  },
});
