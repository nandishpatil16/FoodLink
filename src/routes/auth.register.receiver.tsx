import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/auth/register/receiver")({
  head: () => ({
    meta: [
      { title: "Receiver registration — FoodLink" },
      {
        name: "description",
        content:
          "Register your NGO, shelter or community kitchen to collect verified surplus food nearby.",
      },
      { property: "og:title", content: "Receiver registration — FoodLink" },
      {
        property: "og:description",
        content: "Get verified and start collecting urgency-ranked food donations.",
      },
    ],
  }),
  component: () => <RegistrationForm role="receiver" />,
});
