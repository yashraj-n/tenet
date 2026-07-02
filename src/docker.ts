import Dockerode from "dockerode";
import crypto from "crypto";

const docker = new Dockerode();
const IMAGE_NAME = "agent-pr-image";
const CONTAINER_PREFIX = "agent-pr-container";

export async function requestContainer(owner: string, repo: string, issueId: string, installationId: string) {
  const container = await docker.createContainer({
    Image: IMAGE_NAME,
    name: `${CONTAINER_PREFIX}-${crypto.randomUUID()}`,
    HostConfig: {
      RestartPolicy: {
        Name: "on-failure",
        MaximumRetryCount: 3,
      },
    },
    Env: [`REPO_NAME=${repo}`, `ISSUE_ID=${issueId}`, `OWNER_NAME=${owner}`, `INSTALLATION_ID=${installationId}`],
  });

  await container.start();
}
