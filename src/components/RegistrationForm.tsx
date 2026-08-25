import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, HandHeart, Check, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitVerification } from "@/lib/foodlink.functions";
import { DONOR_TYPES, RECEIVER_TYPES } from "@/lib/foodlink";
import { cn } from "@/lib/utils";

type Role = "donor" | "receiver";

const STEPS = ["Account", "Organisation", "Location", "Documents"];

export function RegistrationForm({ role }: { role: Role }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    name: "",
    org_type: role === "donor" ? DONOR_TYPES[0] : RECEIVER_TYPES[0],
    contact_person: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    lat: null as number | null,
    lng: null as number | null,
    license_number: "",
    service_area: "",
    pickup_radius_km: 10,
    doc_id: "",
    doc_extra: "",
    agree: false,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const types = role === "donor" ? DONOR_TYPES : RECEIVER_TYPES;

  function validStep() {
    if (step === 0)
      return form.full_name.length > 1 && form.email.includes("@") && form.password.length >= 6;
    if (step === 1)
      return form.name.length > 1 && form.contact_person.length > 1 && form.phone.length >= 6;
    if (step === 2)
      return form.address.length > 3 && form.city.length > 0 && form.pincode.length >= 3;
    return form.license_number.length > 1 && form.agree;
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", Number(pos.coords.latitude.toFixed(6)));
        set("lng", Number(pos.coords.longitude.toFixed(6)));
        toast.success("Location captured");
      },
      () => toast.error("Could not read your location"),
    );
  }

  async function submit() {
    setLoading(true);
    try {
      const { data: existing } = await supabase.auth.getUser();
      if (!existing.user) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/login`,
            data: { full_name: form.full_name, phone: form.phone },
          },
        });
        if (error) throw new Error(error.message);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.success("Account created. Confirm your email, then sign in to finish verification.");
        navigate({ to: "/auth/login" });
        return;
      }

      const result = await submitVerification({
        data: {
          role,
          name: form.name,
          org_type: form.org_type,
          contact_person: form.contact_person,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
          lat: form.lat,
          lng: form.lng,
          license_number: form.license_number,
          service_area: form.service_area,
          pickup_radius_km: form.pickup_radius_km,
          documents: [
            { label: "Registration / ID proof", value: form.license_number },
            { label: "Supporting note", value: form.doc_extra },
          ],
        },
      });

      void result;
      toast.success(
        role === "donor" ? "You're all set — post your first donation." : "You're all set — nearby donors are listed below.",
      );
      navigate({ to: role === "donor" ? "/donor/donate" : "/receiver/discover" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-surface px-5 py-8">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HandHeart className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">FoodLink</span>
        </Link>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h1 className="text-2xl font-extrabold">
            {role === "donor" ? "Donor registration" : "Receiver registration"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "donor"
              ? "Hotels, halls, caterers, canteens and households."
              : "NGOs, shelters, orphanages and community kitchens."}
          </p>

          <ol className="mt-6 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />
                )}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>

          <div className="mt-6 space-y-4">
            {step === 0 && (
              <>
                <div>
                  <label className="text-sm font-semibold">Your full name</label>
                  <input
                    className={input}
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <input
                    type="email"
                    className={input}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Password</label>
                  <input
                    type="password"
                    className={input}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="text-sm font-semibold">
                    {role === "donor" ? "Business / household name" : "Organisation name"}
                  </label>
                  <input
                    className={input}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Type</label>
                  <select
                    className={input}
                    value={form.org_type}
                    onChange={(e) => set("org_type", e.target.value)}
                  >
                    {types.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">Contact person</label>
                    <input
                      className={input}
                      value={form.contact_person}
                      onChange={(e) => set("contact_person", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Phone</label>
                    <input
                      className={input}
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-sm font-semibold">Full address</label>
                  <textarea
                    rows={3}
                    className={input}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">City</label>
                    <input
                      className={input}
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Pincode</label>
                    <input
                      className={input}
                      value={form.pincode}
                      onChange={(e) => set("pincode", e.target.value)}
                    />
                  </div>
                </div>
                {role === "receiver" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold">Service area</label>
                      <input
                        className={input}
                        value={form.service_area}
                        onChange={(e) => set("service_area", e.target.value)}
                        placeholder="Wards / neighbourhoods covered"
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface"
                >
                  <MapPin className="size-4" />
                  {form.lat ? `Location set (${form.lat}, ${form.lng})` : "Use my GPS location"}
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className="text-sm font-semibold">
                    {role === "donor"
                      ? "FSSAI / GST / ID number"
                      : "NGO registration / 12A / Trust number"}
                  </label>
                  <input
                    className={input}
                    value={form.license_number}
                    onChange={(e) => set("license_number", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Supporting details (optional)</label>
                  <textarea
                    rows={3}
                    className={input}
                    value={form.doc_extra}
                    onChange={(e) => set("doc_extra", e.target.value)}
                    placeholder={
                      role === "donor"
                        ? "Kitchen capacity, typical surplus, hygiene practices…"
                        : "Beneficiaries served daily, storage, transport available…"
                    }
                  />
                </div>
                <label className="flex items-start gap-3 rounded-xl bg-surface p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) => set("agree", e.target.checked)}
                    className="mt-0.5 size-4"
                  />
                  <span>
                    I declare that the information is accurate and that{" "}
                    {role === "donor"
                      ? "I will only donate food that is safe for human consumption."
                      : "food collected will be distributed only to people in need, and hygienically handled."}
                  </span>
                </label>
              </>
            )}
          </div>

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate({ to: "/auth/register" }) : setStep(step - 1))}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!validStep()}
                onClick={() => setStep(step + 1)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={!validStep() || loading}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading && <Loader2 className="size-4 animate-spin" />} Submit for verification
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/auth/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
