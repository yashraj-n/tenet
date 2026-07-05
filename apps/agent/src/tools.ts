import { tool } from "ai";
import { z } from "zod";
import { mapWithConcurrency, getWorkspacePath } from "./utils";
import { readdir } from "node:fs/promises";
import { $ } from "bun";
import { App } from "octokit";
import { env } from "./env";
import { Shescape } from "shescape";

const she = new Shescape({ shell: "bash" });

export const readMultiTool = tool({
  description: "Read multiple files concurrently",
  inputSchema: z.object({
    paths: z.array(z.string().min(1, "File path cannot be empty")),
  }),
  execute: async ({ paths }) => {
    return mapWithConcurrency(
      paths,
      async (filePath) => {
        try {
          const resolved = getWorkspacePath(filePath);
          const content = await Bun.file(resolved).text();
          return { path: filePath, content, success: true };
        } catch (error: any) {
          return { path: filePath, error: error.message || String(error), success: false };
        }
      },
      5,
    );
  },
});

export const listDirTool = tool({
  description: "List the files and folders inside a directory recursively",
  inputSchema: z.object({
    path: z.string().default("."),
  }),
  execute: async ({ path: dirPath }) => {
    try {
      const resolved = getWorkspacePath(dirPath);
      const entries = await readdir(resolved, { recursive: true });
      return { files: entries };
    } catch (error: any) {
      return { error: error.message || String(error) };
    }
  },
});

export const grepTool = tool({
  description: "Search for patterns in files recursively using ripgrep",
  inputSchema: z.object({
    pattern: z.string().min(1, "Search pattern cannot be empty"),
    path: z.string().default("."),
  }),
  execute: async ({ pattern, path: searchPath }) => {
    try {
      const resolved = getWorkspacePath(searchPath);
      const escaped = she.escape(pattern);
      const { stdout } = await $`rg --json ${escaped} ${resolved}`.nothrow().quiet();
      const output = stdout.toString();
      const lines = output.split("\n").filter(Boolean);
      const results = lines
        .map((line) => {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "match") {
              return {
                file: parsed.data.path.text,
                line: parsed.data.line_number,
                text: parsed.data.submatches.map((m: any) => m.match.text).join(", "),
              };
            }
          } catch {}
          return null;
        })
        .filter(Boolean);

      return { results: results.slice(0, 50) };
    } catch (error: any) {
      return { error: error.message || String(error) };
    }
  },
});

export const replaceFileContentTool = tool({
  description: "Create a new file or replace the entire content of an existing file",
  inputSchema: z.object({
    path: z.string().min(1, "File path cannot be empty"),
    content: z.string(),
  }),
  execute: async ({ path: filePath, content }) => {
    try {
      const resolved = getWorkspacePath(filePath);
      await Bun.write(resolved, content);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  },
});

export const createPRTool = tool({
  description:
    "Create a GitHub commit with the staged changes, push it to a new branch, and create a Pull Request on GitHub",
  inputSchema: z.object({
    title: z.string().min(1, "PR title cannot be empty"),
    description: z.string().min(1, "PR description cannot be empty"),
    commitMessage: z.string().min(1, "Commit message cannot be empty"),
  }),
  execute: async ({ title, description, commitMessage }) => {
    try {
      const branchName = `fix/issue-${env.ISSUE_ID || "patch"}-${Date.now()}`;
      const owner = env.OWNER_NAME!;
      const repo = env.REPO_NAME!;

      await $`git config user.name "Aura AI Agent"`.quiet();
      await $`git config user.email "agent@tenet.yashrajn.com"`.quiet();
      await $`git add .`.quiet();
      await $`git checkout -b ${branchName}`.quiet();
      await $`git commit -m ${commitMessage}`.quiet();
      await $`git push origin ${branchName}`.quiet();

      const app = new App({
        appId: env.APP_ID!,
        privateKey: env.PRIVATE_KEY!,
      });
      const octokit = await app.getInstallationOctokit(parseInt(env.INSTALLATION_ID!));

      const { data: repository } = await octokit.rest.repos.get({ owner, repo });

      const prResponse = await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body: description,
        head: branchName,
        base: repository.default_branch,
      });

      const issueIdStr = env.ISSUE_ID;
      if (issueIdStr) {
        try {
          await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: parseInt(issueIdStr),
            body: `I have successfully created a pull request to resolve this issue. Please review the changes here: ${prResponse.data.html_url}`,
          });
        } catch (commentError: any) {
          console.error(commentError.message || commentError);
        }
      }

      return {
        success: true,
        pullRequestUrl: prResponse.data.html_url,
        branchName,
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  },
});
