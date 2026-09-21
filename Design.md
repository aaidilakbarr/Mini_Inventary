# Stockly / INV.HUB — UI Design Specification

> **Status:** Target design specification  
> **Version:** 1.0  
> **Last updated:** 21 September 2026  
> **Primary scope:** Admin dashboard redesign and shared visual system

## 1. Purpose

This document defines the visual direction, layout, component behavior, responsive rules, and role-based navigation for the Stockly / INV.HUB redesign.

The new dashboard follows the supplied inventory-dashboard reference in terms of hierarchy and composition:

1. page title and primary metrics;
2. operational summary and quick actions;
3. three-part analytical content area;
4. recent activity table.

The reference is used as a **layout and hierarchy guide**, not as a source of new features. Existing Stockly modules, permissions, database structure, and business workflows remain authoritative.

---

## 2. Product Context

Stockly is an internal inventory-management application built with React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. Its main domains are:

- physical inventory;
- borrowing and returns;
- subscriptions and software licences;
- operational reminders;
- audit logs;
- system settings.

The application uses one authentication system, one database, and one shared data layer. Admin and Staff experiences are separated through role-aware layouts, route guards, permissions, and Supabase Row Level Security—not separate applications or backends.

---

## 3. Design Goals

The redesign must:

- make urgent operational information visible within a few seconds;
- feel like a focused inventory application, not a generic analytics template;
- preserve clear differences between Admin and Staff workflows;
- support dense administrative data without looking crowded;
- keep frequent actions reachable in one or two interactions;
- use real Stockly data and avoid decorative or fabricated analytics;
- remain usable from mobile through large desktop screens;
- reuse the existing component stack where practical.

### Non-goals

The redesign must not:

- introduce a new application module solely to match the reference;
- split Admin and Staff into separate applications or databases;
- expose Admin routes by hiding navigation only;
- add a map without a genuine location-tracking use case;
- display percentage trends without historical comparison data;
- display a time-based heatmap before time-series stock data is available;
- duplicate full module tables inside the dashboard.

---

## 4. Design Principles

### 4.1 Operational first

The dashboard prioritises items that require action: pending approvals, overdue borrowings, damaged inventory, low stock, upcoming renewals, and urgent reminders.

### 4.2 Summary, then detail

Dashboard blocks provide short summaries and links. Full CRUD, filtering, audit inspection, and record management remain on their dedicated pages.

### 4.3 Quiet surfaces, meaningful colour

Most surfaces remain neutral. Strong colours are reserved for status, urgency, selected navigation, and primary actions.

### 4.4 Consistent hierarchy

Every page follows the same hierarchy:

1. title and context;
2. primary action;
3. summary or filter controls;
4. main content;
5. secondary information.

### 4.5 Role clarity

Admin screens optimise monitoring, approval, and management. Staff screens optimise discovery, borrowing, and personal history.

---

## 5. Information Architecture

### 5.1 Admin navigation

#### Primary navigation

- Dashboard
- Inventaris
- Peminjaman
- Langganan
- Pengingat
- Planner — `Segera`

#### Secondary navigation

- Log Audit
- Pengaturan Sistem
- Bantuan & FAQ

`Planner` remains a coming-soon item. It must not lead to an unfinished route; selecting it may open the existing informational dialog.

### 5.2 Staff/User navigation

- Inventaris
- Peminjaman

Staff does not receive Admin navigation merely through visual hiding. Route guards and Supabase RLS remain required.

### 5.3 Navigation behaviour

- Desktop uses the existing Admin sidebar and Staff-specific layout.
- The active item uses the primary blue tint, primary-colour icon, and stronger label weight.
- Numeric badges communicate actionable counts, not decorative totals.
- Mobile uses a drawer or sheet triggered from the top bar.
- Admin-only items are not rendered as usable navigation for Staff.

---

## 6. Dashboard Structure

### 6.1 Page header

**Title:** `Dashboard`  
**Subtitle:** `Pantau inventaris, peminjaman, langganan, dan agenda operasional.`

The title appears on the left. Primary metrics occupy the remaining width on large screens and wrap below the title on smaller screens.

### 6.2 Primary KPI cards

The target layout uses three primary KPI cards.

| KPI | Primary value | Supporting information | Destination |
| --- | --- | --- | --- |
| Total Inventaris | Total physical inventory | Number currently available | `/inventory` |
| Peminjaman Aktif | Records with `Borrowed` status | Pending approval count | `/borrowing` |
| Perlu Tindakan | Combined actionable count | Short reason summary | Relevant filtered page |

`Perlu Tindakan` may include:

- overdue borrowings;
- pending approvals;
- damaged or maintenance inventory;
- low-stock records;
- overdue reminders;
- subscriptions approaching renewal.

