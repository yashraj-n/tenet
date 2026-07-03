import { useState, useEffect } from "react";
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
} from "lucide-react";
import { mockRuns, Run } from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/dashboard/runs")({
  component: RunsPage,
});

function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);

  const loadRuns = () => {
    const stored = localStorage.getItem("tenet_runs");
    if (stored) {
      try {
        setRuns(JSON.parse(stored));
      } catch {
        setRuns(mockRuns);
      }
    } else {
      setRuns(mockRuns);
    }
  };

  useEffect(() => {
    loadRuns();
    window.addEventListener("tenet_runs_update", loadRuns);
    return () => window.removeEventListener("tenet_runs_update", loadRuns);
  }, []);

  // Simulating active runner job -> complete in 7 seconds
  useEffect(() => {
    const runningJob = runs.find((r) => r.status === "running");
    if (runningJob) {
      const timer = setTimeout(() => {
        const updated = runs.map((r) => {
          if (r.id === runningJob.id) {
            return {
              ...r,
              status: "completed" as const,
              duration: "42s",
              prLink: `https://github.com/${r.repoName}/pull/${r.issueNumber + 1}`,
              triggeredAt: "1 min ago",
            };
          }
          return r;
        });
        localStorage.setItem("tenet_runs", JSON.stringify(updated));
        setRuns(updated);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [runs]);

  const getStatusBadge = (status: Run["status"]) => {
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
    }
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
        {runs.length > 0 ? (
          runs.map((run) => {
            const issueLink = `https://github.com/${run.repoName}/issues/${run.issueNumber}`;
            return (
              <div
                key={run.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-lg border border-border/40 bg-foreground/[0.005] hover:bg-foreground/[0.015] hover:border-border/80 transition-all duration-300"
              >
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-muted-foreground/60">
                      {run.repoName}
                    </span>
                    <span className="text-xs text-muted-foreground/40 font-mono">&middot;</span>
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      #{run.issueNumber}
                    </span>
                  </div>

                  <a
                    href={issueLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-sans font-medium text-foreground/90 hover:text-[#eca8d6] hover:underline transition-colors truncate cursor-pointer"
                  >
                    {run.issueTitle}
                  </a>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50 font-mono mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{run.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{run.triggeredAt}</span>
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
