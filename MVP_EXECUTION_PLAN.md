# BK Football Predictions — MVP Execution Plan

**Execution status:** Core local MVP implemented on 19 September 2026. The unchecked items below are the product-owner review, broader browser/accessibility QA, and production-readiness work that should follow the first execution.

## 1. MVP outcome

Deliver a usable football-predictions platform in which:

- Visitors can understand the BK Football Predictions service, browse packages, view free predictions, recent results, and testimonials.
- Customers can register, log in, request access to a package, view the request state, and read premium predictions only while their subscription is active.
- The product owner can publish predictions and results, manage packages, approve or reject access requests, set subscription expiry dates, and manage public content.
- The Django API enforces every premium-content rule. The Vue interface never receives locked prediction details.
- The complete customer and owner workflow runs locally without payments, WhatsApp, AI, live-score feeds, email, SMS, or any other external service.

The MVP is successful when one person can complete this flow:

1. Register as a customer.
2. Browse available packages.
3. Request access to one package.
4. See the request as pending.
5. Have an owner approve it in the dedicated BK Owner Control Room.
6. Refresh the account and see the subscription as active.
7. Open premium predictions for that package.
8. Lose access automatically after the subscription expires.

## 2. Scope boundary

### Included

- Responsive, independently branded BK public website.
- Customer registration, login, logout, session persistence, and account page.
- Free and premium prediction publishing.
- Package catalogue with daily, weekly, monthly, and special package support.
- Manual package-access requests.
- Owner approval, rejection, activation, cancellation, and expiry management.
- Server-side premium-content authorization.
- Recent wins/results and testimonials.
- Dedicated Vue owner dashboard for daily package, prediction, access, content, and customer operations.
- Loading, empty, validation, unauthorized, forbidden, and server-error states.
- API, permission, and critical frontend-flow tests.
- Development setup documentation and seeded demonstration data.

### Explicitly excluded

- Mobile-money or card payments.
- JPesa, MTN MoMo, Airtel Money, Stripe, or other payment providers.
- WhatsApp, Twilio, AI support, SMS, email, push notifications, or social login.
- Live-score and football-data providers.
- Advertising integrations or forced video advertisements.
- Developer commission calculations and withdrawals.
- Automated deployment webhooks.
- Data migration from Almax.
- Native mobile applications.

These exclusions must not leave dead buttons, placeholder forms, fake payment states, or sample predictions presented as current data.

## 3. Product composition

### Public experience

Routes:

- `/` — brand introduction, current free pick, product explanation, proof, package preview, and clear registration action.
- `/predictions` — free predictions and premium teasers. Locked responses may show match, competition, kickoff, package, and result state, but never the premium selection, odds, analysis, or betslip data.
- `/packages` — available packages, duration, access description, price display for information, and request-access action.
- `/results` — completed prediction outcomes and recent wins.
- `/about` — product principles, responsible-use message, and service limitations.
- `/login` and `/register` — customer authentication.
- A branded `404` route.

### Customer account

Routes:

- `/account` — identity summary and current access state.
- `/account` — pending, active, expired, rejected, and cancelled subscriptions, with links to authorized predictions.

The account must provide a clear next action for every state. A pending request explains that owner review is required; an expired subscription links back to available packages.

### Owner operations

Build a dedicated Vue owner control room as part of the MVP. Django Admin remains an emergency technical fallback, while daily owner operations happen in the branded dashboard. Provide filters, search, ordering, read-only audit fields, and deliberate actions for:

- Customers.
- Packages.
- Subscription requests and active subscriptions.
- Predictions and prediction results.
- Recent wins.
- Testimonials.

The owner can approve a pending subscription through a protected owner API and dedicated dashboard action. Approval records the acting staff member, activation time, expiry time, and activation source.

## 4. Technical composition

### Frontend: `bk_footballpredictions_web`

Use the existing Vue 3 and Vite project. Add:

- Vue Router for route-level customer journeys.
- Pinia for authentication, packages, and subscription state.
- A single API client with credentials, CSRF support, normalized errors, and no API-shape compatibility hacks.
- Feature folders for public content, accounts, predictions, packages, and subscriptions.
- A BK design-token layer for color, typography, spacing, radii, motion, and focus states.

Recommended structure:

```text
src/
  api/
  assets/
  components/
  composables/
  layouts/
  router/
  stores/
  views/
  styles/
```

Use history routing and configure the eventual web server to return `index.html` for frontend routes.

### Backend: `bk_footballpredictions_api`

Retain `config/` and keep the first MVP domain in two focused Django applications:

```text
accounts/
catalog/
```

Use Django REST Framework and same-origin, secure cookie sessions for the browser MVP. Use Django CSRF protection for state-changing requests. This avoids storing bearer tokens in browser local storage. The Vite development proxy keeps the local browser flow same-origin.

SQLite is acceptable for the first local execution. Use PostgreSQL before staging or production.

