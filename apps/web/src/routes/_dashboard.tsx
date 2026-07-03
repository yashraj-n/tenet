import { useState } from "react";
import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Search, Plus, LogOut, ChevronRight, FolderGit2, Terminal } from "lucide-react";
import { mockRepos } from "@/lib/mock-data";
import { RepoItem } from "@/components/dashboard/repo-item";
import { QuotaBadge } from "@/components/dashboard/quota-badge";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRepos = mockRepos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isRunsActive = location.pathname === "/dashboard/runs";
  const isRepositoriesActive = location.pathname.startsWith("/dashboard") && !isRunsActive;

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-sans noise-overlay antialiased">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-card/60 backdrop-blur-xl border-b border-border z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="group flex items-center gap-2">
            <span className="font-display text-2xl tracking-tight text-foreground group-hover:text-[#eca8d6] transition-colors">
              TENET
            </span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <span>dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">repositories</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <QuotaBadge />

          <div className="h-6 w-px bg-border" />

          <Link
            to="/login"
            className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-full hover:bg-foreground/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </nav>

      {/* Main Body */}
      <div className="flex flex-1 pt-16 min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-[300px] bg-card/40 border-r border-border z-20 flex flex-col">
          {/* Sidebar Nav Links */}
          <div className="p-3 border-b border-border/60 space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors duration-200 ${
                isRepositoriesActive
                  ? "bg-foreground/[0.04] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Repositories</span>
            </Link>
            <Link
              to="/dashboard/runs"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors duration-200 ${
                isRunsActive
                  ? "bg-foreground/[0.04] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Runs History</span>
            </Link>
          </div>

          {/* Search container */}
          <div className="p-4 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Filter repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-[#eca8d6]/50 transition-all font-mono"
              />
            </div>
          </div>

          {/* Repos list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Installed Repositories ({filteredRepos.length})
              </span>
            </div>

            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => <RepoItem key={repo.id} repo={repo} />)
            ) : (
              <div className="text-center py-8 px-4">
                <p className="text-xs text-muted-foreground font-mono">No repositories found</p>
              </div>
            )}
          </div>

          {/* Install App CTA at bottom (subtle helper) */}
          <div className="p-4.5 border-t border-border/40 text-center bg-transparent">
            <span className="text-[11px] font-mono text-muted-foreground/60 block">
              Can't see your repository?
            </span>
            <a
              href="https://github.com/apps/tenet-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#eca8d6] hover:text-[#eca8d6]/80 hover:underline mt-1.5 transition-colors cursor-pointer"
            >
              Install GitHub App <Plus className="w-3 h-3" />
            </a>
          </div>
        </aside>

        {/* Content View */}
        <main className="pl-[300px] flex-1 min-h-full flex flex-col bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