Do not show values such as `+3.25%` unless the backend supplies a valid comparison period. When trend data is unavailable, use an absolute supporting label such as `12 tersedia` or `3 menunggu`.

### 6.3 Operational summary bar

This horizontal card replaces the reference's “Inventory Overview” strip.

#### Left side

- section icon;
- label: `Ringkasan Operasional`;
- last-updated timestamp.

#### Centre

- one short alert summary, for example `5 aktivitas memerlukan perhatian`;
- hide the alert block when the actionable count is zero.

#### Right side

- Export;
- Refresh;
- primary action: `Tambah Inventaris`.

The primary action must only appear for roles authorised to create inventory.

### 6.4 Main analytical grid

Desktop uses a 12-column grid:

| Section | Suggested width | Purpose |
| --- | ---: | --- |
| Distribusi Kondisi Inventaris | 6 columns | Main analytical overview |
| Peminjaman Terkini | 3 columns | Focused transaction summary |
| Agenda & Pengingat | 3 columns | Upcoming operational events |

#### A. Distribusi Kondisi Inventaris

This replaces the heatmap from the reference.

Initial presentation:

- total available;
- total borrowed;
- total damaged;
- total under maintenance;
- optional low-stock count;
- segmented bar, compact bars, or category matrix.

Suggested filters:

- Semua;
- Kategori;
- Lokasi;
- Kondisi.

Time filters such as `Hari`, `Minggu`, `Bulan`, and `Tahun` must only be enabled once historical inventory snapshots or reliable audit-log aggregation exists.

#### B. Peminjaman Terkini

Show the most operationally relevant borrowing record, prioritising:

1. overdue;
2. pending approval;
3. active borrowing;
4. recently returned.

Content:

- inventory name and optional thumbnail;
- borrower name;
- request or borrowing date;
- due date;
- quantity;
- status badge;
- `Lihat Detail` action.

Admin may see contextual approval, rejection, or return-verification actions. Destructive or irreversible actions must still require confirmation.

#### C. Agenda & Pengingat

This replaces the map from the reference because map tracking is not a current core requirement.

Display a compact timeline or list containing:

- borrowing due dates;
- subscription renewals;
- warranty deadlines;
- maintenance schedules;
- manual reminders.

Each item includes a source icon, title, due date, and urgency indicator. The card links to `/reminders` for the complete view.

### 6.5 Recent activity table

**Section title:** `Aktivitas Sistem Terbaru`

This section uses audit-log data and remains a concise dashboard view. Full inspection belongs in `Log Audit`.

#### Tabs

- Semua
- Inventaris
- Peminjaman
- Langganan
- Pengingat

#### Columns

| Column | Content |
| --- | --- |
| Aktivitas | Human-readable action summary |
| Modul | Entity/module badge |
| Pengguna | Actor name |
| Waktu | Localised timestamp |
| Status | Result or record status |
| Actions | Details menu when applicable |

Use server-side or bounded pagination when the record count grows. The dashboard should show a short recent subset rather than loading the entire audit table.

---

## 7. Module-Specific Direction

### 7.1 Inventaris

Admin defaults to a table-oriented view. Staff may default to a visual card catalogue.

Required controls:

- search;
- category filter;
- availability/status filter;
- condition filter;
- location filter when data exists;
- sort;
- grid/table toggle;
- add inventory action for authorised roles.

Inventory detail should evolve from a small modal into a side drawer or wider detail panel containing:

- identity and photo;
- stock breakdown;
- condition;
- location;
- warranty and supplier data;
- current borrower when applicable;
- borrowing and condition history;
- related reminders.

### 7.2 Peminjaman

Recommended status tabs:

- Semua
- Menunggu
- Dipinjam
- Terlambat
- Dikembalikan
- Ditolak

Admin view prioritises approvals and verification. Staff view prioritises personal requests and return status.

### 7.3 Langganan

Show:

- active subscription count;
- normalised monthly cost;
- next billing dates;
- status;
- owner/PIC where available;
- renewal reminders.

### 7.4 Pengingat

Group by urgency rather than source alone:

- Terlambat;
- Hari ini;
- Segera;
- Mendatang;
- Selesai.

Source badges may identify inventory, borrowing, subscription, warranty, maintenance, or manual reminders.

### 7.5 Audit log

Audit logs are Admin-only and read-focused. Use compact rows, strong filters, and a detail drawer. Logs must not be editable or deletable through standard UI actions.

### 7.6 Settings

Separate settings into clear sections:

- borrowing rules;
- reminder thresholds;
- inventory categories;
- user and role management;
- system preferences.

---

## 8. Visual System

### 8.1 Typography

**Primary font:** Plus Jakarta Sans

| Usage | Size | Weight |
| --- | ---: | ---: |
| Page title | 28–32px desktop, 22–24px mobile | 700–800 |
| Section title | 14–16px | 700 |
| KPI value | 24–32px | 700 |
| Body | 13–14px | 400–500 |
| Label/caption | 10–12px | 500–600 |

