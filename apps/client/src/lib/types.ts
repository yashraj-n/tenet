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
