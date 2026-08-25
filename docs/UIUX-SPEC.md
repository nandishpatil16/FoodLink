# FoodLink — UI/UX Specification

Covers layout, spacing, typography and behaviour for **mobile**, **tablet** and **desktop**.

---

## 1. Design tokens

All tokens live in `src/styles.css` (OKLCH). Never hardcode colors in components.

| Token | Light value | Use |
| --- | --- | --- |
| `--background` | `oklch(1 0 0)` | Page background |
| `--foreground` | `oklch(0.21 0.05 258)` | Navy body/heading text |
| `--surface` | `oklch(0.972 0.008 250)` | Search bar, tiles, inset panels |
| `--card` | `oklch(1 0 0)` | Cards, header, bottom nav |
| `--primary` | `oklch(0.56 0.19 258)` | Blue accent, FAB, CTAs |
| `--primary-soft` | `oklch(0.95 0.03 255)` | Active nav pill, chips |
| `--success` / `--success-soft` | green | Verified / delivered |
| `--warning` / `--warning-soft` | amber | High urgency |
| `--critical` / `--critical-soft` | red | Critical urgency, destructive |
| `--muted-foreground` | `oklch(0.55 0.03 257)` | Secondary text, icons |
| `--border` | `oklch(0.92 0.01 255)` | Hairlines |

Radius scale: `--radius: 0.875rem` → `rounded-xl` cards, `rounded-2xl` panels, `rounded-full` FAB/chips.
Shadows: `--shadow-card` (resting cards), `--shadow-float` (FAB, sticky CTA).
Font: **Plus Jakarta Sans** for both body and display.

---

## 2. Breakpoints (Tailwind v4 defaults)

| Name | Min width | Target |
| --- | --- | --- |
| base | 0 | Phone (360–639 px) |
| `sm` | 640 px | Large phone / small tablet portrait |
| `md` | 768 px | Tablet |
| `lg` | 1024 px | Laptop |
| `xl` | 1280 px | Desktop |

Content container: `mx-auto max-w-5xl px-4` (mobile) → `sm:px-6` → `lg:px-8`.
Landing page uses `max-w-6xl`; forms and detail pages use `max-w-2xl` for readable line length.

---

## 3. Type scale

| Role | Mobile | Tablet (`sm`/`md`) | Desktop (`lg`+) | Classes |
| --- | --- | --- | --- | --- |
| Hero headline | 30 px / 1.1 | 40 px | 56 px | `text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight` |
| Page title (H1) | 22 px | 26 px | 30 px | `text-xl sm:text-2xl lg:text-3xl font-extrabold` |
| Section title (H2) | 18 px | 20 px | 24 px | `text-lg sm:text-xl lg:text-2xl font-bold` |
| Card title (H3) | 16 px | 16 px | 18 px | `text-base lg:text-lg font-semibold` |
| Body | 14 px | 15 px | 16 px | `text-sm lg:text-base` |
| Secondary / meta | 12 px | 12 px | 13 px | `text-xs text-muted-foreground` |
| Chips, nav labels | 12 px | 12 px | 12 px | `text-xs font-medium` |
| Numeric stats | 24 px | 30 px | 36 px | `text-2xl sm:text-3xl lg:text-4xl font-extrabold` |

Line height: headings `leading-tight`, body `leading-relaxed`. Heading letter-spacing `-0.02em` (set globally in `styles.css`).

---

## 4. Spacing rhythm

| Context | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Page horizontal padding | 16 px | 24 px | 32 px |
| Vertical section gap | 24 px | 32 px | 48 px |
| Card padding | 16 px | 20 px | 24 px |
| Grid gap | 12 px | 16 px | 20 px |
| Bottom safe area | `pb-28` (nav clearance) | `pb-28` | `pb-12` (nav can hide at `lg`) |

Touch targets: minimum **44 × 44 px**; nav items `py-2` with `size-5` icons; FAB is `size-14`.

---

## 5. Layout per device

### Mobile (base)
- Sticky header: logo + inline search (search wraps to its own full-width row via `order-3 w-full`).
- Single-column content stack.
- Fixed bottom nav with 5 slots; middle slot is a raised circular primary FAB (`-mt-7`).
- Forms are one field per row; sticky primary action at the bottom of the form card.
- Cards full-bleed within the 16 px gutter, photo aspect `4/3`.

