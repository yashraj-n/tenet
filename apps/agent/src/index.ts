/* eslint-disable no-useless-escape */
import { App } from "octokit";
import { cloneGitRepo } from "./git";
import { rm, mkdir } from "node:fs/promises";
import * as ai from "ai";
import { isStepCount } from "ai";
import { getLanguageModel } from "./factory";
import { createDevPrompt, createReviewPrompt } from "./prompt";
import {
  readMultiTool,
  listDirTool,
  grepTool,
  replaceFileContentTool,
  createPRTool,
} from "./tools";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { env } from "./env";
import { $ } from "bun";
import { z } from "zod";

const { generateText, generateObject } = wrapAISDK(ai);

const reviewResultSchema = z.object({
  summary: z.object({
    title: z.string(),
    prInfo: z.array(z.string()),
    poem: z.string(),
  }),
  filesChanged: z.array(
    z.object({
      path: z.string(),
      status: z.string(),
      summary: z.string(),
    }),
  ),
  sequenceDiagram: z.object({
    mermaid: z.string(),
    description: z.string(),
  }),
  issues: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high"]),
      category: z.enum(["code", "security", "performance", "maintainability"]),
      file: z.string(),
      line: z.number().nullable(),
      title: z.string(),
      details: z.string(),
      autofixPrompt: z.string(),
    }),
  ),
  verdict: z.object({
    risk: z.enum(["low", "medium", "high"]),
    recommendation: z.enum(["approve", "request_changes", "needs_human_review"]),
  }),
});

type ReviewResult = z.infer<typeof reviewResultSchema>;

function formatReviewComment(review: ReviewResult) {
  const severityRank = { high: 0, medium: 1, low: 2 };
  const sortedIssues = [...review.issues].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );
  const severityIcon = {
    high: "🔴",
    medium: "🟠",
    low: "🟡",
  };
  const recommendationLabel = {
    approve: "Approve",
    request_changes: "Request changes",
    needs_human_review: "Needs human review",
  };
  const issueRows =
    review.issues.length === 0
      ? "_No issues found._"
      : sortedIssues
          .map(
            (issue, index) => `### ${severityIcon[issue.severity]} ${index + 1}. ${issue.title}

| Severity | Category | Location |
| --- | --- | --- |
| ${issue.severity} | ${issue.category} | \`${issue.file}${issue.line ? `:${issue.line}` : ""}\` |

${issue.details}

<details>
<summary>Autofix prompt for an AI agent</summary>

\`\`\`text
${issue.autofixPrompt}
\`\`\`

</details>`,
          )
          .join("\n\n");

  return `## Review summary

### ${review.summary.title}

${review.summary.prInfo.map((line) => `- ${line}`).join("\n")}

### Walkthrough

| File | Change |
| --- | --- |
${review.filesChanged.map((file) => `| \`${file.path}\` | ${file.summary} |`).join("\n")}

### Sequence diagram

\`\`\`mermaid
${review.sequenceDiagram.mermaid}
\`\`\`

${review.sequenceDiagram.description}

### Review findings

${issueRows}

### Verdict

| Risk | Recommendation |
| --- | --- |
| ${review.verdict.risk} | ${recommendationLabel[review.verdict.recommendation]} |

> ${review.summary.poem}
`;
}

console.log(`
 _____         __    _____ 
/__   \___  /\ \ \__/__   \
  / /\/ _ \/  \/ / _ \/ /\/
 / / |  __/ /\  /  __/ /   
 \/   \___\_\ \/ \___\/
`);

