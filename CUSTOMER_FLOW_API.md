# ServioSpot — Customer Flow API Specification

For the backend team. This document covers the **customer journey**:
browse as guest → account + verification → request wizard → track → chat →
receive & compare proposals → per-proposal decision → contact release →
after-event outcome & review.

It is based on the prototype in `serviospot2/` (mirrored at `src/flow2/`) and on the
endpoints already consumed by the app in `src/api/customerApi.ts`, `src/api/publicApi.ts`,
`src/api/chatApi.ts`, `src/api/authApi.ts` and `src/api/accountApi.ts`.

This is the counterpart to `FLOW2_BACKEND_API.md` (vendor flow). Shared endpoints
(chat, contact release, notifications) are called out in each file.

---

## 0. Transport & conventions (do not change)

| Item | Value |
| --- | --- |
| Method | **Every call is `POST`** (existing `src/api/client.ts` uses POST only) |
| Base URL | `https://app.erpportaal.nl/api` |
| Path style | `serviospot/<action>` |
| Auth | `token` sent **in the JSON body** when signed in; `company_login` in the body when signed out. A `Bearer` header may also be accepted if body `token` keeps working. |
| Envelope | Request `{ ...body, token }` → reply `{ "status_code": 200, "status": true, "data": { ... } }`. `status:false` / non-200 is an error; `message` is shown to the user. |
| Money | Integer **euro cents**, VAT included, unless noted. Budget fields use cents. |
| Plans | Plans are vendor-side only; customers are never limited by plan. |
| Contact privacy | Provider phone/email visible only on Platinum profiles; customer contact reaches a provider **only** after explicit release. |
| Dates | `YYYY-MM-DD`; datetimes ISO-8601. |
| Language | Bilingual labels are served as `{ nl, en }` where the app renders them. |

---

## 1. Customer flow overview

```
A  Welcome / Browse as guest
B  Register / Login + verify email & phone
C  Choose route
   ├─ Route 1 → D  Open provider profile
   └─ Route 2 → E  Search / Matching by filters
                    │
        D / E ──────┴──► F  Request wizard (5 steps)
                          F1 Event: guests, date, city, venue, occasion
                          F2 Cuisine & dishes: cuisine, vegetarian, dish counts
                          F3 Staff & logistics: staff, tasks, delivery/pickup, tableware, catering times
                          F4 Extra wishes: drinks, halal, allergies, forbidden, vegan, budget, comments
                          F5 Review + consent
        F → G  Submit request
        G → H  Track invitations / availability / proposals & deadlines
        H → I  Chat: ask clarification in-app
        I → J  Receive proposals
        J → K  Compare: request vs offer on identical rows
        K → L  Per-proposal choice
             ├─ Reject ───────────────────► M  Rejected
             ├─ Interested, no decision ──► N  Interested
             └─ Learn more ──► O  Request contact + explicit consent
                              O → P  Contacts shared with provider
                              P → Q  Continue personally with provider
                              Q → R  After event: outcome question
                                    ├─ Customer confirms event happened → S  Review eligible
                                    └─ Unknown → T  No review

H → Edit / withdraw / duplicate / close → U  Material edit = new revision + reconfirmation
```

---

## 1a. Node → endpoint map (quick reference)

