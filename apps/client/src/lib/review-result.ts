import { z } from "zod";

export const reviewResultSchema = z.object({
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

export type ReviewResult = z.infer<typeof reviewResultSchema>;

export function parseReviewResult(value: unknown) {
  return reviewResultSchema.parse(value);
}
