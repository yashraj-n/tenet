import { App } from "octokit";
import { env } from "#/env";
import type { Repo } from "./types";

function getApp() {
  return new App({
    appId: env.APP_ID,
    privateKey: env.PRIVATE_KEY,
  });
}

export async function getInstalledRepos() {
  const app = getApp();

  const { data: installations } = await app.octokit.rest.apps.listInstallations();

  const repos: Repo[] = [];

  for (const installation of installations) {
    const octokit = await app.getInstallationOctokit(installation.id);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    for (const repo of data.repositories) {
      const { data: pullsSearch } = await octokit.rest.search.issuesAndPullRequests({
        q: `repo:${repo.full_name} is:pr state:open`,
        per_page: 1,
      });
      const { data: issuesSearch } = await octokit.rest.search.issuesAndPullRequests({
        q: `repo:${repo.full_name} is:issue state:open`,
        per_page: 1,
      });

      repos.push({
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
  }

  return repos;
}

export async function getInstallationOctokitForRepo(owner: string, repo: string) {
  const app = getApp();
  const { data: installation } = await app.octokit.rest.apps.getRepoInstallation({
    owner,
    repo,
  });
  return app.getInstallationOctokit(installation.id);
}
