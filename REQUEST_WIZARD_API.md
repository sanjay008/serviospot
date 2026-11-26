# Customer request wizard — one API for every Next

The customer opens a new request from the **+** icon. The screen has **5 steps**. The **Next** button on steps 1–4 must call **one API**:

`POST https://app.erpportaal.nl/api/serviospot/saveRequestDraft`

Do not add a new URL per step. The same endpoint saves the draft, validates **only the step that was sent**, and tells the app whether that step is allowed to finish.

The app moves to the next step **only** when `data.step_completed` equals the `step` that was sent. A message such as `"Step 1 completed"` is for people. The app does not parse that sentence. It reads `data.step_completed`.

Step 5 does not have a Next button. Its button is **Submit request**, which stays `POST serviospot/submitRequest`. That call is allowed only after steps 1–4 are completed on the same `draft_id`.

## Auth and envelope

Same as the rest of ServioSpot.

- Method: `POST`
- JSON body
- Session: `token` in the JSON body (the app adds this; do not require a separate header)
- The app reads **only** `data`. Put `step_completed`, `next_step`, and `draft_id` inside `data`.
- `status: false` or a non-2xx HTTP status is a failure. The app stays on the current step and shows `message`.

Success:

```json
{
  "status_code": 200,
  "status": true,
  "message": "Step 1 completed",
  "data": {
    "draft_id": 88,
    "step": 1,
    "step_completed": 1,
    "next_step": 2,
    "completed_steps": [1]
  }
}
```

Validation failure. Do not set `step_completed`.

```json
{
  "status_code": 422,
  "status": false,
  "message": "Event date is required.",
  "data": {
    "draft_id": 88,
    "step": 1,
    "step_completed": null,
    "next_step": 1,
    "errors": {
      "event_date": "Event date is required."
    }
  }
}
```

## What to change on `saveRequestDraft`

Today this route can accept a partial request and the app does not wait for a step result. Change it as follows.

1. Require a signed-in **customer**. A vendor token must not create a customer request draft.
2. Accept a new integer `step`: `1`, `2`, `3`, or `4`.
3. Accept `draft_id` on steps 2–4. Step 1 may omit it; create the draft and return `draft_id`.
4. Keep **one open draft** per customer. If `draft_id` is missing on a later step, reuse that customer's open draft. If the id belongs to another customer, return 404 `"Draft not found."`
5. Merge the sent fields into that draft. Do not wipe earlier steps when a later step sends only its own fields. The app currently resends the whole body on every Next; still merge, do not require fields from future steps.
6. Validate **only** the rules for `step`. Do not reject step 1 because cuisine or consent is empty.
7. On success, persist the draft as incomplete and return `step_completed` equal to `step`, and `next_step` equal to `step + 1`.
8. On failure, return `status: false`, a clear `message`, and `data.step_completed: null`. Do not mark the step complete.
9. Do **not** invite vendors, create a public request, or send notifications from this API. That happens only in `submitRequest`.
10. Store `completed_steps`. A step may be saved again (the customer pressed Back, edited, then Next). Re-validate that step and keep it in `completed_steps` when it passes.
11. Optional `provider_id`: present when the customer started the request from one caterer's profile. Save it on the draft. It does not skip any step.

`message` on success must name the step that just finished, for example `"Step 1 completed"`, `"Step 2 completed"`, `"Step 3 completed"`, `"Step 4 completed"`.

## Steps

| Step | Screen | Next calls | `step` value | After success the app opens |
| --- | --- | --- | --- | --- |
| 1 | Event details | `saveRequestDraft` | `1` | Cuisine |
| 2 | Cuisine & dishes | `saveRequestDraft` | `2` | Staff |
| 3 | Staff & logistics | `saveRequestDraft` | `3` | Extras |
| 4 | Extra wishes | `saveRequestDraft` | `4` | Review |
| 5 | Review & submit | `submitRequest` | not this API | Request detail |

The customer cannot open step 2 until step 1 returns `step_completed: 1`. Same rule for steps 3 and 4. Back does not call the API.

## Body the app sends

`token` is added by the app. Every Next sends the fields filled so far, plus `step` and, after step 1, `draft_id`.

