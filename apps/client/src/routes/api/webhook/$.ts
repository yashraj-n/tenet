import { env } from "#/env";
import { startAgentJob } from "#/lib/agent-job.server";
import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "../../../db";

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

          const result = await startAgentJob({
            owner,
            repo,
            issueNumber,
            userId: account.userId,
            customInstructions,
          });

          return new Response(JSON.stringify({ message: "Job started", ...result }), {
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
