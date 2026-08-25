import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const orgSchema = z.object({
  role: z.enum(["donor", "receiver"]),
  name: z.string().min(2),
  org_type: z.string().min(1),
  contact_person: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().or(z.literal("")),
  address: z.string().min(4),
  city: z.string().min(1),
  pincode: z.string().min(3),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  license_number: z.string().min(2),
  service_area: z.string().default(""),
  pickup_radius_km: z.number().min(1).max(100).default(10),
  documents: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
});

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => orgSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runVerificationReview } = await import("./verification.server");

    const review = await runVerificationReview(data);
    // Approval step is disabled for now: every registration is activated instantly.
    const status = "VERIFIED" as const;

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(roleError.message);

    const { error } = await supabaseAdmin.from("organizations").upsert(
      {
        owner_id: context.userId,
        role: data.role,
        name: data.name,
        org_type: data.org_type,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        license_number: data.license_number,
        service_area: data.service_area,
        pickup_radius_km: data.pickup_radius_km,
        documents: data.documents,
        verification_status: status,
        ai_review: review,
      },
      { onConflict: "owner_id" },
    );
    if (error) throw new Error(error.message);

    return { status, review };
  });

export const acceptDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        donation_id: z.string().uuid(),
        receiver_org_name: z.string().min(2),
        receiver_contact_person: z.string().min(2),
        receiver_phone: z.string().min(6),
        vehicle_number: z.string().min(3),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: verified } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("owner_id", context.userId)
      .eq("role", "receiver")
      .eq("verification_status", "VERIFIED")
      .maybeSingle();
    if (!verified) return { ok: false as const, reason: "not_verified" };

    // Atomic first-come-first-serve lock: only rows still AVAILABLE are updated.
    const { data: rows, error } = await supabaseAdmin
      .from("donations")
      .update({
        status: "ACCEPTED",
        receiver_id: context.userId,
        receiver_org_name: data.receiver_org_name,
        receiver_contact_person: data.receiver_contact_person,
        receiver_phone: data.receiver_phone,
        vehicle_number: data.vehicle_number,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", data.donation_id)
      .eq("status", "AVAILABLE")
      .select("id, donor_id");

    if (error) throw new Error(error.message);
    const won = rows?.[0];
    if (!won) return { ok: false as const, reason: "taken" };

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await supabaseAdmin
      .from("pickup_codes")
      .upsert({ donation_id: data.donation_id, donor_id: won.donor_id, code });
    await supabaseAdmin.from("donation_events").insert({
      donation_id: data.donation_id,
      status: "ACCEPTED",
      note: `${data.receiver_org_name} accepted this donation`,
      actor_id: context.userId,
    });

    return { ok: true as const };
  });

export const schedulePickup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        donation_id: z.string().uuid(),
        pickup_time: z.string().min(4),
        team_size: z.number().min(1).max(50),
        pickup_note: z.string().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("donations")
      .update({
        status: "PICKUP_SCHEDULED",
        pickup_time: new Date(data.pickup_time).toISOString(),
        team_size: data.team_size,
        pickup_note: data.pickup_note,
      })
      .eq("id", data.donation_id)
      .eq("receiver_id", context.userId)
      .in("status", ["ACCEPTED", "PICKUP_SCHEDULED"])
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) return { ok: false as const, reason: "invalid_state" };

    await supabaseAdmin.from("donation_events").insert({
      donation_id: data.donation_id,
      status: "PICKUP_SCHEDULED",
      note: `Pickup scheduled with a team of ${data.team_size}`,
      actor_id: context.userId,
    });
    return { ok: true as const };
  });

export const verifyPickupOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ donation_id: z.string().uuid(), code: z.string().length(6) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: codeRow } = await supabaseAdmin
      .from("pickup_codes")
      .select("code")
      .eq("donation_id", data.donation_id)
      .maybeSingle();
    if (!codeRow || codeRow.code !== data.code) return { ok: false as const, reason: "wrong_code" };

    const { data: rows, error } = await supabaseAdmin
      .from("donations")
      .update({ status: "COLLECTED", collected_at: new Date().toISOString() })
      .eq("id", data.donation_id)
      .eq("receiver_id", context.userId)
      .in("status", ["ACCEPTED", "PICKUP_SCHEDULED"])
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) return { ok: false as const, reason: "invalid_state" };

    await supabaseAdmin.from("donation_events").insert({
      donation_id: data.donation_id,
      status: "COLLECTED",
      note: "Pickup code verified at the donor location",
      actor_id: context.userId,
    });
    return { ok: true as const };
  });

export const markDelivered = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ donation_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from("donations")
      .update({ status: "COMPLETED", delivered_at: now })
      .eq("id", data.donation_id)
      .eq("receiver_id", context.userId)
      .eq("status", "COLLECTED")
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) return { ok: false as const, reason: "invalid_state" };

    await supabaseAdmin.from("donation_events").insert([
      { donation_id: data.donation_id, status: "DELIVERED", note: "Food reached the beneficiaries", actor_id: context.userId },
      { donation_id: data.donation_id, status: "COMPLETED", note: "Donation completed", actor_id: context.userId },
    ]);
    return { ok: true as const };
  });

export const prepareDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ role: z.enum(["donor", "receiver"]) }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDemoAccount } = await import("./demo.server");
    return ensureDemoAccount(data.role);
  });
