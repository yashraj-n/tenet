import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_ID: z.string(),
    PRIVATE_KEY: z.string(),
    WEBHOOK_SECRET: z.string(),
    APP_BASE_URL: z.string(),
    SECRET_WEBHOOK_KEY: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