```json
{
  "token": "<session token>",
  "step": 1,
  "draft_id": 88,
  "provider_id": "5",
  "event_type": "birthday",
  "event_date": "2026-12-01",
  "start_time": "19:00",
  "end_time": "23:00",
  "city": "Surat",
  "postcode": "395007",
  "location": "Grand Hall",
  "indoor_outdoor": "indoor",
  "guest_count": 80,
  "needs": ["food"],
  "cuisines": ["surinamese", "hindustani"],
  "dietary": ["vegetarian:mixed", "halal"],
  "services": ["serve", "buffet"],
  "budget_total_cents": 250000,
  "description": "No nuts\nAllergies: nuts\nAvoid: beef",
  "details": {
    "venue_type": "venue",
    "occasion": "birthday",
    "cuisine_style": "hindustani",
    "counts": {
      "base": 2,
      "chicken": 1,
      "pork": 0,
      "beef": 0,
      "fish": 0,
      "shrimp": 0,
      "veg": 2,
      "extraVeg": 1,
      "starter": 1,
      "dessert": 1
    },
    "serving_format": "buffet",
    "staff": "yes",
    "warming": "yes",
    "fulfilment": "delivery",
    "handover_time": "18:00",
    "tableware": "real",
    "plates": "yes",
    "cutlery": "yes",
    "glasses": "no",
    "end_date": "2026-12-02",
    "drinks": "yes",
    "drink_type": "soft",
    "drink_quantity": "2 bottles per table",
    "halal": "yes",
    "vegan": "no",
    "diet_notes": ""
  }
}
```

How the screen maps onto those keys:

| App field | JSON |
| --- | --- |
| Event name | sent as `event_type` only when occasion is empty. Also keep the typed name: read `event_type` when it is not an occasion code, and store it as the event name. |
| Occasion | `details.occasion`, and `event_type` when an occasion is selected |
| Guests | `guest_count` |
| Event date | `event_date` (`YYYY-MM-DD`) |
| City | `city` |
| Postcode | `postcode` |
| Home or venue | `details.venue_type` |
| Venue name | `location` (only asked when `venue_type` is `venue`) |
| Indoor / outdoor | `indoor_outdoor` |
| Access, kitchen, power, water | first line of `description` when present |
| Cuisine | first value of `cuisines` |
| Surinamese style | `details.cuisine_style` and the second value of `cuisines` |
| Vegetarian | `details` is not a separate top-level key; it is inside `dietary` as `vegetarian:no`, `vegetarian:full`, or `vegetarian:mixed` |
| Serving format | `details.serving_format` |
| Dish counts | `details.counts` |
| Staffed service | `details.staff` |
| Warming trays | `details.warming` |
| Start / end time | `start_time`, `end_time` |
| End date | `details.end_date` |
| Delivery or pickup | `details.fulfilment` |
| Handover time | `details.handover_time` |
| Tableware | `details.tableware` |
| Plates, cutlery, glasses | `details.plates`, `details.cutlery`, `details.glasses` |
| Tasks set to yes | `services` (task keys below) |
| Drinks | `details.drinks`, `details.drink_type`, `details.drink_quantity` |
| Halal / vegan | `details.halal`, `details.vegan`, also listed in `dietary` when the value is `yes` |
| Allergies | a `description` line starting with `Allergies:` |
| Forbidden ingredients | a `description` line starting with `Avoid:` |
| Other diet notes | last free-text piece of `dietary` when it is not `vegetarian:…`, `halal`, or `vegan`; also `details.diet_notes` |
| Budget in euros | `budget_total_cents` (euros × 100). `0` or omitted means unknown. |
| Comments | included in `description` |
| Started from a caterer | `provider_id` |

`needs` is always `["food"]` from this screen.

## Allowed values

Send and store these exact codes. Do not translate them.

| Field | Allowed |
| --- | --- |
| `details.occasion` / `event_type` when it is an occasion | `birthday`, `wedding`, `business`, `other` |
| `details.venue_type` | `home`, `venue` |
| `indoor_outdoor` | `indoor`, `outdoor`, `both` |
| Cuisine (`cuisines[0]`) | `surinamese`, `turkish`, `dutch`, `african`, `indian`, `mixed`, `other` |
| `details.cuisine_style` | `hindustani`, `creole`, `javanese`, `mixedStyle`, `none` |
| Vegetarian prefix in `dietary` | `vegetarian:no`, `vegetarian:full`, `vegetarian:mixed` |
| `details.serving_format` | `buffet`, `plated`, `bites` |
| Yes / no fields | `yes`, `no` |
| `details.fulfilment` | `delivery`, `pickup` |
| `details.tableware` | `real`, `plastic`, `own` |
| `details.drink_type` | `soft`, `alcohol`, `both` |
| `services` task keys | `decorate`, `buffet`, `serve`, `bar`, `wash`, `clean` |
| `details.counts` keys | `base`, `chicken`, `pork`, `beef`, `fish`, `shrimp`, `veg`, `extraVeg`, `starter`, `dessert` |

Each count is an integer from 0 to 50. `guest_count` is an integer from 1 to 9999.

`cuisine_style` is sent only when cuisine is `surinamese`.

When vegetarian is `vegetarian:full`, animal counts (`chicken`, `pork`, `beef`, `fish`, `shrimp`) are 0. Reject the step if any of those is greater than 0.

## Validation by step

