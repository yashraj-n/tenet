/* eslint-disable no-useless-escape */
import { App } from "octokit";
import { cloneGitRepo } from "./git";
import { rm, mkdir } from "node:fs/promises";
import * as ai from "ai";
import { isStepCount } from "ai";
import { getLanguageModel } from "./factory";
import { createDevPrompt } from "./prompt";
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

const { generateText } = wrapAISDK(ai);

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

    const accessToken = (auth as { token: string }).token;
    console.log(`Repo Name: ${repoName}`);
    console.log(`Issue ID: ${issueId}`);
    console.log(`Owner Name: ${ownerName}`);
    console.log(`Issue Title: ${issue.title}`);
    console.log(`Issue Body: ${issue.body}`);

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
    await $`chown -R 2000:2000 /workspace`.quiet();
    await $`chmod -R 777 /workspace`.quiet();
    await $`git config --global --add safe.directory '*'`.quiet();

    process.chdir("/workspace");
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
    await sendCallback("failed", undefined, err.message || String(err));
    process.exit(1);
  }
}

main();
