import { type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createAzure } from "@ai-sdk/azure";
import { createCohere } from "@ai-sdk/cohere";
import { createMistral } from "@ai-sdk/mistral";

export function getLanguageModel(): LanguageModel {
  const provider = (process.env.LLM_PROVIDER || "openai").trim().toLowerCase();
  const modelId = process.env.LLM_MODEL?.trim();

  if (!modelId) {
    throw new Error("LLM_MODEL environment variable is not defined or is empty.");
  }

  switch (provider) {
    case "openai":
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      })(modelId);

    case "anthropic":
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: process.env.ANTHROPIC_BASE_URL,
      })(modelId);

    case "google":
      return createGoogle({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
        baseURL: process.env.GOOGLE_BASE_URL,
      })(modelId);

    case "azure":
      return createAzure({
        resourceName: process.env.AZURE_RESOURCE_NAME,
        apiKey: process.env.AZURE_API_KEY,
        baseURL: process.env.AZURE_BASE_URL,
      })(modelId);

    case "cohere":
      return createCohere({
        apiKey: process.env.COHERE_API_KEY,
        baseURL: process.env.COHERE_BASE_URL,
      })(modelId);

    case "mistral":
      return createMistral({
        apiKey: process.env.MISTRAL_API_KEY,
        baseURL: process.env.MISTRAL_BASE_URL,
      })(modelId);

    default:
      throw new Error(
        `Unsupported LLM_PROVIDER "${provider}". Supported providers: openai, anthropic, google, azure, cohere, mistral.`,
      );
  }
}
