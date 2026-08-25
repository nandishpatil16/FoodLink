import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Save, ShieldCheck, LifeBuoy } from "lucide-react";

import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAccount, accountQueryKey } from "@/hooks/useAccount";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FoodLink" },
      { name: "description", content: "Edit your profile, organisation details and app preferences." },
      { property: "og:title", content: "Settings — FoodLink" },
      { property: "og:description", content: "Edit profile, organisation details and preferences." },
    ],
  }),
  component: SettingsPage,
});

const PREF_KEY = "foodlink:prefs";

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: account, isLoading } = useAccount();
  const [prefs, setPrefs] = useState({ notifications: true, autoLocation: true });
  const org = account?.organization ?? null;
  const role = account?.role === "receiver" ? "receiver" : "donor";


  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [orgForm, setOrgForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    pickup_radius_km: 10,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account?.profile) {
      setFullName(account.profile.full_name ?? "");
      setPhone(account.profile.phone ?? "");
    }
    if (org) {
      setOrgForm({
        name: org.name ?? "",
        contact_person: org.contact_person ?? "",
        phone: org.phone ?? "",
        address: org.address ?? "",
        city: org.city ?? "",
        pincode: org.pincode ?? "",
        pickup_radius_km: org.pickup_radius_km ?? 10,
      });
    }
  }, [account?.profile, org]);

  useEffect(() => {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      try {
        setPrefs((p) => ({ ...p, ...JSON.parse(raw) }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  function togglePref(key: keyof typeof prefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function save() {
    if (!account?.user) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", account.user.id);
      if (pErr) throw new Error(pErr.message);

      if (org) {
        const { error: oErr } = await supabase
          .from("organizations")
          .update(orgForm)
          .eq("id", org.id);
        if (oErr) throw new Error(oErr.message);
      }

      await queryClient.invalidateQueries({ queryKey: accountQueryKey() });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth/login", replace: true });
  }

  return (
    <AppShell role={role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-extrabold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Edit your profile, organisation details and app preferences.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <Card title="Your profile">
              <Field label="Full name" value={fullName} onChange={setFullName} />
              <Field label="Phone" value={phone} onChange={setPhone} />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Email</p>
                <p className="mt-1 text-sm">{account?.user.email}</p>
              </div>
            </Card>

            {org && (
              <Card title={role === "receiver" ? "Organisation (NGO)" : "Organisation (donor)"}>
                <Field
                  label="Organisation name"
                  value={orgForm.name}
                  onChange={(v) => setOrgForm({ ...orgForm, name: v })}
                />
                <Field
                  label="Contact person"
                  value={orgForm.contact_person}
                  onChange={(v) => setOrgForm({ ...orgForm, contact_person: v })}
                />
                <Field
                  label="Organisation phone"
                  value={orgForm.phone}
                  onChange={(v) => setOrgForm({ ...orgForm, phone: v })}
                />
                <Field
                  label={role === "receiver" ? "Base address" : "Pickup address"}
                  value={orgForm.address}
                  onChange={(v) => setOrgForm({ ...orgForm, address: v })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="City"
                    value={orgForm.city}
                    onChange={(v) => setOrgForm({ ...orgForm, city: v })}
                  />
                  <Field
                    label="Pincode"
                    value={orgForm.pincode}
                    onChange={(v) => setOrgForm({ ...orgForm, pincode: v })}
                  />
                </div>
              </Card>
            )}

            <Card title="Preferences">
              <Toggle
                icon={Bell}
                label="Notifications"
                hint={
                  role === "donor"
                    ? "Alert me when an NGO accepts my donation"
                    : "Alert me when urgent food is posted nearby"
                }
                on={prefs.notifications}
                onClick={() => togglePref("notifications")}
              />
              <Toggle
                icon={ShieldCheck}
                label="Use my current location"
                hint="Auto-fill GPS for pickup distance"
                on={prefs.autoLocation}
                onClick={() => togglePref("autoLocation")}
              />
            </Card>

            <Link
              to="/help"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground"
            >
              <LifeBuoy className="size-4 text-primary" /> Help &amp; support
            </Link>




            <button
              onClick={save}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <Save className="size-4" /> {saving ? "Saving…" : "Save changes"}
            </button>

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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm font-bold">{title}</p>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Toggle({
  icon: Icon,
  label,
  hint,
  on,
  onClick,
}: {
  icon: typeof Bell;
  label: string;
  hint: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left"
    >
      <Icon className="size-4 text-primary" />
      <span className="flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        className={
          on
            ? "flex h-6 w-11 items-center rounded-full bg-primary p-0.5"
            : "flex h-6 w-11 items-center rounded-full bg-border p-0.5"
        }
      >
        <span
          className={
            on
              ? "size-5 translate-x-5 rounded-full bg-card transition-transform"
              : "size-5 rounded-full bg-card transition-transform"
          }
        />
      </span>
    </button>
  );
}
