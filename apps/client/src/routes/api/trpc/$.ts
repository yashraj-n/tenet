import { createFileRoute } from "@tanstack/react-router";
import { appRouter } from "#/integrations/trpc/router";
import { createContext } from "#/integrations/trpc/context";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return fetchRequestHandler({
          endpoint: "/api/trpc",
          req: request,
          router: appRouter,
          createContext: () => createContext(request),
        });
      },
      POST: ({ request }) => {
        return fetchRequestHandler({
          endpoint: "/api/trpc",
          req: request,
          router: appRouter,
          createContext: () => createContext(request),
        });
      },
    },
  },
});
