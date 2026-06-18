import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  // DIRECT_URL is used by migrate commands (bypasses pgbouncer)
  datasource: {
    url: env("DIRECT_URL"),
  },
});
