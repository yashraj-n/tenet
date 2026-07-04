import { env } from "#/env";
import { v2 } from "@google-cloud/run";

export const gcpJobsClient = new v2.JobsClient({
  credentials: env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : undefined,
});
