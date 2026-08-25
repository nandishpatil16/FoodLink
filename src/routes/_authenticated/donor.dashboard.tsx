import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, PackageOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DonationCard } from "@/components/DonationCard";
import { supabase } from "@/integrations/supabase/client";
import { computeUrgency, type DonationStatus } from "@/lib/foodlink";
import { VerifiedGate } from "@/components/VerifiedGate";


export const Route = createFileRoute("/_authenticated/donor/dashboard")({
  head: () => ({
    meta: [
      { title: "Donor dashboard — FoodLink" },
      { name: "description", content: "Track your posted food donations and pickups." },
      { property: "og:title", content: "Donor dashboard — FoodLink" },
      { property: "og:description", content: "Track your posted food donations and pickups." },
    ],
  }),
  component: DonorDashboard,
});

function DonorDashboard() {
  return (
    <VerifiedGate role="donor">
      {() => (
        <AppShell role="donor">
          <DashboardBody />
        </AppShell>
      )}
    </VerifiedGate>
  );
}

function DashboardBody() {
  const { data, isLoading } = useQuery({
    queryKey: ["donations", "mine"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return rows ?? [];
    },
    refetchInterval: 20_000,
  });

  const active =
    data?.filter((d) => !["COMPLETED", "CANCELLED", "EXPIRED"].includes(d.status)) ?? [];
  const past = data?.filter((d) => ["COMPLETED", "CANCELLED", "EXPIRED"].includes(d.status)) ?? [];
  const mealsSaved = past
    .filter((d) => d.status === "COMPLETED")
    .reduce((sum, d) => sum + Number(d.quantity_value), 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active posts" value={active.length} />
        <Stat label="Completed" value={past.filter((d) => d.status === "COMPLETED").length} />
        <Stat label="Meals rescued" value={Math.round(mealsSaved)} />
      </div>

      <Link
        to="/donor/donate"
        className="flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-float"
      >
        <span>
          <span className="block text-base font-bold">Have surplus food right now?</span>
          <span className="text-sm opacity-90">Post it in under a minute</span>
        </span>
        <Plus className="size-6" />
      </Link>

      <section>
        <h2 className="text-lg font-extrabold">Active donations</h2>

        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : active.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((d) => (
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
                  urgency: computeUrgency({
                    prepared_at: d.prepared_at,
                    pickup_deadline: d.pickup_deadline,
                    category: d.category,
                    quantity_value: Number(d.quantity_value),
                  }),
                }}
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold">History</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((d) => (
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
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <PackageOpen className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 font-semibold">No active donations</p>
      <p className="text-sm text-muted-foreground">
        Post surplus food and verified NGOs nearby will see it instantly.
      </p>
    </div>
  );
}
