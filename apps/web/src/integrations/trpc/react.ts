import { createTRPCContext } from "@trpc/tanstack-react-query";
import type {AppRouter} from "@tenet/server";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
