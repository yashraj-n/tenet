import { useState } from "react";
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import {
  FolderGit2,
  Star,
  GitBranch,
  Github,
  AlertCircle,
  CheckCircle,
  Search,
  ArrowLeft,
  GitPullRequest,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { IssueRow } from "@/components/dashboard/issue-row";
import { PRRow } from "@/components/dashboard/pr-row";
import { BuildModal } from "@/components/dashboard/build-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTRPC } from "../../integrations/trpc/react";
import type { Issue } from "@/lib/types";

export const Route = createFileRoute("/_dashboard/dashboard/$repoId")({
  component: RepoDetail,
});

function RepoDetail() {
  const { repoId } = useParams({ from: "/_dashboard/dashboard/$repoId" });
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isBuildOpen, setIsBuildOpen] = useState(false);
  const [issueFilter, setIssueFilter] = useState("");

  const trpc = useTRPC();
  const { data: repos, isLoading: isLoadingRepos } = useQuery(trpc.getRepos.queryOptions());
  const repo = repos?.find((r: any) => r.id === repoId);

  const [owner, name] = repo ? repo.fullName.split("/") : ["", ""];
  const { data: issues = [], isLoading: isLoadingIssues } = useQuery({
    ...trpc.getIssues.queryOptions({ owner, repo: name }),
    enabled: !!repo,
  });

  const { data: pulls = [], isLoading: isLoadingPulls } = useQuery({
    ...trpc.getPullRequests.queryOptions({ owner, repo: name }),
    enabled: !!repo,
  });

  const handleBuildTrigger = (issue: any) => {
    setSelectedIssue(issue);
    setIsBuildOpen(true);
  };

  if (isLoadingRepos) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
        <div className="w-8 h-8 border-2 border-foreground/10 border-t-foreground/80 rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-muted-foreground">Loading repository...</p>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <h3 className="text-lg font-display text-foreground mb-1">Repository Not Found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The requested repository does not exist.
        </p>
        <Link to="/dashboard" className="text-xs font-mono text-[#eca8d6] hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const repoIssues = issues.filter(
    (iss: any) =>
      iss.title.toLowerCase().includes(issueFilter.toLowerCase()) ||
      String(iss.number).includes(issueFilter),
  );

  const repoPulls = pulls.filter(
    (pr: any) =>
      pr.title.toLowerCase().includes(issueFilter.toLowerCase()) ||
      String(pr.number).includes(issueFilter),
  );

  return (
    <div className="flex-1 flex flex-col p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-8">
      {/* Mobile back trigger */}
      <Link
        to="/dashboard"
        className="inline-flex sm:hidden items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to list
      </Link>

      {/* Repository Header Card */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-border pb-8">
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-foreground/[0.02] border border-border flex items-center justify-center text-muted-foreground">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <a
                href={`https://github.com/${repo.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-3xl font-display font-medium text-foreground hover:text-[#eca8d6] transition-colors"
              >
                {repo.name}
                <Github className="w-4 h-4 text-muted-foreground group-hover:text-[#eca8d6] opacity-0 group-hover:opacity-100 transition-all" />
              </a>
              <span className="text-xs text-muted-foreground font-mono">{repo.fullName}</span>
            </div>
          </div>

          {repo.description && (
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {repo.description}
            </p>
          )}

          {/* Quick stats tags */}
          <div className="flex flex-wrap gap-4 pt-1.5 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/10" />
              <span>{repo.stars} stars</span>
            </div>
            <div className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span>main branch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="issues" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <TabsList className="bg-foreground/[0.02] border border-border/60">
            <TabsTrigger value="issues" className="gap-2 px-4 py-1.5 text-xs font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Issues</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-foreground/5 text-[10px]">
                {issues.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pulls" className="gap-2 px-4 py-1.5 text-xs font-mono">
              <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pull Requests</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-foreground/5 text-[10px]">
                {pulls.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Search filter in detail view */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search by title or number..."
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="w-full bg-foreground/[0.01] border border-border/80 rounded-full pl-8 pr-4 py-1.5 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-[#eca8d6]/50 transition-all font-mono"
            />
          </div>
        </div>

        <TabsContent value="issues" className="space-y-4 outline-none">
          {isLoadingIssues ? (
            <div className="flex flex-col items-center justify-center py-20 select-none">
              <div className="w-8 h-8 border-2 border-foreground/10 border-t-foreground/80 rounded-full animate-spin mb-3" />
              <p className="text-xs font-mono text-muted-foreground animate-pulse">
                Fetching issues from GitHub...
              </p>
            </div>
          ) : repoIssues.length > 0 ? (
            <div className="flex flex-col gap-3">
              {repoIssues.map((issue: any) => (
                <IssueRow key={issue.id} issue={issue} onBuildTrigger={handleBuildTrigger} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-2xl bg-foreground/[0.005] select-none text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400/80 mb-3" />
              <h4 className="text-sm font-sans font-medium text-foreground">All Caught Up!</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                No open issues match your filter.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pulls" className="space-y-4 outline-none">
          {isLoadingPulls ? (
            <div className="flex flex-col items-center justify-center py-20 select-none">
              <div className="w-8 h-8 border-2 border-foreground/10 border-t-foreground/80 rounded-full animate-spin mb-3" />
              <p className="text-xs font-mono text-muted-foreground animate-pulse">
                Fetching pull requests from GitHub...
              </p>
            </div>
          ) : repoPulls.length > 0 ? (
            <div className="flex flex-col gap-3">
              {repoPulls.map((pr: any) => (
                <PRRow key={pr.id} pr={pr} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-2xl bg-foreground/[0.005] select-none text-center">
              <GitPullRequest className="w-10 h-10 text-[#eca8d6]/80 mb-3" />
              <h4 className="text-sm font-sans font-medium text-foreground">No Pull Requests</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                No open pull requests match your filter.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Solver trigger modal overlay */}
      <BuildModal
        issue={selectedIssue}
        isOpen={isBuildOpen}
        onClose={() => {
          setIsBuildOpen(false);
          setSelectedIssue(null);
        }}
      />
    </div>
  );
}
export default RepoDetail;
