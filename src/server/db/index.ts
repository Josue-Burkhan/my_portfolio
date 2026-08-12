import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "@/server/db/schema";

const globalForDatabase = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDatabase.postgresClient ??
  postgres(env.DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresClient = client;
}

export const db = drizzle(client, { schema });
