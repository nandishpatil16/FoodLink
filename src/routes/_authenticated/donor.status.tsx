import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Clock, CheckCircle2, Phone, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, categoryLabel, timeLeftLabel, type DonationStatus } from "@/lib/foodlink";

export const Route = createFileRoute("/_authenticated/donor/status")({
  head: () => ({
    meta: [
      { title: "Donation status — FoodLink" },
      { name: "description", content: "See which NGOs accepted your food donations, live." },
      { property: "og:title", content: "Donation status — FoodLink" },
      { property: "og:description", content: "See which NGOs accepted your donations, live." },
    ],
  }),
  component: () => (
    <VerifiedGate role="donor">
      {() => (
        <AppShell role="donor">
          <StatusBody />
        </AppShell>
      )}
    </VerifiedGate>
  ),
});

const OPEN: DonationStatus[] = ["AVAILABLE"];

function StatusBody() {
  const seen = useRef<Set<string> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["donor-status"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("donations")
        .select("*")
        .not("status", "in", "(COMPLETED,CANCELLED,EXPIRED)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return rows ?? [];
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!data) return;
    const acceptedIds = data.filter((d) => d.receiver_id).map((d) => d.id as string);
    if (seen.current === null) {
      const stored =
        typeof window !== "undefined" ? window.localStorage.getItem("foodlink:accepted") : null;
      seen.current = new Set<string>(stored ? (JSON.parse(stored) as string[]) : acceptedIds);
      if (!stored) {
        window.localStorage.setItem("foodlink:accepted", JSON.stringify(acceptedIds));
        return;
      }
    }
    const fresh = data.filter((d) => d.receiver_id && !seen.current!.has(d.id));
    if (fresh.length > 0) {
      fresh.forEach((d) => {
        seen.current!.add(d.id);
        toast.success(`${d.receiver_org_name ?? "An NGO"} accepted “${d.title}”`, {
          description: "Share your pickup code when the team arrives.",
        });
      });
      window.localStorage.setItem(
        "foodlink:accepted",
        JSON.stringify(Array.from(seen.current!)),
      );
    }
  }, [data]);

  const rows = data ?? [];
  const waiting = rows.filter((r) => OPEN.includes(r.status as DonationStatus));
  const accepted = rows.filter((r) => !OPEN.includes(r.status as DonationStatus));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 text-lg font-extrabold">
          <BellRing className="size-5 text-primary" /> Acceptance status
        </h1>
        <p className="text-sm text-muted-foreground">
          You get a notification here the moment an NGO accepts your food.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Empty text="No live donations. Post surplus food to see acceptance status here." />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-bold">Accepted ({accepted.length})</h2>
            {accepted.length === 0 ? (
              <Empty text="No one has accepted yet." />
            ) : (
              accepted.map((d) => (
                <Link
                  key={d.id}
                  to="/donor/donation/$id"
                  params={{ id: d.id }}
                  className="block rounded-2xl border border-success/30 bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{d.title}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                      <CheckCircle2 className="size-3.5" />
                      {STATUS_LABEL[d.status as DonationStatus]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {categoryLabel(d.category)} · {Number(d.quantity_value)} {d.quantity_unit}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>{d.receiver_org_name ?? "NGO"}</span>
                    {d.receiver_phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3.5" /> {d.receiver_phone}
                      </span>
                    )}
                    {d.vehicle_number && (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="size-3.5" /> {d.vehicle_number}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold">Waiting for acceptance ({waiting.length})</h2>
            {waiting.length === 0 ? (
              <Empty text="Nothing waiting." />
            ) : (
              waiting.map((d) => (
                <Link
                  key={d.id}
                  to="/donor/donation/$id"
                  params={{ id: d.id }}
                  className="block rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{d.title}</p>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      Not accepted yet
                    </span>
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {timeLeftLabel(d.pickup_deadline)}
                  </p>
                </Link>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
