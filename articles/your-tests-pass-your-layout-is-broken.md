---
title: Your Tests Pass. Your Layout Is Broken
description: >-
  Assertions check text and state, never geometry. Visual testing covers that
  gap, but the reason teams abandon it is the approval queue, not the price.
  TWD's matchLayout takes a different route.
date: '2026-09-08'
tags:
  - testing
  - css
  - frontend
  - webdev
devto_url: 'https://dev.to/kevinccbsg/your-tests-pass-your-layout-is-broken-5e8j'
---
You change one line of CSS. A `flex-direction`, a `max-width`, a padding on a shared card component.

Every test passes. The button is still there, the text still says "Continue", the modal still opens. Green across the board.

And the pricing page now has three columns overlapping on top of each other.

## Assertions were never going to catch that

This is not a gap in your test suite. It is what assertions are.

```ts
twd.should(button, 'have.text', 'Continue');
twd.should(modal, 'be.visible');
```

Those questions are about content and state. Is the text right, is the element there, is it enabled. Every one of them still answers yes on a page whose layout has collapsed, because none of them is looking at where anything sits.

The information you need is geometry, and nothing in a normal test suite is measuring it.

## So why doesn't everyone do visual testing?

The tools have existed for years. Most teams either never adopt them or quietly stop looking at them, and the reason is not the invoice.

It's the approval queue.

A visual testing tool compares screenshots pixel by pixel. So a font renders half a pixel differently, or a shadow shifts, and you get forty changed screenshots to review. None of them is a bug. You click approve on all of them.

Do that twice and you have learned a habit: approve the batch, do not look. From that point on your visual testing is a formality. You are paying for a service and reviewing nothing, which is worse than not having it, because now everyone believes it's covered.

The failure mode is not "it costs money". It's "it produced so much noise that we stopped reading it".

## Watch the geometry, not the pixels

[twd-js](https://www.npmjs.com/package/twd-js) ships a beta command called `matchLayout` that starts from a different question. Not "are these two images identical", but "did anything move".

```js
await twd.matchLayout(page, 'landing');
```

It deliberately does not see a colour change. It does not see a changed string. It does not see a font rendering one pixel wider. Those either do not matter for layout or are already covered by the assertions you have.

What it does see is a block that grew, a column that collapsed, a button that wrapped, a section that disappeared. When it fails, you get your own page backwith the areas that moved boxed in red:

![A landing page with the regions that moved boxed in red and orange](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/480js64m0lrnqyzx0wwe.png)

Red is a region that changed. Orange is a region that is new, because the page got taller. Everything else is left alone, and that is most of the page.

Being coarse on purpose is the whole point. There is nothing to approve in bulk because the noise never gets generated.

## The reference is a text file

The other half of the approval problem is where the review happens.

With a hosted tool, approving is a separate queue: another dashboard, another login, a list of thumbnails to get through. That separation is what turns reviewing into clicking.

`matchLayout` writes a small text file next to your test and you commit it. When a layout changes, the diff shows up in the pull request you were already reading.
There is no second queue, because approving is the code review.

No screenshots in git. No container spinning up somewhere to render your page. No account.

## Try it

The verdict is decided by [twd-cli](https://www.npmjs.com/package/twd-cli), which
pins the viewport, so a snapshot never fails because you resized your browser while working.

```bash
npx twd-cli run
```

First run writes the reference and passes. Change your CSS, run again, and you get the picture above. If the change was intentional, `--update-snapshots` accepts it.

The docs are at [twd.dev/layout-snapshots](https://twd.dev/layout-snapshots).

It's beta, and honest about what it is: a guard on geometry, not a pixel comparison. If you want to know that a button is exactly `#1a1a1a`, assert it.
If you want to know that your footer did not just eat the page, this is the cheaper way to find out.
