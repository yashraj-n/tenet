import { tool } from "ai";
import { z } from "zod";
import { mapWithConcurrency } from "../utils";

export const readMultiTool = tool({
  description: "Read multiple files concurrently",
  inputSchema: z.array(z.string().min(1, "File path cannot be empty")),
  execute: async (paths) => {
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
