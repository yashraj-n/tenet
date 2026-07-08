FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/pkg
COPY package.json /temp/pkg/package.json

RUN cd /temp/pkg && bun install --production

FROM base AS release
COPY . /app/apps/bot
COPY --from=install /temp/pkg/node_modules /app/apps/bot/node_modules

EXPOSE 3000

WORKDIR /app/apps/bot
ENTRYPOINT [ "bun", "src/app.ts" ]
