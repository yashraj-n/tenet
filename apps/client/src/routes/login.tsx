import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Github, ArrowLeft } from "lucide-react";

import { authClient } from "#/lib/auth-client";

import { getSeoMetadata } from "#/lib/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    getSeoMetadata({
      title: "Sign In to Tenet — AI Agent for GitHub Issues",
      description:
        "Sign in to Tenet with GitHub to start automatically triaging issues, generating pull requests, and resolving bugs in your repositories.",
      path: "/login",
    }),
  component: LoginComponent,
});

function LoginComponent() {
  const handleGithubLogin = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-background px-6 noise-overlay">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#eca8d6]/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Back Link */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 mb-10"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Back to home
        </Link>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg p-10 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

          <div className="text-center mb-10">
            <h1 className="font-display text-5xl italic text-foreground mb-3">Tenet</h1>
            <p className="text-muted-foreground text-sm">Sign in to get started</p>
          </div>

          <Button
            className="w-full bg-foreground hover:bg-foreground/90 text-background h-12 text-sm font-medium gap-2.5 transition-all duration-300 hover-lift cursor-pointer"
            onClick={handleGithubLogin}
          >
            <Github className="w-[18px] h-[18px]" />
            Continue with GitHub
          </Button>

          <p className="text-[11px] text-muted-foreground/60 text-center mt-6 leading-relaxed font-sans">
            By continuing, you agree to our{" "}
            <Link
              to="/terms"
              className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Open source &middot;{" "}
          <a
            href="https://github.com/yashraj-n/tenet"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            View on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