| Diagram node | Endpoint(s) | Status |
| --- | --- | --- |
| A Welcome / Browse as guest | `getProviders`, `getCategories` | exists |
| D Open provider profile | `getProviderDetails`, `getProviderOfferings`, `getProviderReviews`, `getOffering` | exists |
| E Search / Matching by filters | `searchProviders` | exists |
| B Register / Login | `register`, `login`, `getMe` | exists |
| B Verify email & phone | `verifyEmail`, `verifyPhone` | exists |
| F1–F5 Request wizard (per step) | `saveRequestDraft` | extend |
| G Submit request | `submitRequest` | extend |
| H Track invitations / availability / proposals / deadlines | `getRequests`, `getRequestDetails` | extend |
| I Chat clarification | `getConversations`, `getMessages`, `sendMessage` | exists |
| J Receive proposals | `getProposals` | extend |
| K Compare on identical rows | `getRequestProposalComparison` (or `getProposals` with `lines[]`) | **new/extend** |
| L Per-proposal choice | `setProposalResponse` | **new** |
| L→M Reject | `setProposalResponse` (`rejected`) | **new** |
| L→N Interested, no decision | `setProposalResponse` (`interested`) | **new** |
| L→O Request contact + consent | `continueWithProvider` | exists |
| O→P Contacts shared | `getReleasedContacts` | exists |
| P→Q Continue personally | no endpoint (off-platform) | — |
| Q→R Outcome question | `saveOutcome` | exists |
| R→S Review eligible | `saveReview` | exists |
| R→T No review | — | — |
| H→U Edit / withdraw / duplicate / close | `updateRequest`, `cancelRequest`, `duplicateRequest`, `closeRequest` | **new/extend** |

---

## 2. Guest / discovery (A, D, E)

All public — callable without login.

| Endpoint | Body | Purpose |
| --- | --- | --- |
| `serviospot/getProviders` | `{ city?, guests? }` | home list of nearby caterers |
| `serviospot/getCategories` | `{}` | Food / Drinks / Staff tiles |
| `serviospot/searchProviders` | `{ q?, city?, guests?, category?, cuisine?, diet?, price_min?, price_max?, lat?, lng? }` | Route 2 filtered matching |
| `serviospot/getProviderDetails` | `{ provider_id }` | Route 1 public profile |
| `serviospot/getProviderOfferings` | `{ provider_id }` | menu / dishes |
| `serviospot/getProviderReviews` | `{ provider_id }` | reviews |
| `serviospot/getOffering` | `{ offering_id }` | one dish |

Notes:
- Provider phone/email must be hidden on the public profile unless the plan is Platinum.
- `searchProviders` should return enough to support **matching** in Route 2 (cuisine, diet, guest range, radius).
- Guests can browse and open a request wizard, but `submitRequest` requires a session (see §3).

---

## 3. Account & verification (B)

Existing shared endpoints. Customer register sends `role: "customer"`.

| Endpoint | Body | Notes |
| --- | --- | --- |
| `serviospot/register` | `{ role:"customer", full_name, email, password, country_code, phone, city? }` | returns auth `token` |
| `serviospot/login` | `{ email, password, role:"customer" }` | returns `token` + role |
| `serviospot/getMe` | `{}` | returns `email_verified`, `phone_verified`, plan, role |
| `serviospot/verifyEmail` | `{}` | marks email verified |
| `serviospot/verifyPhone` | `{ phone? }` | marks phone verified |
| `serviospot/updateMe` | `{ full_name, email, country_code, phone }` | resets `email_verified` / `phone_verified` when the value changed |

Rule: sending a request requires a signed-in account. In the current app **phone
verification is not required to submit** (the app only reflects `phone_verified`
that the server reports) — keep or tighten this explicitly and document it.

---

## 4. Request wizard (F1–F5) and submit (G)

### 4.1 Draft autosave — **extend** `serviospot/saveRequestDraft`
Called on **every "Next"**, logged-in only. Existing `saveRequestDraft` accepts a
partial `RequestBody`. Keep it tolerant of partial payloads and return a `draft_id`
so submit can reference the same record.

### 4.2 Payload — the 5 steps map to one `RequestBody`

The app already flattens the wizard into `RequestBody` + a structured `details`
object (`src/api/actions.ts`). Use the same shape so nothing needs re-mapping.

