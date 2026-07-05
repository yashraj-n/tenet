import { type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createAzure } from "@ai-sdk/azure";
import { createCohere } from "@ai-sdk/cohere";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "./env";

export function getLanguageModel(): LanguageModel {
  const provider = (env.LLM_PROVIDER || "openai").trim().toLowerCase();
  const modelId = env.LLM_MODEL?.trim();
  const apiKey = env.LLM_API_KEY;

  if (!modelId) {
    throw new Error("LLM_MODEL environment variable is not defined or is empty.");
  }

  switch (provider) {
    case "openai":
      return createOpenAI({
        apiKey,
      })(modelId);

    case "anthropic":
      return createAnthropic({
        apiKey,
      })(modelId);

    case "google":
      return createGoogle({
        apiKey,
      })(modelId);

    case "azure":
      return createAzure({
        apiKey,
      })(modelId);

    case "cohere":
      return createCohere({
        apiKey,
      })(modelId);

    case "mistral":
      return createMistral({
        apiKey,
      })(modelId);

    case "openrouter":
      return createOpenRouter({
        apiKey,
      })(modelId);

    default:
      throw new Error(
        `Unsupported LLM_PROVIDER "${provider}". Supported providers: openai, anthropic, google, azure, cohere, mistral, openrouter.`,
      );
  }
}
