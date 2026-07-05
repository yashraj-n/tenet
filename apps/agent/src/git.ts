import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function cloneGitRepo(
  repoOwner: string,
  repoName: string,
  targetDir: string,
  username: string,
  password: string,
): Promise<void> {
  await execAsync(
    `git clone https://${username}:${password}@github.com/${repoOwner}/${repoName}.git ${targetDir}`,
  );
}
