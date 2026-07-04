import Dockerode from "dockerode";
import crypto from "crypto";
import { env } from "./env";

let socketPath =
  env.DOCKER_SOCK_PATH && env.DOCKER_SOCK_PATH.trim() !== ""
    ? env.DOCKER_SOCK_PATH
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
  const containerApiKey =
    env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.COHERE_API_KEY ||
    process.env.MISTRAL_API_KEY ||
    process.env.OPENROUTER_API_KEY;

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
      ...(env.APP_ID ? [`APP_ID=${env.APP_ID}`] : []),
      ...(env.PRIVATE_KEY ? [`PRIVATE_KEY=${env.PRIVATE_KEY}`] : []),
      ...(env.LLM_MODEL ? [`LLM_MODEL=${env.LLM_MODEL}`] : []),
      ...(containerApiKey ? [`LLM_API_KEY=${containerApiKey}`] : []),
      ...(env.LANGCHAIN_TRACING_V2 ? [`LANGCHAIN_TRACING_V2=${env.LANGCHAIN_TRACING_V2}`] : []),
      ...(env.LANGCHAIN_API_KEY ? [`LANGCHAIN_API_KEY=${env.LANGCHAIN_API_KEY}`] : []),
      ...(env.LANGCHAIN_PROJECT ? [`LANGCHAIN_PROJECT=${env.LANGCHAIN_PROJECT}`] : []),
    ],
  });
  console.log(`Starting container ${container.id} for issue ${issueId} in repo ${owner}/${repo}`);
  await container.start();
}
