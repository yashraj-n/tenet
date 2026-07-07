import { Probot } from "probot";
import { run } from "probot";
import { env } from "./env";

const app = (app: Probot) => {
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: `Heya @${context.payload.issue.user?.login ?? ""}, Tenet Agent is installed, send /tenet-build to automatically resolve this issue and send a PR`,
    });
    await context.octokit.rest.issues.createComment(issueComment);
  });

  app.on("issue_comment", async (ctx) => {
    const comment = ctx.payload.comment.body;
    if (comment !== "/tenet-build") return;
    await ctx.octokit.rest.reactions.createForIssueComment({
      ...ctx.repo(),
      comment_id: ctx.payload.comment.id,
      content: "eyes",
    });

    const owner = ctx.payload.repository.owner.login;
    const repo = ctx.payload.repository.name;
    const issueNumber = ctx.payload.issue.number.toString();
    const invokerUsername = ctx.payload.comment.user?.login;

    if (!invokerUsername) {
      console.error("No comment user login found.");
      return;
    }

    try {
      const url = `${env.APP_BASE_URL}/api/webhook/run?owner=${owner}&repo=${repo}&issueNumber=${issueNumber}&invokerUsername=${invokerUsername}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.SECRET_WEBHOOK_KEY}`,
          "ngrok-skip-browser-warning": "tenet",
        },
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `Server returned status ${res.status}`);
      }

      await ctx.octokit.rest.reactions.createForIssueComment({
        ...ctx.repo(),
        comment_id: ctx.payload.comment.id,
        content: "rocket",
      });
    } catch (err: any) {
      console.error("Failed to trigger agent build:", err);
      await ctx.octokit.rest.issues.createComment({
        ...ctx.repo(),
        issue_number: ctx.payload.issue.number,
        body: `❌ Failed to trigger build: ${err.message || String(err)}`,
      });
    }
  });
};

run(app);
