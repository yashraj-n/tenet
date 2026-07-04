import { TRPCError } from "@trpc/server";
import { Octokit } from "octokit";
import { prisma } from "../db";
import { env } from "#/env";

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

  let token = account.accessToken;
  const bufferTime = 5 * 60 * 1000;
  const isExpired =
    account.accessTokenExpiresAt &&
    account.accessTokenExpiresAt.getTime() - bufferTime < Date.now();

  if (isExpired && account.refreshToken) {
    try {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: account.refreshToken,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };

        if (data.access_token) {
          token = data.access_token;
          const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

          await prisma.account.update({
            where: { id: account.id },
            data: {
              accessToken: data.access_token,
              refreshToken: data.refresh_token || account.refreshToken,
              accessTokenExpiresAt: newExpiresAt,
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh GitHub access token:", error);
    }
  }

  return new Octokit({
    auth: token,
  });
}
