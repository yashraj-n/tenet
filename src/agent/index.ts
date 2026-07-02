import { App } from "octokit";
import { cloneGitRepo } from "./git";
import * as ai from "ai";
import { isStepCount } from "ai";
import { getLanguageModel } from "./factory";
import { createDevPrompt } from "./prompt";
import { readMultiTool } from "./tools";
import { wrapAISDK } from "langsmith/experimental/vercel";

const { generateText } = wrapAISDK(ai);

const repoName = process.env.REPO_NAME;
const issueId = process.env.ISSUE_ID;
const ownerName = process.env.OWNER_NAME;

const app = new App({
  appId: process.env.APP_ID!,
  privateKey: process.env.PRIVATE_KEY!,
});

const octokit = await app.getInstallationOctokit(parseInt(process.env.INSTALLATION_ID!));
const auth = await app.octokit.auth({
  type: "installation",
  installationId: parseInt(process.env.INSTALLATION_ID!),
});

const { data: issue } = await octokit.rest.issues.get({
  owner: process.env.OWNER_NAME!,
  repo: process.env.REPO_NAME!,
  issue_number: parseInt(process.env.ISSUE_ID!),
});

const accessToken = (auth as { token: string }).token;
console.log(`Repo Name: ${repoName}`);
console.log(`Issue ID: ${issueId}`);
console.log(`Owner Name: ${ownerName}`);
console.log(`Issue Title: ${issue.title}`);
console.log(`Issue Body: ${issue.body}`);
console.log(`Token (first 7): ${accessToken.substring(0, 7)}...`);

console.log("Cloning to /tmp/workdir");
await cloneGitRepo(
  process.env.OWNER_NAME!,
  process.env.REPO_NAME!,
  "/tmp/workdir",
  "x-access-token",
  accessToken,
);

process.chdir("/tmp/workdir");
console.log("Asking ai wtf is this");
const agent = await generateText({
  model: getLanguageModel(),
  system: await createDevPrompt(process.env.LLM_MODEL || "default"),
  prompt: `wat is this project about, answer the question!`,
  tools: {
    readMulti: readMultiTool,
  },
  seed: 0,
  stopWhen: isStepCount(5000),
  // maxSteps: 5,
});

console.log(`Agent response: ${agent.text}`);
