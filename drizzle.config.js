import { defineConfig } from "drizzle-kit";
import 'dotenv/config';

export default defineConfig({
    out: "./drizzle",
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    migrations: {
        table: "__drizzle_migrations__",
        schema: "public",
        prefix: "timestamp",
    },
    introspect: {
        casing: "camel",
    },
    breakpoints: true,
    strict: true,
    verbose: true,
});
