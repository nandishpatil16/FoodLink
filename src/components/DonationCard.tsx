import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Utensils } from "lucide-react";
import { UrgencyChip } from "./UrgencyChip";
import { categoryLabel, timeLeftLabel, type DonationStatus, STATUS_LABEL } from "@/lib/foodlink";

export type DonationCardData = {
  id: string;
  title: string;
  category: string;
  quantity_value: number;
  quantity_unit: string;
  pickup_deadline: string;
  photo_url: string | null;
  donor_org_name: string;
  status: DonationStatus;
  urgency: number;
  distance?: number | null;
};

export function DonationCard({
  donation,
  href,
  showStatus,
}: {
  donation: DonationCardData;
  href: string;
  showStatus?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-float/40"
    >
      <div className="relative h-36 bg-surface">
        {donation.photo_url ? (
          <img
            src={donation.photo_url}
            alt={donation.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Utensils className="size-8" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <UrgencyChip score={donation.urgency} />
        </div>
        {showStatus && (
          <span className="absolute right-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
            {STATUS_LABEL[donation.status]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-tight">{donation.title}</h3>
        <p className="text-sm text-muted-foreground">
          {categoryLabel(donation.category)} · {donation.quantity_value} {donation.quantity_unit}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {timeLeftLabel(donation.pickup_deadline)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {donation.distance != null ? `${donation.distance} km` : donation.donor_org_name}
          </span>
        </div>
      </div>
    </Link>
  );
}
