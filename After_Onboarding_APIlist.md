# ServioSpot — APIs Required After Onboarding

This list covers the APIs needed for the customer and vendor flows after onboarding is complete.
The default route prefix is `serviospot/`; routes that use `api/serviospot/` are shown with that prefix.

**Status guide:**
- **In app**: The API call is defined in the current mobile app. This does not confirm that the backend route is implemented.
- **New / needs extension**: The flow requires this API or behavior, but it still needs to be added to or extended in the app/backend contract.

> Completing vendor onboarding and receiving admin approval are separate steps. The vendor profile must not be public and the vendor must not receive leads until approval.

## 1. Shared APIs — for customers and vendors

| API name | What it is used for |
|---|---|
| `serviospot/login` | Signs a customer or vendor into their account. |
| `serviospot/logout` | Ends the current user's session. |
| `serviospot/me` | Returns the signed-in user's profile, role, and verification status. |
| `serviospot/verifyEmail` | Handles email verification for the user. |
| `serviospot/verifyPhone` | Verifies the user's phone number. |
| `serviospot/savePushToken` | Saves the device's Expo push token for notifications. |
| `serviospot/getNotifications` | Returns the user's notifications. |
| `serviospot/getUnreadCount` | Returns the number of unread notifications. |
| `serviospot/markNotificationRead` | Marks one notification as read. |
| `serviospot/markAllNotificationsRead` | Marks all notifications as read. |
| `serviospot/getNotificationSettings` | Returns current push, email, and event notification settings. |
| `serviospot/updateNotificationSettings` | Saves the user's notification preferences. |
| `serviospot/getLegal` | Returns the current terms of service or privacy policy. |
| `serviospot/saveReport` | Lets a user report a provider, content, or account. |
| `serviospot/exportAccount` | Requests an export of the user's account data. |
| `serviospot/deleteAccount` | Deletes the user's account and clears the session. |
| `serviospot/getConversations` | Returns the user's conversation list. |
| `serviospot/getMessages` | Returns messages from a selected conversation. |
| `serviospot/sendMessage` | Sends a message in a conversation. |

## 2. Customer APIs

### Discover and choose a provider

| API name | What it is used for |
|---|---|
| `serviospot/getCategories` | Displays provider or service categories on the home screen. |
| `serviospot/getProviders` | Returns providers based on city and guest count. |
| `serviospot/searchProviders` | Finds providers using search, cuisine, diet, budget, and location filters. |
| `serviospot/getProviderDetails` | Displays a provider's public profile and service details. |
| `serviospot/getProviderOfferings` | Displays a provider's menu or offerings. |
| `serviospot/getProviderReviews` | Displays customer reviews for a provider. |
| `serviospot/getOffering` | Displays details for a specific offering. |
| `serviospot/getFavorites` | Returns providers and offerings saved by the customer. |
| `serviospot/saveFavorite` | Saves a provider or offering as a favorite. |
| `serviospot/deleteFavorite` | Removes a saved favorite. |

### Requests, proposals, and after the event

| API name | What it is used for |
|---|---|
| `serviospot/saveRequestDraft` | Saves or autosaves incomplete information from the request form as a draft. |
| `serviospot/submitRequest` | Submits the customer's completed request and matches it with eligible vendors. |
| `serviospot/getRequests` | Displays the customer's submitted requests and their progress. |
| `serviospot/getRequestDetails` | Displays a request's details, status, vendor responses, and deadlines. |
| `serviospot/cancelRequest` | Cancels a request submitted by the customer. |
| `serviospot/getProposals` | Returns proposals submitted by vendors for a request. |
| `serviospot/getProposal` | Displays the full details of one proposal. |
| `serviospot/getRequestProposalComparison` | Provides a side-by-side comparison of proposals against the request requirements. **New / needs extension** |
| `serviospot/setProposalResponse` | Lets the customer mark a proposal as interested or rejected. **New** |
| `serviospot/continueWithProvider` | Releases contact details to the selected vendor after the customer's explicit consent. |
| `serviospot/getReleasedContacts` | Returns vendors whose contact details have been released to the customer. |
| `serviospot/saveOutcome` | Records whether the event took place. |
| `serviospot/saveReview` | Saves the customer's review for a vendor after an eligible event. |
| `serviospot/updateRequest` | Updates a request, creates a new revision, and asks vendors to reconfirm. **New** |
| `serviospot/duplicateRequest` | Copies an existing request into a new draft. **New** |
| `serviospot/closeRequest` | Closes a request while retaining it in the customer's history. **New** |