### Tablet (`sm` / `md`)
- Header becomes a single row: logo · search (flex-1) · actions.
- Card grids go 2-up: `grid gap-4 sm:grid-cols-2`.
- Category tiles: 4 per row (`grid-cols-4 sm:grid-cols-6`).
- Forms use 2-column pairs for short fields: `sm:grid-cols-2`.
- Bottom nav stays (centered, `max-w-3xl`).

### Desktop (`lg` / `xl`)
- Content centered at `max-w-5xl`; landing sections at `max-w-6xl`.
- Card grids 3-up: `lg:grid-cols-3`.
- Detail pages: two-column split — main content `lg:col-span-2`, sticky sidebar (OTP / receiver contact / actions) `lg:sticky lg:top-24`.
- Hover states enabled (`hover:shadow-card`, `hover:scale-105` on the FAB); all hover affordances have a non-hover equivalent for touch.

### Responsive header rule
Any row mixing text and fixed widgets:
```tsx
<header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
  <div className="flex min-w-0 items-center gap-3">
    <span className="shrink-0 …">{icon}</span>
    <h1 className="truncate …">{title}</h1>
  </div>
  <Widget />
</header>
```

---

## 6. Components

**Bottom nav** (`src/components/BottomNav.tsx`)
- Donor: Home · Status · **+ Donate** (FAB) · History · Profile
- Receiver: Home · Accepted · **Discover** (FAB, search icon) · History · Profile
- Active item: `bg-primary-soft text-primary` pill; inactive `text-muted-foreground`.

**Donation card** (`DonationCard.tsx`)
- Photo (4:3, `rounded-xl`), urgency chip top-left, title + category, quantity · time left · distance meta row, whole card is the link target.

**Urgency chip** (`UrgencyChip.tsx`)
- Critical → `bg-critical-soft text-critical`; High → warning tokens; Normal → `bg-surface text-muted-foreground`. Always pairs color with a text label (never color-only).

**Forms**
- Label 12 px semibold, input `h-11 rounded-xl bg-surface`, helper text 12 px muted, error text 12 px critical.
- Multi-step wizard: step dots at top, Back/Continue pair pinned at the card bottom (`flex gap-3`, Continue `flex-1`).

**Empty states**: centered icon in a `size-12 rounded-2xl bg-surface` tile, 16 px bold line, 14 px muted line, one primary CTA.

---

## 7. Motion & accessibility

- Transitions: `transition-colors`/`transition-transform` at 150–200 ms, ease-out. No layout-shifting animations.
- Focus: visible `ring-2 ring-ring ring-offset-2` on every interactive element.
- Contrast: body text ≥ 4.5:1, large text ≥ 3:1 against its surface.
- Semantics: one `<h1>` per page, `nav`/`main`/`header` landmarks, `aria-label` on icon-only buttons (e.g. the FAB).
- Images always carry descriptive `alt`; photos lazy-load.
- Every route defines its own `head()` with unique title/description/OG tags.

---

## 8. Page inventory

| Page | Route | Layout notes |
| --- | --- | --- |
| Landing | `/` | Hero one-liner, Choose your role, How it works, live donation stats, footer with copyright |
| Role select | `/auth/register` | Two large role cards, stacked on mobile, 2-up from `sm` |
| Donor register | `/auth/register/donor` | 4-step wizard |
| Receiver register | `/auth/register/receiver` | 4-step wizard |
| Login | `/auth/login` | Centered card, `max-w-md` |
| Donor dashboard | `/donor/dashboard` | Stat tiles 2-up mobile / 4-up desktop + active donations |
| Post food | `/donor/donate` | Food details + timing + confirm prefilled address |
| Donation detail | `/donor/donation/$id` | Details list + OTP panel (sidebar on desktop) |
| Donor status | `/donor/status` | Accepted / awaiting list, polls every 10 s, toast on accept |
| Donor history | `/donor/history` | Closed donations list |
| Receiver dashboard | `/receiver/dashboard` | Stats + active pickups |
| Discover | `/receiver/discover` | Filters row, sorted nearest → farthest, card grid |
| Accepted | `/receiver/accepted` | Claimed donations |
| Pickup detail | `/receiver/pickup/$id` | Full food details, schedule → OTP → collected → delivered |
| Receiver history | `/receiver/history` | Completed pickups |
| Account | `/account` | Org details, verification badge, links |
| Settings | `/settings` | Profile + org edit, preferences, sign out |
| Help | `/help` | FAQ + contact |
