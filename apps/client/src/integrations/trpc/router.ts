import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, createTRPCRouter } from "./init";
import { encrypt } from "../../lib/crypto.server";
import { prisma } from "../../db";
import crypto from "node:crypto";
import { startAgentJob } from "../../lib/agent-job.server";
import {
  getInstalledRepos,
  getInstallationOctokitForRepo,
  getRepo,
  getDashboardStats,
} from "../../lib/github-app.server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogle } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createCohere } from "@ai-sdk/cohere";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

function getDefaultModelForProvider(provider: string): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "google":
      return "gemini-1.5-flash";
    case "anthropic":
      return "claude-3-5-haiku-20241022";
    case "cohere":
      return "command-r";
    case "mistral":
      return "open-mistral-7b";
    case "openrouter":
      return "google/gemini-2.5-flash";
    default:
      return "";
  }
}

async function verifyApiKey(provider: string, apiKey: string, modelName?: string) {
  let model;
  const testModelId = modelName || getDefaultModelForProvider(provider);

  try {
    switch (provider) {
      case "openai":
        model = createOpenAI({ apiKey })(testModelId);
        break;
      case "google":
        model = createGoogle({ apiKey })(testModelId);
        break;
      case "anthropic":
        model = createAnthropic({ apiKey })(testModelId);
        break;
      case "cohere":
        model = createCohere({ apiKey })(testModelId);
        break;
      case "mistral":
        model = createMistral({ apiKey })(testModelId);
        break;
      case "openrouter":
        model = createOpenRouter({ apiKey })(testModelId);
        break;
      default:
        return;
    }

    await generateText({
      model,
      prompt: "ok",
      maxOutputTokens: 5,
    });
  } catch (err: any) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `API Key validation failed for ${provider}: ${err.message || String(err)}`,
    });
  }
}

async function checkAndUpdateQuota(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { maxQuota: true, quotaUsed: true, quotaResetAt: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const now = new Date();
  const maxQuota = user.maxQuota ?? 2;
  const quotaUsed = user.quotaUsed ?? 0;
  const quotaResetAt = user.quotaResetAt ?? now;

  if (user.maxQuota === null || user.quotaUsed === null || user.quotaResetAt === null) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        maxQuota,
        quotaUsed,
        quotaResetAt,
      },
    });
  }

  const resetInterval = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
  const timePassed = now.getTime() - quotaResetAt.getTime();

  if (timePassed >= resetInterval) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        quotaUsed: 0,
        quotaResetAt: now,
      },
      select: { maxQuota: true, quotaUsed: true, quotaResetAt: true },
    });
    return {
      maxQuota: updatedUser.maxQuota ?? 2,
      quotaUsed: updatedUser.quotaUsed ?? 0,
      quotaResetAt: updatedUser.quotaResetAt ?? now,
    };
  }

  return {
    maxQuota,
    quotaUsed,
    quotaResetAt,
  };
}

