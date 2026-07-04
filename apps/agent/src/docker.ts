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
      ...(process.env.APP_ID ? [`APP_ID=${process.env.APP_ID}`] : []),
      ...(process.env.PRIVATE_KEY ? [`PRIVATE_KEY=${process.env.PRIVATE_KEY}`] : []),
      ...(process.env.LLM_MODEL ? [`LLM_MODEL=${process.env.LLM_MODEL}`] : []),
      ...(process.env.GEMINI_API_KEY ? [`GEMINI_API_KEY=${process.env.GEMINI_API_KEY}`] : []),
      ...(process.env.OPENAI_API_KEY ? [`OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`] : []),
      ...(process.env.ANTHROPIC_API_KEY
        ? [`ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`]
        : []),
      ...(process.env.COHERE_API_KEY ? [`COHERE_API_KEY=${process.env.COHERE_API_KEY}`] : []),
      ...(process.env.MISTRAL_API_KEY ? [`MISTRAL_API_KEY=${process.env.MISTRAL_API_KEY}`] : []),
      ...(process.env.OPENROUTER_API_KEY
        ? [`OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY}`]
        : []),
      ...(process.env.LANGCHAIN_TRACING_V2
        ? [`LANGCHAIN_TRACING_V2=${process.env.LANGCHAIN_TRACING_V2}`]
        : []),
      ...(process.env.LANGCHAIN_API_KEY
        ? [`LANGCHAIN_API_KEY=${process.env.LANGCHAIN_API_KEY}`]
        : []),
      ...(process.env.LANGCHAIN_PROJECT
        ? [`LANGCHAIN_PROJECT=${process.env.LANGCHAIN_PROJECT}`]
        : []),
    ],
  });
  console.log(`Starting container ${container.id} for issue ${issueId} in repo ${owner}/${repo}`);
  await container.start();
}
