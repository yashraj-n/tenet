"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: FileCheck,
    title: "Open source",
    description: "Every line of Tenet's code is public. Audit it, fork it, contribute to it.",
  },
  {
    icon: Lock,
    title: "Encrypted keys",
    description:
      "Your API keys are encrypted the moment you save them. We never store them in plain text.",
  },
  {
    icon: Shield,
    title: "Isolated execution",
    description:
      "Each fix runs in its own sandboxed environment. Your live code is never touched until you merge.",
  },
  {
    icon: Eye,
    title: "Minimal permissions",
    description:
      "Tenet only requests the GitHub permissions it strictly needs to read issues and open pull requests.",
  },
];

export function SecuritySection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % securityFeatures.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="security" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background accent removed */}

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-20">
          <span
            className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="w-12 h-px bg-foreground/20" />
            Security
          </span>

          {/* Title — full width */}
          <h2
            className={`text-6xl md:text-7xl lg:text-[100px] font-display tracking-tight leading-[0.9] mb-12 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Powerful,
            <br />
            <span className="text-muted-foreground">not reckless.</span>
          </h2>

          {/* Description — below title */}
          <div
            className={`transition-all duration-1000 delay-100 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Tenet is open-source — every line of code is public and auditable. Your API keys are
              encrypted at rest, and every fix runs in an isolated environment.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Large visual card */}
          <div
            className={`lg:col-span-7 relative p-8 lg:p-12 border border-foreground/10 min-h-[400px] overflow-hidden transition-all duration-700 flex flex-col justify-between ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative z-10">
              <span className="font-mono text-sm text-muted-foreground">Active protection</span>
              <div className="mt-8">
                <span className="text-7xl lg:text-8xl font-display">100%</span>
                <span className="block text-muted-foreground mt-2">
                  open source — read every line on GitHub
                </span>
              </div>
            </div>

            {/* Styled badge inside card */}
            <div className="mt-12 p-4 bg-foreground/[0.02] border border-foreground/10 rounded-lg">
              <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#eca8d6]" />
                Your keys are encrypted
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                API keys are encrypted at rest using industry-grade encryption. They're only used to
                run your chosen AI model during a fix.
              </p>
            </div>
          </div>

          {/* Feature cards stack */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`p-6 border transition-all duration-500 cursor-default ${
                  activeFeature === index
                    ? "border-foreground/30 bg-foreground/[0.04]"
                    : "border-foreground/10"
                } ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
                style={{ transitionDelay: `${index * 80}ms` }}
                onClick={() => setActiveFeature(index)}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-10 h-10 flex items-center justify-center border transition-colors ${
                      activeFeature === index
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/20"
                    }`}
                  >
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
