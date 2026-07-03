import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { auth } from "./lib/auth";

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  return {
    req,
    res,
    session: session?.session ?? null,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
