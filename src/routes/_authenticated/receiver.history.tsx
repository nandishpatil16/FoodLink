import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { DonationCard } from "@/components/DonationCard";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { type DonationStatus } from "@/lib/foodlink";

export const Route = createFileRoute("/_authenticated/receiver/history")({
  head: () => ({
    meta: [
      { title: "Pickup history — FoodLink" },
      { name: "description", content: "Review pickups your organisation has completed." },
      { property: "og:title", content: "Pickup history — FoodLink" },
      { property: "og:description", content: "Review pickups your organisation completed." },
    ],
  }),
  component: () => <VerifiedGate role="receiver">{() => <HistoryBody />}</VerifiedGate>,
});

const CLOSED = ["COMPLETED", "CANCELLED", "EXPIRED", "DELIVERED"];

function HistoryBody() {
  const { data: account } = useAccount();

  const { data, isLoading } = useQuery({
    queryKey: ["receiver-history", account?.user.id],
    enabled: Boolean(account?.user.id),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("donations")
        .select("*")
        .eq("receiver_id", account!.user.id)
        .order("accepted_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (rows ?? []).filter((r) => CLOSED.includes(r.status));
    },
  });

  return (
    <AppShell role="receiver">
      <div className="space-y-5">
        <div>
          <h1 className="inline-flex items-center gap-2 text-lg font-extrabold">
            <History className="size-5 text-primary" /> History
          </h1>
          <p className="text-sm text-muted-foreground">Pickups your team has closed out.</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No past pickups yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data!.map((d) => (
              <DonationCard
                key={d.id}
                href={`/receiver/pickup/${d.id}`}
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
    </AppShell>
  );
}
