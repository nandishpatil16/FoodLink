import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Soup } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { DonationCard } from "@/components/DonationCard";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { FOOD_CATEGORIES, computeUrgency, distanceKm, type DonationStatus } from "@/lib/foodlink";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/receiver/discover")({
  head: () => ({
    meta: [
      { title: "Discover food — FoodLink" },
      { name: "description", content: "Browse urgency-ranked surplus food available nearby." },
      { property: "og:title", content: "Discover food — FoodLink" },
      { property: "og:description", content: "Browse urgency-ranked surplus food nearby." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  return (
    <VerifiedGate role="receiver">{() => <DiscoverBody />}</VerifiedGate>
  );
}

function DiscoverBody() {
  const { data: account } = useAccount();
  const org = account?.organization;
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["donations", "available"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("donations")
        .select("*")
        .eq("status", "AVAILABLE")
        .gt("pickup_deadline", new Date().toISOString());
      if (error) throw new Error(error.message);
      return rows ?? [];
    },
    refetchInterval: 15_000,
  });

  const items = useMemo(() => {
    const list = (data ?? [])
      .filter((d) => (category ? d.category === category : true))
      .filter((d) =>
        q ? `${d.title} ${d.donor_org_name}`.toLowerCase().includes(q.toLowerCase()) : true,
      )
      .map((d) => ({
        row: d,
        urgency: computeUrgency({
          prepared_at: d.prepared_at,
          pickup_deadline: d.pickup_deadline,
          category: d.category,
          quantity_value: Number(d.quantity_value),
        }),
        distance: distanceKm({ lat: org?.lat, lng: org?.lng }, { lat: d.lat, lng: d.lng }),
      }));
    // Nearest first; listings without a known distance fall to the end.
    return list.sort((a, b) => {
      const da = a.distance ?? Number.POSITIVE_INFINITY;
      const db = b.distance ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return b.urgency - a.urgency;
    });
  }, [data, category, q, org?.lat, org?.lng]);

  return (
    <AppShell
      role="receiver"
      search={{ value: q, onChange: setQ, placeholder: "Search food or donor…" }}
    >
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip active={category === null} onClick={() => setCategory(null)} label="All" />
          {FOOD_CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              active={category === c.value}
              onClick={() => setCategory(c.value)}
              label={c.label}
            />
          ))}
        </div>

        <div>
          <h1 className="text-lg font-extrabold">Food available nearby</h1>
          <p className="text-sm text-muted-foreground">
            Automatically sorted nearest to farthest. Tap a listing to see full food details and accept it.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Soup className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">Nothing available right now</p>
            <p className="text-sm text-muted-foreground">
              New donations appear here the moment a donor posts them.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ row, urgency, distance }) => (
              <div key={row.id} className="flex flex-col gap-2">
                <DonationCard
                  href={`/receiver/pickup/${row.id}`}
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
                    urgency,
                    distance,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
