# ServioSpot backend API handoff — current app flows

This is the combined backend handoff for the current customer and vendor flows. It was checked against `src/api/*.ts`, `src/api/actions.ts`, current screens, `CUSTOMER_FLOW_API.md` and `FLOW2_BACKEND_API.md`.

## Important status note

“In app” means the route is called by the current API client. It does **not** prove that the backend route is implemented or working. “Required” means the current documented flow needs the behavior/route, but the app currently does not call that route (or calls an existing route that needs the behavior extended). Backend must confirm actual implementation and test it.

## Transport and shared rules

- REST base URL is configured through `EXPO_PUBLIC_API_URL`; route paths below are `serviospot/<action>`.
- Current API endpoint definitions use `POST` requests with JSON bodies, including list/detail reads. The shared client defaults to POST.
- Auth mode is configurable. Default is `body`: signed-in calls include `{ token }`; signed-out calls include `{ company_login }` if configured. Bearer and no-auth modes are also supported.
- App accepts either a raw JSON response or `{ data: ... }`; `status: false` or non-2xx is treated as an error and `message`/`error` is displayed.
- Money is integer euro cents. Dates are `YYYY-MM-DD`; timestamps ISO-8601.
- Never expose private vendor address or unreleased customer contact. Chat must block direct contact details until consent-based release.

## 1. Authentication, account, legal, and notifications (shared)

| Endpoint | Body | Used for / backend behavior | Status |
|---|---|---|---|
| `register` | `{ role, full_name, email, password, country_code, phone, city? }` | Create customer/vendor account; return token | In app |
| `login` | `{ email, password, role }` | Sign in; return token and user/role data | In app |
| `logout` | `{}` | Invalidate session if supported | In app |
| `me` | `{}` | Current user profile, role, verification flags | In app |
| `verifyEmail` | `{}` | Email verification action/status | In app |
| `verifyPhone` | `{ phone }` | Phone verification action/status | In app |
| `savePushToken` | `{ expo_token }` | Register Expo push token for signed-in user | In app |
| `getNotifications` | `{}` | Notification list | In app |
| `getUnreadCount` | `{}` | Unread notification count | In app |
| `markNotificationRead` | `{ notification_id }` | Mark one read | In app |
| `markAllNotificationsRead` | `{}` | Mark all read | In app |
| `getNotificationSettings` | `{}` | Read push/email/request/message/proposal/review preferences | In app |
| `updateNotificationSettings` | `{ push, email, request, message, proposal, review }` | Save notification preferences | In app |
| `saveReport` | `{ target_type, target_id, reason, details? }` | Report provider/content/user | In app |
| `exportAccount` | `{}` | Request account data export | In app |
| `deleteAccount` | `{}` | Delete account and clear session | In app |
| `getPlans` | `{}` | Public plan list | In app |
| `getLegal` | `{ doc: "terms" \| "privacy" }` | Legal document text | In app |

`updateMe` is described in the customer spec but is **not** currently defined/called by the app. Add it only if profile editing is expected to update account identity fields; current profile-edit screens may use role-specific endpoints instead. Email/phone verification requirements must be consistent across customer and vendor onboarding (see flow rules below).

## 2. Public discovery (customer and guest)

| Endpoint | Body | Used for / backend behavior | Status |
|---|---|---|---|
| `getCategories` | `{}` | Home category tiles | In app |
| `getProviders` | `{ city?, guests? }` | Home provider list | In app |
| `searchProviders` | `{ q?, city?, guests?, category?, cuisine?, diet?, price_min?, price_max?, lat?, lng? }` | Filter/search provider list; return fields needed for cuisine, diet, guest capacity and service area matching | In app |
| `getProviderDetails` | `{ provider_id }` | Public provider profile; hide private address and protect phone/email per plan/privacy rules | In app |
| `getProviderOfferings` | `{ provider_id }` | Provider menu/offering list | In app |
| `getProviderReviews` | `{ provider_id }` | Public reviews | In app |
| `getOffering` | `{ offering_id }` | Offering detail | In app |

Guests may browse and prepare a request. Submitting a request requires a signed-in customer.

## 3. Customer request lifecycle

