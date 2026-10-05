---
title: Testing Payment Flows Without the Payment SDK
description: >-
  How to use component mocking to test payment callbacks, analytics events, and
  error handling without depending on third-party SDKs like Adyen or Stripe.
date: '2026-04-19'
tags:
  - testing
  - twd
  - payments
  - mocking
devto_url: 'https://dev.to/kevinccbsg/testing-payment-flows-without-the-payment-sdk-3obm'
---
Payment integrations are one of the hardest things to test in a web app. The SDK renders its own UI, controls its own form fields, and fires callbacks when the user completes a payment. You can't programmatically fill in a credit card number. You can't simulate a declined card. And if the SDK fails to initialize — because of a network issue, a bad API key, or a test environment misconfiguration — your entire test falls apart.

You can mock the SDK's setup endpoint to get the SDK rendering, the form mounting, the session resolving. That covers surface area — but it stops there. It doesn't test what happens *after* the payment resolves: the API calls, the analytics events, the navigation, the error states. The part that actually matters.

This article shows a different approach: using TWD's component mocking to replace the payment SDK entirely with a simple mock that gives you full control over the payment lifecycle.

## Test What You Own. Mock What You Don't.

That's TWD's philosophy, and it's the whole reason component mocking is the right tool here. The payment SDK is someone else's code — its internals and lifecycle are their problem, covered by their test suite. Your responsibility is the seam: the callbacks fired into your app, the API calls they trigger, the analytics events, the UI state. That's where your bugs ship from.

You won't exercise the real SDK in these tests. That's the tradeoff — and it's deliberate. What you gain is the ability to exercise *your* side of the integration exhaustively: every callback, every branch, every error path. The SDK's correctness is the vendor's concern. The correctness of everything your app does around it is yours, and that's what these tests finally reach.

## The Problem

A typical payment component looks like this:

```tsx
function PaymentDropIn({ session, clientKey, orderId, cart }) {
  useEffect(() => {
    const checkout = await PaymentSDK.init({
      session,
      clientKey,
      onPaymentCompleted: async () => {
        await confirmOrder(orderId);
        await trackPurchase(cart, orderId);
        navigate("/success");
      },
      onPaymentFailed: (result) => {
        trackPaymentError(cart, result.code);
        setError("Payment failed");
      },
    });
    checkout.mount(ref.current);
  }, []);

  return <div ref={ref} />;
}
```

Everything is tangled inside one component: the SDK initialization, the business logic, the analytics, the navigation, the error handling. You can't test the `onPaymentCompleted` callback without actually initializing the SDK. And you can't initialize the SDK without a real (or carefully mocked) payment session.

## Step 1: Separate the SDK from the Logic

The fix is architectural. Move the callback logic *out* of the payment component and into the parent. The payment component becomes a thin SDK wrapper that receives callbacks as props:

```tsx
// Thin wrapper — just the SDK
function PaymentDropIn({ session, clientKey, onCompleted, onFailed, onError }) {
  useEffect(() => {
    const checkout = await PaymentSDK.init({
      session,
      clientKey,
      onPaymentCompleted: () => onCompleted(),
      onPaymentFailed: (result) => onFailed(result.code),
      onError: (err) => onError(err.message),
    });
    checkout.mount(ref.current);
  }, []);

  return <div ref={ref} />;
}
```

```tsx
// Parent — owns the business logic
function CheckoutPage({ cart, orderId }) {
  const handleCompleted = async () => {
    await confirmOrder(orderId);
    await trackPurchase(cart, orderId);
    navigate("/success");
  };

  const handleFailed = (code) => {
    trackPaymentError(cart, code);
    setError("Payment failed");
  };

  return (
    <PaymentDropIn
      session={session}
      clientKey={clientKey}
      onCompleted={handleCompleted}
      onFailed={handleFailed}
      onError={handleError}
    />
  );
}
```

This is a good refactor regardless of testing. The parent owns the business logic. The payment component owns the SDK. Clean separation.

## Step 2: Wrap for Mocking

TWD provides `MockedComponent` — a wrapper that lets tests replace a component's children with a mock. Wrap the payment component:

```tsx
import { MockedComponent } from "twd-js/ui";

function PaymentDropIn(props) {
  return (
    <MockedComponent name="paymentDropIn">
      <PaymentDropInContent {...props} />
    </MockedComponent>
  );
}
```

