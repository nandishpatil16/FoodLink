# FoodLink — Smart Food Rescue Platform

A real-time platform connecting surplus-food donors (hotels, halls, households) with verified NGOs and shelters, with verification, urgency scoring, atomic first-come-first-serve accepts, and OTP-verified pickups.

## Look and feel

Reference: the uploaded NearBook screenshot — clean white surfaces, soft rounded cards, dark navy headings, a single blue accent, a top search bar, an icon-tile category row, and a fixed bottom nav bar.

- Bottom nav (mobile + tablet, persistent): Home · My Donations · **Donate Food** (raised circular blue FAB in the middle, camera/plus icon, label under it) · Favourites/Saved · Profile. Labels swap per role (donor sees "Donate Food", receiver sees "Discover").
- Category tile row on the discover/home screens: Cooked Meals, Bakery, Packaged, Fruits & Veg, Dairy, Others, View All.
- Cards: rounded, light shadow, photo with a heart/save button top-right, urgency chip (Critical / High / Normal).
- Palette: white background, slate surfaces, navy foreground, blue primary — with green reserved for "safe/verified" and amber/red for urgency. All defined as design tokens in `src/styles.css`.

## Roles and flows

**Donor** — register (org info → address + GPS → documents → agreement), wait through AI + team verification, then post surplus food with photo, quantity, prepared-at, pickup deadline, GPS and a food-safety declaration. Sees which NGO accepted (name, contact, vehicle), a 6-digit pickup OTP, full status timeline and history.

**Receiver (NGO)** — register (org type, service area, pickup radius, certificate), get verified, browse food sorted by urgency score with distance/urgency/category filters, accept a donation by submitting NGO name, contact person and vehicle number, schedule pickup, verify with the donor's OTP on arrival, then mark Collected → Delivered.

**Admin** — backend only. Verification records and status transitions exist in the database; no admin UI is built.

## Pages

| Page | URL |
| --- | --- |
| Landing (donor ↔ FoodLink ↔ NGO bridge, how it works, role cards) | `/` |
| Role selection | `/auth/register` |
| Donor registration (4 steps) | `/auth/register/donor` |
| Receiver registration (4 steps) | `/auth/register/receiver` |
| Verification pending | `/auth/register/donor/pending`, `/auth/register/receiver/pending` |
| Login (with demo shortcuts) | `/auth/login` |
| Donor dashboard | `/donor/dashboard` |
| Post food | `/donor/donate` |
| Donation detail (OTP, receiver contact, timeline) | `/donor/donation/$id` |
| Receiver dashboard | `/receiver/dashboard` |
| Discover food (urgency-sorted, filters, map toggle) | `/receiver/discover` |
| Accepted detail (schedule → OTP → collected → delivered) | `/receiver/accepted/$id` |

## Technical approach

- **Lovable Cloud** provides the database, auth and server logic. Enabled as the first step.
- Tables: `profiles`, `user_roles` (separate table, enum `donor | receiver | admin`), `organizations` (donor/receiver details, verification status, documents), `donations`, `donation_events` (status timeline), `pickups` (schedule, team size, vehicle, OTP hash). RLS on every table plus explicit grants; donors only see their own donations, receivers see `AVAILABLE` ones plus those they accepted.
- **FCFS accept** runs in a server function as a single conditional update (`... WHERE id = $1 AND status = 'AVAILABLE'`). One affected row = accepted; zero = "another NGO just took this".
- **OTP**: generated on accept, shown only to the donor, verified server-side; verification moves the donation to `COLLECTED`.
- **Urgency score (0–10)** computed from time remaining to deadline, time since preparation, category perishability and quantity — as a database-side expression so the discover list can sort on it.
- **Verification**: registration writes a `PENDING` organization, an AI check (completeness, duplicate detection, document consistency, suspicious flags) via Lovable AI records a result and moves it to `UNDER_REVIEW`; a manual flip to `VERIFIED` unlocks posting/accepting. Demo accounts are seeded pre-verified so the flows are usable immediately.
- Route guards: donor and receiver areas live under authenticated layouts that redirect unverified or wrong-role users.
- Photos go to Cloud storage; GPS captured via the browser geolocation API with manual address fallback.
- Each route gets its own SEO metadata.

## Build order

1. Enable Cloud, design tokens, app shell with the bottom nav + FAB.
2. Database schema, RLS, grants, seeded demo data.
3. Landing, role selection, registration wizards, pending, login.
4. Donor dashboard, post food, donation detail with OTP.
5. Receiver dashboard, discover with urgency and filters, accept + schedule + OTP + delivery.
