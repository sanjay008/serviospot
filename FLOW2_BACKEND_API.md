# ServioSpot — Flow 2 (Provider) API Specification

For the backend team. This document covers the **provider journey** (second flow):
onboarding → admin review → request inbox → availability → proposal → contact → analytics.

It is based on the prototype in `serviospot2/` (mirrored at `src/flow2/`) and on the
endpoints already consumed by the app in `src/api/vendorApi.ts`, `src/api/authApi.ts`
and `src/api/accountApi.ts`. Each section states whether the endpoint **already
exists**, must be **extended**, or is **new**.

> Counterpart: `CUSTOMER_FLOW_API.md` (customer flow). Shared endpoints — chat,
> contact release, notifications, outcome/review — are noted in both files.

---

## 0. Transport & conventions (do not change)

| Item | Value |
| --- | --- |
| Method | **Every call is `POST`** (existing `src/api/client.ts` uses POST only) |
| Base URL | `https://app.erpportaal.nl/api` |
| Path style | `serviospot/<action>` |
| Auth | `token` sent **in the JSON body** when signed in; `company_login` in the body when signed out. A `Bearer` header is also acceptable if you keep body `token` working. |
| Envelope | Request `{ ...body, token }` → reply `{ "status_code": 200, "status": true, "data": { ... } }`. `status:false` or non-200 is an error, `message` is shown to the user. |
| Money | Integer **euro cents**, VAT included, unless noted. |
| Plans | `free`, `gold`, `platinum` only. Leads/calendar/templates/analytics are Gold+; Free receives no leads. |
| Dates | `YYYY-MM-DD`; datetimes ISO-8601. |
| Language | Bilingual fields are served as `{ nl, en }` where the app renders labels. |

Providers currently in the repo that already map to real calls:
`register`, `updateVendorProfile`, `savePreferences`, `saveVendorServices`,
`saveVerification`, `getLeads`, `getLead`, `saveAvailability`, `saveProposal`,
`withdrawProposal`, `getCalendar`, `saveCalendar`, `getAnalytics`,
`getVendorReviews`, `saveReviewResponse`, plus shared `verifyEmail`/`verifyPhone`.

---

## 1. Flow 2 overview

```
A  Provider onboarding
   A1 Account: name, email, phone, password
   A2 Verify email AND phone (both required)
   A3 Provider type (private/business) + private address
   A4 Service area: base postcode + radius, delivery/pickup/onsite
   A5 Capabilities: cuisines, styles, diet, staff/tasks, drinks, tableware, warming trays
   A6 Capacity per fulfilment type: min/max guests, lead days
   A7 Profile: description, from-price, menu PDF + photos
   A8 6-months-free full-plan consent
   A9 Review & submit
        │
        ▼
Z  Admin review ──rejected/changes──► back to A7 (edit)
        │ approved
        ▼
P  Profile public + trial starts
        │
        ▼
B  Inbox: anonymised requests, deadlines, quality signals
C  Block dates / capacity per service
D  Confirm availability  (see 3.3)
        │ hard requirement = no
        ▼
X  Stopped: decline & close  OR  correct the answer
        │ ok
        ▼
E  Send proposal (one all-in price, incl. VAT, breakdown sums exactly; deposit separate)
        │
        ▼
F  Chat with customer in-app
        │
        ▼
G  Customer requests contact (explicit consent)
        │
        ▼
H  Contacts shared + notification to both sides
        │
        ▼
I  Agree wishes, price and cooperation personally
        │
        ▼
J  Analytics: views → invitations → availability → proposals → contacts
```

---

## 1a. Node → endpoint map (quick reference)

