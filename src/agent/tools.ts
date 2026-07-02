import { tool } from "ai";
import { z } from "zod";
import { mapWithConcurrency } from "../utils";
import { readdir } from "node:fs/promises";
import { $ } from "bun";

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
