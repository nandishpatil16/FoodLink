import { cn } from "@/lib/utils";
import { URGENCY_LABEL, urgencyLevel } from "@/lib/foodlink";

export function UrgencyChip({ score, className }: { score: number; className?: string }) {
  const level = urgencyLevel(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        level === "critical" && "bg-critical-soft text-critical",
        level === "high" && "bg-warning-soft text-warning-foreground",
        level === "normal" && "bg-primary-soft text-accent-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          level === "critical" && "bg-critical",
          level === "high" && "bg-warning",
          level === "normal" && "bg-primary",
        )}
      />
      {URGENCY_LABEL[level]} · {score.toFixed(1)}
    </span>
  );
}
