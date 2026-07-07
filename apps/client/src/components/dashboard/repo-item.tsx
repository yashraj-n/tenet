import { Link } from "@tanstack/react-router";
import { FolderGit2, Star } from "lucide-react";
import type { Repo } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "../../integrations/trpc/react";

interface RepoItemProps {
  repo: Repo;
}

export function RepoItem({ repo }: RepoItemProps) {
  const languageColorMap: Record<string, string> = {
    TypeScript: "bg-blue-400",
    JavaScript: "bg-yellow-400",
    Python: "bg-green-400",
    Go: "bg-cyan-400",
  };

  const dotColor = languageColorMap[repo.language] || "bg-gray-400";
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    const [owner, name] = repo.fullName.split("/");
    if (owner && name) {
      queryClient.prefetchQuery(trpc.getIssues.queryOptions({ owner, repo: name }));
      queryClient.prefetchQuery(trpc.getPullRequests.queryOptions({ owner, repo: name }));
    }
  };

  return (
    <Link
      to="/dashboard/$repoId"
      params={{ repoId: repo.id }}
      onMouseEnter={handleMouseEnter}
      className="group flex flex-col gap-1.5 p-4 rounded-lg border border-transparent border-l-2 border-l-transparent hover:border-l-[#eca8d6]/30 hover:bg-foreground/[0.02] hover:border-border/40 hover:translate-x-0.5 active:bg-foreground/[0.04] transition-all duration-200 select-none cursor-pointer"
      activeProps={{
        className: "bg-foreground/[0.04]! border-border/80! shadow-sm shadow-black/10",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <FolderGit2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="truncate text-sm font-sans tracking-tight">{repo.name}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
          <Star className="w-3 h-3 text-amber-400/80 fill-amber-400/20" />
          {repo.stars}
        </div>
      </div>

      {repo.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {repo.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          {repo.language}
        </div>
        {repo.openIssuesCount > 0 && (
          <div className="flex items-center gap-1 text-[#eca8d6]">
            <span>{repo.openIssuesCount} issues</span>
          </div>
        )}
        {repo.openPullsCount > 0 && (
          <div className="flex items-center gap-1 text-emerald-400">
            <span>{repo.openPullsCount} PRs</span>
          </div>
        )}
      </div>
    </Link>
  );
}
export default RepoItem;
