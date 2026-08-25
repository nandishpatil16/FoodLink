import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  HandHeart,
  Building2,
  Users,
  ShieldCheck,
  Timer,
  KeyRound,
  ArrowRight,
  Utensils,
} from "lucide-react";
import { getPublicStats } from "@/lib/stats.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodLink — Rescue Safe Surplus Food in Real Time" },
      {
        name: "description",
        content:
          "FoodLink connects hotels, halls and households with verified NGOs and shelters so safe surplus food reaches people instead of bins.",
      },
      { property: "og:title", content: "FoodLink — Rescue Safe Surplus Food in Real Time" },
      {
        property: "og:description",
        content:
          "A transparent food rescue network: post surplus food, verified NGOs accept it, OTP-verified pickup confirms the handoff.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Get verified",
    body: "Donors and NGOs register with documents. An automated review plus a human check unlocks the portal.",
  },
  {
    icon: Utensils,
    title: "Post surplus food",
    body: "Quantity, preparation time, pickup deadline, photo and GPS — with a food safety declaration.",
  },
  {
    icon: Timer,
    title: "Urgency-ranked matching",
    body: "NGOs see food scored 0–10 by time left, food age, perishability and quantity. First to accept locks it.",
  },
  {
    icon: KeyRound,
    title: "OTP-verified handoff",
    body: "The donor holds a 6-digit code. The NGO enters it on arrival, then marks the food collected and delivered.",
  },
];

function Landing() {
  const { data: stats } = useQuery({
    queryKey: ["foodlink", "public-stats"],
    queryFn: () => getPublicStats(),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HandHeart className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">FoodLink</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/auth/login"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface"
          >
            Login
          </Link>
          <Link
            to="/auth/register"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Register
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
          Zero safe food wasted · Zero people going hungry
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Rescue surplus food. Feed people.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          Hotels, marriage halls and restaurants throw away safe food every day while shelters
          nearby run short. FoodLink makes that handoff real-time, verified and accountable.
        </p>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <Building2 className="mx-auto size-6 text-primary" />
            <p className="mt-2 font-bold">Donors</p>
            <p className="text-sm text-muted-foreground">Hotels · Halls · Kitchens · Homes</p>
          </div>
          <div className="flex items-center justify-center gap-1 text-primary">
            <span className="hidden h-px w-8 bg-primary/40 sm:block" />
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              FoodLink
            </span>
            <span className="hidden h-px w-8 bg-primary/40 sm:block" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <Users className="mx-auto size-6 text-success" />
            <p className="mt-2 font-bold">Receivers</p>
            <p className="text-sm text-muted-foreground">NGOs · Shelters · Trusts</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-extrabold">Choose your role</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            to="/auth/register/donor"
            className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-colors hover:border-primary"
          >
            <Building2 className="size-6 text-primary" />
            <p className="mt-3 text-lg font-bold">I have surplus food</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Register your hotel, hall, canteen or household and post safe leftover food in
              minutes.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Register as donor <ArrowRight className="size-4" />
            </span>
          </Link>
          <Link
            to="/auth/register/receiver"
            className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-colors hover:border-success"
          >
            <Users className="size-6 text-success" />
            <p className="mt-3 text-lg font-bold">I distribute food</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Register your NGO, shelter or community kitchen and collect urgency-ranked food
              nearby.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-success">
              Register as receiver <ArrowRight className="size-4" />
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-extrabold">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <s.icon className="size-5 text-primary" />
              <p className="mt-3 font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-extrabold">Donations through FoodLink</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live numbers straight from the platform — nothing inflated.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Donations posted" value={stats?.donationsPosted ?? 0} />
          <StatCard label="Pickups completed" value={stats?.donationsCompleted ?? 0} />
          <StatCard label="Meals rescued" value={stats?.mealsRescued ?? 0} />
          <StatCard label="Registered organisations" value={(stats?.donors ?? 0) + (stats?.receivers ?? 0)} />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>FoodLink · Smart Food Rescue &amp; Leftover Food Management</p>
        <p className="mt-2 text-xs">
          © {new Date().getFullYear()} FoodLink. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
      <p className="text-3xl font-extrabold text-primary">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

