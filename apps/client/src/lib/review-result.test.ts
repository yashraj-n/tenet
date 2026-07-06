import { describe, expect, test } from "vitest";
import { parseReviewResult } from "./review-result";

describe("parseReviewResult", () => {
  test("accepts the PR review JSON shape used by the client", () => {
    const result = parseReviewResult({
      summary: {
        title: "Review for #12",
        prInfo: ["Adds review mode", "Keeps writes disabled"],
        poem: "Small diff, sharp eyes.",
      },
      filesChanged: [{ path: "src/app.ts", status: "modified", summary: "Adds entrypoint" }],
      sequenceDiagram: {
        mermaid: "sequenceDiagram\n  Client->>Agent: review",
        description: "Client starts a review run.",
      },
      issues: [
        {
          severity: "high",
          category: "security",
          file: "src/app.ts",
          line: 42,
          title: "Missing authorization check",
          details: "The handler trusts caller input.",
          autofixPrompt: "Add authorization before processing the request.",
        },
      ],
      verdict: { risk: "high", recommendation: "request_changes" },
    });

    expect(result.issues[0]?.severity).toBe("high");
  });
});
