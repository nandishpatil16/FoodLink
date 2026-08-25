import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { UrgencyChip } from "@/components/UrgencyChip";
import { supabase } from "@/integrations/supabase/client";
import {
  acceptDonation,
  markDelivered,
  schedulePickup,
  verifyPickupOtp,
} from "@/lib/foodlink.functions";
import { useAccount } from "@/hooks/useAccount";
import {
  STATUS_LABEL,
  categoryLabel,
  computeUrgency,
  timeLeftLabel,
  type DonationStatus,
} from "@/lib/foodlink";

export const Route = createFileRoute("/_authenticated/receiver/pickup/$id")({
  head: () => ({
    meta: [
      { title: "Pickup details — FoodLink" },
      { name: "description", content: "Schedule the pickup, verify the code and confirm delivery." },
      { property: "og:title", content: "Pickup details — FoodLink" },
      { property: "og:description", content: "Schedule pickup, verify code, confirm delivery." },
    ],
  }),
  component: PickupPage,
});

function PickupPage() {
  return (
    <VerifiedGate role="receiver">
      {() => (
        <AppShell role="receiver">
          <Body />
        </AppShell>
      )}
    </VerifiedGate>
  );
}

function toLocalInput(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function Body() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: account } = useAccount();
  const org = account?.organization;

  const [vehicle, setVehicle] = useState("");
  const [pickupTime, setPickupTime] = useState(toLocalInput(new Date(Date.now() + 3600_000)));
  const [teamSize, setTeamSize] = useState(2);
  const [note, setNote] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["donation", id],
    queryFn: async () => {
      const [{ data: donation, error }, { data: events }] = await Promise.all([
        supabase.from("donations").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("donation_events")
          .select("status, note, created_at")
          .eq("donation_id", id)
          .order("created_at"),
      ]);
      if (error) throw new Error(error.message);
      return { donation, events: events ?? [] };
    },
    refetchInterval: 15_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["donation", id] });

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.donation) return <p className="text-sm text-muted-foreground">Donation not found.</p>;

  const d = data.donation;
  const status = d.status as DonationStatus;
  const mine = d.receiver_id === account?.user.id;

  return (
    <div className="space-y-6">
      <Link
        to="/receiver/discover"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Back to discover
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {d.photo_url && (
          <img src={d.photo_url} alt={d.title} className="h-52 w-full object-cover" />
        )}
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <UrgencyChip
              score={computeUrgency({
                prepared_at: d.prepared_at,
                pickup_deadline: d.pickup_deadline,
                category: d.category,
                quantity_value: Number(d.quantity_value),
              })}
            />
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold">
              {STATUS_LABEL[status]}
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
              <MapPin className="size-3.5" /> {d.donor_address}
            </span>
            {mine && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {d.donor_phone} · {d.donor_org_name}
              </span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface p-4 text-xs">
            <Detail label="Donor" value={d.donor_org_name} />
            <Detail label="Category" value={categoryLabel(d.category)} />
            <Detail
              label="Quantity"
              value={`${Number(d.quantity_value)} ${d.quantity_unit}`}
            />
            <Detail
              label="Prepared at"
              value={new Date(d.prepared_at).toLocaleString()}
            />
            <Detail
              label="Pickup deadline"
              value={new Date(d.pickup_deadline).toLocaleString()}
            />
            <Detail label="Status" value={STATUS_LABEL[status]} />
          </dl>
        </div>
      </div>

      {status === "AVAILABLE" && (
        <Panel title="Accept this donation">
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="Vehicle number (e.g. KA05AB1234)"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          />
          <Action
            disabled={busy || vehicle.length < 3 || !org}
            label="Accept donation"
            onClick={() =>
              run(async () => {
                const res = await acceptDonation({
                  data: {
                    donation_id: id,
                    receiver_org_name: org!.name,
                    receiver_contact_person: org!.contact_person,
                    receiver_phone: org!.phone,
                    vehicle_number: vehicle,
                  },
                });
                if (!res.ok)
                  toast.error(
                    res.reason === "taken"
                      ? "Another NGO accepted this first"
                      : "Your account is not verified",
                  );
                else toast.success("Accepted — now schedule the pickup");
              })
            }
          />
        </Panel>
      )}

      {mine && (status === "ACCEPTED" || status === "PICKUP_SCHEDULED") && (
        <Panel title="Schedule pickup">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              placeholder="Team size"
            />
          </div>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="Note for the donor (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Action
            disabled={busy}
            label={status === "PICKUP_SCHEDULED" ? "Update schedule" : "Confirm schedule"}
            onClick={() =>
              run(async () => {
                const res = await schedulePickup({
                  data: {
                    donation_id: id,
                    pickup_time: pickupTime,
                    team_size: teamSize,
                    pickup_note: note,
                  },
                });
                if (res.ok) toast.success("Pickup scheduled");
                else toast.error("This donation can no longer be scheduled");
              })
            }
          />
        </Panel>
      )}

      {mine && (status === "ACCEPTED" || status === "PICKUP_SCHEDULED") && (
        <Panel title="Verify pickup code at the donor location">
          <input
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-center text-2xl font-extrabold tracking-[0.4em] outline-none focus:border-primary"
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />
          <Action
            disabled={busy || otp.length !== 6}
            label="Verify and collect"
            onClick={() =>
              run(async () => {
                const res = await verifyPickupOtp({ data: { donation_id: id, code: otp } });
                if (res.ok) toast.success("Code verified — food collected");
                else
                  toast.error(
                    res.reason === "wrong_code" ? "That code is incorrect" : "Invalid state",
                  );
                setOtp("");
              })
            }
          />
        </Panel>
      )}

      {mine && status === "COLLECTED" && (
        <Panel title="Confirm delivery">
          <p className="text-sm text-muted-foreground">
            Mark the donation delivered once the food has reached the beneficiaries.
          </p>
          <Action
            disabled={busy}
            label="Mark as delivered"
            onClick={() =>
              run(async () => {
                const res = await markDelivered({ data: { donation_id: id } });
                if (res.ok) toast.success("Thank you — donation completed");
                else toast.error("Invalid state");
              })
            }
          />
        </Panel>
      )}

      {status === "COMPLETED" && (
        <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-5 text-success">
          <CheckCircle2 className="size-5" />
          <p className="text-sm font-semibold">This donation was delivered and completed.</p>
        </div>
      )}

    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm font-bold">{title}</p>
      {children}
    </div>
  );
}

function Action({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
    >
      {label}
    </button>
  );
}
