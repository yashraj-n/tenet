import { env } from "#/env";
import { gcpJobsClient } from "#/lib/gcp.server";
import { App } from "octokit";
import { prisma } from "../db";
import { decrypt } from "./crypto.server";

export async function startAgentJob(opts: {
  owner: string;
  repo: string;
  issueNumber: string;
  userId: string;
  customInstructions?: string;
}) {
  const app = new App({
    appId: env.APP_ID,
    privateKey: env.PRIVATE_KEY,
  });

  const { data: installation } = await app.octokit.rest.apps.getRepoInstallation({
    owner: opts.owner,
    repo: opts.repo,
  });
  const installationId = String(installation.id);

  const config = await prisma.providerConfig.findFirst({
    where: { userId: opts.userId },
  });

  if (!config || !config.encryptedKey) {
    throw new Error("No model API key configured. Please go to settings first.");
  }

  const apiKey = decrypt(config.encryptedKey, config.iv, config.salt);

  const [operation] = await gcpJobsClient.runJob({
    name: `projects/${env.GOOGLE_PROJECT_ID}/locations/${env.GOOGLE_PROJECT_REGION}/jobs/${env.GOOGLE_CLOUD_RUN_WORKER_NAME}`,
    overrides: {
      containerOverrides: [
        {
          env: [
            { name: "REPO_NAME", value: opts.repo },
            { name: "ISSUE_ID", value: opts.issueNumber },
            { name: "OWNER_NAME", value: opts.owner },
            { name: "INSTALLATION_ID", value: installationId },
            { name: "LLM_PROVIDER", value: config.provider },
            { name: "LLM_MODEL", value: config.modelName ?? "" },
            { name: "LLM_API_KEY", value: apiKey },
            { name: "APP_ID", value: env.APP_ID },
            { name: "PRIVATE_KEY", value: env.PRIVATE_KEY },
            { name: "CUSTOM_INSTRUCTIONS", value: opts.customInstructions ?? "" },
          ],
        },
      ],
    },
  });

  return { executionName: operation.name };
}
