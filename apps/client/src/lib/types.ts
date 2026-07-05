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
  userId: string;
  repoOwner: string;
  repoName: string;
  issueNumber: number;
  issueTitle: string;
  status: "queued" | "running" | "completed" | "failed";
  executionName?: string | null;
  prLink?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}
