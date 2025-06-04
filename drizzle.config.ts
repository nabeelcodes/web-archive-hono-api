import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dbCredentials: {
    url: "file:./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/8fc43331c3bc5f87a139fcd20e65220a2ec74dd3e026018faa3ecc23a798ee0b.sqlite"
  }
});
