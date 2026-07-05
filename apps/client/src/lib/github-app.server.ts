import { App } from "octokit";
import { env } from "#/env";

function getApp() {
  return new App({
    appId: env.APP_ID,
    privateKey: env.PRIVATE_KEY,
  });
}

export async function getInstalledRepos() {
  const app = getApp();

  const { data: installations } = await app.octokit.rest.apps.listInstallations();

  const repos: Array<{
    id: string;
    name: string;
    fullName: string;
    description?: string;
    stars: number;
    language: string;
    openIssuesCount: number;
  }> = [];

  for (const installation of installations) {
    const octokit = await app.getInstallationOctokit(installation.id);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    for (const repo of data.repositories) {
      repos.push({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description ?? undefined,
        stars: repo.stargazers_count || 0,
        language: repo.language || "TypeScript",
        openIssuesCount: repo.open_issues_count || 0,
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
