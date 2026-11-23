
# MPERN Store --- Payment Security Changes

## Overview

This document records the payment-security changes made to the MPERN
Store payment flow, the protections they provide, and the remaining work
required before the payment module can be considered production-ready.

The current payment integration uses Razorpay for online payments,
PostgreSQL through Prisma for order/payment records, and Express for the
backend APIs and webhook endpoint.

> **Status note:** The changes below describe the code updates prepared
> during this work. Syntax checks and end-to-end payment-security tests
> must be run in the project environment. A successful syntax check does
> not prove that the full payment flow is secure or operational.

------------------------------------------------------------------------

## 1. Files Changed

  ---------------------------------------------------------------------------------------
  File                                                Change
  --------------------------------------------------- -----------------------------------
  `server/routes/adminRoutes.js`                      Removed the admin route that
                                                      allowed manual payment-status
                                                      updates.

  `server/controllers/razorpayWebHookController.js`   Strengthened webhook validation,
                                                      removed sensitive debug logging,
                                                      and safely ignored unsupported
                                                      events.

  `server/controllers/paymentController.js`           Strengthened customer payment
                                                      verification and handled a
                                                      webhook/customer-verification race
                                                      condition.

  `client/src/pages/admin/AdminOrderDetails.jsx`      Removed the manual payment-failure
                                                      action and made payment status
                                                      read-only in the admin UI.

  `server/app.js`                                     Confirmed that the Razorpay webhook
                                                      route uses `express.raw()` before
                                                      normal JSON parsing. A duplicate
                                                      normal middleware registration was
                                                      identified for cleanup.
  ---------------------------------------------------------------------------------------

## 2. Admin Payment-Status Restrictions

**File:** `server/routes/adminRoutes.js`

The admin endpoint:

``` http
PATCH /api/admin/orders/:id/payment
```

was removed from the admin router.

The `updatePaymentStatus` controller is no longer imported or registered
by this router.

### Security benefit

Administrators can no longer use this route to manually set an order's
payment status to `PAID` or `REFUNDED`. Payment status should be updated
only by the verified payment/refund workflow.

The admin router continues to apply its router-level authentication and
ADMIN role authorization middleware.

**Important:** Removing the route from this router does not prove that
the controller function has been deleted or that no other route exposes
it. Check the project for any other registration of
`updatePaymentStatus`.

## 3. Razorpay Webhook Security

**File:** `server/controllers/razorpayWebHookController.js`

The webhook handler applies the following checks:

-   Requires the configured `RAZORPAY_WEBHOOK_SECRET`.
-   Requires the request body to be a raw `Buffer`.
-   Validates the webhook signature format.
-   Computes an HMAC-SHA256 digest using the webhook secret.
-   Compares signatures using `crypto.timingSafeEqual()`.
-   Parses the JSON payload only after signature verification.
-   Requires a webhook event ID.
-   Ignores unsupported event types before attempting to extract payment
    details.
-   Checks that a matching application order exists.
-   Validates the payment amount and currency against the stored order.
-   For `payment.captured`, checks that Razorpay reports the payment as
    `captured`.
-   Records webhook event IDs in the database. The
    `WebhookEvent.eventId` field is unique, providing duplicate-event
    protection.
-   Uses a database transaction to record the event and update the
    order.

Sensitive debug logging of the webhook signature and complete raw
payload was removed.

### Events currently handled

  -----------------------------------------------------------------------
  Razorpay event                      Current behaviour
  ----------------------------------- -----------------------------------
  `payment.captured`                  Validates the captured payment and
                                      attempts to mark the order `PAID`
                                      and `CONFIRMED`.

  `payment.failed`                    Attempts to mark a pending payment
                                      as `FAILED`.

  Other events                        Returns a successful ignored
                                      response.
  -----------------------------------------------------------------------

### Raw request body configuration

The webhook route in `server/app.js` is registered before the normal
JSON body parser:

