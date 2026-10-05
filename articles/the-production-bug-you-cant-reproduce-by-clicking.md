---
title: The Production Bug You Can't Reproduce by Clicking
description: >-
  Some bugs only happen when a request fails or arrives late at the exact wrong
  moment. You can't trigger that manually. An AI agent reading the code plus
  deterministic TWD mocks made it reproducible in a test.
date: '2026-07-03'
tags:
  - testing
  - twd
  - ai
  - debugging
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fo7qeskxv1sa52qayv0vq.png
devto_url: >-
  https://dev.to/kevinccbsg/the-production-bug-you-cant-reproduce-by-clicking-1k4d
---
A payment request showed up in production logs with `country: "ROW"` at the top level and `billing_address.country: "FRA"` inside the customer object. Two different countries in the same body. The frontend clearly sent it, but nobody could make it happen again.

Every team has a bug like this. The payload contradicts itself, the logs prove it happened, and no amount of clicking through the app reproduces it. That's usually the signature of a timing bug: something failed, or arrived late, at exactly the wrong moment.

## Why Manual Testing Can't Touch It

We tried to reproduce it by hand first. No luck.

The reason is structural, not lack of effort. To trigger this bug you need one specific API call, the price recalculation that fires when the user changes country, to either fail or respond slowly, at the exact moment the user submits the payment. Manually, you have no lever for that:

- You can't make the real backend fail once, on demand, for one request.
- Browser devtools throttling is global and clumsy: it slows everything, not the one call you care about.
- Even if you get lucky once, you can't do it twice. A repro you can't repeat is not a repro.

So the bug stays "unconfirmed", the ticket goes stale, and the payload keeps showing up in the logs every few weeks.

## An Agent Reads Code, Not Screens

This is where the AI agent changed the approach. Instead of guessing from the outside, it read the code and found that the app keeps the country in two places: one in the billing form the user fills in, and one in app state, set when the page first loads. When the user picks a different country, the app fires a background request to update prices, and only when that request succeeds does the app state catch up with the form.

That gap between "the form changed" and "the app state caught up" is the whole bug. Two ways to fall into it, found in minutes:

1. **The background request fails.** The app state keeps the old country, the form shows the new one, and the pay button still works.
2. **The user pays too fast.** The payment is built before the background request comes back, so it still reads the old country.

Both are timing conditions. Both are exactly the kind of thing you can't produce by clicking. And both are trivial to express as [TWD](https://twd.dev/) mocks, because in TWD the test controls the server's behavior per request.

The failure case is one mock:

```ts
await twd.mockRequest("recalcFail", {
	url: "/api/pricing/quote",
	method: "POST",
	status: 500,
	response: { message: "recalculation failed" },
});

await selectBillingCountry("France");
await twd.waitForRequest("recalcFail");

await clickSubmitPayment();
const rule = await twd.waitForRequest("createPayment");

// The exact payload from the production logs
expect(rule.request.country).to.equal("ROW");
expect(rule.request.customer.billing_address.country).to.equal("FRA");
```

Note the assertion: `twd.waitForRequest` returns the intercepted body, so the test checks what the app actually sent over the wire, not what the UI displayed.

## Reproducing the Race with a Delayed Mock

The second path needs timing control: the recalculation must succeed, but slowly. TWD mocks accept a `delay`, so the service worker holds the response while the test keeps going:

```ts
await twd.mockRequest("recalcSlow", {
	url: "/api/pricing/quote",
	method: "POST",
	status: 200,
	response: cartResponse,
	delay: 3000,
});

await selectBillingCountry("France");
await clickSubmitPayment(); // pay before the recalculation lands

const rule = await twd.waitForRequest("createPayment");
expect(rule.request.country).to.equal("ROW"); // stale, the store never updated
```

No `setTimeout` in the test, no flaky sleep, no real backend behaving badly on cue. The race is deterministic because the delay is part of the mock definition. The condition we could never hit manually now reproduces on every single run.

Both tests passed on the first attempt. Weeks of "cannot reproduce" closed in one session.

## What Made the Difference

Two things, and neither is magic:

1. **The agent reads code.** A human reproducing a bug works from the UI inward and has to guess where the timing window is. An agent works from the code outward: it finds the store, the sync mechanism, and the gaps, then writes tests that target them directly.
2. **The mock layer makes timing a test input.** Failures and delays are declared per request, in the test file, running against your real app in the browser. That turns "race condition" from something you hope to catch into something you specify.

The whole loop ran through [twd-relay](https://github.com/BRIKEV/twd-relay#readme), which drives the browser tab you already have open, so every repro attempt was visible as it executed. After the fix, the same two tests stayed in the suite as regression coverage.

If you have a ticket that says "cannot reproduce" and a log line that says otherwise, this combination is worth trying: let the agent read the code and put the timing in a mock.
