import { GitPullRequest, GitBranch, ExternalLink, SearchCheck } from "lucide-react";
import type { PullRequest } from "@/lib/types";

interface PRRowProps {
  pr: PullRequest;
  onReviewTrigger?: (pr: PullRequest) => void;
}

export function PRRow({ pr, onReviewTrigger }: PRRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 p-4.5 px-6 rounded-lg border border-border/40 bg-foreground/[0.005] hover:bg-foreground/[0.015] hover:border-border/80 transition-all duration-300 group">
      <div className="flex items-start gap-4.5 min-w-0 flex-1">
        {/* Status Icon */}
        <div
          className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-300 ${
            pr.draft
              ? "bg-muted/30 border-muted text-muted-foreground"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-xs text-muted-foreground/60 font-mono">#{pr.number}</span>
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-sans font-medium text-foreground/90 tracking-tight hover:text-[#eca8d6] hover:underline transition-colors duration-200 truncate cursor-pointer"
            >
              {pr.title}
            </a>
            {pr.draft && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border bg-muted/20 text-muted-foreground border-muted/30 select-none">
                Draft
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
            {/* Branch visualization badge */}
            <div className="flex items-center gap-1 bg-foreground/[0.02] border border-border/40 rounded px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              <GitBranch className="w-3 h-3 text-blue-400" />
              <span className="max-w-[100px] truncate" title={pr.targetBranch}>
                {pr.targetBranch}
              </span>
              <span className="text-muted-foreground/40">←</span>
              <span
                className="max-w-[120px] truncate font-medium text-foreground/80"
                title={pr.sourceBranch}
              >
                {pr.sourceBranch}
              </span>
            </div>

            {/* Labels */}
            {pr.labels.map((lbl, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono border select-none ${lbl.color}`}
              >
                {lbl.name}
              </span>
            ))}

            <span className="text-[11px] text-muted-foreground/60 font-mono">
              opened {new Date(pr.createdAt).toLocaleDateString()} by {pr.author}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onReviewTrigger?.(pr)}
          className="flex items-center justify-center bg-[#eca8d6]/5 hover:bg-[#eca8d6]/15 text-[#eca8d6] border border-[#eca8d6]/20 rounded px-3 py-1.5 h-8.5 text-xs gap-1.5 transition-all duration-200 cursor-pointer"
        >
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
            Code Review
          </span>
          <SearchCheck className="w-3.5 h-3.5" />
        </button>

        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground border border-border/80 rounded px-3 py-1.5 h-8.5 text-xs gap-1.5 transition-all duration-200 cursor-pointer"
        >
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors duration-200">
            View PR
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#eca8d6] transition-colors" />
        </a>
      </div>
    </div>
  );
}

export default PRRow;