## 3. Vendor APIs — after admin approval

### Dashboard and leads

| API name | What it is used for |
|---|---|
| `serviospot/getVendorDashboard` | Displays lead, proposal, and activity counts on the vendor dashboard. |
| `serviospot/getLeads` | Returns matching customer requests in the vendor's inbox. |
| `serviospot/getLead` | Displays one lead/request while hiding the customer's private information until contact is released. |
| `serviospot/saveAvailability` | Saves the vendor's availability response for a lead. |
| `serviospot/saveProposal` | Sends a proposal with pricing and service details for a request. |
| `serviospot/withdrawProposal` | Withdraws a submitted proposal. |

### Profile, services, and account

| API name | What it is used for |
|---|---|
| `serviospot/getVendorProfile` | Returns the vendor's current data for profile editing. |
| `serviospot/updateVendorProfile` | Updates the vendor's public name, city, story, or logo. |
| `serviospot/saveVerification` | Saves KVK, VAT, and legal name for business verification. |
| `serviospot/saveVendorServices` | Saves the services offered by the vendor. |
| `api/serviospot/getVendorOfferings` | Returns the vendor's menu/offerings for management. |
| `serviospot/saveOffering` | Creates a new service or menu offering. |
| `serviospot/updateOffering` | Updates an existing offering. |
| `serviospot/setOfferingActive` | Activates or deactivates an offering. |
| `serviospot/getSubscription` | Displays the vendor's current plan and trial/subscription status. |
| `serviospot/getPlans` | Displays available subscription plans and their details. |
| `serviospot/saveSubscription` | Saves or updates the vendor's selected plan. |
| `serviospot/getInvoices` | Returns the vendor's invoices. |

### Availability, preferences, and performance

| API name | What it is used for |
|---|---|
| `serviospot/getCalendar` | Displays the vendor's saved availability calendar. |
| `serviospot/saveCalendar` | Saves the vendor's availability for a date. |
| `serviospot/getPreferences` | Displays the vendor's lead-matching preferences. |
| `serviospot/savePreferences` | Saves preferences for city, guest capacity, cuisine, and radius. |
| `serviospot/getTemplates` | Returns saved proposal templates. |
| `serviospot/saveTemplate` | Creates or updates a proposal template. |
| `serviospot/deleteTemplate` | Deletes a proposal template. |
| `serviospot/getAnalytics` | Displays the vendor's performance from leads through contact releases. |
| `serviospot/getVendorReviews` | Returns customer reviews received by the vendor. |
| `serviospot/saveReviewResponse` | Lets the vendor reply to a review. |

### Contact release

| API name | What it is used for |
|---|---|
| `serviospot/getContactReleases` | Returns customer requests for which contact details have been released to the vendor. **New; not wired in the app** |
| `serviospot/getContactRelease` | Returns a customer's contact details for one request only after the customer has consented. **New; not wired in the app** |

## 4. Backend rules to enforce

- Do not show the customer's phone number, email, or exact address to a vendor before contact is released.
- Keep personally identifying customer information anonymized in the vendor's lead list.
- Release customer contact only after `continueWithProvider`; enforce the per-request release limit on the backend as well.
- Do not send leads to vendors on the Free plan; check Gold/Platinum eligibility on the backend.
- Make the vendor profile public and start the trial only after admin approval.
- Validate consent and required request fields when a customer submits a request.
- An API being defined in the app does not prove that the backend route is implemented; verify each route's backend status and response contract separately.
