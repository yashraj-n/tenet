import { useState, useEffect } from "react";
import { createFileRoute, Outlet, Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  Search,
  Plus,
  LogOut,
  ChevronRight,
  FolderGit2,
  Terminal,
  Settings,
  Loader2,
  Mail,
  Bug,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../integrations/trpc/react";
import { RepoItem } from "@/components/dashboard/repo-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "#/lib/auth-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function UserNav() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const defaultQuota = { limit: 2, used: 0, resetAt: null as string | null };
  const [quota, setQuota] = useState(defaultQuota);

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem("tenet_quota");
      if (stored) {
        setQuota(JSON.parse(stored));
      } else {
        setQuota(defaultQuota);
      }
    };

    handleUpdate();
    window.addEventListener("tenet_quota_update", handleUpdate);
    return () => window.removeEventListener("tenet_quota_update", handleUpdate);
  }, []);

  const getResetTimeStr = () => {
    if (!quota.resetAt) return "Resets in 2 days";
    const nextReset = new Date(quota.resetAt).getTime() + 2 * 24 * 60 * 60 * 1000;
    const diffMs = nextReset - Date.now();
    if (diffMs <= 0) return "Resets soon";
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHours >= 24) {
      const diffDays = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `Resets in ${diffDays}d ${remainingHours}h`;
    }
    return `Resets in ${diffHours}h`;
  };

  if (isPending) {
    return <div className="h-9 w-9 rounded-full bg-foreground/10 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-full hover:bg-foreground/5"
      >
        Sign In
      </Link>
    );
  }

  const handleSignOut = async () => {
    await authClient.signOut();
    router.navigate({ to: "/login" });
  };

  const initial = session.user.name?.charAt(0).toUpperCase() || "U";
  const limit = quota.limit || 2;
  const used = quota.used || 0;
  const remaining = Math.max(0, limit - used);
  const percentage = Math.max(0, Math.min(1, remaining / limit));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 rounded-full cursor-pointer focus:outline-none flex items-center justify-center group">
          {/* Circular Progress Ring */}
          <svg className="absolute inset-0 size-full -rotate-90">
            {/* Track */}
            <circle cx="18" cy="18" r="15" className="stroke-border/40 fill-none stroke-[2]" />
            {/* Indicator */}
            <circle
              cx="18"
              cy="18"
              r="15"
              className={`fill-none stroke-[2] transition-all duration-300 ${
                remaining === 0 ? "stroke-red-400/80" : "stroke-emerald-400"
              }`}
              strokeDasharray={94.2}
              strokeDashoffset={94.2 * (1 - percentage)}
            />
          </svg>

          {/* Avatar (inset inside the ring) */}
          <Avatar className="h-7 w-7">
            {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
            <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground/80 flex items-center justify-center">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-foreground">
                {session.user.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
            </div>

            {/* Runs left display */}
            <div className="pt-1.5 border-t border-border/40 space-y-1 text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Runs remaining:</span>
                <span
                  className={`font-semibold ${remaining === 0 ? "text-red-400" : "text-emerald-400"}`}
                >
                  {remaining} / {limit}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground/60 text-right">
                {getResetTimeStr()}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="mailto:tenet@yashrajn.com" className="cursor-pointer flex items-center w-full">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground/80" />
            <span>Contact Us</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://github.com/yashraj-n/aura-ai-agent/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer flex items-center w-full"
          >
            <Bug className="mr-2 h-4 w-4 text-muted-foreground/80" />
            <span>Report Bug</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-400 focus:text-red-400 cursor-pointer flex items-center"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [reposPage, setReposPage] = useState(1);
  const trpc = useTRPC();
  const router = useRouter();

  const { data: reposData, isLoading } = useQuery(
    trpc.getRepos.queryOptions({ page: reposPage, limit: 7 }),
  );
  const repos = reposData?.items || [];
  const totalRepos = reposData?.total || 0;
  const totalReposPages = Math.ceil(totalRepos / 7);

  const match = location.pathname.match(/^\/dashboard\/([^/]+)/);
  const repoId = match && match[1] !== "runs" && match[1] !== "settings" ? match[1] : null;

  const { data: activeRepo } = useQuery({
    ...trpc.getRepo.queryOptions({ repoId: repoId || "" }),
    enabled: !!repoId,
  }) as any;

  const { data: quotaData } = useQuery(trpc.getQuota.queryOptions());
  const { data: activeConfigs = [], isLoading: isLoadingConfigs } = useQuery(
    trpc.getProviderConfigs.queryOptions(),
  );

  const hasAnyConfigured = activeConfigs.some((c: any) => c.hasKey);

  useEffect(() => {
    if (!isLoadingConfigs && !hasAnyConfigured && location.pathname !== "/dashboard/settings") {
      router.navigate({ to: "/dashboard/settings" });
      toast.error("Please configure an LLM provider key to get started.");
    }
  }, [hasAnyConfigured, isLoadingConfigs, location.pathname, router]);

  useEffect(() => {
    if (quotaData) {
      localStorage.setItem(
        "tenet_quota",
        JSON.stringify({
          limit: quotaData.maxQuota,
          used: quotaData.quotaUsed,
          resetAt: quotaData.quotaResetAt,
        }),
      );
      window.dispatchEvent(new Event("tenet_quota_update"));
    }
  }, [quotaData]);

  const filteredRepos = repos.filter((repo: any) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isRunsActive = location.pathname === "/dashboard/runs";
  const isSettingsActive = location.pathname === "/dashboard/settings";
  const isRepositoriesActive =
    location.pathname.startsWith("/dashboard") && !isRunsActive && !isSettingsActive;

  const getBreadcrumbs = () => {
    const parts = [{ label: "dashboard", href: "/dashboard" }];

    if (isRunsActive) {
      parts.push({ label: "runs", href: "/dashboard/runs" });
    } else if (isSettingsActive) {
      parts.push({ label: "settings", href: "/dashboard/settings" });
    } else if (isRepositoriesActive) {
      if (repoId) {
        parts.push({ label: "repos", href: "/dashboard" });
        parts.push({
          label: activeRepo ? activeRepo.name : repoId,
          href: `/dashboard/${repoId}`,
        });
      } else {
        parts.push({ label: "repos", href: "/dashboard" });
      }
    }

    return parts;
  };

  const breadcrumbs = getBreadcrumbs();

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
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            {breadcrumbs.map((part, index) => (
              <span key={index} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/35" />}
                <Link
                  to={part.href}
                  className={cn(
                    "transition-colors hover:text-foreground cursor-pointer",
                    index === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {part.label}
                </Link>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <UserNav />
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
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors duration-200",
                isRepositoriesActive
                  ? "bg-foreground/[0.04] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]",
                !hasAnyConfigured && "pointer-events-none opacity-30 select-none",
              )}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Repositories</span>
            </Link>
            <Link
              to="/dashboard/runs"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors duration-200",
                isRunsActive
                  ? "bg-foreground/[0.04] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]",
                !hasAnyConfigured && "pointer-events-none opacity-30 select-none",
              )}
            >
              <Terminal className="w-4 h-4" />
              <span>Runs History</span>
            </Link>
            <Link
              to="/dashboard/settings"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors duration-200 ${
                isSettingsActive
                  ? "bg-foreground/[0.04] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Model Settings</span>
            </Link>
          </div>

          {/* Search container */}
          <div
            className={cn(
              "p-4 border-b border-border/60",
              !hasAnyConfigured && "pointer-events-none opacity-30 select-none",
            )}
          >
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-[#eca8d6]/50 transition-all font-mono"
              />
            </div>
          </div>

          {/* Repos list */}
          <div
            className={cn(
              "flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none",
              !hasAnyConfigured && "pointer-events-none opacity-30 select-none",
            )}
          >
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Installed Repositories {isLoading ? "" : `(${filteredRepos.length})`}
              </span>
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2 px-3 py-4">
                <div className="h-10 bg-foreground/[0.03] border border-border/20 rounded-lg animate-pulse" />
                <div className="h-10 bg-foreground/[0.03] border border-border/20 rounded-lg animate-pulse" />
                <div className="h-10 bg-foreground/[0.03] border border-border/20 rounded-lg animate-pulse" />
              </div>
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo: any) => <RepoItem key={repo.id} repo={repo} />)
            ) : (
              <div className="text-center py-8 px-4">
                <p className="text-xs text-muted-foreground font-mono">No repositories found</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalReposPages > 1 && (
              <div className="px-3 py-2 flex items-center justify-between border-t border-border/20 mt-3 text-[10px] font-mono text-muted-foreground select-none">
                <button
                  onClick={() => setReposPage((p) => Math.max(1, p - 1))}
                  disabled={reposPage === 1}
                  className="hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  &lt; prev
                </button>
                <span>
                  page {reposPage} / {totalReposPages}
                </span>
                <button
                  onClick={() => setReposPage((p) => Math.min(totalReposPages, p + 1))}
                  disabled={reposPage === totalReposPages}
                  className="hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  next &gt;
                </button>
              </div>
            )}
          </div>

          {/* Install App CTA at bottom (subtle helper) */}
          <div className="p-4.5 border-t border-border/40 text-center bg-transparent">
            <span className="text-[11px] font-mono text-muted-foreground/60 block">
              Can't see your repository?
            </span>
            <a
              href="https://github.com/apps/tenet-ai-agent"
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
