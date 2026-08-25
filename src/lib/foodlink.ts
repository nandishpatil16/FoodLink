export type DonationStatus =
  | "AVAILABLE"
  | "ACCEPTED"
  | "PICKUP_SCHEDULED"
  | "COLLECTED"
  | "DELIVERED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "FLAGGED";

export const FOOD_CATEGORIES = [
  { value: "cooked", label: "Cooked Meals" },
  { value: "bakery", label: "Bakery" },
  { value: "packaged", label: "Packaged" },
  { value: "fruits", label: "Fruits & Veg" },
  { value: "dairy", label: "Dairy" },
  { value: "others", label: "Others" },
] as const;

export function categoryLabel(value: string) {
  return FOOD_CATEGORIES.find((c) => c.value === value)?.label ?? "Others";
}

export const DONOR_TYPES = [
  "Hotel / Restaurant",
  "Marriage Hall / Event",
  "Caterer",
  "Hostel / Canteen",
  "Community Kitchen",
  "Household",
];

export const RECEIVER_TYPES = [
  "NGO",
  "Shelter Home",
  "Community Kitchen",
  "Orphanage",
  "Religious Trust",
  "Old Age Home",
];

export const STATUS_FLOW: DonationStatus[] = [
  "AVAILABLE",
  "ACCEPTED",
  "PICKUP_SCHEDULED",
  "COLLECTED",
  "DELIVERED",
  "COMPLETED",
];

export const STATUS_LABEL: Record<DonationStatus, string> = {
  AVAILABLE: "Available",
  ACCEPTED: "Accepted",
  PICKUP_SCHEDULED: "Pickup scheduled",
  COLLECTED: "Collected",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  FLAGGED: "Flagged",
};

export type UrgencyLevel = "critical" | "high" | "normal";

export function urgencyLevel(score: number): UrgencyLevel {
  if (score >= 9) return "critical";
  if (score >= 5) return "high";
  return "normal";
}

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  critical: "Critical",
  high: "High",
  normal: "Normal",
};

/** Mirrors the database urgency_score() function so the client can sort/score locally. */
export function computeUrgency(input: {
  prepared_at: string;
  pickup_deadline: string;
  category: string;
  quantity_value: number;
}) {
  const now = Date.now();
  const deadline = new Date(input.pickup_deadline).getTime();
  const prepared = new Date(input.prepared_at).getTime();
  const hoursLeft = (deadline - now) / 3_600_000;
  const hoursOld = (now - prepared) / 3_600_000;

  let score = 0;
  if (hoursLeft <= 0) score += 5;
  else if (hoursLeft <= 1) score += 4.5;
  else if (hoursLeft <= 3) score += 3.5;
  else if (hoursLeft <= 6) score += 2.5;
  else if (hoursLeft <= 12) score += 1.5;
  else score += 0.5;

  if (hoursOld >= 6) score += 2.5;
  else if (hoursOld >= 3) score += 1.5;
  else if (hoursOld >= 1) score += 0.8;
  else score += 0.2;

  const perish: Record<string, number> = {
    cooked: 1.5,
    dairy: 1.4,
    bakery: 1.0,
    fruits: 0.8,
    packaged: 0.2,
  };
  score += perish[input.category] ?? 0.7;

  const q = Number(input.quantity_value) || 0;
  if (q >= 200) score += 1;
  else if (q >= 100) score += 0.7;
  else if (q >= 30) score += 0.4;
  else score += 0.1;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function timeLeftLabel(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Deadline passed";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min left`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr left`;
  return `${Math.round(hours / 24)} d left`;
}

export function distanceKm(
  a: { lat?: number | null | undefined; lng?: number | null | undefined },
  b: { lat?: number | null | undefined; lng?: number | null | undefined },
) {

  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}
