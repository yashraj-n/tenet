import { App } from "octokit";
import { env } from "#/env";
import type { Repo } from "./types";

const REPOS_CACHE_TTL_MS = 60_000;

type InstalledRepo = { repo: any; installationId: number };

let app: App | undefined;
let installedReposCache: { expiresAt: number; entries: InstalledRepo[] } | undefined;
const installationOctokitCache = new Map<number, Promise<any>>();
const repoCountsCache = new Map<
  string,
  { expiresAt: number; counts: { issues: number; pulls: number } }
>();

function getApp() {
  app ??= new App({
    appId: env.APP_ID,
    privateKey: env.PRIVATE_KEY,
  });
  return app;
}

function getInstallationOctokit(app: App, installationId: number) {
  let octokit = installationOctokitCache.get(installationId);
  if (!octokit) {
    octokit = app.getInstallationOctokit(installationId);
    installationOctokitCache.set(installationId, octokit);
  }
  return octokit;
}

function toRepo(repo: any, counts?: { issues: number; pulls: number }): Repo {
  return {
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description ?? undefined,
    stars: repo.stargazers_count || 0,
    language: repo.language || "TypeScript",
    openIssuesCount: counts?.issues ?? repo.open_issues_count ?? 0,
    openPullsCount: counts?.pulls ?? 0,
  };
}

async function getInstalledRepoEntries() {
  if (installedReposCache && installedReposCache.expiresAt > Date.now()) {
    return installedReposCache.entries;
  }

  const app = getApp();
  const { data: installations } = await app.octokit.rest.apps.listInstallations();

  const reposByInstallation = await Promise.all(
    installations.map(async (installation) => {
      const octokit = await getInstallationOctokit(app, installation.id);
      const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });

      return data.repositories.map((repo) => ({ repo, installationId: installation.id }));
    }),
  );

  const entries = reposByInstallation.flat();
  installedReposCache = { entries, expiresAt: Date.now() + REPOS_CACHE_TTL_MS };
  return entries;
}

async function getRepoCounts(octokit: any, fullName: string) {
  const cached = repoCountsCache.get(fullName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.counts;
  }

  const [issuesSearch, pullsSearch] = await Promise.all([
    octokit.rest.search.issuesAndPullRequests({
      q: `repo:${fullName} is:issue state:open`,
      per_page: 1,
    }),
    octokit.rest.search.issuesAndPullRequests({
      q: `repo:${fullName} is:pr state:open`,
      per_page: 1,
    }),
  ]);

  const counts = {
    issues: issuesSearch.data.total_count,
    pulls: pullsSearch.data.total_count,
  };
  repoCountsCache.set(fullName, { counts, expiresAt: Date.now() + REPOS_CACHE_TTL_MS });
  return counts;
}

export async function getInstalledRepos(page: number = 1, limit: number = 10) {
  const allRepos = await getInstalledRepoEntries();
  const total = allRepos.length;
  const items = allRepos.slice((page - 1) * limit, page * limit).map(({ repo }) => toRepo(repo));

  return { items, total };
}

export async function getInstallationOctokitForRepo(owner: string, repo: string) {
  const app = getApp();
  const fullName = `${owner}/${repo}`.toLowerCase();
  const cachedRepo = (await getInstalledRepoEntries()).find(
    (item) => item.repo.full_name.toLowerCase() === fullName,
  );

  if (cachedRepo) {
    return getInstallationOctokit(app, cachedRepo.installationId);
  }

  const { data: installation } = await app.octokit.rest.apps.getRepoInstallation({
    owner,
    repo,
  });
  return getInstallationOctokit(app, installation.id);
}

export async function getRepo(repoId: string) {
  const app = getApp();
  const matched = (await getInstalledRepoEntries()).find((item) => String(item.repo.id) === repoId);
  if (!matched) return null;

  const octokit = await getInstallationOctokit(app, matched.installationId);
  const counts = await getRepoCounts(octokit, matched.repo.full_name);

  return toRepo(matched.repo, counts);
}

export async function getDashboardStats() {
  const repos = await getInstalledRepoEntries();

  return {
    totalRepos: repos.length,
    totalIssues: repos.reduce((sum, { repo }) => sum + (repo.open_issues_count || 0), 0),
  };
}
