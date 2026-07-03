import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import cors from "@fastify/cors";
import { createContext } from "./context";
import { appRouter, type AppRouter } from "./router";

const server = fastify({
  routerOptions: {
    maxParamLength: 5000,
  },
});

await server.register(cors, {
  origin: ["http://localhost:3000"],
  credentials: true,
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
