import { env } from "#/env";
import { gcpJobsClient } from "#/lib/gcp.server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/webhook/$")({
  server: {
    handlers: {
      GET: async () => {
        // const authHeader = request.headers.get("Authorization");
        // const params = new URL(request.url);
        // const owner = params.searchParams.get("owner");
        // const repo = params.searchParams.get("repo");
        // const issueNumber = params.searchParams.get("issueNumber");
        // const customInstructions =
        //   params.searchParams.get("customInstructions") ?? "No Custom Instructions Provided";

        const job = await gcpJobsClient.runJob({
          name: `projects/${env.GOOGLE_PROJECT_ID}/locations/${env.GOOGLE_PROJECT_REGION}/jobs/${env.GOOGLE_CLOUD_RUN_WORKER_NAME}`,
        });
        console.log("Job executed successfully:", job);

        return new Response(
          JSON.stringify({
            message: "Job executed successfully",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      },
    },
  },
});
