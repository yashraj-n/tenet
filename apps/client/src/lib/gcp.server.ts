import { env } from "#/env";
import { GoogleAuth } from "google-auth-library";

const cloudRunAuth = new GoogleAuth({
  credentials: JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

export async function runCloudRunJob(opts: {
  name: string;
  overrides: {
    containerOverrides: Array<{
      env: Array<{ name: string; value: string }>;
    }>;
  };
}) {
  const client = await cloudRunAuth.getClient();
  const { data } = await client.request<{ name?: string }>({
    url: `https://run.googleapis.com/v2/${opts.name}:run`,
    method: "POST",
    data: { overrides: opts.overrides },
  });

  return data;
}
