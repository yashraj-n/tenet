import { useState, useEffect } from "react";
const defaultQuota = { limit: 2, used: 0 };

export function QuotaBadge() {
  const [quota, setQuota] = useState(defaultQuota);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem("tenet_quota");
      if (stored) {
        setQuota(JSON.parse(stored));
      } else {
        setQuota(defaultQuota);
      }
    };

    handleUpdate();
    window.addEventListener("tenet_quota_update", handleUpdate);
    return () => window.removeEventListener("tenet_quota_update", handleUpdate);
  }, []);

  const remaining = quota.limit - quota.used;
  const hasQuota = remaining > 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-2 px-3 py-1 bg-foreground/[0.02] border border-border/80 rounded-md text-xs font-mono select-none cursor-help transition-all duration-200 min-w-[115px] justify-center"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${hasQuota ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`}
      />
      {isHovered ? (
        <span className="text-[#eca8d6] animate-fade-in text-[11px]">resets in 21h</span>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">runs left:</span>
          <span className="text-foreground font-semibold">{remaining}</span>
        </div>
      )}
    </div>
  );
}
export default QuotaBadge;
