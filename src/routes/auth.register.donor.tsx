import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/auth/register/donor")({
  head: () => ({
    meta: [
      { title: "Donor registration — FoodLink" },
      {
        name: "description",
        content:
          "Register your hotel, hall, canteen or household as a verified FoodLink food donor.",
      },
      { property: "og:title", content: "Donor registration — FoodLink" },
      {
        property: "og:description",
        content: "Four quick steps to start rescuing your surplus food.",
      },
    ],
  }),
  component: () => <RegistrationForm role="donor" />,
});