Use a monospaced font only for identifiers, quantities requiring alignment, asset codes, and timestamps when helpful. Avoid using monospace for most KPI values or body copy.

### 8.2 Colour tokens

Preserve the existing Stockly identity rather than copying the reference's violet exactly.

| Token | Value / direction | Usage |
| --- | --- | --- |
| Background | `#F4F7FB` | Main application canvas |
| Surface | `#FFFFFF` | Cards, panels, top bar |
| Primary | `#2563EB` | Primary actions, active navigation, links |
| Foreground | slate-950 family | Main text |
| Muted foreground | slate-500/600 family | Supporting text |
| Border | slate-200 family | Card and control boundaries |
| Accent | `#F97316` | Rare secondary accent only |

#### Semantic colours

| Meaning | Colour direction |
| --- | --- |
| Available / completed / healthy | Emerald |
| Borrowed / informational | Blue |
| Pending / approaching deadline | Amber |
| Overdue / damaged / destructive | Red/Rose |
| Maintenance / scheduled | Violet |
| Retired / dismissed / neutral | Slate |

Never rely on colour alone. Pair colour with a label, icon, shape, or accessible text.

### 8.3 Radius and borders

- default control radius: 8–10px;
- primary card radius: 12–16px;
- pill badge radius: full;
- borders: 1px neutral border;
- avoid stacking multiple visible borders inside the same card.

### 8.4 Shadows

Use shadows sparingly:

- default cards: border plus very subtle shadow or no shadow;
- floating drawer/dropdown: medium soft shadow;
- primary buttons: optional subtle primary-tinted shadow;
- never use heavy dark shadows on dashboard cards.

### 8.5 Spacing

Use a consistent 4px base system:

- compact gap: 8px;
- control gap: 12px;
- card padding: 16–20px;
- section gap: 20–24px;
- desktop page padding: 24–32px;
- mobile page padding: 12–16px.

### 8.6 Icons

Use Lucide React consistently.

- default icon size: 16px;
- navigation icon: 18–20px;
- KPI icon: 20–24px;
- icon-only controls require an accessible label and tooltip where meaning is not obvious.

---

## 9. Component Rules

### Buttons

- One visually dominant primary action per section.
- Secondary actions use outline or ghost variants.
- Destructive actions use red only when the action is truly destructive.
- Icon-only actions must have at least a 36×36px desktop target and 44×44px touch target where possible.

### Cards

- Cards must have a clear single purpose.
- Avoid cards inside cards unless the inner element is a distinct selectable record.
- Keep headings, actions, and empty states aligned consistently.

### Tables

- Use sticky headers for long tables.
- Keep the primary identity column visible and visually dominant.
- Use compact status badges.
- Row actions belong at the far right.
- On narrow screens, convert critical rows into stacked cards rather than forcing horizontal compression.

### Filters

- Keep common filters visible.
- Move uncommon filters into an advanced-filter popover or sheet.
- Active filters must be obvious and individually removable.
- Provide a clear-all action when more than one filter can be active.

### Drawers and dialogs

- Use drawers for viewing and editing record detail without losing list context.
- Use dialogs for focused confirmations and short forms.
- Avoid fitting complex inventory history or multi-section forms into a small dialog.

---

## 10. Interaction and State Design

Every data block must define:

- loading state using skeletons that resemble the final layout;
- empty state explaining what is missing and, when authorised, what action to take;
- error state with a retry action;
- success feedback after mutations;
- disabled state with a readable reason when appropriate.

### Refresh behaviour

- Refresh updates dashboard data without resetting navigation or scroll position.
- Show a compact spinner in the triggering control.
- Preserve existing data while revalidating when possible.

### Status changes

- Approval, rejection, return, and condition changes must provide clear confirmation feedback.
- Returned-damaged items remain tracked and unavailable.
- Condition and availability are displayed as separate concepts where the data model supports them.

### Motion

- Use short 150–250ms transitions.
- Limit motion to hover, panel entry, feedback, and loading transitions.
- Respect reduced-motion preferences.

---

## 11. Responsive Behaviour

### Large desktop — `≥1280px`

- Sidebar remains visible.
- KPI cards align beside the title when space allows.
- Main analytical area uses the 6/3/3 grid.
- Recent activity uses a full table.

### Tablet / small desktop — `768–1279px`

- KPI cards form a three-column or wrapped grid.
- Main analytical area becomes two columns.
- Agenda may move below the first two cards.
- Sidebar may collapse or switch to a drawer depending on available width.

### Mobile — `<768px`

