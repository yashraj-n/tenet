import { tool } from "ai";
import { z } from "zod";

export const readMultiTool = tool({
  inputSchema: z.array(z.string()),
  execute: async (_paths) => {
    
  },
});
