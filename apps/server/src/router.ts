import { z } from "zod";
import { getGithubOctokit } from "./lib/github";
import { publicProcedure, protectedProcedure, router } from "./trpc";

export const appRouter = router({
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
});

export type AppRouter = typeof appRouter;