| Diagram node | Endpoint(s) | Status |
| --- | --- | --- |
| A1 Account | `serviospot/register` | exists |
| A2 Verify email & phone | `serviospot/verifyEmail`, `serviospot/verifyPhone` | exists |
| A3 Provider type + private address | `serviospot/saveVendorOnboarding` (step 2) | **new** |
| A4 Service area (postcode, radius, fulfilment) | `serviospot/saveVendorOnboarding` (step 3) | **new** |
| A5 Capabilities (cuisines, diet, staff, drinks, tableware, trays) | `serviospot/saveVendorOnboarding` (step 4) | **new** |
| A6 Capacity per fulfilment + lead days | `serviospot/saveVendorOnboarding` (step 5) | **new** |
| A7 Profile + menu PDF + photos | `saveVendorOnboarding` (step 6) + `uploadVendorFile` | **new** |
| A8 6-months-free consent | `saveVendorOnboarding` (`trial_consent`) | **new** |
| A9 Review & submit | `serviospot/submitVendorOnboarding` | **new** |
| Z Admin review | `adminApproveVendorOnboarding`, `adminRejectVendorOnboarding` | **new, internal** |
| Z→A7 rejected | `getVendorOnboardingStatus` (`rejected` + `admin_reason`) | **new** |
| Z→P approved | `getVendorOnboardingStatus` (`approved`, `trial_ends_at`) | **new** |
| B Inbox (anonymised, deadlines, quality) | `getLeads`, `getLead`, `getVendorDashboard` | extend |
| C Block dates / capacity per service | `getCalendar`, `saveCalendar` | extend |
| D Confirm availability | `saveAvailability` | extend |
| D1 Availability full/partial/conditional/none | `saveAvailability` | extend |
| D2 Same questions yes/no (+ alternative & reason) | `saveProposal.confirmations[]` | extend |
| D3 Counts & proteins, staff roles, setup/teardown | `saveProposal.counts`, `.staff_roles`, `.setup_time` | extend |
| D4 Equipment, drinks, transport, task status | `saveProposal.equipment_counts`, `.details` | extend |
| D5 One all-in price (breakdown sums exactly) | `saveProposal.pricing` (server validates total) | extend |
| D6 Deposit separate, deviations, validity/version | `saveProposal.deposit_cents`, `.version`, `.valid_until` | extend |
| D→X Hard requirement = no | rule: `saveAvailability(none)` or correct, block `saveProposal` | rule |
| X→D Correct answer | retry `saveAvailability` / `saveProposal` | rule |
| E Send proposal | `saveProposal` | extend |
| F Chat in-app | `getConversations`, `getMessages`, `sendMessage` | exists |
| G Customer requests contact (consent) | customer `continueWithProvider` → vendor `getContactReleases` | extend |
| H Contacts shared + notification | `getContactRelease` + push `contact_released` | **new** |
| I Agree in person (off-platform) | no endpoint (optionally `saveOutcome` later) | — |
| J Analytics funnel | `getAnalytics` | extend |

---

## 2. Onboarding & account (steps A1–A9, bridge Z)

### 2.1 Account — **exists** (`serviospot/register`)
`role: "vendor"`, `full_name`, `email`, `password`, `country_code`, `phone`, optional `city`.
Returns the auth `token`. Reuse as-is.

### 2.2 Verify email & phone — **exists** (`serviospot/verifyEmail`, `serviospot/verifyPhone`)
Both must be possible **before** submit; onboarding cannot be submitted while either is
unverified. App reads back `email_verified` / `phone_verified` from `getMe`.

### 2.3 Onboarding draft — **NEW**
Autosave the wizard so a provider can leave and resume. One record per provider.

| Endpoint | Body | Reply |
| --- | --- | --- |
| `serviospot/getVendorOnboarding` | `{}` | onboarding object (below) |
| `serviospot/saveVendorOnboarding` | full or partial onboarding object | saved object + `completion` |

```jsonc
// saveVendorOnboarding request (all fields optional; server merges by step)
{
  "step": 3,
  "provider_type": "private",          // "private" | "business"
  "profile_name": "Mama Sita Home Kitchen",
  "company_name": "",                   // required when provider_type=business
  "kvk_number": "",                     // optional for private
  "private_address": {                  // NEVER public
    "street": "...", "house_number": "...", "postcode": "3011AA", "city": "Rotterdam"
  },
  "service_area": { "base_postcode": "3011AA", "radius_km": 25 },
  "fulfilment": { "delivery": true, "pickup": true, "onsite": true },
  "cuisines": ["surinamese"],
  "cuisine_styles": ["hindustani"],
  "capabilities": ["food","halal","staff","warm","realWare","drinks"],
  "capacity": {
    "delivery": { "min_guests": 10, "max_guests": 150 },
    "pickup":   { "min_guests": 5,  "max_guests": 100 },
    "onsite":   { "min_guests": 30, "max_guests": 150 },
    "lead_days": 3
  },
  "profile": {
    "description": "…at least 20 chars…",
    "from_price_cents": 1700,
    "menu_pdf_url": "https://…",
    "photos": ["https://…"]
  },
  "trial_consent": true,               // step 7
  "terms_accepted": true               // step 8
}
```

