import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import type { Issue } from "@/lib/types";

interface BuildModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
}

type BuildStep = "idle" | "success" | "quota_exceeded";

export function BuildModal({ issue, isOpen, onClose }: BuildModalProps) {
  const [step, setStep] = useState<BuildStep>("idle");
  const defaultQuota = { limit: 2, used: 0 };
  const [quota, setQuota] = useState(defaultQuota);
  const [customInstructions, setCustomInstructions] = useState("");

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("tenet_quota");
      if (stored) {
        setQuota(JSON.parse(stored));
      } else {
        setQuota(defaultQuota);
      }
      setStep("idle");
      setCustomInstructions("");
    }
  }, [isOpen]);

  if (!issue) return null;

  const handleStartBuild = () => {
    if (quota.used >= quota.limit) {
      setStep("quota_exceeded");
      return;
    }

    // Add run to localStorage runs list
    const storedRunsStr = localStorage.getItem("tenet_runs");
    let currentRuns = [];
    try {
      if (storedRunsStr) {
        currentRuns = JSON.parse(storedRunsStr);
      }
    } catch {
      currentRuns = [];
    }

    const newRun = {
      id: `run-${Date.now()}`,
      repoName: issue.repoId,
      repoId: issue.repoId,
      issueNumber: issue.number,
      issueTitle: issue.title,
      status: "running" as const,
      triggeredAt: "Just now",
      duration: "--",
    };

    const updatedRuns = [newRun, ...currentRuns];
    localStorage.setItem("tenet_runs", JSON.stringify(updatedRuns));
    window.dispatchEvent(new Event("tenet_runs_update"));

    // Increment quota
    const updatedQuota = { ...quota, used: quota.used + 1 };
    localStorage.setItem("tenet_quota", JSON.stringify(updatedQuota));
    window.dispatchEvent(new Event("tenet_quota_update"));

    setStep("success");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md p-8 sm:rounded-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-display text-2xl italic tracking-tight text-foreground text-center">
            {step === "success" ? "Build Triggered" : "Autonomous Agent Build"}
          </DialogTitle>
          {step !== "success" && (
            <DialogDescription className="text-muted-foreground text-sm text-center">
              Trigger the AI solver on issue #{issue.number} of {issue.repoId}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2">
          {step === "idle" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-foreground/[0.01] border border-border space-y-1.5">
                <span className="text-[10px] text-[#eca8d6] font-mono uppercase tracking-widest block font-semibold">
                  Issue Profile
                </span>
                <h4 className="text-sm font-medium font-sans text-foreground">
                  #{issue.number} {issue.title}
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {issue.labels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${lbl.color}`}
                    >
                      {lbl.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions settings */}
              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-1.5">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  placeholder="e.g. Please preserve the utility functions in helpers.ts and use standard imports..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full h-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-[#eca8d6]/50 transition-colors resize-none font-sans"
                />
              </div>
            </div>
          )}

          {/* Triggered Success Screen */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center gap-4 py-4 text-center select-none">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 fill-emerald-500/10" />
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  The agent container has been initialized. You can monitor the progress logs and PR
                  generation on the runs history page.
                </p>
              </div>

              <div className="w-full pt-4">
                <Link
                  to="/dashboard/runs"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full bg-foreground text-background hover:bg-foreground/90 font-medium text-sm px-6 h-12 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.01]"
                >
                  Go to Runs Page
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Quota Exceeded Screen */}
          {step === "quota_exceeded" && (
            <div className="flex flex-col items-center justify-center gap-4 py-4 text-center select-none">
              <AlertTriangle className="w-12 h-12 text-amber-400 fill-amber-500/10" />
              <div className="space-y-1.5">
                <h3 className="text-base font-sans font-medium text-foreground">
                  Quota Limit Reached
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  You have used all of your 2 daily requests. Quota resets in approximately 12
                  hours.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full mt-4">
                <Button
                  className="w-full bg-foreground text-background h-11"
                  onClick={() => {
                    const reset = { used: 0, limit: 2 };
                    localStorage.setItem("tenet_quota", JSON.stringify(reset));
                    window.dispatchEvent(new Event("tenet_quota_update"));
                    setStep("idle");
                  }}
                >
                  Reset Quota (Demo Mode)
                </Button>
                <Button variant="ghost" className="w-full h-11" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>

        {step === "idle" && (
          <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-border/40 pt-4 mt-2">
            <Button variant="ghost" className="flex-1 h-11" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-foreground text-background hover:bg-foreground/90 font-medium flex-1 h-11 gap-1.5 cursor-pointer"
              onClick={handleStartBuild}
            >
              Trigger Build
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default BuildModal;
