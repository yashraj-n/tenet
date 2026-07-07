import { App } from "octokit";
import { env } from "#/env";
import type { Repo } from "./types";

function getApp() {
  return new App({
    appId: env.APP_ID,
    privateKey: env.PRIVATE_KEY,
  });
}

export async function getInstalledRepos(page: number = 1, limit: number = 10) {
  const app = getApp();

  const { data: installations } = await app.octokit.rest.apps.listInstallations();

  const allRepos: Array<{ repo: any; installationId: number }> = [];
  const octokits: Record<number, any> = {};

  for (const installation of installations) {
    const octokit = await app.getInstallationOctokit(installation.id);
    octokits[installation.id] = octokit;
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    for (const repo of data.repositories) {
      allRepos.push({ repo, installationId: installation.id });
    }
  }

  const total = allRepos.length;
  const sliced = allRepos.slice((page - 1) * limit, page * limit);
  const items: Repo[] = [];

  for (const item of sliced) {
    const { repo, installationId } = item;
    const octokit = octokits[installationId];

    const { data: pullsSearch } = await octokit.rest.search.issuesAndPullRequests({
      q: `repo:${repo.full_name} is:pr state:open`,
      per_page: 1,
    });
    const { data: issuesSearch } = await octokit.rest.search.issuesAndPullRequests({
      q: `repo:${repo.full_name} is:issue state:open`,
      per_page: 1,
    });

    items.push({
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description ?? undefined,
      stars: repo.stargazers_count || 0,
      language: repo.language || "TypeScript",
      openIssuesCount: issuesSearch.total_count,
      openPullsCount: pullsSearch.total_count,
    });
  }

  return { items, total };
}

export async function getInstallationOctokitForRepo(owner: string, repo: string) {
  const app = getApp();
  const { data: installation } = await app.octokit.rest.apps.getRepoInstallation({
    owner,
    repo,
  });
  return app.getInstallationOctokit(installation.id);
}