### Core data model

#### User

- Unique normalized phone number.
- Display name.
- Active/blocked status.
- Staff and superuser flags through Django's permission system.
- Created and updated timestamps.

Create the custom user model before the first business migration.

#### Package

- Name and slug.
- Access duration in hours or days.
- Informational price and currency.
- Description and benefits.
- Active and featured flags.
- Optional request deadline.
- Display order.

Do not name this model `Group`; Django uses groups for permissions.

#### Subscription

- Customer and package.
- Status: `pending`, `active`, `expired`, `rejected`, or `cancelled`.
- Requested, approved, starts, and expires timestamps.
- Informational price snapshot.
- Activation source: `manual` for the MVP, with room for `payment` later.
- Approved-by staff member.
- Owner note and customer-visible response.

Only one unresolved request for the same customer and package should be allowed at a time.

#### Prediction

- Home and away teams.
- Competition and kickoff timestamp.
- Access level: `free` or `premium`.
- Required package for premium predictions.
- Market, selection, odds, analysis, and optional betslip reference.
- Publication state and publication timestamp.
- Result state: `pending`, `won`, `lost`, or `void`.
- Created-by and updated-by staff references.

The serializer must omit premium fields unless the authenticated customer has an active, unexpired subscription to the required package.

#### Public content

- `RecentWin` for proof/result content.
- `Testimonial` with moderation and publication state.

## 5. Initial API contract

```text
GET    /api/health/

GET    /api/v1/auth/csrf/
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/me/

GET    /api/v1/packages/
GET    /api/v1/packages/{slug}/

GET    /api/v1/predictions/
GET    /api/v1/predictions/{id}/

GET    /api/v1/me/subscriptions/
POST   /api/v1/me/subscriptions/
POST   /api/v1/me/subscriptions/{id}/cancel/

GET    /api/v1/recent-wins/
GET    /api/v1/testimonials/
GET    /api/v1/owner/dashboard/
CRUD   /api/v1/owner/packages/
CRUD   /api/v1/owner/predictions/
POST   /api/v1/owner/subscriptions/{id}/decide/
CRUD   /api/v1/owner/recent-wins/
CRUD   /api/v1/owner/testimonials/
GET    /api/v1/owner/customers/
POST   /api/v1/owner/customers/{id}/block/
GET    /api/v1/owner/activities/
```

Registration sends `first_name`, `surname`, `date_of_birth`, a normalized unique
`phone`, `password`, and `password_confirm`. The API requires the member to be at
least 18 years old. The current privileged role is Product Owner; future roles
use Django groups and permissions so staff access is not automatically elevated
to owner access.

Customer ownership must always come from `request.user`. No customer endpoint accepts a user ID from the browser.

## 6. Execution sequence

### Phase 1 — Foundation and contract

- [x] Record MVP scope and exclusions in repository documentation.
- [x] Add Vue Router and Pinia.
- [x] Create frontend layouts, router guards, API client, and error model.
- [x] Create Django apps and the custom user model.
- [x] Configure DRF, session authentication, CSRF, media, and API error responses.
- [x] Establish `/api/v1/` versioning.
- [x] Add a development seed command and environment examples without secrets.
- [x] Use a consistent snake-case API response convention.

Exit condition: a customer can register, log in, refresh the browser, retrieve `/auth/me/`, and log out.

### Phase 2 — Packages and subscriptions

- [x] Implement `Package` and `Subscription` models and migrations.
- [x] Build dedicated owner package management with image upload.
- [x] Implement public package endpoints.
- [x] Implement authenticated subscription request and cancellation endpoints.
- [x] Implement owner approve, reject, and cancel actions in the control room.
- [x] Enforce expiry during every entitlement check.
- [x] Build package catalogue and customer subscription screens.

Exit condition: a registered customer can request a package and an owner can activate it without editing the database manually.

### Phase 3 — Predictions and access control

- [x] Implement prediction publishing and result states.
- [x] Build dedicated owner prediction publishing and result management.
- [x] Implement public teaser serialization.
- [x] Implement authenticated premium serialization based on package entitlement.
- [x] Add free and premium prediction views in Vue.
- [x] Add locked, pending-access, expired, empty, and unavailable states.
- [x] Remove the scaffold health-check presentation from the frontend.

Exit condition: premium fields never appear in an unauthorized API response, while an active subscriber receives them.

### Phase 4 — Public content and BK interface

- [x] Establish the BK identity, typography, color system, icon style, and responsive grid.
- [x] Build the home, predictions, packages, results, about, login, register, account, and 404 pages.
- [x] Implement recent wins and moderated testimonials.
- [x] Add clear timestamps and result labels.
- [ ] Add responsible-use, privacy, and terms links with approved draft copy.
- [x] Add keyboard navigation, focus states, reduced-motion handling, and semantic landmarks.

