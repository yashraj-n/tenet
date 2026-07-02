FROM oven/bun:1 AS base
WORKDIR /app

RUN apt-get update && \
    apt-get install -y git ripgrep && \
    rm -rf /var/lib/apt/lists/*

FROM base AS install
RUN mkdir -p /temp/pkg
COPY package.json bun.lock /temp/pkg/
RUN cd /temp/pkg && bun install --frozen-lockfile --production

FROM base AS release


COPY --from=install /temp/pkg/node_modules node_modules
COPY . .


USER bun
ENTRYPOINT [ "bun", "run", "start" ]