| Endpoint | Body | Used for / backend behavior | Status |
|---|---|---|---|
| `getFavorites` | `{}` | Customer saved providers/offerings | In app |
| `saveFavorite` | `{ type: "provider" \| "offering", id }` | Save favorite | In app |
| `deleteFavorite` | `{ favorite_id }` | Remove favorite | In app |
| `saveRequestDraft` | Partial `RequestBody` (shape below) | Autosave wizard progress; tolerate partial fields and return/reuse `draft_id` | In app; extend |
| `submitRequest` | Full `RequestBody` plus `consent: true` (currently consent is not in the TypeScript type; add it to app/backend contract) | Validate and submit; match eligible Gold/Platinum vendors, create invitations/deadlines, return request id/reference/invited count | In app; extend |
| `getRequests` | `{}` | Customer request list/status | In app; extend with tracking counts/status |
| `getRequestDetails` | `{ request_id }` | Request snapshot, revision, invitation/availability/proposal counts and deadlines | In app; extend |
| `cancelRequest` | `{ request_id, reason }` | Customer withdraws request | In app |
| `getProposals` | `{ request_id }` | Proposals for request; include comparison-ready rows, pricing, validity, version and state | In app; extend |
| `getProposal` | `{ proposal_id }` | Single proposal details | In app |
| `continueWithProvider` | `{ proposal_id }` | Explicitly release contact for this provider; cap 3 releases per request | In app |
| `getReleasedContacts` | `{ request_id }` | Contact details for already released providers | In app |
| `saveOutcome` | `{ request_id, outcome, provider_id? }` | Record after-event outcome (`happened` / `unknown`) | In app |
| `saveReview` | `{ request_id, provider_id, overall, food, communication, reliability, value, service, body }` | Save review only when outcome is happened and contact was released | In app |
| `getRequestProposalComparison` | `{ request_id }` | Common ordered request-vs-proposal rows for compare screen; alternatively extend `getProposals` | Required, new or extend |
| `setProposalResponse` | `{ proposal_id, response: "rejected" \| "interested", reason? }` | Reject or mark interested; interest is not contact consent | Required, new; app does not call yet |
| `updateRequest` | `{ request_id, ...RequestBody }` | Material edits create revision and require provider reconfirmation | Required, new; app does not call yet |
| `duplicateRequest` | `{ request_id }` | Copy request into a new draft | Required by documented flow; app does not call yet |
| `closeRequest` | `{ request_id }` | Close tracking without deleting history | Required by documented flow; app does not call yet |

### Request payload currently produced by app

The app flattens wizard answers to `RequestBody` in `src/api/actions.ts`:

```json
{
  "event_type": "birthday",
  "event_date": "2026-11-14",
  "start_time": "19:00",
  "end_time": "23:00",
  "flexible_date": false,
  "city": "Rotterdam",
  "postcode": "3011AA",
  "location": "Eventzaal Rotterdam",
  "indoor_outdoor": "indoor",
  "guest_count": 80,
  "needs": ["food"],
  "cuisines": ["surinamese", "hindustani"],
  "dietary": ["halal", "vegan"],
  "services": ["Serving", "Buffet setup"],
  "budget_total_cents": 350000,
  "budget_per_person_cents": 4375,
  "description": "Customer notes",
  "details": {
    "venue_kind": "venue", "venue_name": "Eventzaal Rotterdam",
    "access_notes": "", "occasion": "birthday", "cuisine": "surinamese",
    "cuisine_style": "hindustani", "vegetarian": "mixed",
    "base_dishes": 2, "chicken_dishes": 2, "pork_dishes": 0,
    "beef_dishes": 0, "fish_dishes": 1, "shrimp_dishes": 0,
    "vegetable_dishes": 2, "extra_vegetarian_dishes": 2,
    "starters": 0, "desserts": 1, "serving_format": "buffet",
    "staffed": "yes", "warming": "yes", "tableware": "real",
    "plates": "yes", "cutlery": "yes", "glasses": "no",
    "catering_start": "19:00", "catering_end_date": "2026-11-14",
    "catering_end": "23:00", "tasks": ["Serving", "Buffet setup"],
    "handoff": "delivery", "handoff_time": "18:00", "drinks": "no",
    "drink_details": "", "halal": true, "allergies": "",
    "forbidden": "", "vegan": "no", "other_diet": ""
  }
}
```

