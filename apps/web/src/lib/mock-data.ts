export interface Issue {
  id: string;
  number: number;
  title: string;
  repoId: string;
  labels: Array<{ name: string; color: string }>;
  createdAt: string;
  author: string;
  body?: string;
}

export interface Repo {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  stars: number;
  language: string;
  openIssuesCount: number;
}

export interface Run {
  id: string;
  repoName: string;
  repoId: string;
  issueNumber: number;
  issueTitle: string;
  status: "queued" | "running" | "completed" | "failed";
  triggeredAt: string;
  duration: string;
  prLink?: string;
}

export const mockQuota = {
  used: 0,
  limit: 2,
};

export const mockRepos: Repo[] = [
  {
    id: "1",
    name: "aura-ai-agent",
    fullName: "yashraj-n/aura-ai-agent",
    description:
      "Autonomous AI software engineer that fixes codebase issues in sandbox environments.",
    stars: 42,
    language: "TypeScript",
    openIssuesCount: 2,
  },
  {
    id: "2",
    name: "fastify-trpc-demo",
    fullName: "yashraj-n/fastify-trpc-demo",
    description: "A boilerplate template demonstrating fastify server integrated with tRPC v11.",
    stars: 12,
    language: "TypeScript",
    openIssuesCount: 0,
  },
];

export const mockIssues: Issue[] = [
  {
    id: "issue-1",
    number: 101,
    title: "Fix memory leak in websocket connections",
    repoId: "1",
    labels: [
      { name: "bug", color: "bg-red-500/10 text-red-400 border-red-500/20" },
      { name: "high-priority", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    ],
    createdAt: "2 days ago",
    author: "yashrajn",
    body: "WS connection is not closed properly on route unmount.",
  },
  {
    id: "issue-2",
    number: 102,
    title: "Support custom model selection in settings screen",
    repoId: "1",
    labels: [{ name: "enhancement", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }],
    createdAt: "3 hours ago",
    author: "yashrajn",
    body: "User should be able to pick custom LLM provider.",
  },
];

export const mockRuns: Run[] = [
  {
    id: "run-1",
    repoName: "yashraj-n/aura-ai-agent",
    repoId: "1",
    issueNumber: 101,
    issueTitle: "Fix memory leak in websocket connections",
    status: "completed",
    triggeredAt: "10 mins ago",
    duration: "45s",
    prLink: "https://github.com/yashraj-n/aura-ai-agent/pull/102",
  },
];
