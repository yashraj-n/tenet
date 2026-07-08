import { createFileRoute } from "@tanstack/react-router";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { SecuritySection } from "@/components/landing/security-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";

import { getSeoMetadata } from "#/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    getSeoMetadata({
      title: "Tenet — Automate GitHub Issue Resolution with AI",
      description:
        "Tenet is an open-source AI agent that connects to your GitHub repositories, diagnoses issues, and writes pull requests automatically to resolve them.",
      path: "/",
    }),
  component: Home,
});

function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <IntegrationsSection />
      <SecuritySection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
