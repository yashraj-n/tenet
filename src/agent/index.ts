import { App } from "octokit";

const repoName = process.env.REPO_NAME;
const issueId = process.env.ISSUE_ID;
const ownerName = process.env.OWNER_NAME;


const app = new App({
  appId: process.env.APP_ID!,
  privateKey: process.env.PRIVATE_KEY!,
});

const octokit = await app.getInstallationOctokit(parseInt(process.env.INSTALLATION_ID!));
const { data: issue } = await octokit.rest.issues.get({
  owner: process.env.OWNER_NAME!,
  repo: process.env.REPO_NAME!,
  issue_number: parseInt(process.env.ISSUE_ID!),
});

console.log(`Repo Name: ${repoName}`);
console.log(`Issue ID: ${issueId}`);
console.log(`Owner Name: ${ownerName}`);
console.log(`Issue Title: ${issue.title}`);
console.log(`Issue Body: ${issue.body}`);




const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

while (true) {
  await sleep(1000000);
}