```jsonc
// serviospot/saveRequestDraft  and  serviospot/submitRequest
{
  "event_type": "birthday",                  // F1 occasion
  "event_date": "2026-11-14",
  "start_time": "19:00",
  "end_time": "23:00",
  "flexible_date": false,
  "city": "Rotterdam",
  "postcode": "3011AA",
  "location": "Eventzaal Rotterdam",         // venue name
  "indoor_outdoor": "indoor",
  "guest_count": 80,
  "needs": ["food"],                          // top-level needs (food, drinks, staff, …)
  "cuisines": ["surinamese", "hindustani"],   // F2
  "dietary": ["halal", "vegan"],              // F4 diet flags
  "services": ["Serving", "Buffet setup"],    // F3 tasks
  "budget_total_cents": 350000,
  "budget_per_person_cents": 4375,
  "description": "…",                         // F4 comments

  "details": {                                // exact keys the app already sends
    "venue_kind": "venue", "venue_name": "Eventzaal Rotterdam",
    "access_notes": "…", "occasion": "birthday",
    "cuisine": "surinamese", "cuisine_style": "hindustani",
    "vegetarian": "mixed",
    "base_dishes": 2, "chicken_dishes": 2, "pork_dishes": 0, "beef_dishes": 0,
    "fish_dishes": 1, "shrimp_dishes": 0, "vegetable_dishes": 2,
    "extra_vegetarian_dishes": 2, "starters": 0, "desserts": 1,
    "serving_format": "buffet",
    "staffed": "yes", "warming": "yes",
    "tableware": "real", "plates": "yes", "cutlery": "yes", "glasses": "no",
    "catering_start": "19:00", "catering_end_date": "2026-11-14", "catering_end": "23:00",
    "tasks": ["Serving", "Buffet setup", "Cleanup / teardown"],
    "handoff": "delivery", "handoff_time": "18:00",
    "drinks": "no", "drink_details": "",
    "halal": true, "allergies": "…", "forbidden": "…",
    "vegan": "no", "other_diet": "…"
  }
}
```

### 4.3 Submit — **extend** `serviospot/submitRequest`
- Requires session; server re-validates: `guest_count ≥ 1`, `event_date`, `city`,
  ≥ 1 dish (sum of dish counts), `consent = true`.
- On success: persist the request, generate a `reference` (e.g. `DEMO-002`),
  match it to eligible providers (Gold/Platinum, matching cuisine/diet/area/capacity),
  create **invitations** with a **deadline**, and return `{ request_id, reference, status }`.
- Free-plan providers must not be invited.
- Response should include the initial `deadline` and `invited_count` for the tracking screen.

### 4.4 Consent (F5)
`consent: true` means "I confirm the details and understand this is an indication,
not a booking." Store `consent_at` server-side.

---

## 5. Track & manage requests (H, U)

### 5.1 Lists & detail — **extend**
| Endpoint | Body | Notes |
| --- | --- | --- |
| `serviospot/getRequests` | `{}` | customer's requests + status |
| `serviospot/getRequestDetails` | `{ request_id }` | full request + progress |

`getRequestDetails` must return the tracking data for node H:
```jsonc
{
  "request": { /* RequestBody snapshot */ },
  "revision": 1,
  "status": "proposals",              // submitted | collecting | proposals | contact | closed
  "invited_count": 5,
  "opened_count": 4,
  "availability_count": 3,
  "proposal_count": 2,
  "response_deadline": "2026-11-05T17:00:00Z",
  "proposals": [ { "proposal_id": "…", "provider_id": "…", "availability": "full" } ]
}
```

### 5.2 Edit / withdraw / duplicate / close (node U) — **new + extend**

| Endpoint | Body | Effect |
| --- | --- | --- |
| `serviospot/updateRequest` | `{ request_id, ...RequestBody }` | **Material edit → new revision + reconfirmation** |
| `serviospot/cancelRequest` | `{ request_id, reason }` | exists; the customer withdraws the request |
| `serviospot/duplicateRequest` | `{ request_id }` | **new**; copies to a new draft |
| `serviospot/closeRequest` | `{ request_id }` | **new**; close without a reason (no longer tracking) |

