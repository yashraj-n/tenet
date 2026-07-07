import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Terminal, Loader2, ExternalLink, Clock, Calendar, ShieldCheck } from "lucide-react";
import { useTRPC } from "../../integrations/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { reviewResultSchema } from "@/lib/review-result";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/dashboard/runs")({
  component: RunsPage,
});

function RunsPage() {
  const [runsPage, setRunsPage] = useState(1);
  const trpc = useTRPC();
  const { data: runsData, isLoading } = useQuery(
    trpc.getRuns.queryOptions({ page: runsPage, limit: 10 }),
  );
  const runs = runsData?.items || [];
  const totalRuns = runsData?.total || 0;
  const totalRunsPages = Math.ceil(totalRuns / 10);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "running":
        return "running";
      case "queued":
        return "queued";
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      default:
        return status;
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
    <div className="flex-1 flex flex-col p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-10 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border/20 pb-5">
        <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground">
          Runs History
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Review chronological container solver executions, logs, and pull request outputs.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 select-none">
          <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
          <p className="text-[10px] font-mono text-muted-foreground animate-pulse uppercase tracking-wider">
            Streaming runs history...
          </p>
        </div>
      ) : runs.length > 0 ? (
        <div className="relative border-l border-border/40 ml-3 pl-8 space-y-10 py-2">
          {runs.map((run) => {
            const isReview = run.mode === "pr_review";
            const itemNumber = isReview ? run.prNumber : run.issueNumber;
            const itemTitle = isReview ? run.prTitle : run.issueTitle;
            const itemLink = `https://github.com/${run.repoName}/${isReview ? "pull" : "issues"}/${itemNumber}`;
            const review = reviewResultSchema.safeParse(run.reviewJson).success
              ? reviewResultSchema.parse(run.reviewJson)
              : null;

            // Status Styling details
            const isCompleted = run.status === "completed";
            const isFailed = run.status === "failed";
            const isRunning = run.status === "running";
            const isQueued = run.status === "queued";

            return (
              <div key={run.id} className="relative group flex flex-col gap-2">
                {/* Timeline axis dot */}
                <div
                  className={cn(
                    "absolute -left-[38px] top-1 h-2.5 w-2.5 rounded-full border bg-background transition-colors duration-300",
                    isCompleted && "border-emerald-500 bg-emerald-500",
                    isFailed && "border-red-500 bg-red-500",
                    isRunning && "border-primary bg-primary animate-pulse",
                    isQueued && "border-amber-500 bg-amber-500 animate-pulse",
                  )}
                />

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
                  <span className="font-semibold text-foreground/80">{run.repoName}</span>
                  <span>&middot;</span>
                  <span>
                    {isReview ? "PR" : "Issue"} #{itemNumber}
                  </span>
                  <span>&middot;</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{getDuration(run)}</span>
                  </div>
                  <span>&middot;</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Title and Job Status Header */}
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                  <a
                    href={itemLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-sans font-medium text-foreground hover:underline transition-colors cursor-pointer group-hover:text-foreground/90 leading-tight"
                  >
                    {itemTitle}
                  </a>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 text-[10.5px] font-mono select-none shrink-0">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isCompleted && "bg-emerald-500",
                        isFailed && "bg-red-500",
                        isRunning && "bg-primary animate-pulse",
                        isQueued && "bg-amber-500 animate-pulse",
                      )}
                    />
                    <span
                      className={cn(
                        isCompleted && "text-emerald-500",
                        isFailed && "text-red-400",
                        isRunning && "text-primary",
                        isQueued && "text-amber-400",
                      )}
                    >
                      {getStatusLabel(run.status)}
                    </span>
                  </div>
                </div>

                {/* Execution Log traces */}
                <div className="space-y-1.5 mt-1">
                  {isCompleted && run.prLink && (
                    <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground/85">
                      <span className="text-emerald-500 font-mono select-none">&gt;</span>
                      <span>shipped:</span>
                      <a
                        href={run.prLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                      >
                        PR Shipped <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {isFailed && run.errorMessage && (
                    <div className="flex items-start gap-2 text-[11px] font-mono text-red-400/90 leading-relaxed bg-red-500/5 border border-red-500/10 rounded px-2.5 py-1.5 max-w-3xl">
                      <span className="select-none">x</span>
                      <span>{run.errorMessage}</span>
                    </div>
                  )}

                  {isRunning && (
                    <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground/85">
                      <span className="text-primary font-mono select-none animate-pulse">●</span>
                      <span>solving issue in container container...</span>
                    </div>
                  )}

                  {isQueued && (
                    <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground/85">
                      <span className="text-amber-500 font-mono select-none animate-pulse">~</span>
                      <span>waiting in job scheduler queue...</span>
                    </div>
                  )}
                </div>

                {/* Interactive Audit report drawer */}
                {review && (
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={() =>
                        setExpandedReviews((prev) => ({ ...prev, [run.id]: !prev[run.id] }))
                      }
                      className="flex items-center gap-1.5 text-[11px] font-mono text-primary/80 hover:text-primary transition-colors cursor-pointer w-fit"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {expandedReviews[run.id]
                          ? "[-] Hide Security Review"
                          : `[+] Show Security Review (${review.issues.length} warnings)`}
                      </span>
                    </button>

                    {expandedReviews[run.id] && (
                      <div className="bg-black/35 border border-border/40 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-muted-foreground mt-1 max-w-3xl animate-fade-in">
                        <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-2">
                          <span className="text-foreground/45">// SECURITY AUDIT FEED</span>
                          <span className="text-[10px] font-semibold text-emerald-400">
                            RECOMMENDATION: {review.verdict.recommendation.toUpperCase()}
                          </span>
                        </div>

                        {review.issues.length === 0 ? (
                          <div className="text-emerald-400 font-semibold">
                            ● No security vulnerabilities found.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {review.issues.map((issue) => (
                              <div
                                key={`${issue.file}:${issue.line}:${issue.title}`}
                                className="space-y-1 border-b border-border/10 pb-3 last:border-b-0 last:pb-0"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      "px-1 py-0.5 rounded text-[9px] font-bold text-black select-none leading-none",
                                      issue.severity === "high"
                                        ? "bg-red-400"
                                        : issue.severity === "medium"
                                          ? "bg-amber-400"
                                          : "bg-blue-400",
                                    )}
                                  >
                                    {issue.severity.toUpperCase()}
                                  </span>
                                  <span className="text-foreground/80 font-medium">
                                    {issue.title}
                                  </span>
                                  <span className="text-foreground/40 text-[10px] ml-auto">
                                    {issue.file}
                                    {issue.line ? `:${issue.line}` : ""}
                                  </span>
                                </div>
                                <p className="text-foreground/75 leading-normal">{issue.details}</p>
                                <p className="text-primary font-medium flex items-center gap-1.5 flex-wrap">
                                  <span>Autofix prompt:</span>
                                  <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-[10px] font-mono text-foreground/85 border border-border/20">
                                    {issue.autofixPrompt}
                                  </code>
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalRunsPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/20 pt-4 mt-6 text-xs font-mono text-muted-foreground select-none">
              <button
                onClick={() => setRunsPage((p) => Math.max(1, p - 1))}
                disabled={runsPage === 1}
                className="hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                &lt; previous page
              </button>
              <span>
                page {runsPage} / {totalRunsPages}
              </span>
              <button
                onClick={() => setRunsPage((p) => Math.min(totalRunsPages, p + 1))}
                disabled={runsPage === totalRunsPages}
                className="hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                next page &gt;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/40 rounded-2xl bg-card/10 select-none text-center max-w-md mx-auto">
          <Terminal className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <h4 className="text-xs font-sans font-medium text-foreground">No executions found</h4>
          <p className="text-[10px] text-muted-foreground max-w-xs mt-1 leading-normal">
            Trigger a build command inside any GitHub repository issue thread to see run history
            traces.
          </p>
        </div>
      )}
    </div>
  );
}

export default RunsPage;
