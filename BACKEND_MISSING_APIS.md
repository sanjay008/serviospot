# ServioSpot — APIs still needed

Base: `POST /api/serviospot/{endpoint}`  
Auth: `{ token }` in JSON body

Only the APIs the app still needs. Already working OTP/onboarding/discover/request/chat APIs are not listed.

---

## Priority 1 — Edit profile

| Endpoint | Used for | Body |
|---|---|---|
| `getVendorProfile` | Load vendor edit profile | `{ token }` |
| `updateVendorProfile` | Save vendor edit profile | `{ token, name?, city?, story?, logo? }` + confirm if `business_name` / starting price are supported |
| `updateMe` **(new)** | Save customer edit profile | `{ token, full_name?, email?, phone?, country_code?, photo? }` |

---

## Priority 2 — Vendor screens not wired yet

| Endpoint | Used for |
|---|---|
| `saveVerification` | KvK / VAT / legal name |
| `saveVendorServices` | Service categories |
| `updateOffering` | Edit package |
| `setOfferingActive` | Activate / deactivate package |
| `getSubscription` | Current plan |
| `saveSubscription` | Change plan |
| `getPlans` | Plan list |
| `getInvoices` | Invoices |
| `getCalendar` | Availability calendar |
| `saveCalendar` | Save day availability |
| `getPreferences` | Lead preferences |
| `savePreferences` | Save lead preferences |
| `getTemplates` | Proposal templates |
| `saveTemplate` | Save template |
| `deleteTemplate` | Delete template |
| `getAnalytics` | Vendor analytics |
| `getVendorReviews` | Vendor reviews list |
| `saveReviewResponse` | Reply to a review |

---

## Priority 3 — Customer screens not wired yet

| Endpoint | Used for |
|---|---|
| `getFavorites` | Favorites list |
| `saveFavorite` | Save favorite |
| `deleteFavorite` | Remove favorite |
| `saveRequestDraft` | Autosave request draft |
| `updateRequest` | Edit submitted request |

---

## Please confirm

1. Exact request/response for `getVendorProfile` and `updateVendorProfile`
2. Photo format for `logo` / `photo` (URL or base64)
3. Whether `updateMe` exists or will be added
