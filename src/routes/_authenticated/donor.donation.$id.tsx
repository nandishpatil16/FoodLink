import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, KeyRound, Phone, Truck, Clock, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";

import { UrgencyChip } from "@/components/UrgencyChip";
import { supabase } from "@/integrations/supabase/client";
import {
  categoryLabel,
  computeUrgency,
  timeLeftLabel,
  STATUS_LABEL,
  type DonationStatus,
} from "@/lib/foodlink";

export const Route = createFileRoute("/_authenticated/donor/donation/$id")({
  head: () => ({
    meta: [
      { title: "Donation details — FoodLink" },
      { name: "description", content: "Track pickup status and share your pickup code." },
      { property: "og:title", content: "Donation details — FoodLink" },
      { property: "og:description", content: "Track pickup status and share your pickup code." },
    ],
  }),
  component: DonationDetail,
});

function DonationDetail() {
  return (
    <VerifiedGate role="donor">
      {() => (
        <AppShell role="donor">
          <Body />
        </AppShell>
      )}
    </VerifiedGate>
  );
}

function Body() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["donation", id],
    queryFn: async () => {
      const [{ data: donation, error }, { data: events }, { data: code }] = await Promise.all([
        supabase.from("donations").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("donation_events")
          .select("status, note, created_at")
          .eq("donation_id", id)
          .order("created_at"),
        supabase.from("pickup_codes").select("code").eq("donation_id", id).maybeSingle(),
      ]);
      if (error) throw new Error(error.message);
      return { donation, events: events ?? [], code: code?.code ?? null };
    },
    refetchInterval: 15_000,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.donation) return <p className="text-sm text-muted-foreground">Donation not found.</p>;

  const d = data.donation;
  const urgency = computeUrgency({
    prepared_at: d.prepared_at,
    pickup_deadline: d.pickup_deadline,
    category: d.category,
    quantity_value: Number(d.quantity_value),
  });

  return (
    <div className="space-y-6">
      <Link
        to="/donor/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {d.photo_url && (
          <img src={d.photo_url} alt={d.title} className="h-52 w-full object-cover" />
        )}
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <UrgencyChip score={urgency} />
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold">
              {STATUS_LABEL[d.status as DonationStatus]}
            </span>
          </div>
          <h1 className="text-xl font-extrabold">{d.title}</h1>
          <p className="text-sm text-muted-foreground">
            {categoryLabel(d.category)} · {Number(d.quantity_value)} {d.quantity_unit}
          </p>
          {d.description && <p className="text-sm">{d.description}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {timeLeftLabel(d.pickup_deadline)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {d.donor_address || "Address not set"}
            </span>
          </div>
        </div>
      </div>

      {data.code && d.status !== "COMPLETED" && (
        <div className="rounded-2xl border border-primary/30 bg-primary-soft p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <KeyRound className="size-4" /> Pickup code
          </p>
          <p className="mt-2 text-4xl font-extrabold tracking-[0.3em] text-primary">{data.code}</p>
          <p className="mt-2 text-xs text-accent-foreground">
            Share this only with the NGO team when they arrive. They enter it to confirm pickup.
          </p>
        </div>
      )}

      {d.receiver_org_name && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-bold">Collecting organisation</p>
          <p className="mt-1 text-sm">{d.receiver_org_name}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Phone className="size-4" /> {d.receiver_phone} · {d.receiver_contact_person}
            </span>
            {d.vehicle_number && (
              <span className="inline-flex items-center gap-1">
                <Truck className="size-4" /> {d.vehicle_number}
              </span>
            )}
          </div>
          {d.pickup_time && (
            <p className="mt-3 text-sm">
              Pickup scheduled for {new Date(d.pickup_time).toLocaleString()}
              {d.team_size ? ` · team of ${d.team_size}` : ""}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
