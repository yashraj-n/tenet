import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Terminal, Loader2, ExternalLink, Clock, Calendar, ShieldCheck } from "lucide-react";
import { useTRPC } from "../../integrations/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { reviewResultSchema } from "@/lib/review-result";
import { cn } from "@/lib/utils";

import { getSeoMetadata } from "#/lib/seo";

export const Route = createFileRoute("/_dashboard/dashboard/runs")({
  head: () =>
    getSeoMetadata({
      title: "Runs & Jobs — Tenet AI",
      description:
        "Monitor active agent executions, review generated code diffs, and inspect build runs.",
      path: "/dashboard/runs",
      noIndex: true,
    }),
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
    <div className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-10 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border/20 pb-5">
        <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground">
          Runs History
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Track and review automated code corrections, PR reviews, and execution logs.
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
          {runs.map((run, runIndex) => {
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
              <div
                key={run.id}
                className="relative group flex flex-col gap-2 stagger-in"
                style={{ "--i": runIndex } as React.CSSProperties}
              >
                {/* Timeline axis dot */}
                <div
                  className={cn(
                    "absolute -left-[38px] top-1 h-2.5 w-2.5 rounded-full border bg-background transition-colors duration-300",
                    isCompleted && "border-emerald-500 bg-emerald-500",
                    isFailed && "border-red-500 bg-red-500",
                    isRunning && "border-primary bg-primary text-primary status-glow",
                    isQueued && "border-amber-500 bg-amber-500 text-amber-500 status-glow",
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
                      <div className="border border-border/30 bg-foreground/[0.01] rounded-xl p-5 mt-3 max-w-3xl space-y-5 animate-fade-in">
                        {/* Audit Header */}
                        <div className="flex items-center justify-between border-b border-border/20 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              Security Review
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full select-none",
                              review.verdict.recommendation === "approve"
                                ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
                                : "text-amber-500 bg-amber-500/10 border border-amber-500/20",
                            )}
                          >
                            verdict: {review.verdict.recommendation}
                          </span>
                        </div>

                        {review.issues.length === 0 ? (
                          <div className="text-xs text-emerald-400 font-mono flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            No security vulnerabilities found.
                          </div>
                        ) : (
                          <div className="divide-y divide-border/10">
                            {review.issues.map((issue) => (
                              <div
                                key={`${issue.file}:${issue.line}:${issue.title}`}
                                className="py-4 first:pt-0 last:pb-0 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={cn(
                                        "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border leading-none select-none",
                                        issue.severity === "high"
                                          ? "text-red-400 border-red-400/20 bg-red-400/5"
                                          : issue.severity === "medium"
                                            ? "text-amber-400 border-amber-400/20 bg-amber-400/5"
                                            : "text-blue-400 border-blue-400/20 bg-blue-400/5",
                                      )}
                                    >
                                      {issue.severity.toUpperCase()}
                                    </span>
                                    <span className="text-sm font-sans font-medium text-foreground">
                                      {issue.title}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-muted-foreground/60">
                                    {issue.file}
                                    {issue.line ? `:${issue.line}` : ""}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-sans leading-relaxed pl-1">
                                  {issue.details}
                                </p>

                                {issue.autofixPrompt && (
                                  <div className="bg-black/35 border border-border/20 rounded-lg p-3 font-mono text-[11px] text-foreground/90 space-y-1.5 mt-2">
                                    <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest block font-sans select-none">
                                      Suggested Correction
                                    </span>
                                    <code className="text-primary/95 leading-normal block overflow-x-auto select-all whitespace-pre-wrap">
                                      {issue.autofixPrompt}
                                    </code>
                                  </div>
                                )}
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
