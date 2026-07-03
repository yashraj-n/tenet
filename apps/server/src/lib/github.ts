import { TRPCError } from "@trpc/server";
import { Octokit } from "octokit";
import { prisma } from "./prisma";

export async function getGithubOctokit(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
  });

  if (!account || !account.accessToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No connected GitHub account or access token found.",
    });
  }

  return new Octokit({
    auth: account.accessToken,
  });
}
