import { env } from "#/env";
import { gcpJobsClient } from "#/lib/gcp.server";
import { createFileRoute } from "@tanstack/react-router";
import { App } from "octokit";
import { prisma } from "../../../db";
import { decrypt } from "../../../lib/crypto.server";

export const Route = createFileRoute("/api/webhook/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url);
        const owner = params.searchParams.get("owner");
        const repo = params.searchParams.get("repo");
        const issueNumber = params.searchParams.get("issueNumber");
        const invokerUsername = params.searchParams.get("invokerUsername");
        const customInstructions =
          params.searchParams.get("customInstructions") ?? "No Custom Instructions Provided";

        if (!owner || !repo || !issueNumber || !invokerUsername) {
          return new Response(
            JSON.stringify({
              error: "Missing required parameters: owner, repo, issueNumber, invokerUsername",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        try {
          const app = new App({
            appId: env.APP_ID,
            privateKey: env.PRIVATE_KEY,
          });

          const { data: installation } = await app.octokit.rest.apps.getRepoInstallation({
            owner,
            repo,
          });
          const installationId = String(installation.id);

          const githubUserRes = await fetch(`https://api.github.com/users/${invokerUsername}`);
          if (!githubUserRes.ok) {
            return new Response(
              JSON.stringify({ error: `GitHub user not found: ${invokerUsername}` }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          const githubUser = (await githubUserRes.json()) as { id: number };
          const githubUserId = String(githubUser.id);

          const account = await prisma.account.findFirst({
            where: {
              providerId: "github",
              accountId: githubUserId,
            },
          });

          if (!account) {
            return new Response(
              JSON.stringify({ error: `No registered account found for user: ${invokerUsername}` }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const config = await prisma.providerConfig.findFirst({
            where: { userId: account.userId },
          });

          if (!config || !config.encryptedKey) {
            return new Response(
              JSON.stringify({
                error: `No model API key configured for user: ${invokerUsername}. Please go to settings first.`,
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const apiKey = decrypt(config.encryptedKey, config.iv, config.salt);
          console.log(
            `Repo details; Owner: ${owner}, Repo: ${repo}, Issue Number: ${issueNumber}, Invoker: ${invokerUsername}, Installation ID: ${installationId}`,
          );
          const [operation] = await gcpJobsClient.runJob({
            name: `projects/${env.GOOGLE_PROJECT_ID}/locations/${env.GOOGLE_PROJECT_REGION}/jobs/${env.GOOGLE_CLOUD_RUN_WORKER_NAME}`,
            overrides: {
              containerOverrides: [
                {
                  env: [
                    { name: "REPO_NAME", value: repo },
                    { name: "ISSUE_ID", value: String(issueNumber) },
                    { name: "OWNER_NAME", value: owner },
                    { name: "INSTALLATION_ID", value: String(installationId) },
                    { name: "LLM_PROVIDER", value: config.provider },
                    { name: "LLM_MODEL", value: config.modelName ?? "" },
                    { name: "LLM_API_KEY", value: apiKey },
                    { name: "APP_ID", value: env.APP_ID },
                    { name: "PRIVATE_KEY", value: env.PRIVATE_KEY },
                    { name: "CUSTOM_INSTRUCTIONS", value: customInstructions ?? "" },
                  ],
                },
              ],
            },
          });

          const [execution] = await operation.promise();

          console.log(execution.name);

          console.log("Job executed successfully:", operation);

          return new Response(
            JSON.stringify({
              message: "Job executed successfully",
              executionId: operation.name,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        } catch (err: any) {
          console.error(err);
          return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
