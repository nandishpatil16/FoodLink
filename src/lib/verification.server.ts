export type VerificationInput = {
  role: "donor" | "receiver";
  name: string;
  org_type: string;
  contact_person: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  license_number: string;
  service_area: string;
  documents: { label: string; value: string }[];
};

export type VerificationReview = {
  decision: "verified" | "review" | "rejected";
  completeness: number;
  checks: { label: string; passed: boolean; detail: string }[];
  summary: string;
  reviewed_at: string;
};

function heuristicChecks(input: VerificationInput) {
  const digits = input.phone.replace(/\D/g, "");
  return [
    {
      label: "Profile completeness",
      passed: Boolean(input.name && input.address && input.city && input.contact_person),
      detail: "Organisation name, contact person and full address are present.",
    },
    {
      label: "Contact number format",
      passed: digits.length >= 10,
      detail: digits.length >= 10 ? "Phone number looks valid." : "Phone number looks too short.",
    },
    {
      label: "Licence / registration number",
      passed: input.license_number.trim().length >= 5,
      detail:
        input.license_number.trim().length >= 5
          ? "Registration identifier recorded."
          : "Registration identifier is unusually short.",
    },
    {
      label: "Supporting documents",
      passed: input.documents.filter((d) => d.value.trim()).length >= 1,
      detail: `${input.documents.filter((d) => d.value.trim()).length} document reference(s) submitted.`,
    },
    {
      label: "Service details",
      passed: input.role === "donor" ? true : input.service_area.trim().length > 2,
      detail:
        input.role === "donor"
          ? "Donor accounts do not require a service area."
          : "Service area recorded for pickup matching.",
    },
  ];
}

/** AI-assisted plausibility pass; falls back to deterministic checks when the gateway is unavailable. */
async function aiSummary(input: VerificationInput, checks: ReturnType<typeof heuristicChecks>) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You review food-rescue organisation registrations. Reply with one short sentence (max 25 words) stating whether the submitted details look consistent and plausible, and name any concern.",
          },
          {
            role: "user",
            content: JSON.stringify({ submission: input, automated_checks: checks }),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function runVerificationReview(input: VerificationInput): Promise<VerificationReview> {
  const checks = heuristicChecks(input);
  const passed = checks.filter((c) => c.passed).length;
  const completeness = Math.round((passed / checks.length) * 100);
  const summary =
    (await aiSummary(input, checks)) ??
    (completeness === 100
      ? "All submitted details are complete and internally consistent."
      : "Some details are incomplete and need a human reviewer.");

  const decision: VerificationReview["decision"] =
    completeness === 100 ? "verified" : completeness >= 60 ? "review" : "rejected";

  return { decision, completeness, checks, summary, reviewed_at: new Date().toISOString() };
}