Exit condition: every included route works on phone and desktop widths with real API states and no placeholder interactions.

### Phase 5 — Verification and first execution

- [x] Add backend tests for authentication, ownership, permissions, subscription lifecycle, expiry, and premium-field redaction.
- [ ] Add frontend tests for authentication state, package requests, route guards, and locked-content behavior.
- [x] Run one end-to-end owner-approval journey through the Vite proxy.
- [ ] Create deterministic seed data for free, locked, active, expired, won, lost, and empty states.
- [x] Run migrations from a clean database.
- [x] Run Django checks and the complete backend test suite.
- [x] Run the Vite production build.
- [x] Start both servers and execute the complete customer-to-owner-to-customer workflow.

Exit condition: all MVP acceptance scenarios pass from a clean checkout using documented commands.

## 7. Required acceptance checks

- [ ] A guest receives complete free predictions.
- [ ] A guest receives only safe teaser fields for premium predictions.
- [ ] A logged-in customer without access still receives only teaser fields.
- [ ] A pending request does not unlock premium content.
- [ ] An active subscription unlocks only its associated package.
- [ ] An expired subscription immediately stops unlocking premium content.
- [ ] One customer cannot read or modify another customer's subscriptions.
- [ ] Blocking a customer invalidates their authenticated access.
- [ ] Draft predictions, wins, and testimonials never appear publicly.
- [ ] Client-supplied status, expiry, price, user ID, or approval fields are ignored or rejected.
- [ ] API failure produces an honest unavailable state rather than static or stale predictions.
- [ ] Repeated access requests do not create uncontrolled duplicates.
- [ ] Owner actions retain an audit trail.
- [ ] Uploaded media types and sizes are validated.
- [ ] No secrets are committed to either repository.

## 8. Checklist after the first successful execution

### Product-owner review

- [ ] Demonstrate the complete manual access workflow to the product owner.
- [ ] Confirm the names, durations, informational prices, and rules for every package.
- [ ] Confirm exactly which prediction fields guests may see.
- [ ] Confirm the content publishing and result-update workflow.
- [ ] Replace seed copy and media with approved BK content.
- [ ] Record requested changes as prioritized issues rather than changing scope during the review.

### Security and permission review

- [ ] Inspect guest, customer, blocked-user, staff, and superuser permissions separately.
- [ ] Verify premium fields are absent from raw network responses, not merely hidden in the page.
- [ ] Verify CSRF enforcement on every state-changing session endpoint.
- [ ] Verify session cookies use `HttpOnly`, `Secure`, and appropriate `SameSite` settings outside local development.
- [ ] Run dependency and secret scans.
- [ ] Review media access so uploads cannot execute code or expose private files.

### Operational rehearsal

- [ ] Have the owner create, edit, publish, settle, and archive a prediction.
- [ ] Have the owner approve, reject, cancel, and expire test subscriptions.
- [ ] Verify timestamps and expiry behavior in the configured Uganda timezone.
- [ ] Verify how an incorrect owner action is corrected and logged.
- [ ] Export and restore a test database backup.
- [ ] Write the short daily operating procedure for the owner.

### User-experience review

- [ ] Test the primary workflow at common mobile widths and on a slow connection.
- [ ] Test keyboard-only navigation and visible focus.
- [ ] Check loading, empty, offline, 401, 403, 404, 422, and 500 states.
- [ ] Check contrast, text resizing, reduced motion, and screen-reader labels.
- [ ] Confirm that no dead payment, chat, live-score, or advertisement controls remain.
- [ ] Run a five-user usability session and record where users hesitate.

### Staging readiness

- [ ] Move staging from SQLite to PostgreSQL.
- [ ] Separate development, test, staging, and production settings.
- [ ] Configure allowed hosts, trusted origins, HTTPS, static files, media storage, structured logging, and error reporting.
- [ ] Establish database and media backup retention.
- [ ] Add health and readiness checks.
- [ ] Run migrations and tests from a clean staging deployment.
- [ ] Perform product-owner acceptance testing and record written sign-off.

### Post-MVP backlog decision

- [ ] Review real usage before selecting integrations.
- [ ] Decide whether the first integration should be payment collection, notifications, or customer support.
- [ ] Write provider-neutral interfaces before selecting a payment or messaging vendor.
- [ ] Add webhook idempotency, reconciliation, refunds, and audit requirements before payment implementation.
- [ ] Add support conversation ownership, privacy, quotas, and human takeover requirements before WhatsApp or AI support.
- [ ] Review owner-dashboard usage and prioritize workflow refinements from observed operational pain.
- [ ] Keep developer commission, live scores, advertising, and automated deployment outside scope until separately approved.

## 9. MVP definition of done

The MVP is done only when the system can be installed from a clean checkout, the automated checks pass, the full manual-access workflow succeeds, premium fields are protected by Django, the owner can operate the product without developer database access, and the product owner accepts the responsive BK customer experience.