In production, `MockedComponent` is a transparent pass-through — it renders its children. In tests, `twd.mockComponent("paymentDropIn", ...)` replaces the children with whatever you provide.

One important detail: `MockedComponent` passes its child's *props* to the mock component. That's why we need `PaymentDropInContent` as a separate component that receives all the callback props — so the mock receives them too.

## Step 3: Build the Mock

The mock is dead simple. Three buttons — one per payment outcome:

```tsx
twd.mockComponent("paymentDropIn", ({ onCompleted, onFailed, onError }) => {
  return (
    <div>
      <button onClick={() => onCompleted()}>Pay</button>
      <button onClick={() => onFailed("Refused")}>Fail Payment</button>
      <button onClick={() => onError("SDK crashed")}>Error</button>
    </div>
  );
});
```

Click "Pay" and the parent's `handleCompleted` fires — calling `confirmOrder`, sending the purchase event, navigating to success. Click "Fail Payment" and `handleFailed` fires — sending the error event, showing the error banner. No SDK involved. Just callbacks.

## Step 4: Test Everything

Now you can test the full payment lifecycle with standard TWD patterns:

```ts
it("should call confirmOrder and navigate to success", async () => {
  await twd.mockRequest("confirmOrder", {
    url: `/api/orders/${orderId}/confirm`,
    method: "PATCH",
    status: 200,
    response: { customer_id: "cust-123", order_count: 3 },
  });

  // ... fill form, submit, wait for payment session ...

  const payButton = await screenDom.findByRole("button", { name: "Pay" });
  await userEvent.click(payButton);

  // Verify the API was called
  const rule = await twd.waitForRequest("confirmOrder");
  expect(rule).to.exist;

  // Verify navigation
  await twd.url().should("contain.url", "/success");
});

it("should fire purchase_error when payment is declined", async () => {
  // ... setup ...

  const failButton = await screenDom.findByRole("button", { name: "Fail Payment" });
  await userEvent.click(failButton);

  const errorEvent = await twd.waitFor(() => {
    const ev = window.dataLayer.find(e => e.event === "purchase_error");
    if (!ev) throw new Error("Event not found");
    return ev;
  });
  expect(errorEvent.error_code).to.equal("Refused");
});

it("should show error banner when confirmOrder fails", async () => {
  await twd.mockRequest("confirmOrderFail", {
    url: `/api/orders/${orderId}/confirm`,
    method: "PATCH",
    status: 500,
    response: { message: "Server error" },
  });

  // ... setup ...

  const payButton = await screenDom.findByRole("button", { name: "Pay" });
  await userEvent.click(payButton);

  const errorBanner = await twd.get("[data-testid='payment-error']");
  errorBanner.should("be.visible");
  await twd.url().should("not.contain.url", "/success");
});
```

## What This Pattern Gives You

**Coverage you couldn't get before:**
- Analytics events fire with the correct data (payment type, transaction ID, error codes)
- The `confirmOrder` API is called with the right order ID
- Navigation to the success page happens after payment, not before
- Error banners appear when the API fails
- Error banners appear when the payment is declined
- Error banners appear when the SDK crashes

**Speed:** These tests run in ~1 second each. No SDK initialization, no payment session setup, no Adyen/Stripe endpoint mocking.

**Reliability:** No more flaky tests that break because the payment SDK's test environment is down. The mock is deterministic.

## Conclusion

The unlock is component mocking. TWD's `MockedComponent` lets you replace a third-party SDK in tests with a simple stand-in whose callbacks you fire on demand — so the payment flow, which previously depended on an un-drivable SDK, becomes three buttons and a set of assertions. The SDK never boots. Tests run in a second. The callback flow — API calls, analytics, navigation, error states — is finally exercised.

The thin-wrapper refactor is what makes that possible, but it's the enabler, not the point. Once it's in place, the pattern transfers to any third-party component that fires callbacks: map SDKs, video players, chat widgets, auth flows. Same shape every time — wrap the component, swap it in tests.

Existing tests that mock the SDK's setup endpoint still work; they cover different ground. The component mock picks up where those stop.

More on the feature at [twd.dev/component-mocking](https://twd.dev/component-mocking.html).
