import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Clock, XCircle, Check, LogOut } from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/pending")({
  head: () => ({
    meta: [
      { title: "Verification status — FoodLink" },
      { name: "description", content: "Track the verification status of your FoodLink account." },
      { property: "og:title", content: "Verification status — FoodLink" },
      {
        property: "og:description",
        content: "Your FoodLink account is being reviewed before the portal unlocks.",
      },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { data, isLoading } = useAccount();
  const navigate = useNavigate();
  const org = data?.organization;
  const status = org?.verification_status ?? "PENDING";
  const review = org?.ai_review;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 shadow-card">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your status…</p>
        ) : !org ? (
          <>
            <h1 className="text-xl font-extrabold">No registration found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Finish your donor or receiver registration to request verification.
            </p>
            <Link
              to="/auth/register"
              className="mt-5 inline-block rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Continue registration
            </Link>
          </>
        ) : (
          <>
            <span
              className={
                status === "VERIFIED"
                  ? "flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success"
                  : status === "REJECTED"
                    ? "flex size-12 items-center justify-center rounded-2xl bg-critical-soft text-critical"
                    : "flex size-12 items-center justify-center rounded-2xl bg-warning-soft text-warning-foreground"
              }
            >
              {status === "VERIFIED" ? (
                <ShieldCheck className="size-6" />
              ) : status === "REJECTED" ? (
                <XCircle className="size-6" />
              ) : (
                <Clock className="size-6" />
              )}
            </span>

            <h1 className="mt-4 text-2xl font-extrabold">
              {status === "VERIFIED"
                ? "You're verified"
                : status === "REJECTED"
                  ? "Verification rejected"
                  : "Verification under review"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {review?.summary ??
                "Our team reviews every organisation before the portal unlocks. This usually takes a few hours."}
            </p>

            {review?.checks?.length ? (
              <ul className="mt-5 space-y-2">
                {review.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 rounded-xl bg-surface p-3">
                    <span
                      className={
                        c.passed
                          ? "mt-0.5 text-success"
                          : "mt-0.5 text-critical"
                      }
                    >
                      {c.passed ? <Check className="size-4" /> : <XCircle className="size-4" />}
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold">{c.label}</span>
                      <span className="block text-muted-foreground">{c.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {status === "VERIFIED" && (
                <Link
                  to={org.role === "receiver" ? "/receiver/discover" : "/donor/dashboard"}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Open my portal
                </Link>
              )}
              {status === "REJECTED" && (
                <Link
                  to={org.role === "receiver" ? "/auth/register/receiver" : "/auth/register/donor"}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Resubmit details
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
