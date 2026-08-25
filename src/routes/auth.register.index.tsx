import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, HandHeart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth/register/")({
  head: () => ({
    meta: [
      { title: "Register — FoodLink" },
      {
        name: "description",
        content: "Register as a food donor or as a verified receiving NGO on FoodLink.",
      },
      { property: "og:title", content: "Register — FoodLink" },
      {
        property: "og:description",
        content: "Choose your role and join the FoodLink rescue network.",
      },
    ],
  }),
  component: RegisterChoice,
});

function RegisterChoice() {
  return (
    <div className="min-h-screen bg-surface px-5 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HandHeart className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">FoodLink</span>
        </Link>

        <h1 className="mt-8 text-2xl font-extrabold">How will you use FoodLink?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every account is document-verified before the portal unlocks.
        </p>

        <div className="mt-6 space-y-4">
          <Link
            to="/auth/register/donor"
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary"
          >
            <Building2 className="size-6 shrink-0 text-primary" />
            <div>
              <p className="font-bold">I want to donate food</p>
              <p className="text-sm text-muted-foreground">
                Hotel, marriage hall, caterer, canteen, community kitchen or household.
              </p>
            </div>
            <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground" />
          </Link>

          <Link
            to="/auth/register/receiver"
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:border-success"
          >
            <Users className="size-6 shrink-0 text-success" />
            <div>
              <p className="font-bold">I want to collect food</p>
              <p className="text-sm text-muted-foreground">
                NGO, shelter home, orphanage, old age home or religious trust.
              </p>
            </div>
            <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground" />
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/auth/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