export const appRouter = createTRPCRouter({
  test: publicProcedure.query(() => {
    return "Hello World";
  }),

  getRepos: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10) }).optional())
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      return getInstalledRepos(page, limit);
    }),

  getRepo: protectedProcedure.input(z.object({ repoId: z.string() })).query(async ({ input }) => {
    return getRepo(input.repoId);
  }),

  getDashboardStats: protectedProcedure.query(async () => {
    return getDashboardStats();
  }),

  getQuota: protectedProcedure.query(async ({ ctx }) => {
    return checkAndUpdateQuota(ctx.user.id);
  }),

  getIssues: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ input }) => {
      const octokit = await getInstallationOctokitForRepo(input.owner, input.repo);

      const { data: searchResult } = await octokit.rest.search.issuesAndPullRequests({
        q: `repo:${input.owner}/${input.repo} is:issue state:open`,
        per_page: 1,
      });

      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: input.owner,
        repo: input.repo,
        state: "open",
        sort: "created",
        direction: "desc",
        page: input.page,
        per_page: input.limit,
      });

      const items = issues
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

      return { items, total: searchResult.total_count };
    }),

  getPullRequests: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ input }) => {
      const octokit = await getInstallationOctokitForRepo(input.owner, input.repo);

      const { data: searchResult } = await octokit.rest.search.issuesAndPullRequests({
        q: `repo:${input.owner}/${input.repo} is:pr state:open`,
        per_page: 1,
      });

      const { data: pulls } = await octokit.rest.pulls.list({
        owner: input.owner,
        repo: input.repo,
        state: "open",
        sort: "created",
        direction: "desc",
        page: input.page,
        per_page: input.limit,
      });

      const items = pulls.map((pr) => {
        const labels = (pr.labels || []).map((lbl) => {
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
          id: String(pr.id),
          number: pr.number,
          title: pr.title,
          repoId: `${input.owner}/${input.repo}`,
          labels,
          createdAt: pr.created_at,
          author: pr.user?.login || "unknown",
          draft: pr.draft || false,
          sourceBranch: pr.head.ref,
          targetBranch: pr.base.ref,
          url: pr.html_url,
        };
      });

      return { items, total: searchResult.total_count };
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
        { id: "openai/o1", name: "o1", provider: "openai" },
        { id: "openai/o3-mini", name: "o3-mini", provider: "openai" },
        { id: "anthropic/claude-3-7-sonnet", name: "Claude 3.7 Sonnet", provider: "anthropic" },
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
      await verifyApiKey(input.provider, input.apiKey, input.modelName || undefined);

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
      const quota = await checkAndUpdateQuota(ctx.user.id);
      if (quota.quotaUsed >= quota.maxQuota) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Run quota exceeded. You have used ${quota.quotaUsed}/${quota.maxQuota} runs. Your quota resets every 2 days.`,
        });
      }

      const octokit = await getInstallationOctokitForRepo(input.owner, input.repo);
      const { data: issue } = await octokit.rest.issues.get({
        owner: input.owner,
        repo: input.repo,
        issue_number: parseInt(input.issueNumber),
      });

      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { quotaUsed: { increment: 1 } },
      });

      const runId = crypto.randomUUID();
      const run = await prisma.run.create({
        data: {
          id: runId,
          userId: ctx.user.id,
          repoOwner: input.owner,
          repoName: `${input.owner}/${input.repo}`,
          issueNumber: parseInt(input.issueNumber),
          issueTitle: issue.title,
          status: "queued",
        },
      });

      try {
        const result = await startAgentJob({
          owner: input.owner,
          repo: input.repo,
          issueNumber: input.issueNumber,
          userId: ctx.user.id,
          runId: run.id,
          customInstructions: input.customInstructions,
        });

        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: "running",
            executionName: result.executionName,
          },
        });

        return { runId: run.id, executionName: result.executionName };
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
    }),

  runPRReview: protectedProcedure
    .input(
      z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        prNumber: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const quota = await checkAndUpdateQuota(ctx.user.id);
      if (quota.quotaUsed >= quota.maxQuota) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Run quota exceeded. You have used ${quota.quotaUsed}/${quota.maxQuota} runs. Your quota resets every 2 days.`,
        });
      }

      const octokit = await getInstallationOctokitForRepo(input.owner, input.repo);
      const { data: pull } = await octokit.rest.pulls.get({
        owner: input.owner,
        repo: input.repo,
        pull_number: parseInt(input.prNumber),
      });

      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { quotaUsed: { increment: 1 } },
      });

      const run = await prisma.run.create({
        data: {
          id: crypto.randomUUID(),
          userId: ctx.user.id,
          mode: "pr_review",
          repoOwner: input.owner,
          repoName: `${input.owner}/${input.repo}`,
          prNumber: parseInt(input.prNumber),
          prTitle: pull.title,
          status: "queued",
        },
      });

      try {
        const result = await startAgentJob({
          owner: input.owner,
          repo: input.repo,
          prNumber: input.prNumber,
          mode: "pr_review",
          userId: ctx.user.id,
          runId: run.id,
        });

        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: "running",
            executionName: result.executionName,
          },
        });

        return { runId: run.id, executionName: result.executionName };
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
    }),

  getRuns: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;

      const [total, runs] = await Promise.all([
        prisma.run.count({ where: { userId: ctx.user.id } }),
        prisma.run.findMany({
          where: { userId: ctx.user.id },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      const timedOutRunIds: string[] = [];
      const modifiedRuns = runs.map((run) => {
        const isPending = run.status === "running" || run.status === "queued";
        if (isPending && new Date(run.createdAt) < tenMinutesAgo) {
          timedOutRunIds.push(run.id);
          return {
            ...run,
            status: "failed",
            errorMessage: "Job execution timed out (exceeded 10 minutes limit)",
          };
        }
        return run;
      });

      if (timedOutRunIds.length > 0) {
        prisma.run
          .updateMany({
            where: { id: { in: timedOutRunIds } },
            data: {
              status: "failed",
              errorMessage: "Job execution timed out (exceeded 10 minutes limit)",
            },
          })
          .catch((err) => {
            console.error("Failed to update timed out runs in background:", err);
          });
      }

      return { items: modifiedRuns, total };
    }),

  getTracingState: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { tracingDisabled: true },
    });
    return user?.tracingDisabled ?? false;
  }),

  setTracingState: protectedProcedure.input(z.boolean()).mutation(async ({ ctx, input }) => {
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { tracingDisabled: input },
    });
    return { success: true };
  }),
});

export type TRPCRouter = typeof appRouter;
