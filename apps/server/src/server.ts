import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import cors from "@fastify/cors";
import { toNodeHandler } from "better-auth/node";
import { createContext } from "./context";
import { appRouter, type AppRouter } from "./router";
import { auth } from "./lib/auth";

const server = fastify({
  routerOptions: {
    maxParamLength: 5000,
  },
});

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"];

await server.register(cors, {
  origin: trustedOrigins,
  credentials: true,
});

server.all("/api/auth/*", async (req, reply) => {
  await toNodeHandler(auth)(req.raw, reply.raw);
  reply.sent = true;
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 9000;

server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

(async () => {
  try {
    console.log("Listening on port", PORT);
    await server.listen({
      port: PORT,
      host: "0.0.0.0",
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
