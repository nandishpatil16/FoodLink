import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck, Utensils, Truck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { DonationCard } from "@/components/DonationCard";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { computeUrgency, distanceKm, type DonationStatus } from "@/lib/foodlink";


export const Route = createFileRoute("/_authenticated/receiver/dashboard")({
  head: () => ({
    meta: [
      { title: "NGO dashboard — FoodLink" },
      { name: "description", content: "Track your active pickups and rescued meals." },
      { property: "og:title", content: "NGO dashboard — FoodLink" },
      { property: "og:description", content: "Track active pickups and rescued meals." },
    ],
  }),
  component: ReceiverDashboard,
});

const ACTIVE: DonationStatus[] = ["ACCEPTED", "PICKUP_SCHEDULED", "COLLECTED", "DELIVERED"];

function ReceiverDashboard() {
  return <VerifiedGate role="receiver">{() => <Body />}</VerifiedGate>;
}

function Body() {
  const { data: account } = useAccount();
  const org = account?.organization;

  const { data, isLoading } = useQuery({
    queryKey: ["receiver-donations", account?.user.id],
    enabled: Boolean(account?.user.id),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("donations")
        .select("*")
        .eq("receiver_id", account!.user.id)
        .order("accepted_at", { ascending: false });
      if (error) throw new Error(error.message);
      return rows ?? [];
    },
    refetchInterval: 20_000,
  });

  const rows = data ?? [];
  const active = rows.filter((r) => ACTIVE.includes(r.status as DonationStatus));
  const completed = rows.filter((r) => r.status === "COMPLETED");
  const meals = completed.reduce(
    (sum, r) => sum + (r.quantity_unit === "servings" ? Number(r.quantity_value) : 0),
    0,
  );

  return (
    <AppShell role="receiver">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-extrabold">{org?.name ?? "Your organisation"}</h1>
          <p className="text-sm text-muted-foreground">Your pickups and impact so far.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Truck className="size-4" />} value={active.length} label="Active" />
          <Stat
            icon={<PackageCheck className="size-4" />}
            value={completed.length}
            label="Completed"
          />
          <Stat icon={<Utensils className="size-4" />} value={meals} label="Meals rescued" />
        </div>

        <Link
          to="/receiver/discover"
          className="block rounded-2xl bg-primary p-5 text-primary-foreground shadow-card"
        >
          <p className="text-base font-extrabold">Find food nearby</p>
          <p className="text-sm opacity-90">Urgency-ranked surplus from verified donors.</p>
        </Link>

        <Section title="Active pickups">

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : active.length === 0 ? (
            <Empty text="No active pickups. Accept a donation to get started." />
          ) : (
            <Grid>
              {active.map((row) => (
                <DonationCard
                  key={row.id}
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
            </Grid>
          )}
        </Section>

        {completed.length > 0 && (
          <Section title="Completed">
            <Grid>
              {completed.slice(0, 6).map((row) => (
                <DonationCard
                  key={row.id}
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
                    urgency: 0,
                  }}
                />
              ))}
            </Grid>
          </Section>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <p className="mt-2 text-xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
