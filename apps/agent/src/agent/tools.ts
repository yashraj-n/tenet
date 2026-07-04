import { tool } from "ai";
import { z } from "zod";
import { mapWithConcurrency, getWorkspacePath } from "../utils";
import { readdir } from "node:fs/promises";
import { $ } from "bun";
import { App } from "octokit";
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
          const safePath = getWorkspacePath(filePath);
          const content = await Bun.file(safePath).text();
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
      const safeDir = getWorkspacePath(dirPath);
      return await readdir(safeDir);
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
      const safeDir = getWorkspacePath(dirPath);
      const isLinux = process.platform === "linux";
      const escapedPattern = she.quote(pattern);
      const escapedDir = she.quote(safeDir);
      const shellCommand = `rg -n --no-heading --color=never ${escapedPattern} ${escapedDir}`;

      const cmd = isLinux
        ? ["runuser", "-u", "agent-sandbox", "--", "bash", "-c", shellCommand]
        : ["bash", "-c", shellCommand];

      const proc = Bun.spawn({
        cmd,
        timeout: 20000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
          HOME: "/home/agent-sandbox",
          LANG: "en_US.UTF-8",
        },
      });

      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      if (exitCode === 1) {
        return "No matches found.";
      }

      return stdout;
    } catch (error: any) {
      return { error: error.message || String(error) };
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
      const isLinux = process.platform === "linux";
      const cmd = isLinux
        ? ["runuser", "-u", "agent-sandbox", "--", "bash", "-c", command]
        : ["bash", "-c", command];

      const proc = Bun.spawn({
        cmd,
        cwd: "/workspace",
        timeout: 20000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
          HOME: "/home/agent-sandbox",
          LANG: "en_US.UTF-8",
        },
      });

      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();

      if (proc.killed && proc.signalCode === "SIGTERM") {
        return {
          stdout,
          stderr: stderr || "Command timed out after 20 seconds",
          exitCode: 124,
        };
      }

      return {
        stdout,
        stderr,
        exitCode,
      };
    } catch (error: any) {
      return {
        stdout: "",
        stderr: error.message || String(error),
        exitCode: 1,
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
      const safePath = getWorkspacePath(filePath);
      await Bun.write(safePath, content);
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
