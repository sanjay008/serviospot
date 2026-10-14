# ServioSpot API list

For the backend. The app is customer and vendor. Prices are integer euro cents. Auth is a Bearer token. Plans are only Free, Gold, and Platinum. Phone and email on a public profile are visible only on Platinum. A customer can still release contact on a request, up to 3 providers. No admin APIs.

## Shared

### Login and account

- `POST /auth/register` — Create a customer or vendor account.
- `POST /auth/login` — Sign in and return the token plus role.
- `POST /auth/logout` — End the session.
- `POST /auth/verify-phone` — Mark the phone verified so a customer can send a request.
- `POST /auth/verify-email` — Mark the email verified.
- `GET /me` — Return the signed-in name, email, phone, role, and plan.
- `POST serviospot/updateMe` — Save `full_name`, `email`, `country_code`, `phone`. Reply with the updated user, and reset `email_verified` or `phone_verified` when that value changed.
- `DELETE /me` — Delete the account.
- `POST /me/export` — Email the user a copy of their data.

### Notifications

- `POST /devices/push-token` — Save this phone’s Expo push token.
- `GET /notifications` — List alerts for the current role.
- `PATCH /notifications/:id/read` — Mark one alert read and open its screen.
- `PATCH /notifications/read-all` — Mark every alert for this role read.
- `GET /notification-settings` — Read push, email, request, message, proposal, and review toggles.
- `PATCH /notification-settings` — Save those toggles.

### Language and legal

- `POST https://app.erpportaal.nl/api/get_language` — Already exists. Loads language names and translation text. Do not rebuild it.
- `GET /legal/:doc` — Return terms or privacy text.

### Report

- `POST /reports` — Save a report about a profile, message, or account.

## Customer

### Home

- `GET /providers` — Show caterers near the customer.
- `GET /categories` — Show the Food, Drinks, Staff, and other tiles.
- `GET /notifications/unread-count` — Show the red dot on the bell.

### Search

- `GET /providers/search` — Filter caterers by city, cuisine, guests, price, and diet.

### Caterer profile

- `GET /providers/:id` — Show the public page. Hide phone and email unless the plan is Platinum.
- `GET /providers/:id/offerings` — Show that caterer’s menu.
- `GET /providers/:id/reviews` — Show reviews on the profile.
- `POST /favorites` — Save or unsave a caterer or a dish.

### Dish

- `GET /offerings/:id` — Show one dish with its photo and price.

### Ask for a price

- `PUT /requests/draft` — Save the form while the customer is still filling it.
- `POST /requests` — Send the request to matching caterers. Free-plan caterers are not invited.

### My requests

- `GET /requests` — List the customer’s requests.
- `GET /requests/:id` — Open one request and its prices.
- `POST /requests/:id/cancel` — Cancel a request with a reason.

### One price

- `GET /proposals/:id` — Show one caterer’s price.
- `POST /proposals/:id/continue` — Release that caterer’s contact. Stop after 3 continues on the same request.

### Compare

- `GET /requests/:id/proposals` — List prices side by side so the customer can pick one.

### Released contact

- `GET /requests/:id/contacts` — Show phone and email only after the customer continued with that caterer.

### Chat

- `GET /conversations` — List the customer’s chats.
- `GET /conversations/:id/messages` — Load one chat.
- `POST /conversations/:id/messages` — Send a message. Reject phone, email, and links until contact is released.

### Saved

- `GET /favorites` — List saved caterers and dishes.
- `DELETE /favorites/:id` — Remove one saved item.

### After the event

- `POST /requests/:id/outcome` — Record whether the customer used a caterer.
- `POST /reviews` — Save a review only after a real event.

### Me

Uses the shared account, notification, legal, and report APIs.

## Vendor

### Register, plan, and services

- `POST /auth/register` — Create the vendor account. Same shared register, with role vendor.
- `GET /plans` — List Free, Gold, and Platinum with price and features.
- `POST /subscriptions` — Save the chosen plan. Payment is a preview until a real payment provider is added.
- `PUT /vendor/services` — Save the services the vendor offers, then open the vendor home.

### Home

- `GET /vendor/dashboard` — Show counts for requests to answer, prices sent, and customers who picked them.
- `GET /leads?filter=new` — Show the newest requests waiting for a price.
- `GET /notifications/unread-count` — Show the red dot on the bell.

### Requests

- `GET /leads` — List requests. Free plan gets none.
- `GET /leads/:id` — Open one request.
- `PATCH /leads/:id/availability` — Say available, partial, or unavailable.
- `POST /leads/:id/proposal` — Send or update the price.
- `POST /proposals/:id/withdraw` — Take a sent price back.

### Menu

- `GET /vendor/offerings` — List this vendor’s dishes.
- `POST /vendor/offerings` — Add a dish. Block it when the plan’s dish limit is full. The app sends `title`, `category`, `description`, `price_cents`, `price_type`, `cuisine`, `diet`, and `photo`.
- `PATCH /vendor/offerings/:id` — Edit a dish. Same fields as add.
- `PATCH /vendor/offerings/:id/active` — Show or hide a dish.

### Public page and business check

- `GET /vendor/profile` — Load the page the vendor edits.
- `PATCH /vendor/profile` — Save name, city, story, and photo.
- `POST /vendor/verification` — Submit KvK details. Status stays pending until a reviewer accepts it.

### Plan

- `GET /subscriptions/current` — Show the active plan.
- `POST /subscriptions` — Switch plan. Do not charge a card in this preview.
- `GET /invoices` — List past invoices once real billing exists.

### More

- `GET /vendor/preferences` — Load the jobs the vendor wants.
- `PUT /vendor/preferences` — Save city, guests, and cuisine rules.
- `GET /vendor/calendar` — Load busy days. Gold and Platinum only.
- `PUT /vendor/calendar` — Save a day as available, limited, or unavailable.
- `GET /vendor/templates` — List saved quotes. Gold and Platinum only.
- `POST /vendor/templates` — Save a quote to reuse.
- `DELETE /vendor/templates/:id` — Delete a saved quote.
- `GET /vendor/analytics` — Show profile views and request counts. Not on Free.
- `GET /vendor/reviews` — List reviews on this vendor.
- `POST /reviews/:id/response` — Save the vendor’s reply to a review.

### Chat

- `GET /conversations` — List the vendor’s chats.
- `GET /conversations/:id/messages` — Load one chat.
- `POST /conversations/:id/messages` — Send a message. Same contact block as the customer until contact is released.

Alerts, language, sign out, and delete account use the shared APIs.
