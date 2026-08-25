import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { DonationCard } from "@/components/DonationCard";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { computeUrgency, distanceKm, type DonationStatus } from "@/lib/foodlink";

export const Route = createFileRoute("/_authenticated/receiver/accepted")({
  head: () => ({
    meta: [
      { title: "Accepted food — FoodLink" },
      { name: "description", content: "Food donations your organisation has accepted." },
      { property: "og:title", content: "Accepted food — FoodLink" },
      { property: "og:description", content: "Food donations your organisation has accepted." },
    ],
  }),
  component: () => <VerifiedGate role="receiver">{() => <AcceptedBody />}</VerifiedGate>,
});

const ACCEPTED: DonationStatus[] = ["ACCEPTED", "PICKUP_SCHEDULED", "COLLECTED", "DELIVERED"];

function AcceptedBody() {
  const { data: account } = useAccount();
  const org = account?.organization;
  const userId = account?.user.id;

  const { data, isLoading } = useQuery({
    enabled: !!userId,
    queryKey: ["receiver", "accepted", userId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("donations")
        .select("*")
        .eq("receiver_id", userId!)
        .in("status", ACCEPTED)
        .order("accepted_at", { ascending: false });
      if (error) throw new Error(error.message);
      return rows ?? [];
    },
    refetchInterval: 20_000,
  });

  const rows = data ?? [];

  return (
    <AppShell role="receiver">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-extrabold">Accepted food</h1>
          <p className="text-sm text-muted-foreground">
            Everything you have claimed and still need to collect or deliver.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <PackageCheck className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No accepted donations yet</p>
            <p className="text-sm text-muted-foreground">
              Accept a listing from Discover and it will show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <DonationCard
                key={row.id}
                href={`/receiver/pickup/${row.id}`}
                showStatus
                donation={{
                  id: row.id,
                  title: row.title,
                  category: row.category,
                  quantity_value: Number(row.quantity_value),
                  quantity_unit: row.quantity_unit,
                  pickup_deadline: row.pickup_deadline,
                  photo_url: row.photo_url,
                  donor_org_name: row.donor_org_name,
                  status: row.status as DonationStatus,
                  urgency: computeUrgency({
                    prepared_at: row.prepared_at,
                    pickup_deadline: row.pickup_deadline,
                    category: row.category,
                    quantity_value: Number(row.quantity_value),
                  }),
                  distance: distanceKm(
                    { lat: org?.lat, lng: org?.lng },
                    { lat: row.lat, lng: row.lng },
                  ),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
