import { z } from "zod";
import { getGithubOctokit } from "../../lib/github";
import { publicProcedure, protectedProcedure, createTRPCRouter } from "./init";
import { encrypt } from "../../lib/crypto.server";
import { prisma } from "../../db";
import crypto from "node:crypto";
import { startAgentJob } from "../../lib/agent-job.server";

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(() => {
    return "Hello World";
  }),

  getRepos: protectedProcedure.query(async ({ ctx }) => {
    const octokit = await getGithubOctokit(ctx.user.id);
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      type: "all",
      sort: "updated",
      direction: "desc",
      per_page: 100,
    });

    return repos.map((repo) => ({
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description ?? undefined,
      stars: repo.stargazers_count || 0,
      language: repo.language || "TypeScript",
      openIssuesCount: repo.open_issues_count || 0,
    }));
  }),

  getIssues: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string() }))
    .query(async ({ ctx, input }) => {
      const octokit = await getGithubOctokit(ctx.user.id);
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: input.owner,
        repo: input.repo,
        state: "open",
        sort: "created",
        direction: "desc",
      });

      return issues
        .filter((issue) => !issue.pull_request)
        .map((issue) => {
          const labels = (issue.labels || []).map((lbl) => {
            const name = typeof lbl === "string" ? lbl : lbl.name || "";
            const lowercaseName = name.toLowerCase();
            let color = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            if (lowercaseName.includes("bug")) {
              color = "bg-red-500/10 text-red-400 border-red-500/20";
            } else if (lowercaseName.includes("enhancement") || lowercaseName.includes("feature")) {
              color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            } else if (lowercaseName.includes("priority") || lowercaseName.includes("urgent")) {
              color = "bg-orange-500/10 text-orange-400 border-orange-500/20";
            }
            return { name, color };
          });

          return {
            id: String(issue.id),
            number: issue.number,
            title: issue.title,
            repoId: `${input.owner}/${input.repo}`,
            labels,
            createdAt: issue.created_at,
            author: issue.user?.login || "unknown",
            body: issue.body ?? undefined,
          };
        });
    }),

  getAvailableModels: protectedProcedure.query(async () => {
    try {
      const res = await fetch("https://models.dev/models.json");
      const data = (await res.json()) as Record<
        string,
        { id: string; name: string; description?: string }
      >;
      const supportedProviders = [
        "google",
        "openai",
        "anthropic",
        "cohere",
        "mistral",
        "azure",
        "openrouter",
      ];

      const modelsList: Array<{
        id: string;
        name: string;
        provider: string;
        description?: string;
      }> = [];

      for (const key of Object.keys(data)) {
        const provider = key.split("/")[0];
        if (supportedProviders.includes(provider)) {
          modelsList.push({
            id: data[key].id,
            name: data[key].name,
            provider,
            description: data[key].description,
          });
        }
      }
      return modelsList;
    } catch (error) {
      console.error(error);
      return [
        { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google" },
        { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google" },
        { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" },
        { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
        { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic" },
        { id: "cohere/command-r-plus", name: "Command R+", provider: "cohere" },
        { id: "mistral/mistral-large-latest", name: "Mistral Large", provider: "mistral" },
      ];
    }
  }),

  getProviderConfigs: protectedProcedure.query(async ({ ctx }) => {
    const configs = await prisma.providerConfig.findMany({
      where: { userId: ctx.user.id },
    });
    return configs.map((c: any) => ({
      provider: c.provider,
      updatedAt: c.updatedAt,
      hasKey: true,
      modelName: c.modelName,
    }));
  }),

  saveProviderConfig: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
        apiKey: z.string().min(1, "API Key is required"),
        modelName: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { encryptedData, iv, salt } = encrypt(input.apiKey);

      const existing = await prisma.providerConfig.findUnique({
        where: {
          userId_provider: {
            userId: ctx.user.id,
            provider: input.provider,
          },
        },
      });

      if (existing) {
        await prisma.providerConfig.update({
          where: { id: existing.id },
          data: {
            encryptedKey: encryptedData,
            iv,
            salt,
            modelName: input.modelName || null,
          },
        });
      } else {
        await prisma.providerConfig.create({
          data: {
            id: crypto.randomUUID(),
            userId: ctx.user.id,
            provider: input.provider,
            encryptedKey: encryptedData,
            iv,
            salt,
            modelName: input.modelName || null,
          },
        });
      }
      return { success: true };
    }),

  runAgent: protectedProcedure
    .input(
      z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        issueNumber: z.string().min(1),
        customInstructions: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await startAgentJob({
        owner: input.owner,
        repo: input.repo,
        issueNumber: input.issueNumber,
        userId: ctx.user.id,
        customInstructions: input.customInstructions,
      });
      return result;
    }),
});

export type TRPCRouter = typeof appRouter;
