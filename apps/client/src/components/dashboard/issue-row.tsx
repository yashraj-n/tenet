import { Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Issue } from "@/lib/types";

interface IssueRowProps {
  issue: Issue;
  onBuildTrigger: (issue: Issue) => void;
}

export function IssueRow({ issue, onBuildTrigger }: IssueRowProps) {
  const githubLink = `https://github.com/${issue.repoId}/issues/${issue.number}`;

  return (
    <div className="flex items-center justify-between gap-6 p-4.5 px-6 rounded-lg border border-border/40 bg-foreground/[0.005] hover:bg-foreground/[0.015] hover:border-border/80 transition-all duration-300 group">
      <div className="flex items-start gap-4.5 min-w-0 flex-1">
        {/* Status Icon */}
        <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-colors duration-300">
          <AlertCircle className="w-4 h-4" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 font-mono">#{issue.number}</span>
            <a
              href={githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-sans font-medium text-foreground/90 tracking-tight hover:text-[#eca8d6] hover:underline transition-colors duration-200 truncate cursor-pointer"
            >
              {issue.title}
            </a>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {issue.labels.map((lbl, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono border select-none ${lbl.color}`}
              >
                {lbl.name}
              </span>
            ))}
            <span className="text-[11px] text-muted-foreground/60 font-mono ml-1">
              opened {new Date(issue.createdAt).toLocaleDateString()} by {issue.author}
            </span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        className="bg-foreground/[0.02] hover:bg-foreground/[0.08] text-foreground border border-border/80 px-4.5 h-8.5 gap-1.5 shrink-0 transition-colors duration-200 cursor-pointer group"
        onClick={() => onBuildTrigger(issue)}
      >
        <Play className="w-2.5 h-2.5 fill-[#eca8d6] text-[#eca8d6] transition-transform duration-200" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors duration-200">
          Build
        </span>
      </Button>
    </div>
  );
}
export default IssueRow;
