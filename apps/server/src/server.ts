import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import cors from "@fastify/cors";
import { fromNodeHeaders } from "better-auth/node";
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

server.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      const webUrl = process.env.WEB_URL || "http://localhost:3000";

      const url = new URL(request.url, `http://${request.headers.host || "localhost:9000"}`);

      const callbackURLParam = url.searchParams.get("callbackURL");
      if (callbackURLParam && callbackURLParam.startsWith("/")) {
        url.searchParams.set("callbackURL", `${webUrl}${callbackURLParam}`);
      }

      const headers = fromNodeHeaders(request.headers);

      let requestBody = request.body;
      if (requestBody && typeof requestBody === "object") {
        const bodyObj = requestBody as Record<string, any>;
        if (bodyObj.callbackURL && bodyObj.callbackURL.startsWith("/")) {
          requestBody = {
            ...bodyObj,
            callbackURL: `${webUrl}${bodyObj.callbackURL}`,
          };
        }
      }

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(requestBody ? { body: JSON.stringify(requestBody) } : {}),
      });

      const response = await auth.handler(req);

      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "content-length") {
          reply.header(key, value);
        }
      });
      return reply.send(response.body ? await response.text() : null);
    } catch (error) {
      server.log.error(error as any, "Authentication Error");
      return reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
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
