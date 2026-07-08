import { GitPullRequest, GitBranch, SearchCheck } from "lucide-react";
import type { PullRequest } from "@/lib/types";

interface PRRowProps {
  pr: PullRequest;
  onReviewTrigger?: (pr: PullRequest) => void;
}

export function PRRow({ pr, onReviewTrigger }: PRRowProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 md:p-4.5 md:px-6 rounded-lg border border-border/40 bg-foreground/[0.005] hover:bg-foreground/[0.015] hover:border-border/80 transition-all duration-300 group">
      <div className="flex items-start gap-4.5 min-w-0 flex-1 w-full">
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
            <div className="flex items-center gap-1 bg-foreground/[0.02] border border-border/40 rounded px-2 py-0.5 text-[11px] font-mono text-muted-foreground flex-wrap max-w-full">
              <GitBranch className="w-3 h-3 text-blue-400" />
              <span className="max-w-[80px] sm:max-w-[100px] truncate" title={pr.targetBranch}>
                {pr.targetBranch}
              </span>
              <span className="text-muted-foreground/40">←</span>
              <span
                className="max-w-[90px] sm:max-w-[120px] truncate font-medium text-foreground/80"
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

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={() => onReviewTrigger?.(pr)}
          className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-[#eca8d6]/10 to-[#eca8d6]/5 hover:from-[#eca8d6]/25 hover:to-[#eca8d6]/15 text-[#eca8d6] border border-[#eca8d6]/30 hover:border-[#eca8d6]/60 rounded-lg px-4.5 py-2 h-9 text-xs gap-2 transition-all duration-300 hover:shadow-[0_0_20px_-3px_rgba(236,168,214,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer font-medium tracking-wide group/btn"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#eca8d6] drop-shadow-[0_0_8px_rgba(236,168,214,0.2)]">
            Code Review
          </span>
          <SearchCheck className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:rotate-6" />
        </button>
      </div>
    </div>
  );
}

export default PRRow;