Reply includes a `status` (`draft` | `pending` | `approved` | `rejected`) and, when
rejected, `admin_reason`.

### 2.4 File upload (menu PDF + photos, step A7) — **NEW**
`vendor-onboarding.tsx` already stores profile photos as data URIs (see
`PhotoPicker`). For PDFs/photos we need a real store.

| Endpoint | Body | Reply |
| --- | --- | --- |
| `serviospot/uploadVendorFile` | `{ kind: "menu_pdf" \| "photo", filename, mime, data_base64 }` | `{ url }` |

Server stores, moderates and returns a stable URL. Reject > size limit and unsafe
mime types. Keep the existing data-URI path working for `logo`/`photo` until migration.

### 2.5 Submit onboarding (step A9) — **NEW**
| Endpoint | Body | Reply |
| --- | --- | --- |
| `serviospot/submitVendorOnboarding` | `{}` (server reads the saved draft) | `{ status: "pending" }` |

**Server-side validation before accepting** (mirror the app's client checks):
- name, email, phone, password present; email format valid; password ≥ 8 chars
- email **and** phone verified
- profile_name, full private address, city present; company_name when `business`
- at least one fulfilment type; radius ≥ 1
- at least one cuisine and one capability; if `surinamese` then ≥ 1 cuisine style
- description ≥ 20 chars
- `trial_consent` and `terms_accepted` true

On success set `status = "pending"` and lock the record from further edits until
admin action (or allow edits that reset to `pending` — pick one and document it).

### 2.6 Onboarding status — **NEW** (provider-facing)
| Endpoint | Body | Reply |
| --- | --- | --- |
| `serviospot/getVendorOnboardingStatus` | `{}` | `{ status, admin_reason, approved_at, trial_started_at, trial_ends_at }` |

- `pending` → no public profile, no leads; show "awaiting review".
- `rejected` → show `admin_reason`; editable copy returns provider to step A7.
- `approved` → profile public; **trial starts on approval**; set `trial_ends_at = +6 months`.

### 2.7 Admin review (bridge Z) — **NEW, internal**
The customer app has no admin surface (`BACKEND_API.md` states "No admin APIs"), but
the flow requires a reviewer. These can live in a separate admin tool, not the mobile API.

| Endpoint | Body | Effect |
| --- | --- | --- |
| `serviospot/adminListVendorOnboarding` | `{ status: "pending" }` | list submissions |
| `serviospot/adminApproveVendorOnboarding` | `{ vendor_id }` | `approved`, start 6-month trial, profile public |
| `serviospot/adminRejectVendorOnboarding` | `{ vendor_id, reason }` | `rejected`, `admin_reason` stored |

---

## 3. Provider operations (after approval)

### 3.1 Inbox / leads — **mostly exists**
Existing `getLeads`, `getLead`, `getVendorDashboard`. Requirements:

- Requests must be **anonymised** until contact is released: no customer name,
  phone, email, or exact address. Return only: reference, guests, city, date,
  dish counts, tasks, dietary/allergy flags allowed by policy, `deadline_hours`,
  and a `quality` signal (e.g. 0–100).
- Free plan → `getLeads` returns `[]`.
- `filter` values used by the app today: `new`, `sent`, `picked`. Keep them; add
  `opened` if a separate "seen" state is needed (prototype has `invited`, `opened`,
  `availability`, `proposal`, `declined`).
- Add a per-lead **deadline** and an **expired** flag so the UI can show "respond within 24h".

Suggested lead status enum (align app + backend):
`invited | opened | availability | proposal | declined | expired`.

### 3.2 Calendar / capacity — **exists** (`getCalendar`, `saveCalendar`)
Prototype blocks dates **per service** ("Block dates / capacity per service").
Current `CalendarBody = { date, status }`. **Extend** to optionally carry the
service and a remaining-capacity count:

```jsonc
{
  "date": "2026-11-14",
  "status": "available" | "limited" | "unavailable",
  "fulfilment": "delivery" | "pickup" | "onsite",   // optional
  "slots": 2                                          // optional capacity
}
```

### 3.3 Availability + proposal (subgraph D) — **extend**

**D1 Availability.** Prototype values: `full | partial | conditional | none`.
Existing `AvailabilityBody` uses `available | partial | maybe | unavailable`.
Pick canonical values and map in the app (recommended server values:
`full | partial | conditional | none`). Add `reason` for `conditional`/`none`.

| Endpoint | Body |
| --- | --- |
| `serviospot/saveAvailability` | `{ lead_id, status, reason?, alternative? }` |

**D2–D5 Proposal.** The provider must **confirm each request item yes/no**; "no"
opens an alternative + reason. The proposal is **one all-in price incl. VAT**
whose breakdown **sums exactly to the total**; the deposit is separate; it carries
**validity and a version**.

Existing `saveProposal` already accepts `food_cents, drinks_cents, staff_cents,
delivery_cents, equipment_cents, other_cents, discount_cents, expires_at,
included, excluded, assumptions, details`. **Extend** with structured
confirmations/deviations (or put them in `details`):

```jsonc
{
  "lead_id": "…",
  "availability": "full",
  "guest_count": 80,

  "confirmations": [                     // same questions as the request, yes/no
    { "key": "guests",        "yes": true,  "answer": "80" },
    { "key": "catering_time", "yes": true,  "answer": "19:00-23:00" },
    { "key": "cuisine",       "yes": true,  "answer": "surinamese" },
    { "key": "staff",         "yes": true,  "answer": "4" },
    { "key": "warming_trays", "yes": false, "answer": "0",
      "alternative": "none available", "reason": "equipment unavailable" }
  ],

  "counts": { "chicken": 2, "fish": 1, "veg": 2, "extra_veg": 1, "dessert": 1 },
  "staff_roles": ["serve", "buffet"],
  "setup_time": "18:00", "teardown_time": "23:30",
  "equipment_counts": { "plates": 80, "cutlery": 80, "glasses": 0 },

  "pricing": {
    "food_cents": 220000, "staff_cents": 50000,
    "equipment_cents": 15000, "transport_cents": 12500,
    "total_cents": 297500,               // MUST equal sum of parts
    "per_guest_cents": 3719,
    "deposit_cents": 0                    // separate, refundable
  },
  "valid_until": "2026-11-01",
  "version": 1,

  "message": "…",
  "included": "…", "excluded": "…", "assumptions": "…",
  "details": { }
}
```

**Server rules:**
- Reject if `total_cents != sum(parts)`.
- New send of an existing proposal = new `version`; never mutate a sent version.
- `withdrawProposal` (exists) keeps history.
- Block sending while any **hard requirement** (date, capacity, catering hours,
  required diet/allergy) is confirmed "no" without a valid alternative.

### 3.4 Hard-requirement stop (X) — **rule, no new endpoint**
If a hard requirement is "no", the lead must be either **declined + closed**
(`saveAvailability` with `none`, or a dedicated `decline` action) or corrected.
Do not allow `saveProposal` in that state.

### 3.5 Chat — **exists** (`getConversations`, `getMessages`, `sendMessage`)
Same contact-blocking rule as the customer: reject phone, email and links in
message text until contact is released.

### 3.6 Contact sharing (G–H) — **extends existing customer flow**
Customer side already has `continueWithProvider` (max 3 per request) and
`getReleasedContacts`. Provider side needs the mirrored notification + record:

| Endpoint | Body | Reply |
| --- | --- | --- |
| `serviospot/getContactReleases` | `{}` | list of releases for this vendor |
| `serviospot/getContactRelease` | `{ request_id }` | `{ customer: { name, phone, email } }` **only if released** |

On release the backend must:
- send a push/notification to the provider (`type: "contact_released"`),
- store a `ContactRelease` record (request, vendor, customer, released_at).
- A provider must never see customer contact before this point.

### 3.7 Analytics funnel (J) — **extend** `getAnalytics`
Existing `getAnalytics` returns views/counts. Return the exact funnel:

```jsonc
{
  "profile_views": 0,
  "invitations": 0,        // requests where this vendor was invited
  "availability": 0,       // invitations answered
  "proposals": 0,          // proposals sent
  "contacts": 0,           // contact releases
  "window_days": 30
}
```

Label contacts as "not verified revenue" (prototype copy). Gold/Platinum only.

---

## 4. Data model / enums (shared vocabulary)

```
provider_type   : "private" | "business"
onboarding_status: "draft" | "pending" | "approved" | "rejected"
fulfilment      : "delivery" | "pickup" | "onsite"
availability    : "full" | "partial" | "conditional" | "none"
lead_status     : "invited" | "opened" | "availability" | "proposal" | "declined" | "expired"
proposal_status : "draft" | "sent" | "withdrawn" | "contact" | "rejected"
plan            : "free" | "gold" | "platinum"
task            : "decorate" | "buffet" | "serve" | "bar" | "wash" | "clean"
capability      : "food" | "vegetarian" | "vegan" | "halal" | "staff" | "decoration"
                | "warm" | "realWare" | "drinks" | "equipment"
cuisine         : "surinamese" | "turkish" | "dutch" | "african" | "indian" | "mixed" | "other"
cuisine_style   : "hindustani" | "creole" | "javanese" | "mixedStyle" | "none"
```

Dish counts collected in the request (mirror in proposal confirmations):
`base, chicken, pork, beef, fish, shrimp, veg, extra_veg, starter, dessert`.

---

## 5. Endpoint summary

| # | Endpoint | Status | Purpose |
| --- | --- | --- | --- |
| 1 | `serviospot/register` | exists | vendor account |
| 2 | `serviospot/verifyEmail` / `verifyPhone` | exists | both required |
| 3 | `serviospot/getVendorOnboarding` | **new** | load draft |
| 4 | `serviospot/saveVendorOnboarding` | **new** | save step / draft |
| 5 | `serviospot/uploadVendorFile` | **new** | menu PDF + photos |
| 6 | `serviospot/submitVendorOnboarding` | **new** | → pending review |
| 7 | `serviospot/getVendorOnboardingStatus` | **new** | pending/approved/rejected + reason |
| 8 | `serviospot/adminApproveVendorOnboarding` | **new, internal** | approve + start trial |
| 9 | `serviospot/adminRejectVendorOnboarding` | **new, internal** | reject + reason |
| 10 | `serviospot/getLeads` / `getLead` | extend | anonymised inbox, deadline, quality |
| 11 | `serviospot/getVendorDashboard` | exists | counts |
| 12 | `serviospot/getCalendar` / `saveCalendar` | extend | per-service capacity |
| 13 | `serviospot/saveAvailability` | extend | full/partial/conditional/none + reason |
| 14 | `serviospot/saveProposal` | extend | confirmations, deviations, version, exact total |
| 15 | `serviospot/withdrawProposal` | exists | withdraw sent proposal |
| 16 | `serviospot/getContactReleases` / `getContactRelease` | **new** | released customer contact |
| 17 | `serviospot/getConversations` / `getMessages` / `sendMessage` | exists | in-app chat |
| 18 | `serviospot/getAnalytics` | extend | funnel views→invitations→availability→proposals→contacts |

---

## 6. Business rules checklist

- [ ] Email **and** phone verified before onboarding can be submitted.
- [ ] Private address never leaves the server to any public/customer payload.
- [ ] Profile becomes public and the 6-month trial starts **only** on admin approval.
- [ ] No leads on Free; leads/calendar/templates/analytics are Gold+.
- [ ] Leads are anonymised until a contact release exists.
- [ ] Contact is shown **only** after the customer's explicit consent (`continueWithProvider`).
- [ ] A material edit to a sent proposal creates a **new version**, never a silent change.
- [ ] Proposal breakdown must **sum exactly** to the all-in total; deposit is separate.
- [ ] Hard requirement = "no" stops the flow: decline/close or correct.
- [ ] Contact releases capped at 3 per request (already enforced on the customer side).
- [ ] Analytics "contacts" are not verified revenue.

---

## 7. Open questions for the backend team

1. Are onboarding draft, credentials and status one vendor record or separate tables?
2. Can a `pending` submission be edited, and does that reset `pending`?
3. Exact `quality` signal for leads: score (0–100) or labelled tags?
4. File storage: max size, allowed mime types, moderation flow, and URL lifetime.
5. Trial: absolute `trial_ends_at` timestamp, and behavior when it lapses
   (freeze leads vs. downgrade to Free automatically)?
6. Contact release: are both parties notified simultaneously, and is the release
   revocable before the event?

00
## 8. Backend API Implementation Tasks

- Implement all missing NEW Vendor APIs defined in this specification.
- Extend existing APIs according to the documented requirements without breaking current functionality.
- Enforce all security rules and business validations on the backend.
- Verify Free, Gold, and Platinum subscription permissions and the 6-month trial logic.
- Add tests for all new and modified APIs.
- Do not modify unrelated APIs or customer flows.
- Update the API documentation with actual implementation status.
- Report completed APIs, remaining work, and test results.

**Important:** Inspect the existing backend, database, and API structure before making changes. Do not assume an API is implemented until it has been tested successfully.