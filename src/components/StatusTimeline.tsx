import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_FLOW, STATUS_LABEL, type DonationStatus } from "@/lib/foodlink";

export function StatusTimeline({
  status,
  events,
}: {
  status: DonationStatus;
  events?: { status: string; note: string; created_at: string }[];
}) {
  const currentIndex = STATUS_FLOW.indexOf(status);
  return (
    <ol className="space-y-4">
      {STATUS_FLOW.map((step, i) => {
        const done = currentIndex >= i;
        const event = events?.find((e) => e.status === step);
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-bold",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              {i < STATUS_FLOW.length - 1 && (
                <span className={cn("h-8 w-px", done ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <div className="pb-1">
              <p className={cn("text-sm font-semibold", !done && "text-muted-foreground")}>
                {STATUS_LABEL[step]}
              </p>
              {event && (
                <p className="text-xs text-muted-foreground">
                  {event.note} · {new Date(event.created_at).toLocaleString()}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
