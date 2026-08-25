import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO = {
  donor: {
    email: "demo.donor@foodlink.app",
    password: "FoodLinkDemo#2026",
    full_name: "Ravi Kulkarni",
    phone: "+91 98450 11223",
    org: {
      name: "Grand Palace Hotel",
      org_type: "Hotel / Restaurant",
      contact_person: "Ravi Kulkarni",
      address: "14, MG Road, Ashok Nagar",
      city: "Bengaluru",
      pincode: "560001",
      lat: 12.9752,
      lng: 77.6055,
      license_number: "FSSAI-11220003000123",
      service_area: "",
      pickup_radius_km: 10,
    },
  },
  receiver: {
    email: "demo.ngo@foodlink.app",
    password: "FoodLinkDemo#2026",
    full_name: "Anita Deshpande",
    phone: "+91 98860 55441",
    org: {
      name: "Annapurna Seva Trust",
      org_type: "NGO",
      contact_person: "Anita Deshpande",
      address: "Plot 8, 5th Cross, Indiranagar",
      city: "Bengaluru",
      pincode: "560038",
      lat: 12.9719,
      lng: 77.6412,
      license_number: "NGO-KA-2019-4471",
      service_area: "East & Central Bengaluru",
      pickup_radius_km: 15,
    },
  },
} as const;

async function findUserByEmail(email: string) {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return data?.users?.find((u) => u.email === email) ?? null;
}

async function seedDonations(donorId: string) {
  const { count } = await supabaseAdmin
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("donor_id", donorId);
  if ((count ?? 0) > 0) return;

  const now = Date.now();
  const iso = (mins: number) => new Date(now + mins * 60000).toISOString();
  const org = DEMO.donor.org;

  await supabaseAdmin.from("donations").insert([
    {
      donor_id: donorId,
      donor_org_name: org.name,
      donor_phone: DEMO.donor.phone,
      donor_address: `${org.address}, ${org.city} ${org.pincode}`,
      title: "Veg biryani & raita",
      category: "cooked",
      description: "Freshly prepared buffet surplus, kept in warming trays.",
      quantity_value: 120,
      quantity_unit: "servings",
      prepared_at: iso(-150),
      pickup_deadline: iso(110),
      lat: org.lat,
      lng: org.lng,
    },
    {
      donor_id: donorId,
      donor_org_name: org.name,
      donor_phone: DEMO.donor.phone,
      donor_address: `${org.address}, ${org.city} ${org.pincode}`,
      title: "Assorted breads & buns",
      category: "bakery",
      description: "Unsold bakery counter stock, packed in trays.",
      quantity_value: 45,
      quantity_unit: "packets",
      prepared_at: iso(-320),
      pickup_deadline: iso(400),
      lat: 12.9611,
      lng: 77.6387,
    },
    {
      donor_id: donorId,
      donor_org_name: org.name,
      donor_phone: DEMO.donor.phone,
      donor_address: `${org.address}, ${org.city} ${org.pincode}`,
      title: "Sealed water & juice packs",
      category: "packaged",
      description: "Sealed beverage cartons left over from a conference.",
      quantity_value: 200,
      quantity_unit: "packs",
      prepared_at: iso(-60),
      pickup_deadline: iso(1400),
      lat: 12.9899,
      lng: 77.5901,
    },
  ]);
}

export async function ensureDemoAccount(role: "donor" | "receiver") {
  const spec = DEMO[role];
  let user = await findUserByEmail(spec.email);

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      email_confirm: true,
      user_metadata: { full_name: spec.full_name, phone: spec.phone },
    });
    if (error && !error.message.includes("already")) throw new Error(error.message);
    user = data?.user ?? (await findUserByEmail(spec.email));
  } else {
    await supabaseAdmin.auth.admin.updateUserById(user.id, { password: spec.password });
  }
  if (!user) throw new Error("Could not prepare the demo account");

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: user.id, full_name: spec.full_name, phone: spec.phone });
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role }, { onConflict: "user_id,role" });
  await supabaseAdmin.from("organizations").upsert(
    {
      owner_id: user.id,
      role,
      email: spec.email,
      phone: spec.phone,
      verification_status: "VERIFIED",
      documents: [{ label: "Registration certificate", value: "demo-certificate.pdf" }],
      ai_review: {
        decision: "verified",
        completeness: 100,
        checks: [],
        summary: "Demo account pre-verified for evaluation.",
        reviewed_at: new Date().toISOString(),
      },
      ...spec.org,
    },
    { onConflict: "owner_id" },
  );

  if (role === "donor") await seedDonations(user.id);

  return { email: spec.email, password: spec.password };
}