async function sendCallback(
  status: "completed" | "failed",
  prLink?: string,
  reviewJson?: unknown,
  errorMessage?: string,
) {
  if (!env.CALLBACK_URL || !env.RUN_ID) {
    console.log("No callback URL or Run ID configured. Skipping status callback.");
    return;
  }

  console.log(`Sending completion callback to ${env.CALLBACK_URL} with status: ${status}...`);
  try {
    const res = await fetch(env.CALLBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SECRET_WEBHOOK_KEY || ""}`,
        "ngrok-skip-browser-warning": "tenet",
      },
      body: JSON.stringify({
        runId: env.RUN_ID,
        status,
        prLink,
        reviewJson,
        errorMessage,
      }),
    });

    if (!res.ok) {
      console.error(`Callback failed with status ${res.status}:`, await res.text());
    } else {
      console.log("Callback sent successfully!");
    }
  } catch (err) {
    console.error("Failed to send callback:", err);
  }
}

async function main() {
  try {
    const repoName = env.REPO_NAME;
    const issueId = env.ISSUE_ID;
    const prNumber = env.PR_NUMBER;
    const ownerName = env.OWNER_NAME;

    if (!env.APP_ID || !env.PRIVATE_KEY || !env.INSTALLATION_ID) {
      throw new Error("Missing GitHub App credentials in agent environment.");
    }

    const app = new App({
      appId: env.APP_ID,
      privateKey: env.PRIVATE_KEY,
    });

    const octokit = await app.getInstallationOctokit(parseInt(env.INSTALLATION_ID));
    const auth = await app.octokit.auth({
      type: "installation",
      installationId: parseInt(env.INSTALLATION_ID),
    });

    const accessToken = (auth as { token: string }).token;
    console.log(`Repo Name: ${repoName}`);
    console.log(`Issue ID: ${issueId || "N/A"}`);
    console.log(`PR Number: ${prNumber || "N/A"}`);
    console.log(`Owner Name: ${ownerName}`);

    console.log("Cloning to /workspace");
    try {
      await rm("/workspace", { recursive: true, force: true });
    } catch {}
    await mkdir("/workspace", { recursive: true });

    await cloneGitRepo(
      env.OWNER_NAME!,
      env.REPO_NAME!,
      "/workspace",
      "x-access-token",
      accessToken,
    );
    await $`git -C /workspace config core.fileMode false`.quiet();
    await $`chown -R 2000:2000 /workspace`.quiet();
    await $`chmod -R 777 /workspace`.quiet();
    await $`git config --global --add safe.directory '*'`.quiet();

    process.chdir("/workspace");

    if (env.AGENT_MODE === "pr_review") {
      if (!prNumber) {
        throw new Error("Missing PR_NUMBER for PR review mode.");
      }

      const pullNumber = parseInt(prNumber);
      const { data: pull } = await octokit.rest.pulls.get({
        owner: env.OWNER_NAME!,
        repo: env.REPO_NAME!,
        pull_number: pullNumber,
      });
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner: env.OWNER_NAME!,
        repo: env.REPO_NAME!,
        pull_number: pullNumber,
        per_page: 100,
      });
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: env.OWNER_NAME!,
        repo: env.REPO_NAME!,
        issue_number: pullNumber,
      });

      await $`git fetch origin ${`pull/${pullNumber}/head:pr-review-${pullNumber}`}`.quiet();
      await $`git checkout ${`pr-review-${pullNumber}`}`.quiet();

      const review = await generateObject({
        model: getLanguageModel(),
        schema: reviewResultSchema,
        schemaName: "PullRequestReview",
        schemaDescription: "Structured pull request code and security review result.",
        system: createReviewPrompt(env.LLM_MODEL || "default", env.CUSTOM_INSTRUCTIONS),
        prompt: `Review this pull request.

PR:
Title: ${pull.title}
Body: ${pull.body || ""}
Author: ${pull.user?.login || "unknown"}
Base: ${pull.base.ref}
Head: ${pull.head.ref}

Comments:
${comments.map((c) => `${c.user?.login}: ${c.body}`).join("\n")}

Changed files and patches:
${files
  .map(
    (file) => `File: ${file.filename}
Status: ${file.status}
Additions: ${file.additions}
Deletions: ${file.deletions}
Patch:
${(file.patch || "").slice(0, 12000)}`,
        )
  .join("\n\n")}`,
        seed: 0,
      });

      console.log(`Review response: ${JSON.stringify(review.object)}`);
      await octokit.rest.issues.createComment({
        owner: env.OWNER_NAME!,
        repo: env.REPO_NAME!,
        issue_number: pullNumber,
        body: formatReviewComment(review.object),
      });
      await sendCallback("completed", undefined, review.object);
      return;
    }

    const { data: issue } = await octokit.rest.issues.get({
      owner: env.OWNER_NAME!,
      repo: env.REPO_NAME!,
      issue_number: parseInt(env.ISSUE_ID!),
    });

    const { data: comments } = await octokit.rest.issues.listComments({
      owner: env.OWNER_NAME!,
      repo: env.REPO_NAME!,
      issue_number: parseInt(env.ISSUE_ID!),
    });

    console.log(`Issue Title: ${issue.title}`);
    console.log(`Issue Body: ${issue.body}`);

    const agent = await generateText({
      model: getLanguageModel(),
      system: createDevPrompt(env.LLM_MODEL || "default", env.CUSTOM_INSTRUCTIONS),
      prompt: `These are comments of issue:
      Title: ${issue.title}
      Body: ${issue.body}
      Comments: ${comments.map((c) => c.user?.login + ": " + c.body).join("\n")}`,
      tools: {
        readMulti: readMultiTool,
        listDir: listDirTool,
        grep: grepTool,
        replaceFileContent: replaceFileContentTool,
        createPR: createPRTool,
      },
      seed: 0,
      stopWhen: isStepCount(5000),
    });

    console.log(`Agent response: ${agent.text}`);

    let prLink: string | undefined = undefined;
    if (agent.steps) {
      for (const step of agent.steps) {
        if (step.toolResults) {
          for (const result of step.toolResults) {
            const resObj = result as any;
            if (resObj.toolName === "createPR") {
              const data = resObj.result || resObj.output;
              if (data?.success) {
                prLink = data.pullRequestUrl;
              }
            }
          }
        }
      }
    }

    await sendCallback("completed", prLink);
  } catch (err: any) {
    console.error("Agent execution failed:", err);
    await sendCallback("failed", undefined, undefined, err.message || String(err));
    process.exit(1);
  }
}

main();
