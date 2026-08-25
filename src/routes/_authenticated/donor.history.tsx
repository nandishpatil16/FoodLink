import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { DonationCard } from "@/components/DonationCard";
import { supabase } from "@/integrations/supabase/client";
import { type DonationStatus } from "@/lib/foodlink";

export const Route = createFileRoute("/_authenticated/donor/history")({
  head: () => ({
    meta: [
      { title: "Donation history — FoodLink" },
      { name: "description", content: "Review your completed and closed food donations." },
      { property: "og:title", content: "Donation history — FoodLink" },
      { property: "og:description", content: "Review your completed and closed donations." },
    ],
  }),
  component: () => (
    <VerifiedGate role="donor">
      {() => (
        <AppShell role="donor">
          <HistoryBody />
        </AppShell>
      )}
    </VerifiedGate>
  ),
});

const CLOSED = ["COMPLETED", "CANCELLED", "EXPIRED", "DELIVERED"];

function HistoryBody() {
  const { data, isLoading } = useQuery({
    queryKey: ["donor-history"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (rows ?? []).filter((r) => CLOSED.includes(r.status));
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="inline-flex items-center gap-2 text-lg font-extrabold">
          <History className="size-5 text-primary" /> History
        </h1>
        <p className="text-sm text-muted-foreground">Your past donations and their outcomes.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No past donations yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((d) => (
            <DonationCard
              key={d.id}
              href={`/donor/donation/${d.id}`}
              showStatus
              donation={{
                id: d.id,
                title: d.title,
                category: d.category,
                quantity_value: Number(d.quantity_value),
                quantity_unit: d.quantity_unit,
                pickup_deadline: d.pickup_deadline,
                photo_url: d.photo_url,
                donor_org_name: d.donor_org_name,
                status: d.status as DonationStatus,
                urgency: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
