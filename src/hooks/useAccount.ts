import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AccountRole = "donor" | "receiver" | "admin";

export type Organization = {
  id: string;
  owner_id: string;
  role: AccountRole;
  name: string;
  org_type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  license_number: string;
  service_area: string;
  pickup_radius_km: number;
  verification_status: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  ai_review: {
    decision?: string;
    completeness?: number;
    summary?: string;
    checks?: { label: string; passed: boolean; detail: string }[];
  } | null;
};

export function accountQueryKey() {
  return ["foodlink", "account"] as const;
}

export async function fetchAccount() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase.from("organizations").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  return {
    user,
    profile: profile as { id: string; full_name: string; phone: string } | null,
    organization: (org as Organization | null) ?? null,
    role: (org?.role as AccountRole | undefined) ?? null,
    verified: org?.verification_status === "VERIFIED",
  };
}

export function useAccount() {
  return useQuery({
    queryKey: accountQueryKey(),
    queryFn: fetchAccount,
    staleTime: 30_000,
  });
}
