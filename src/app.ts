import { Probot } from "probot";
import { run } from "probot";
import { requestContainer } from "./docker";

const app = (app: Probot) => {
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: `Heya @${context.payload.issue.user?.login ?? ""}, aura-ai-agent is installed, send /build to automatically resolve this issue and send a PR`,
    });
    await context.octokit.rest.issues.createComment(issueComment);
  });

  app.on("issue_comment", async (ctx) => {
    const comment = ctx.payload.comment.body;
    if (comment !== "/build") return;
    await ctx.octokit.rest.reactions.createForIssueComment({
      ...ctx.repo(),
      comment_id: ctx.payload.comment.id,
      content: "eyes",
    });
    await requestContainer(
      ctx.payload.repository.name,
      ctx.payload.issue.number.toString(),
      ctx.payload.repository.owner.login,
      ctx.payload.installation?.id.toString() ?? "",
    );
  });
};

run(app);
