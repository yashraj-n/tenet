import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SERVER_URL: z.string().url().optional(),
    DATABASE_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    TRUSTED_ORIGINS: z.string(),
    SECRET_WEBHOOK_KEY: z.string(),
    GOOGLE_SERVICE_ACCOUNT_JSON: z.string(),
    GOOGLE_PROJECT_ID: z.string(),
    GOOGLE_PROJECT_REGION: z.string(),
    GOOGLE_CLOUD_RUN_WORKER_NAME: z.string(),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_APP_TITLE: z.string().optional(),
  },
  runtimeEnv: {
    SERVER_URL: process.env.SERVER_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS,
    SECRET_WEBHOOK_KEY: process.env.SECRET_WEBHOOK_KEY,
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    GOOGLE_CLOUD_RUN_WORKER_NAME: process.env.GOOGLE_CLOUD_RUN_WORKER_NAME,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_PROJECT_REGION: process.env.GOOGLE_PROJECT_REGION,
  },
  emptyStringAsUndefined: true,
});
