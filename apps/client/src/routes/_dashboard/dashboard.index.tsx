import { createFileRoute } from "@tanstack/react-router";
import { FolderGit2, AlertCircle, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../../integrations/trpc/react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_dashboard/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const defaultQuota = { limit: 2, used: 0 };
  const [quota, setQuota] = useState(defaultQuota);
  const trpc = useTRPC();
  const { data: reposData } = useQuery(trpc.getRepos.queryOptions({ page: 1, limit: 1000 }));
  const repos = reposData?.items || [];
  const totalRepos = reposData?.total || 0;

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem("tenet_quota");
      if (stored) {
        setQuota(JSON.parse(stored));
      }
    };
    handleUpdate();
    window.addEventListener("tenet_quota_update", handleUpdate);
    return () => window.removeEventListener("tenet_quota_update", handleUpdate);
  }, []);

  const totalIssues = repos.reduce((sum: number, repo: any) => sum + repo.openIssuesCount, 0);
  const remainingQuota = quota.limit - quota.used;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 select-none relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#eca8d6]/[0.015] blur-[100px] pointer-events-none" />

      <div className="max-w-xl text-center space-y-8 relative z-10">
        {/* Animated Icon header */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#eca8d6] to-[#a78bfa] rounded-full blur-md opacity-25 group-hover:opacity-45 transition duration-1000" />
            <div className="relative w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#eca8d6]" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h2 className="font-display text-4xl italic text-foreground tracking-tight">
            Welcome to Tenet
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Tenet acts as an autonomous developer, resolving issues in secure sandbox environments.
            Select a repository to begin.
          </p>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-card border border-border/80 rounded-xl p-4 text-center">
            <FolderGit2 className="w-4 h-4 text-muted-foreground/60 mx-auto mb-1.5" />
            <span className="text-2xl font-display text-foreground block leading-none mb-1">
              {totalRepos}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Repos</span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 text-center">
            <AlertCircle className="w-4 h-4 text-[#eca8d6] mx-auto mb-1.5" />
            <span className="text-2xl font-display text-foreground block leading-none mb-1">
              {totalIssues}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              Open Issues
            </span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 text-center">
            <Sparkles className="w-4 h-4 text-[#a78bfa] mx-auto mb-1.5" />
            <span className="text-2xl font-display text-foreground block leading-none mb-1">
              {remainingQuota}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Runs Left</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-xl border border-border/60 bg-foreground/[0.01] max-w-md mx-auto text-left">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">
            Getting Started
          </span>
          <ol className="text-xs text-muted-foreground space-y-2 font-mono list-decimal pl-4">
            <li>Select an installed repository from the left sidebar list.</li>
            <li>Locate the target issue that requires fixing.</li>
            <li>Click the "Build" button to trigger the autonomous solver.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
export default DashboardIndex;
