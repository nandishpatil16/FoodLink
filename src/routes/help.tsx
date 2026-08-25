import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHeart, LifeBuoy, Mail, MessageCircle, Phone } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & support — FoodLink" },
      {
        name: "description",
        content:
          "Get help with FoodLink: donating surplus food, accepting pickups, OTP handoff and account questions.",
      },
      { property: "og:title", content: "Help & support — FoodLink" },
      {
        property: "og:description",
        content: "Answers to common FoodLink questions plus ways to contact the team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

const FAQ = [
  {
    q: "How do I post surplus food?",
    a: "Open the Donate tab, fill in the food details, quantity, prepared time and pickup deadline, then confirm your pickup address.",
  },
  {
    q: "How does an NGO claim food?",
    a: "Listings are sorted nearest to farthest. Tap a listing to see full details and accept it — the first NGO to accept locks the donation.",
  },
  {
    q: "What is the 6-digit code?",
    a: "The donor holds a pickup code. The NGO enters it on arrival to confirm the handoff, then marks the food collected and delivered.",
  },
  {
    q: "Something looks wrong with my account",
    a: "Open Settings from your profile to update your organisation details, or contact support below.",
  },
];

function HelpPage() {
  return (
    <div className="min-h-screen bg-surface px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HandHeart className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">FoodLink</span>
        </Link>

        <h1 className="mt-8 inline-flex items-center gap-2 text-2xl font-extrabold">
          <LifeBuoy className="size-6 text-primary" /> Help &amp; support
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick answers, plus a real person if you still need one.
        </p>

        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="font-bold">{f.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="font-bold">Contact us</p>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <a href="mailto:support@foodlink.app" className="flex items-center gap-2">
              <Mail className="size-4 text-primary" /> support@foodlink.app
            </a>
            <a href="tel:+911800000000" className="flex items-center gap-2">
              <Phone className="size-4 text-primary" /> +91 1800 000 000
            </a>
            <p className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" /> Replies within 24 hours
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FoodLink. All rights reserved.
        </p>
      </div>
    </div>
  );
}
