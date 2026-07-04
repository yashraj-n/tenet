import Dockerode from "dockerode";
import crypto from "crypto";

let socketPath =
  process.env.DOCKER_SOCK_PATH && process.env.DOCKER_SOCK_PATH.trim() !== ""
    ? process.env.DOCKER_SOCK_PATH
    : "/var/run/docker.sock";

if (socketPath.startsWith("unix://")) {
  socketPath = socketPath.substring(7);
}

const docker = new Dockerode({ socketPath });

const IMAGE_NAME = "agent-pr-image";
const CONTAINER_PREFIX = "agent-pr-container";

export async function requestContainer(
  owner: string,
  repo: string,
  issueId: string,
  installationId: string,
) {
  const container = await docker.createContainer({
    Image: IMAGE_NAME,
    name: `${CONTAINER_PREFIX}-${crypto.randomUUID()}`,
    HostConfig: {
      RestartPolicy: {
        Name: "on-failure",
        MaximumRetryCount: 3,
      },
    },
    Env: [
      `REPO_NAME=${repo}`,
      `ISSUE_ID=${issueId}`,
      `OWNER_NAME=${owner}`,
      `INSTALLATION_ID=${installationId}`,
    ],
  });
  console.log(`Starting container ${container.id} for issue ${issueId} in repo ${owner}/${repo}`);
  await container.start();
}
