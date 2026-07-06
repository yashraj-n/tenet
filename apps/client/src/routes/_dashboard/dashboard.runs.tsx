import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  GitPullRequest,
  Clock,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { useTRPC } from "../../integrations/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { reviewResultSchema } from "@/lib/review-result";

export const Route = createFileRoute("/_dashboard/dashboard/runs")({
  component: RunsPage,
});

function RunsPage() {
  const trpc = useTRPC();
  const { data: runs = [], isLoading } = useQuery(trpc.getRuns.queryOptions());
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <div className="flex items-center gap-1.5 text-xs text-[#eca8d6] font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>running</span>
          </div>
        );
      case "queued":
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>queued</span>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>completed</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono">
            <XCircle className="w-3.5 h-3.5" />
            <span>failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getDuration = (run: any) => {
    if (run.status === "running" || run.status === "queued") {
      return "--";
    }
    const start = new Date(run.createdAt).getTime();
    const end = new Date(run.updatedAt).getTime();
    const diffSeconds = Math.round((end - start) / 1000);
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    }
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex-1 flex flex-col p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="font-display text-4xl italic text-foreground tracking-tight mb-2">
          Runs History
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitor your agent's autonomous containers, logs, and pull request outputs.
        </p>
      </div>

      {/* Runs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 select-none">
            <Loader2 className="w-8 h-8 text-[#eca8d6] animate-spin mb-3" />
            <p className="text-xs font-mono text-muted-foreground animate-pulse">
              Loading runs history...
            </p>
          </div>
        ) : runs.length > 0 ? (
          runs.map((run) => {
            const isReview = run.mode === "pr_review";
            const itemNumber = isReview ? run.prNumber : run.issueNumber;
            const itemTitle = isReview ? run.prTitle : run.issueTitle;
            const itemLink = `https://github.com/${run.repoName}/${isReview ? "pull" : "issues"}/${itemNumber}`;
            const review = reviewResultSchema.safeParse(run.reviewJson).success
              ? reviewResultSchema.parse(run.reviewJson)
              : null;
            return (
              <div
                key={run.id}
                className="flex flex-col gap-4 p-5 rounded-lg border border-border/40 bg-foreground/[0.005] hover:bg-foreground/[0.015] hover:border-border/80 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-muted-foreground/60">
                        {run.repoName}
                      </span>
                      <span className="text-xs text-muted-foreground/40 font-mono">&middot;</span>
                      <span className="text-xs text-muted-foreground/60 font-mono">
                        {isReview ? "PR" : "Issue"} #{itemNumber}
                      </span>
                      {isReview && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#eca8d6] border border-[#eca8d6]/20 bg-[#eca8d6]/5 rounded px-2 py-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          review
                        </span>
                      )}
                    </div>

                    <a
                      href={itemLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-sans font-medium text-foreground/90 hover:text-[#eca8d6] hover:underline transition-colors truncate cursor-pointer"
                    >
                      {itemTitle}
                    </a>

                    {run.errorMessage && (
                      <p className="text-xs font-mono text-red-400 mt-1 max-w-2xl truncate">
                        Error: {run.errorMessage}
                      </p>
                    )}

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50 font-mono mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getDuration(run)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t border-border/20 md:border-0 pt-3 md:pt-0">
                    {getStatusBadge(run.status)}

                    {run.status === "completed" && run.prLink && (
                      <a
                        href={run.prLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-medium rounded-md bg-[#eca8d6]/5 text-[#eca8d6] border border-[#eca8d6]/20 px-3 py-1.5 hover:bg-[#eca8d6]/15 hover:border-[#eca8d6]/40 transition-colors duration-200 cursor-pointer"
                      >
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>PR Shipped</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {review &&
                  (() => {
                    const isCollapsed = !expandedReviews[run.id];
                    return (
                      <div className="flex flex-col gap-3 border-t border-border/30 pt-4">
                        <button
                          onClick={() =>
                            setExpandedReviews((p) => ({ ...p, [run.id]: !p[run.id] }))
                          }
                          className="flex items-center gap-1.5 text-xs font-mono text-[#eca8d6] hover:text-[#eca8d6]/80 transition-colors cursor-pointer w-fit"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {isCollapsed
                              ? `Show Security Review (${review.issues.length} issues)`
                              : "Hide Security Review"}
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className="grid gap-4 animate-fade-in">
                            <div>
                              <h4 className="text-sm font-medium text-foreground">
                                {review.summary.title}
                              </h4>
                              <p className="text-xs text-muted-foreground italic mt-1">
                                {review.summary.poem}
                              </p>
                              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {review.summary.prInfo.map((line) => (
                                  <li key={line}>- {line}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="grid gap-2">
                              {review.issues.length === 0 ? (
                                <p className="text-xs font-mono text-emerald-400">
                                  No review issues found. Recommendation:{" "}
                                  {review.verdict.recommendation}
                                </p>
                              ) : (
                                review.issues.map((issue) => (
                                  <div
                                    key={`${issue.file}:${issue.line}:${issue.title}`}
                                    className="rounded-md border border-border/40 bg-background/40 p-3"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] font-mono uppercase text-[#eca8d6]">
                                        {issue.severity}
                                      </span>
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        {issue.category}
                                      </span>
                                      <span className="text-[10px] font-mono text-muted-foreground truncate">
                                        {issue.file}
                                        {issue.line ? `:${issue.line}` : ""}
                                      </span>
                                    </div>
                                    <h5 className="text-sm font-medium text-foreground mt-1">
                                      {issue.title}
                                    </h5>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {issue.details}
                                    </p>
                                    <p className="text-xs font-mono text-muted-foreground mt-2 rounded bg-foreground/[0.03] p-2">
                                      Autofix: {issue.autofixPrompt}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-2xl bg-foreground/[0.005] select-none text-center">
            <Terminal className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <h4 className="text-sm font-sans font-medium text-foreground">No Runs Yet</h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Trigger a build from any repository issue list to execute the autonomous solver.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RunsPage;
