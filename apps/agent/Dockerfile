FROM oven/bun:1 AS base
WORKDIR /app

RUN apt-get update && \
    apt-get install -y git ripgrep && \
    rm -rf /var/lib/apt/lists/*

FROM base AS install
RUN mkdir -p /temp/pkg/apps/agent /temp/pkg/apps/client
COPY package.json bun.lock /temp/pkg/
COPY apps/agent/package.json /temp/pkg/apps/agent/
COPY apps/client/package.json /temp/pkg/apps/client/
RUN cd /temp/pkg && bun install --frozen-lockfile --production

FROM base AS release

RUN groupadd -g 2000 agent-sandbox && \
    useradd -u 2000 -g 2000 -m -s /bin/bash agent-sandbox

RUN mkdir -p /workspace && \
    chown agent-sandbox:agent-sandbox /workspace

COPY apps/agent /app/apps/agent
COPY --from=install /temp/pkg /app

RUN chown -R root:root /app
RUN chown -R agent-sandbox:agent-sandbox /tmp

WORKDIR /app/apps/agent
USER root
ENTRYPOINT [ "bun", "run", "start" ]