- Navigation uses a sheet/drawer.
- Header content stacks vertically.
- KPI cards may use one column or a compact two-column grid when labels remain readable.
- Operational actions wrap; the primary action remains easiest to reach.
- Analytical cards stack in priority order:
  1. Perlu Tindakan / operational summary;
  2. Peminjaman Terkini;
  3. Agenda & Pengingat;
  4. Distribusi Kondisi;
  5. Aktivitas Terbaru.
- The activity table becomes a compact card list or controlled horizontal table.

No important action may depend on hover.

---

## 12. Accessibility

- Maintain WCAG AA contrast for text and interactive elements.
- Provide visible keyboard focus states.
- Preserve logical heading order.
- Use real button and link elements for interaction.
- Add text alternatives for meaningful inventory images.
- Associate form labels and validation messages with their inputs.
- Announce asynchronous success and error feedback where practical.
- Ensure status is understandable without colour.
- Use Indonesian labels consistently in the interface.

---

## 13. Data Integrity Rules for the UI

- Dashboard values must come from the same domain tables used by the module pages.
- Do not hard-code production metric values.
- Do not infer trends from the current total alone.
- `Perlu Tindakan` must use a documented calculation so its count is explainable.
- Each summary card must link to a page or filtered view that can account for its number.
- Audit activity must be fetched as a bounded recent set.
- Role visibility in the frontend does not replace route protection or RLS.
- Empty or unavailable data should be shown honestly rather than replaced with sample data.

---

## 14. Implementation Mapping

| Design area | Existing implementation area |
| --- | --- |
| Global tokens | `src/index.css`, `tailwind.config.js` |
| Admin shell/navigation | `src/components/layout/BaseLayout.tsx` |
| Staff shell/navigation | `src/components/layout/UserLayout.tsx` |
| Admin layout wrapper | `src/components/layout/AppLayout.tsx` |
| Dashboard composition | `src/pages/Dashboard.tsx` |
| Dashboard aggregation | `src/lib/api/dashboard.ts` |
| Inventory view | `src/pages/Inventory.tsx` |
| Inventory cards | `src/components/inventory/InventoryCard.tsx` |
| Borrowing view | `src/pages/Borrowing.tsx` |
| Subscriptions view | `src/pages/Subscriptions.tsx` |
| Reminders view | `src/pages/Reminders.tsx` |
| Audit activity | `src/pages/AuditLogs.tsx`, `src/lib/api/auditLogs.ts` |
| Shared primitives | `src/components/ui/` |

Prefer extracting new reusable dashboard components instead of allowing `Dashboard.tsx` to become one large component. Suggested component boundaries:

- `DashboardHeader`
- `MetricCard`
- `OperationalSummaryBar`
- `InventoryConditionOverview`
- `RecentBorrowingCard`
- `UpcomingAgendaCard`
- `RecentActivityTable`

---

## 15. Recommended Implementation Order

1. Confirm dashboard data contract and `Perlu Tindakan` calculation.
2. Finalise global tokens, spacing, and shared card/button variants.
3. Rebuild the dashboard header, KPI cards, and operational summary bar.
4. Implement the three-part analytical grid using existing real data.
5. Connect recent activity to a bounded audit-log query.
6. Apply responsive behaviour and mobile navigation.
7. Add loading, empty, error, and permission states.
8. Run accessibility, role, and data-integrity checks.
9. Extend the same visual system to module pages without changing their workflows.

---

## 16. Dashboard Acceptance Criteria

The dashboard redesign is considered ready when:

- [ ] Existing Admin and Staff permissions remain unchanged.
- [ ] Existing navigation items are preserved without adding unapproved modules.
- [ ] The dashboard presents three primary KPIs using real data.
- [ ] `Perlu Tindakan` has an explicit and testable calculation.
- [ ] Map content is replaced by Agenda & Pengingat.
- [ ] The reference heatmap is replaced by an honest condition/category overview unless historical data exists.
- [ ] All summary blocks link to a relevant detailed view.
- [ ] Admin-only actions are protected beyond visual visibility.
- [ ] Loading, empty, error, and success states are implemented.
- [ ] Layout remains usable at mobile, tablet, and desktop widths.
- [ ] Keyboard focus and text contrast meet accessibility requirements.
- [ ] No fabricated trend or sample production data is displayed.
- [ ] `npm run build` and the project lint command complete successfully after implementation.

---

## 17. Final Design Decision

The supplied reference is approved as the structural direction for the Stockly Admin dashboard, with the following required adaptations:

- retain Stockly's current navigation and role model;
- retain Plus Jakarta Sans, blue identity, pale grey background, white cards, and Lucide icons;
- replace the map with Agenda & Pengingat;
- replace the generic heatmap with Distribusi Kondisi Inventaris until historical data exists;
- use audit-log data for Aktivitas Sistem Terbaru;
- keep full data management inside the dedicated module pages;
- prioritise operational clarity over decorative analytics.