Ignore empty fields that belong to a later step.

### Step 1 — Event

Required:

- Event name: non-empty after trim. This is the text the customer typed. If `event_type` is an occasion code, the event name still has to have been provided; accept a non-empty `event_type` that is **not** an occasion code as the name, and require `details.occasion` separately when you store both. Practical rule: require a non-empty event name **and** `details.occasion` in `birthday|wedding|business|other`. Until the app sends the name in its own key, accept step 1 when `event_type` is non-empty (it is the occasion, or the event name if occasion is empty) **and** `guest_count`, `event_date`, `city`, and `postcode` are present. Also require `details.venue_type`, `indoor_outdoor`, and `details.occasion`.
- `guest_count` integer, 1–9999
- `event_date` valid `YYYY-MM-DD`, not in the past (compare in the customer's date, reject yesterday and earlier)
- `city` non-empty
- `postcode` non-empty
- `details.venue_type` is `home` or `venue`
- `location` (venue name) required only when `venue_type` is `venue`
- `indoor_outdoor` is `indoor`, `outdoor`, or `both`
- `details.occasion` is one of the occasion codes

Optional: access notes (`description`).

### Step 2 — Cuisine

Required:

- `cuisines[0]` is one of the cuisine codes
- If cuisine is `surinamese`, `details.cuisine_style` is one of the style codes
- Vegetarian is one of `vegetarian:no`, `vegetarian:full`, `vegetarian:mixed`
- `details.serving_format` is `buffet`, `plated`, or `bites`
- At least one dish: the sum of `details.counts` is ≥ 1
- Each count is an integer 0–50
- If vegetarian is `full`, animal counts are all 0

### Step 3 — Staff

Required:

- `details.staff` is `yes` or `no`
- `details.warming` is `yes` or `no`
- `details.tableware` is `real`, `plastic`, or `own`

When `staff` is `yes`:

- `start_time` and `end_time` are non-empty (`HH:MM`)
- `details.end_date` is a valid `YYYY-MM-DD` and is on or after `event_date`
- `services` may be empty. Each value, if present, must be a task key. Only tasks answered `yes` are sent.

When `staff` is `no`:

- `details.fulfilment` is `delivery` or `pickup`
- `details.handover_time` is non-empty
- Do not require start, end, end date, or tasks

When `tableware` is `real` or `plastic`:

- `details.plates`, `details.cutlery`, and `details.glasses` are each `yes` or `no`

When `tableware` is `own`:

- Do not require plates, cutlery, or glasses

### Step 4 — Extras

Required:

- `details.drinks` is `yes` or `no`
- `details.halal` is `yes` or `no`
- `details.vegan` is `yes` or `no`

When `drinks` is `yes`:

- `details.drink_type` is `soft`, `alcohol`, or `both`
- `details.drink_quantity` is non-empty

When `drinks` is `no`:

- Do not require drink type or quantity

Optional: allergies, forbidden ingredients, diet notes, budget, comments.

If `budget_total_cents` is sent, it is an integer ≥ 0. `0` means the customer does not know the budget. Do not reject `0`.

### Step 5 — Submit (different API)

`POST serviospot/submitRequest`

Body is the same request body plus:

```json
{ "draft_id": 88, "consent": true }
```

Reject when:

- `consent` is not `true`
- `draft_id` is missing or is not this customer's draft
- steps 1–4 are not all in `completed_steps`
- any step 1–4 rule would now fail (the customer may have old data)

On success, turn the draft into a real request, then match vendors. Return inside `data`:

```json
{
  "request_id": 501,
  "draft_id": 88,
  "reference": "REQ-501",
  "status": "submitted"
}
```

The app opens the request screen from `data.request_id` or `data.id`. One of those two keys is required.

## Examples

Step 1, missing date:

Request includes `"step": 1` and no `event_date`.

```json
{
  "status_code": 422,
  "status": false,
  "message": "Event date is required.",
  "data": { "step": 1, "step_completed": null, "next_step": 1, "errors": { "event_date": "Event date is required." } }
}
```

The app stays on Event.

Step 1, valid:

```json
{
  "status_code": 200,
  "status": true,
  "message": "Step 1 completed",
  "data": { "draft_id": 88, "step": 1, "step_completed": 1, "next_step": 2, "completed_steps": [1] }
}
```

The app opens Cuisine and sends `draft_id: 88` on the next Next press.

Step 2 before step 1 is complete:

```json
{
  "status_code": 422,
  "status": false,
  "message": "Complete step 1 first.",
  "data": { "draft_id": 88, "step": 2, "step_completed": null, "next_step": 1, "completed_steps": [] }
}
```

## Out of scope for this API

- Vendor onboarding, plans, Mollie, invoices
- Creating proposals or inviting vendors inside `saveRequestDraft`
- A separate URL per step
