import { createServerFn } from "@tanstack/react-start";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [donations, completed, donors, receivers] = await Promise.all([
      supabaseAdmin.from("donations").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("donations")
        .select("quantity_value", { count: "exact" })
        .in("status", ["DELIVERED", "COMPLETED"]),
      supabaseAdmin
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("role", "donor"),
      supabaseAdmin
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("role", "receiver"),
    ]);

    const meals = (completed.data ?? []).reduce(
      (sum, row: { quantity_value: number | null }) => sum + (row.quantity_value ?? 0),
      0,
    );

    return {
      donationsPosted: donations.count ?? 0,
      donationsCompleted: completed.count ?? 0,
      mealsRescued: meals,
      donors: donors.count ?? 0,
      receivers: receivers.count ?? 0,
    };
  } catch (e) {
    console.warn("[FoodLink] getPublicStats failed:", e);
    return { donationsPosted: 0, donationsCompleted: 0, mealsRescued: 0, donors: 0, receivers: 0 };
  }
});
