import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Loader2, SearchCheck, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "../../integrations/trpc/react";
import type { PullRequest } from "@/lib/types";

interface ReviewModalProps {
  pr: PullRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

type ReviewStep = "idle" | "loading" | "success" | "error";

export function ReviewModal({ pr, isOpen, onClose }: ReviewModalProps) {
  const [step, setStep] = useState<ReviewStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const runPRReview = useMutation(trpc.runPRReview.mutationOptions());

  useEffect(() => {
    if (isOpen) {
      setStep("idle");
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!pr) return null;

  const [owner, repo] = pr.repoId.split("/");

  const handleStartReview = async () => {
    setStep("loading");
    try {
      await runPRReview.mutateAsync({
        owner,
        repo,
        prNumber: String(pr.number),
      });
      queryClient.invalidateQueries(trpc.getRuns.queryFilter());
      queryClient.invalidateQueries(trpc.getQuota.queryFilter());
      setStep("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start review.");
      setStep("error");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md p-8 sm:rounded-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-display text-2xl italic tracking-tight text-foreground text-center">
            {step === "success"
              ? "Review Queued"
              : step === "error"
                ? "Review Failed"
                : "PR Code Review"}
          </DialogTitle>
          {step === "idle" && (
            <DialogDescription className="text-muted-foreground text-sm text-center">
              Generate a read-only code and security review for PR #{pr.number} of {pr.repoId}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2">
          {step === "idle" && (
            <div className="p-4 rounded-lg bg-foreground/[0.01] border border-border space-y-1.5">
              <span className="text-[10px] text-[#eca8d6] font-mono uppercase tracking-widest block font-semibold">
                Pull Request
              </span>
              <h4 className="text-sm font-medium font-sans text-foreground">
                #{pr.number} {pr.title}
              </h4>
              <p className="text-xs text-muted-foreground font-mono">
                {pr.targetBranch} ← {pr.sourceBranch}
              </p>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center select-none">
              <Loader2 className="w-10 h-10 text-[#eca8d6] animate-spin" />
              <p className="text-sm text-muted-foreground font-mono">
                Starting review container...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center gap-4 py-4 text-center select-none">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 fill-emerald-500/10" />
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                The read-only review has started. Results will appear on the runs page when the
                container finishes.
              </p>
              <Link
                to="/dashboard/runs"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full bg-foreground text-background hover:bg-foreground/90 font-medium text-sm px-6 h-12 rounded-lg cursor-pointer transition-all duration-300"
              >
                Go to Runs Page
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 py-4 text-center select-none">
              <XCircle className="w-12 h-12 text-red-400 fill-red-500/10" />
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {errorMessage}
              </p>
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
              onClick={handleStartReview}
            >
              Code Review
              <SearchCheck className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ReviewModal;