Rules for `updateRequest`:
- A **material** change (event date, guests, city, cuisine, diet) bumps `revision`
  and **requires providers to reconfirm** — reset their availability/proposals or
  mark them "needs reconfirmation".
- Non-material edits (comments, budget tweak) update in place without reconfirmation.
- Return the new `revision` and the affected proposal states.

---

## 6. Chat clarification (I)

Existing shared endpoints (`src/api/chatApi.ts`):

| Endpoint | Body |
| --- | --- |
| `serviospot/getConversations` | `{}` |
| `serviospot/getMessages` | `{ conversation_id }` |
| `serviospot/sendMessage` | `{ conversation_id, message }` |

Rule: until contact is released, reject messages containing **phone, email or links**.
A conversation is created per (request, provider) so clarification stays tied to the proposal.

---

## 7. Receive proposals (J)

Existing `serviospot/getProposals` with `{ request_id }`. **Extend** each proposal to
carry the comparison rows and pricing detail produced by the vendor flow:

```jsonc
{
  "proposal_id": "…",
  "provider_id": "…",
  "provider_name": "…",
  "availability": "full",           // full | partial | conditional | none
  "match_score": 91,
  "pricing": {
    "total_cents": 297500, "per_guest_cents": 3719,
    "deposit_cents": 0, "currency": "EUR"
  },
  "valid_until": "2026-11-01",
  "version": 1,
  "status": "sent",                  // sent | interested | rejected | contact | withdrawn
  "lines": [
    { "key": "guests", "label": {"nl":"Personen","en":"Guests"},
      "requested": "80", "offered": "80", "differs": false },
    { "key": "warming_trays", "label": {"nl":"Warmhoudbakken","en":"Warming trays"},
      "requested": "ja", "offered": "0", "differs": true,
      "reason": "equipment unavailable", "alternative": "none" }
  ]
}
```

`getProposal` (`{ proposal_id }`) returns the same shape for the single-proposal screen.

---

## 8. Compare (K)

Compare view needs the **same rows** for every proposal so they line up.

| Endpoint | Body | Reply |
| --- | --- | --- |
| `serviospot/getRequestProposalComparison` | `{ request_id }` | `{ columns: [ {proposal_id, provider_name, total_cents} ], rows: [ {key, label, requested, offers:[{proposal_id, offered, differs}]} ] }` |

Alternatively extend `getProposals` to include a shared `rows[]`. Either way the
**keys and order must match** the request's own fields, and each cell must signal
`differs`. "Not stated" must be distinguishable from "included".

---

## 9. Per-proposal decision (L, M, N, O)

The three choices in the prototype (`serviospot2/src/app/customer/proposal/[id].tsx`):

| Choice | Endpoint | Body |
| --- | --- | --- |
| M Reject | `serviospot/setProposalResponse` | `{ proposal_id, response: "rejected", reason? }` |
| N Interested, no decision | `serviospot/setProposalResponse` | `{ proposal_id, response: "interested" }` |
| O Learn more → contact | `serviospot/continueWithProvider` | `{ proposal_id }` (existing) |

`setProposalResponse` is **new**. Rules:
- `rejected` hides the proposal from the compare view but keeps history.
- `interested` keeps it in play with no contact — **interest is not consent**.
- `continueWithProvider` is the only path that releases contact; cap **3 releases per request**.

---

## 10. Contact release (P, Q)

Existing:

| Endpoint | Body | Reply |
| --- | --- | --- |
| `serviospot/continueWithProvider` | `{ proposal_id }` | `{ released: true }` |
| `serviospot/getReleasedContacts` | `{ request_id }` | released contacts for this request |

On release the backend must:
- require the customer's explicit consent (record `consent_at`),
- share the customer's name, verified email and phone with that provider,
- notify the provider (`type: "contact_released"`) — see `FLOW2_BACKEND_API.md` §3.6,
- store a `ContactRelease` record; **disclosure cannot be recalled** by later status changes.
- Continue afterwards is off-platform (node Q): no booking, no payment in-app.