Backend validates required date/city/guest count/dish count and consent on submit, persists consent timestamp, and returns a stable request reference. Each vendor invitation needs its own status and response deadline. Material edits must preserve old revisions and trigger vendor reconfirmation.

## 4. Vendor onboarding and provider operations

### Onboarding: required backend routes

These steps are in the vendor flow specification, but **are not currently wired into `src/api/vendorApi.ts`**. Current onboarding screen calls `register`, `verifyEmail`, and `verifyPhone` only.

| Endpoint | Body | Purpose | Status |
|---|---|---|---|
| `getVendorOnboarding` | `{}` | Load/resume provider draft | Required, new |
| `saveVendorOnboarding` | Step number plus partial onboarding fields | Autosave private/business, address, service area, fulfilment, capabilities, capacity, profile and consent | Required, new |
| `uploadVendorFile` | `{ kind: "menu_pdf" \| "photo", filename, mime, data_base64 }` | Store/moderate onboarding files and return stable URL | Required, new |
| `submitVendorOnboarding` | `{}` | Validate draft and submit for review | Required, new |
| `getVendorOnboardingStatus` | `{}` | Return draft/pending/approved/rejected, admin reason and trial dates | Required, new |
| `adminListVendorOnboarding` | `{ status: "pending" }` | Admin review queue | Required, internal |
| `adminApproveVendorOnboarding` | `{ vendor_id }` | Approve, publish profile, start 6-month trial | Required, internal |
| `adminRejectVendorOnboarding` | `{ vendor_id, reason }` | Reject with reason and allow correction | Required, internal |

Onboarding draft fields: `provider_type`, `profile_name`, `company_name`, `kvk_number`, `private_address` (never public), `service_area`, `fulfilment`, `cuisines`, `cuisine_styles`, `capabilities`, `capacity`, `profile` (description/from-price/menu PDF/photos), `trial_consent`, `terms_accepted`. Verify both email and phone before submission. Approval alone makes profile public and starts trial.

### Vendor account, dashboard, leads, proposals, and catalogue

| Endpoint | Body | Used for / backend behavior | Status |
|---|---|---|---|
| `getSubscription` | `{}` | Current vendor plan/trial | In app |
| `saveSubscription` | `{ plan: "free" \| "gold" \| "platinum" }` | Select/update plan | In app |
| `getInvoices` | `{}` | Vendor invoices | In app |
| `getVendorDashboard` | `{}` | Vendor dashboard counts | In app |
| `getLeads` | `{ filter?: "new" \| "sent" \| "picked" }` | Lead inbox; anonymized until release; include deadline/expired and quality signal | In app; extend |
| `getLead` | `{ lead_id }` | Lead/request details without customer contact before release | In app |
| `saveAvailability` | `{ lead_id, status: "available" \| "partial" \| "maybe" \| "unavailable", note? }` | Answer availability. Planned canonical flow uses full/partial/conditional/none; align app and backend enum before implementation | In app; extend/align |
| `saveProposal` | `{ lead_id, message, guest_count, food_cents, drinks_cents, staff_cents, delivery_cents, equipment_cents, other_cents, discount_cents, included?, excluded?, assumptions?, expires_at?, details? }` | Send versioned proposal; extend details for confirmations/deviations, exact all-in total, separate deposit, validity/version | In app; extend |
| `withdrawProposal` | `{ proposal_id }` | Withdraw while retaining proposal history | In app |
| `getVendorOfferings` | `{}` | Vendor menu/offering list | In app |
| `saveOffering` | `{ title, category, description?, price_cents, price_type?, cuisine?, diet?, photo? }` | Create offering | In app |
| `updateOffering` | Same fields plus `{ offering_id }` | Edit offering | In app |
| `setOfferingActive` | `{ offering_id, active }` | Activate/deactivate offering | In app |
| `getVendorProfile` | `{}` | Vendor profile edit data | In app |
| `updateVendorProfile` | `{ name?, city?, story?, logo? }` | Update profile; logo may be data URI for current flow | In app |
| `saveVerification` | `{ kvk_number, vat_number?, legal_name }` | Save business verification data | In app |
| `getPreferences` | `{}` | Lead matching preferences | In app |
| `savePreferences` | `{ city?, min_guests?, max_guests?, cuisines?, radius_km? }` | Save lead preferences | In app |
| `getCalendar` | `{}` | Availability calendar | In app |
| `saveCalendar` | `{ date, status: "available" \| "limited" \| "unavailable" }` | Save date availability; extend optionally with fulfilment and slots/capacity | In app; extend |
| `getTemplates` | `{}` | Proposal templates | In app |
| `saveTemplate` | `{ name, body }` | Create/update template | In app |
| `deleteTemplate` | `{ template_id }` | Delete template | In app |
| `getAnalytics` | `{}` | Vendor performance; extend to profile views → invitations → availability → proposals → contacts | In app; extend |
| `getVendorReviews` | `{}` | Vendor's received reviews | In app |
| `saveReviewResponse` | `{ review_id, response }` | Vendor reply to review | In app |

