import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

import { getSeoMetadata } from "#/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    getSeoMetadata({
      title: "Terms of Service — Tenet AI",
      description:
        "Read the Terms of Service for Tenet AI to understand the terms, rules, and conditions for using our automated GitHub issue resolution platform.",
      path: "/terms",
    }),
  component: TermsPage,
});

function TermsPage() {
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
            <Shield className="w-5 h-5 text-[#eca8d6]" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Legal Framework
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-medium text-foreground">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-2">Last Updated: July 7, 2026</p>
        </div>

        {/* Content sections */}
        <div className="space-y-8 font-sans text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              1. Acceptance of Agreement
            </h2>
            <p>
              By accessing, installing, or interacting with the Tenet platform, you represent that
              you have read, understood, and agreed to be bound by the terms and provisions of this
              agreement. If you do not accept these terms in their entirety, you must immediately
              cease all operations and remove the Tenet GitHub application integration.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              2. Scope of Service &amp; Permissions
            </h2>
            <p>
              Tenet operates as an autonomous containerized agent designed to locate, review, and
              automatically fix software issues within your connected GitHub repositories. By
              granting Tenet app installation permissions, you authorize the platform to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs font-mono">
              <li>Read repository metadata, codebases, and issue threads.</li>
              <li>Write changes, commits, and branch structures to your repositories.</li>
              <li>Create, update, and merge Pull Requests on your behalf.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              3. API Credentials &amp; Encryption
            </h2>
            <p>
              To execute automated code corrections, you may choose to configure API integration
              keys for external Large Language Model (LLM) providers. Tenet encrypts these keys at
              rest using industry-standard encryption algorithms prior to storing them in our
              database.
            </p>
          </section>

          <section className="space-y-3 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.01]">
            <h2 className="text-sm font-mono text-red-400 uppercase tracking-wider">
              4. LIMITATION OF LIABILITY &amp; SECURITY BREACH DISCLAIMER
            </h2>
            <p className="text-xs">
              TENET IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
              IN NO EVENT SHALL THE DEVELOPERS, CONTRIBUTORS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
              CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR
              OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE.
            </p>
            <p className="text-xs mt-2">
              <strong>BREACH POLICY:</strong> WHILST API INTEGRATION KEYS ARE ENCRYPTED AT REST, IN
              THE EVENT OF A SYSTEM COMPROMISE, DATABASE BREACH, INFRASTRUCTURE LOSS, OR MALICIOUS
              ATTACK, YOU ACKNOWLEDGE THAT THE DEVELOPERS ACCEPTS ZERO LIABILITY. UNDER NO
              CIRCUMSTANCES SHALL A DATA LEAK OR BREACH BE DEEMED THE FAULT OF THE PLATFORM
              CREATORS. YOU ASSUME ALL RISK REGARDING CREDENTIAL MANAGEMENT.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              5. Third-Party Integrations
            </h2>
            <p>
              This application interfaces directly with external third-party software and systems
              including GitHub, LangChain, LangSmith, and LLM providers. We do not control, and
              assume no responsibility for, the availability, privacy practices, or data handling
              protocols of these third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono text-foreground uppercase tracking-wider">
              6. Governance &amp; Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your access to the Tenet dashboard,
              invalidate credentials, or adjust usage quotas at our sole discretion, without prior
              notice or liability, for any reason, including violation of these terms.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 pt-6 flex justify-between items-center text-[10px] font-mono text-muted-foreground/60">
          <span>&copy; 2026 TENET. ALL RIGHTS RESERVED.</span>
          <Link to="/privacy" className="hover:text-foreground hover:underline transition-colors">
            PRIVACY POLICY
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
