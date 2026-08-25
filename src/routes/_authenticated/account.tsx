import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building2, LifeBuoy, LogOut, Mail, MapPin, Phone, Settings, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Your account — FoodLink" },
      { name: "description", content: "View your organisation profile and verification status." },
      { property: "og:title", content: "Your account — FoodLink" },
      { property: "og:description", content: "Organisation profile and verification status." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: account, isLoading } = useAccount();
  const org = account?.organization;
  const role = account?.role ?? null;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth/login", replace: true });
  }

  return (
    <AppShell role={role === "receiver" ? "receiver" : "donor"}>
      <div className="space-y-6">
        <h1 className="text-lg font-extrabold">Your account</h1>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="text-sm font-bold">{account?.profile?.full_name || "Member"}</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Mail className="size-4" /> {account?.user.email}
                </p>
                {account?.profile?.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-4" /> {account.profile.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  {role === "receiver" ? "NGO / Receiver" : role === "donor" ? "Donor" : "No role yet"}
                </p>
              </div>
            </div>

            {org ? (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.org_type}</p>
                  </div>
                  <span
                    className={
                      org.verification_status === "VERIFIED"
                        ? "inline-flex items-center gap-1 rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success"
                        : "inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted-foreground"
                    }
                  >
                    {org.verification_status === "VERIFIED" ? (
                      <BadgeCheck className="size-3.5" />
                    ) : (
                      <ShieldAlert className="size-3.5" />
                    )}
                    {org.verification_status}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4" /> {org.address}, {org.city} {org.pincode}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4" /> {org.contact_person} · {org.phone}
                  </p>
                  {org.license_number && <p>Licence: {org.license_number}</p>}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No organisation registered yet.
              </div>
            )}

            <Link
              to="/settings"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <Settings className="size-4" /> Edit profile & settings
            </Link>

            <Link
              to="/help"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground"
            >
              <LifeBuoy className="size-4 text-primary" /> Help & support
            </Link>


            <button
              onClick={signOut}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-destructive"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