Plan rules: Free receives no leads; Gold/Platinum may receive leads/calendar/templates/analytics according to the subscription specification. Confirm exact entitlements and trial expiry behavior with backend.

## 5. Shared chat and contact release

| Endpoint / channel | Body/event | Purpose | Status |
|---|---|---|---|
| `getConversations` | `{}` | List conversations | In app, REST |
| `getMessages` | `{ conversation_id }` | Fetch conversation history | In app, REST |
| `sendMessage` | `{ conversation_id, message }` | Send message | In app, REST |
| `getContactReleases` | `{}` | Vendor-side released contact list | Required by vendor spec; missing from app API |
| `getContactRelease` | `{ request_id }` | Vendor fetches customer's contact only after release | Required by vendor spec; missing from app API |
| WebSocket `/serviospot/chat` | `auth {token}`, `join/leave {conversation_id}`, `message {conversation_id,message,from,client_id}` | Live chat relay used by `src/chat/socket.ts`; server emits `message` with id/sender/time | In app, WebSocket (not REST) |

Only `continueWithProvider` should create a release record, record consent, notify both sides and authorize contact retrieval. Contact releases are capped at 3 per request. Do not expose customer contact in leads or before release. Block phone/email/links in chat until release.

## 6. Flow rules backend must enforce

- Customer request submission requires authenticated customer, consent, valid event date/city/guest count and at least one dish.
- Match invitations only to eligible providers and exclude Free providers.
- Vendor onboarding requires verified email and phone, required profile/address/fulfilment/capability fields, consent and terms. Private address stays private.
- Vendor profile goes public and 6-month trial begins only on admin approval.
- Leads and proposals must not reveal customer personal contact before explicit release.
- Availability enum must be normalized. Current app sends `available | partial | maybe | unavailable`; flow spec proposes `full | partial | conditional | none`.
- Proposal versions are immutable once sent; edits create a new version. Validate total equals price components; deposit is separate. Do not allow proposal after a hard requirement is declined without a valid alternative.
- Contact request is explicit consent; max 3 releases per request; notify both parties.
- Chat filters contact details until release.
- Review accepted only after `outcome = happened` and a contact release.
- No in-app booking or payment is represented in the current flow.

## 7. Items needing app/backend contract alignment

1. Current code sends POST for all REST calls, but base URL is environment-configured; do not assume the production URL from older docs.
2. `getMe` route in code is `serviospot/me`, not `serviospot/getMe`.
3. Existing app's customer submit payload type has no `consent` field although the flow spec requires consent.
4. `updateMe`, proposal compare, proposal interested/rejected, request update/duplicate/close, vendor onboarding, and vendor-side contact-release fetch are documented needs but not wired in current API modules.
5. Customer spec says phone verification is not currently required to submit; vendor spec requires both verifications for onboarding. Decide customer policy explicitly.
6. Current availability values differ from the flow spec. Decide canonical server values and update app mapping/types together.
7. Existing docs contain conceptual “exists” labels; backend team should report actual endpoint implementation and test status separately.

## 8. Backend implementation handoff

Inspect existing backend routes/database before implementing. For every endpoint above, confirm request/response shape, auth/role access, validation, privacy, plan entitlements, and error responses. Return actual implementation status and tests. Do not treat this inventory's “In app” label as proof of server implementation.
