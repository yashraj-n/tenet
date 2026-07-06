import type { ReviewResult } from "./review-result";

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
  openPullsCount: number;
}

export interface Run {
  id: string;
  userId: string;
  mode: "issue_build" | "pr_review";
  repoOwner: string;
  repoName: string;
  issueNumber?: number | null;
  issueTitle?: string | null;
  prNumber?: number | null;
  prTitle?: string | null;
  reviewJson?: ReviewResult | null;
  status: "queued" | "running" | "completed" | "failed";
  executionName?: string | null;
  prLink?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  repoId: string;
  labels: Array<{ name: string; color: string }>;
  createdAt: string;
  author: string;
  draft: boolean;
  sourceBranch: string;
  targetBranch: string;
  url: string;
}
