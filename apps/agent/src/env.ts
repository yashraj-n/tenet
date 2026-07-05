import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    LLM_PROVIDER: z.string().default("openai"),
    LLM_MODEL: z.string().optional(),
    LLM_API_KEY: z.string().optional(),

    LANGCHAIN_TRACING_V2: z.string().optional(),
    LANGCHAIN_API_KEY: z.string().optional(),
    LANGCHAIN_PROJECT: z.string().optional(),
    REPO_NAME: z.string().optional(),
    ISSUE_ID: z.string().optional(),
    OWNER_NAME: z.string().optional(),
    INSTALLATION_ID: z.string().optional(),
    APP_ID: z.string().optional(),
    PRIVATE_KEY: z.string().optional(),
    CUSTOM_INSTRUCTIONS: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
