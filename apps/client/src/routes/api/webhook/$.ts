import { env } from "#/env";
import { startAgentJob } from "#/lib/agent-job.server";
import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../../db";
import { getInstallationOctokitForRepo } from "#/lib/github-app.server";
import crypto from "node:crypto";

export const Route = createFileRoute("/api/webhook/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("Authorization");
        if (authHeader !== `Bearer ${env.SECRET_WEBHOOK_KEY}`) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const params = new URL(request.url);
        if (!params.pathname.endsWith("/run")) {
          return new Response(JSON.stringify({ error: "Not Found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const owner = params.searchParams.get("owner");
        const repo = params.searchParams.get("repo");
        const issueNumber = params.searchParams.get("issueNumber");
        const invokerUsername = params.searchParams.get("invokerUsername");
        const customInstructions = params.searchParams.get("customInstructions") ?? undefined;

        if (!owner || !repo || !issueNumber || !invokerUsername) {
          return new Response(
            JSON.stringify({
              error: "Missing required parameters: owner, repo, issueNumber, invokerUsername",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const githubUserRes = await fetch(`https://api.github.com/users/${invokerUsername}`);
          if (!githubUserRes.ok) {
            return new Response(
              JSON.stringify({ error: `GitHub user not found: ${invokerUsername}` }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }
          const githubUser = (await githubUserRes.json()) as { id: number };

          const account = await prisma.account.findFirst({
            where: { providerId: "github", accountId: String(githubUser.id) },
          });

          if (!account) {
            return new Response(
              JSON.stringify({ error: `No registered account for user: ${invokerUsername}` }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }

          const octokit = await getInstallationOctokitForRepo(owner, repo);
          const { data: issue } = await octokit.rest.issues.get({
            owner,
            repo,
            issue_number: parseInt(issueNumber),
          });

          const runId = crypto.randomUUID();
          const run = await prisma.run.create({
            data: {
              id: runId,
              userId: account.userId,
              repoOwner: owner,
              repoName: `${owner}/${repo}`,
              issueNumber: parseInt(issueNumber),
              issueTitle: issue.title,
              status: "queued",
            },
          });

          try {
            const result = await startAgentJob({
              owner,
              repo,
              issueNumber,
              userId: account.userId,
              runId: run.id,
              customInstructions,
            });

            await prisma.run.update({
              where: { id: run.id },
              data: {
                status: "running",
                executionName: result.executionName,
              },
            });

            return new Response(
              JSON.stringify({ message: "Job started", runId: run.id, ...result }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          } catch (err: any) {
            await prisma.run.update({
              where: { id: run.id },
              data: {
                status: "failed",
                errorMessage: err.message || String(err),
              },
            });
            throw err;
          }
        } catch (err: any) {
          console.error(err);
          return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization");
        if (authHeader !== `Bearer ${env.SECRET_WEBHOOK_KEY}`) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const params = new URL(request.url);
        if (!params.pathname.endsWith("/run-complete")) {
          return new Response(JSON.stringify({ error: "Not Found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = (await request.json()) as {
            runId: string;
            status: "completed" | "failed";
            prLink?: string;
            errorMessage?: string;
          };

          if (!body.runId || !body.status) {
            return new Response(
              JSON.stringify({ error: "Missing required parameters: runId, status" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const existingRun = await prisma.run.findUnique({
            where: { id: body.runId },
          });

          if (!existingRun) {
            return new Response(JSON.stringify({ error: `Run not found: ${body.runId}` }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          await prisma.run.update({
            where: { id: body.runId },
            data: {
              status: body.status,
              prLink: body.prLink || null,
              errorMessage: body.errorMessage || null,
            },
          });

          return new Response(JSON.stringify({ message: "Run status updated successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
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
