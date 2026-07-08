import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";

import { getSeoMetadata } from "#/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    getSeoMetadata({
      title: "Privacy Policy — Tenet AI",
      description:
        "Read the Privacy Policy for Tenet AI to understand how we collect, use, and protect your repository data, personal information, and GitHub OAuth tokens.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground px-6 py-12 md:py-20 noise-overlay flex flex-col items-center">
      {/* Ambient decorative glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#eca8d6]/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl space-y-10">
        {/* Back Link */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors duration-255"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-255 group-hover:-translate-x-1" />
          BACK TO HOME
        </Link>

        {/* Page Header */}
        <div className="border-b border-border/40 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-[#eca8d6]" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Information Integrity
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-medium text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-2">Last Updated: July 7, 2026</p>
        </div>

        {/* Content sections */}
        <div className="space-y-8 font-sans text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              1. Information We Collect
            </h2>
            <p>
              We collect and process the following information to facilitate Tenet’s automated
              coding services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Account Information:</strong> Profile metadata returned from GitHub OAuth
                authorizations (username, avatar, email).
              </li>
              <li>
                <strong>Integration Credentials:</strong> LLM provider keys (OpenAI, Anthropic,
                Gemini, etc.) stored in your Settings Console.
              </li>
              <li>
                <strong>Repository Metadata:</strong> Installation logs, branch identifiers, commit
                hashes, and issue description text required to solve errors.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              2. Storing and Processing Your Data
            </h2>
            <p>
              Your integration credentials and provider API keys are encrypted at rest prior to DB
              entry. Repository indexing and agent operations are run inside ephemeral container
              runtimes on GCP. Logs and output results are retained to display executions history.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              3. Data Sharing with Third Parties
            </h2>
            <p>
              To complete code modifications and run diagnostics, your data is processed through the
              following third-party entities:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>LangChain &amp; LangSmith:</strong> Execution traces, prompts, and tool
                inputs/outputs are dispatched to LangChain’s LangSmith platform for runtime
                diagnostics, performance checks, and execution timelines (unless tracing is
                explicitly disabled in your settings).
              </li>
              <li>
                <strong>LLM Model Providers:</strong> Prompt details are transmitted directly to
                your configured model endpoints (OpenAI, Anthropic, Gemini) to resolve issues.
              </li>
              <li>
                <strong>GitHub API:</strong> Solver outputs and files are pushed to GitHub via our
                app installation tokens.
              </li>
            </ul>
          </section>

          <section className="space-y-3 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.01]">
            <h2 className="text-sm font-mono text-red-400 uppercase tracking-wider">
              4. Security Measures &amp; Breach Exemption
            </h2>
            <p className="text-xs">
              We employ standard encryption layers to shield database attributes. However, no
              database transmission over the internet is 100% secure.
            </p>
            <p className="text-xs mt-2">
              In the event of a network infiltration, server breach, or developer credential
              compromise,
              <strong>
                {" "}
                you agree that the developers bear zero fault and accept no liability
              </strong>
              . The storage of sensitive custom credentials is done at your own discretion and risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              5. Your Rights and Controls
            </h2>
            <p>
              You have the right to request deletion of your account, encryption keys, and runs
              history. You may toggle LangSmith tracing on or off inside your Settings Console at
              any time to restrict log flows.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 pt-6 flex justify-between items-center text-[10px] font-mono text-muted-foreground/60">
          <span>&copy; 2026 TENET. ALL RIGHTS RESERVED.</span>
          <Link to="/terms" className="hover:text-foreground hover:underline transition-colors">
            TERMS &amp; CONDITIONS
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
