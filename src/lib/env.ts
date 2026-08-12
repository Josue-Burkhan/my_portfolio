import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export const env = serverEnvironmentSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});