---

## 11. After event (R, S, T)

Existing:

| Endpoint | Body | Notes |
| --- | --- | --- |
| `serviospot/saveOutcome` | `{ request_id, outcome, provider_id? }` | R; `outcome` e.g. `happened` / `unknown` |
| `serviospot/saveReview` | `{ request_id, provider_id, overall, food, communication, reliability, value, service, body }` | S, only if outcome confirms the event |

Rules:
- If the customer confirms the event happened (S) → the request becomes **review-eligible**.
- If unknown (T) → no review; the request stays outcome-unknown.
- A review must only be accepted for a request where `outcome = happened` and a
  contact was released; otherwise reject server-side.
- Reviews are public on the provider profile; provider can reply (`saveReviewResponse`, vendor side).

---

## 12. Endpoint summary

| # | Endpoint | Status | Node |
| --- | --- | --- | --- |
| 1 | `getProviders`, `getCategories` | exists | A |
| 2 | `getProviderDetails`, `getProviderOfferings`, `getProviderReviews`, `getOffering` | exists | D |
| 3 | `searchProviders` | exists | E |
| 4 | `register`, `login`, `getMe` | exists | B |
| 5 | `verifyEmail`, `verifyPhone`, `updateMe` | exists | B |
| 6 | `saveRequestDraft` | extend | F1–F5 |
| 7 | `submitRequest` | extend | G |
| 8 | `getRequests`, `getRequestDetails` | extend | H |
| 9 | `getConversations`, `getMessages`, `sendMessage` | exists | I |
| 10 | `getProposals`, `getProposal` | extend | J |
| 11 | `getRequestProposalComparison` | **new** | K |
| 12 | `setProposalResponse` | **new** | L, M, N |
| 13 | `continueWithProvider` | exists | O |
| 14 | `getReleasedContacts` | exists | P |
| 15 | `saveOutcome` | exists | R |
| 16 | `saveReview` | exists | S |
| 17 | `updateRequest` (revision + reconfirmation) | **new** | U |
| 18 | `cancelRequest` | exists | U |
| 19 | `duplicateRequest`, `closeRequest` | **new** | U |

---

## 13. Business rules checklist

- [ ] Browse, search and open a wizard work as guest; `submitRequest` requires login.
- [ ] Server re-validates guest count, date, city, ≥ 1 dish, consent on submit.
- [ ] Only Gold/Platinum providers are invited; Free providers get none.
- [ ] Each invitation has a deadline; tracking exposes invited/opened/availability/proposal counts.
- [ ] Chat blocks phone, email and links until contact is released.
- [ ] The three proposal choices are distinct: reject / interested / contact.
- [ ] Contact release is the **only** path that shares customer contact; capped at 3 per request.
- [ ] Material request edit creates a **new revision** and forces provider reconfirmation.
- [ ] A review is only accepted after `outcome = happened` (and a released contact).
- [ ] "Not stated" ≠ "included"; the compare view flags every differing row.
- [ ] No booking, payment or final award happens in-app; it is an indication only.

---

## 14. Open questions for the backend team

1. Is `saveRequestDraft` keyed per user (one active draft) or per `draft_id` (many)?
2. What exactly counts as a **material** change that forces reconfirmation?
3. When a request is edited, are prior proposals voided, frozen, or marked "needs reconfirmation"?
4. `getProposals` vs a dedicated comparison endpoint — which do you prefer for node K?
5. Is `setProposalResponse` per proposal or per (request, provider)?
6. After `cancelRequest`/`closeRequest`, are already-released contacts revoked in the UI only, or also server-side?
7. Review eligibility window: how long after the event can a review be submitted?
8. Outcome `unknown` — does it ever auto-resolve from provider-side data, or stay unknown?