``` js
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

app.use(express.json());
```

This ordering is required because webhook signature verification must
use the original request bytes.

The uploaded `app.js` also contained duplicate registrations of
`express.json()` and `cookieParser()`. These are redundant and should be
reduced to one registration each, while keeping the webhook route before
`express.json()`.

## 4. Customer Payment Verification

**File:** `server/controllers/paymentController.js`

The customer verification flow checks:

1.  The authenticated user's ownership of the application order.
2.  That the submitted Razorpay order ID matches the order's stored
    Razorpay order ID.
3.  The Razorpay payment signature using HMAC-SHA256 and a timing-safe
    comparison.
4.  The payment record fetched directly from Razorpay.
5.  That the fetched payment belongs to the expected Razorpay order.
6.  That the payment amount matches the stored order total.
7.  That the payment currency matches the order currency.
8.  That the payment status is `captured`.

The database update is conditional on the order still being eligible for
payment confirmation. This helps prevent conflicting updates from
overwriting an order that has already changed.

### Duplicate verification and webhook race handling

A webhook may confirm a payment before the customer's browser finishes
its verification request.

The verification controller now checks whether the order is already
`PAID` with the same Razorpay payment ID. If so, it returns a successful
"already verified" response rather than treating the same payment as a
conflict.

A different payment ID for an order already marked as paid is rejected.

## 5. Admin Order Details UI

**File:** `client/src/pages/admin/AdminOrderDetails.jsx`

The admin order details page was rewritten to preserve the existing
order information and layout while removing manual payment-status
changes.

Changes include:

-   Removed the "Mark Payment as Failed" action.
-   Removed the frontend request to `PATCH /admin/orders/:id/payment`.
-   Removed the associated payment-update loading and message state.
-   Displays payment status as read-only.
-   Retains order-status management separately.
-   Retains customer details, shipping address, ordered products, order
    summary, payment identifiers, and order timeline.

Frontend restrictions improve the admin experience, but backend
authorization and route restrictions remain the actual security
boundary.

## 6. Database Support Already Present

The Prisma schema contains:

-   `Order.razorpayOrderId`, with a unique constraint.
-   `Order.razorpayPaymentId`, with a unique constraint.
-   `Order.paymentStatus`, using `PENDING`, `PAID`, `FAILED`, and
    `REFUNDED`.
-   `WebhookEvent.eventId`, with a unique constraint.
-   `WebhookEvent.eventType` and timestamps.

These fields support tracking a single Razorpay order/payment reference
and deduplicating webhook event IDs.

### Refund tracking is not implemented yet

The current schema does not contain a dedicated refund model or fields
for:

-   Razorpay refund ID.
-   Refund amount.
-   Refund status and lifecycle.
-   Partial or multiple refunds.
-   Refund timestamps or failure details.

A separate `Refund` model is planned for a proper refund lifecycle. The
order must not be marked `REFUNDED` merely because a refund request was
submitted; the provider's successful refund outcome must be verified
first.

------------------------------------------------------------------------

## 7. Remaining Security and Reliability Work

The following items were identified but are **not yet implemented** in
this change set.

  -----------------------------------------------------------------------
  Priority                Remaining item          Why it matters
  ----------------------- ----------------------- -----------------------
  High                    Implement refund        Prevents false refund
                          creation, persistence,  status and provides an
                          and verified            auditable refund
                          refund-event handling   history.

  High                    Prevent unpaid orders   Keeps order fulfilment
                          from being moved from   state consistent with
                          `PENDING` to            payment state.
                          `CONFIRMED`             

  High                    Handle a captured       Prevents a successful
                          payment arriving after  customer charge from
                          an order has been       being left without an
                          cancelled               appropriate
                                                  recovery/refund
                                                  process.

  Medium                  Make Razorpay order     Prevents simultaneous
                          creation                requests from creating
                          concurrency-safe        multiple provider
                                                  orders for one
                                                  application order.

  Medium                  Add payment             Helps detect and repair
                          reconciliation and      differences between
                          recovery                Razorpay and
                                                  PostgreSQL.

  Medium                  Test webhook retry and  Confirms idempotency
                          duplicate-event         under actual retry
                          behaviour               conditions.
  -----------------------------------------------------------------------

