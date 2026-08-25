import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { VerifiedGate } from "@/components/VerifiedGate";
import { supabase } from "@/integrations/supabase/client";
import { FOOD_CATEGORIES, computeUrgency } from "@/lib/foodlink";
import { UrgencyChip } from "@/components/UrgencyChip";
import { useAccount, type Organization } from "@/hooks/useAccount";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/donor/donate")({
  head: () => ({
    meta: [
      { title: "Donate food — FoodLink" },
      { name: "description", content: "Post surplus food for verified NGOs to collect." },
      { property: "og:title", content: "Donate food — FoodLink" },
      { property: "og:description", content: "Post surplus food for verified NGOs to collect." },
    ],
  }),
  component: DonatePage,
});

function DonatePage() {
  return (
    <VerifiedGate role="donor">
      {() => (
        <AppShell role="donor">
          <DonateForm />
        </AppShell>
      )}
    </VerifiedGate>
  );
}

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function DonateForm() {
  const navigate = useNavigate();
  const { data: account } = useAccount();
  const org = account?.organization as Organization | undefined;
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "cooked",
    description: "",
    quantity_value: 25,
    quantity_unit: "servings",
    prepared_at: toLocalInput(new Date()),
    pickup_deadline: toLocalInput(new Date(Date.now() + 4 * 3600_000)),
    address: "",
    lat: null as number | null,
    lng: null as number | null,
    safe: false,
  });

  useEffect(() => {
    if (!org) return;
    setForm((f) => ({
      ...f,
      address: f.address || org.address || "",
      lat: f.lat ?? org.lat ?? null,
      lng: f.lng ?? org.lng ?? null,
    }));
  }, [org]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const urgency = computeUrgency({
    prepared_at: new Date(form.prepared_at).toISOString(),
    pickup_deadline: new Date(form.pickup_deadline).toISOString(),
    category: form.category,
    quantity_value: form.quantity_value,
  });

  function onPickPhoto(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
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
        toast.success("Pickup location captured");
      },
      () => toast.error("Could not read your location"),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.safe) {
      toast.error("Please confirm the food safety declaration");
      return;
    }
    if (new Date(form.pickup_deadline).getTime() <= Date.now()) {
      toast.error("Pickup deadline must be in the future");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");

      let photo_url: string | null = null;
      if (file) {
        const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
        const { error: upErr } = await supabase.storage.from("food-photos").upload(path, file);
        if (upErr) throw new Error(upErr.message);
        const { data: signed } = await supabase.storage
          .from("food-photos")
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        photo_url = signed?.signedUrl ?? null;
      }

      const { data: inserted, error } = await supabase
        .from("donations")
        .insert({
          donor_id: userId,
          donor_org_name: org?.name ?? "",
          donor_phone: org?.phone ?? "",
          donor_address: form.address || (org?.address ?? ""),
          title: form.title,
          category: form.category,
          description: form.description,
          quantity_value: form.quantity_value,
          quantity_unit: form.quantity_unit,
          prepared_at: new Date(form.prepared_at).toISOString(),
          pickup_deadline: new Date(form.pickup_deadline).toISOString(),
          photo_url,
          lat: form.lat ?? org?.lat ?? null,
          lng: form.lng ?? org?.lng ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      toast.success("Donation posted — nearby NGOs are being notified");
      navigate({ to: "/donor/donation/$id", params: { id: inserted.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post the donation");
    } finally {
      setSaving(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Donate food</h1>
        <p className="text-sm text-muted-foreground">
          Your organisation details are already saved — just add the food details, timing and confirm
          the pickup address.
        </p>
      </div>

      <label className="flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-card">
        {preview ? (
          <img src={preview} alt="Food preview" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Camera className="size-6" /> Add a photo of the food
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
        />
      </label>

      <div>
        <label className="text-sm font-semibold">Food title</label>
        <input
          className={input}
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Veg biryani and dal from a wedding"
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Category</label>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {FOOD_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("category", c.value)}
              className={cn(
                "rounded-xl border px-2 py-3 text-xs font-semibold",
                form.category === c.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Quantity</label>
          <input
            type="number"
            min={1}
            className={input}
            value={form.quantity_value}
            onChange={(e) => set("quantity_value", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Unit</label>
          <select
            className={input}
            value={form.quantity_unit}
            onChange={(e) => set("quantity_unit", e.target.value)}
          >
            <option value="servings">servings</option>
            <option value="kg">kg</option>
            <option value="packets">packets</option>
            <option value="trays">trays</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Prepared at</label>
          <input
            type="datetime-local"
            className={input}
            value={form.prepared_at}
            onChange={(e) => set("prepared_at", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Pickup deadline</label>
          <input
            type="datetime-local"
            className={input}
            value={form.pickup_deadline}
            onChange={(e) => set("pickup_deadline", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold">Description</label>
        <textarea
          rows={3}
          className={input}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Storage, packing, allergens, anything the NGO should know"
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Confirm pickup address</label>
        <textarea
          rows={2}
          className={input}
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder={org?.address ?? "Where should the NGO come?"}
        />
        <button
          type="button"
          onClick={useMyLocation}
          className="mt-2 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface"
        >
          <MapPin className="size-4" />
          {form.lat ? `Pin set (${form.lat}, ${form.lng})` : "Pin my current location"}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-surface p-4">
        <span className="text-sm font-semibold">Predicted urgency</span>
        <UrgencyChip score={urgency} />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm">
        <input
          type="checkbox"
          checked={form.safe}
          onChange={(e) => set("safe", e.target.checked)}
          className="mt-0.5 size-4"
        />
        <span>
          I declare this food is hygienically stored and safe for human consumption until the
          pickup deadline.
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {saving && <Loader2 className="size-4 animate-spin" />} Post donation
      </button>
    </form>
  );
}
