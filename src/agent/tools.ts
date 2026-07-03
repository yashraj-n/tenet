import { tool } from "ai";
import { z } from "zod";
import { mapWithConcurrency } from "../utils";
import { readdir } from "node:fs/promises";
import { $ } from "bun";
import { App } from "octokit";

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
          const content = await Bun.file(filePath).text();
          return { path: filePath, content };
        } catch (error: any) {
          return { path: filePath, error: error.message || String(error) };
        }
      },
      5,
    );
  },
});

export const listDirTool = tool({
  description: "List contents of a directory",
  inputSchema: z.string(),
  execute: async (dirPath) => {
    try {
      return await readdir(dirPath);
    } catch (error: any) {
      return { error: error.message || String(error) };
    }
  },
});

export const grepTool = tool({
  description: "Search for patterns in files recursively using ripgrep (rg)",
  inputSchema: z.object({
    pattern: z.string().min(1, "Pattern cannot be empty"),
    dirPath: z.string().min(1, "Directory path cannot be empty"),
  }),
  execute: async ({ pattern, dirPath }) => {
    try {
      const result = await $`rg -n --no-heading --color=never ${pattern} ${dirPath}`.quiet();
      return result.stdout.toString();
    } catch (error: any) {
      if (error.exitCode === 1) {
        return "No matches found.";
      }
      return { error: error.stderr?.toString() || error.message || String(error) };
    }
  },
});

export const bashTool = tool({
  description: "Run a command in the bash shell. Only run non-interactive commands.",
  inputSchema: z.object({
    command: z.string().min(1, "Command cannot be empty"),
  }),
  execute: async ({ command }) => {
    try {
      const result = await $`bash -c ${command}`.quiet();
      return {
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || "",
        stderr: error.stderr?.toString() || error.message || String(error),
        exitCode: error.exitCode !== undefined ? error.exitCode : 1,
      };
    }
  },
});

export const replaceFileContentTool = tool({
  description:
    "Replace the entire content of a file or create a new file with the specified content",
  inputSchema: z.object({
    filePath: z.string().min(1, "File path cannot be empty"),
    content: z.string(),
  }),
  execute: async ({ filePath, content }) => {
    try {
      await Bun.write(filePath, content);
      return { success: true, filePath };
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
      const branchName = `fix/issue-${process.env.ISSUE_ID || "patch"}-${Date.now()}`;
      const owner = process.env.OWNER_NAME!;
      const repo = process.env.REPO_NAME!;

      await $`git config user.name "Aura AI Agent"`.quiet();
      await $`git config user.email "agent@localhost"`.quiet();
      await $`git add .`.quiet();
      await $`git checkout -b ${branchName}`.quiet();
      await $`git commit -m ${commitMessage}`.quiet();
      await $`git push origin ${branchName}`.quiet();

      const app = new App({
        appId: process.env.APP_ID!,
        privateKey: process.env.PRIVATE_KEY!,
      });
      const octokit = await app.getInstallationOctokit(parseInt(process.env.INSTALLATION_ID!));

      const { data: repository } = await octokit.rest.repos.get({ owner, repo });

      const prResponse = await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body: description,
        head: branchName,
        base: repository.default_branch,
      });

      const issueIdStr = process.env.ISSUE_ID;
      if (issueIdStr) {
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: parseInt(issueIdStr),
          body: `I have successfully created a pull request to resolve this issue. Please review the changes here: ${prResponse.data.html_url}`,
        });
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