The current webhook handler supports `payment.captured` and
`payment.failed`; refund events are not yet processed.

The current `createRazorpayOrder` flow reuses an already stored Razorpay
order ID, but concurrent requests can still race before that ID is
saved. A concurrency-safe design remains necessary.

------------------------------------------------------------------------

## 8. Verification Checklist

Run these checks in a development/test environment before deploying.

### Syntax checks

From the backend project directory:

``` bash
node --check server/routes/adminRoutes.js
node --check server/controllers/razorpayWebHookController.js
node --check server/controllers/paymentController.js
node --check server/app.js
```

No output and no error generally indicates that Node.js found no syntax
errors. To make success explicit:

``` bash
node --check server/controllers/paymentController.js && echo "Syntax check passed!"
```

For the React page, run the frontend development server and inspect the
browser console/build output. `node --check` alone is not a complete
JSX/Vite build test.

### Functional and security tests

-   [ ] Confirm `PATCH /api/admin/orders/:id/payment` is no longer
    registered.
-   [ ] Confirm unauthenticated requests cannot access admin endpoints.
-   [ ] Confirm non-admin users cannot access admin endpoints.
-   [ ] Confirm a webhook with an invalid signature is rejected.
-   [ ] Confirm a valid, supported webhook is processed.
-   [ ] Confirm an unsupported event is acknowledged and ignored.
-   [ ] Confirm a duplicate webhook event ID is not processed twice.
-   [ ] Confirm amount and currency mismatches are rejected.
-   [ ] Confirm a customer cannot verify another customer's order.
-   [ ] Confirm a payment with a mismatched Razorpay order ID is
    rejected.
-   [ ] Confirm a payment that is not captured is not marked `PAID`.
-   [ ] Confirm verification returns success if the webhook has already
    confirmed the same payment ID.
-   [ ] Confirm the admin order details page has no manual
    payment-status action.

Use Razorpay test mode and test credentials for payment testing. Do not
test by manually changing production payment records.

------------------------------------------------------------------------

## 9. Security Notes

-   Keep `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`
    server-side. Never expose them in frontend environment variables or
    client bundles.
-   Use HTTPS for production webhook and application endpoints.
-   Do not log payment secrets, webhook signatures, or complete
    sensitive payloads.
-   Configure the Razorpay dashboard webhook URL and secret to match the
    backend environment.
-   Keep webhook raw-body middleware before JSON parsing.
-   Treat webhook delivery as retryable and design all payment/refund
    processing to be idempotent.
-   Do not consider syntax checks a substitute for integration,
    concurrency, and security testing.

## 10. Current Completion Summary

**Implemented in this change set:**

-   Removed the admin payment-status update route.
-   Strengthened Razorpay webhook signature and payload validation.
-   Removed sensitive webhook debug logs.
-   Added safe handling for unsupported webhook events.
-   Strengthened customer payment verification.
-   Handled the same-payment webhook/verification race.
-   Removed manual payment-status controls from the admin order details
    UI.
-   Confirmed the webhook route is configured to receive the raw request
    body before JSON parsing.

**Still pending:**

-   Complete refund workflow and refund persistence.
-   Unpaid-order confirmation restriction.
-   Concurrent Razorpay order creation protection.
-   Late-payment-after-cancellation recovery.
-   Payment reconciliation.
-   Full end-to-end security testing.

------------------------------------------------------------------------

*This README documents the changes and findings from the current
development checkpoint. It is not a security certification or a claim
that the payment integration is production-ready.*
