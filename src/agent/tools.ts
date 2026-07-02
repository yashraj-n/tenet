import { tool } from "ai";
import { z } from "zod";
import { mapWithConcurrency } from "../utils";
import { readdir } from "node:fs/promises";

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
