---
title: AI Made Code Review the Bottleneck. Attach the UI to Your PR
description: >-
  A green test suite tells a reviewer the assertions passed, not what the UI
  does. TWD can record the run as a video paced at human speed, so the flow
  itself ships with the pull request.
date: '2026-07-29'
tags:
  - testing
  - codereview
  - ai
  - webdev
devto_url: >-
  https://dev.to/kevinccbsg/ai-made-code-review-the-bottleneck-attach-the-ui-to-your-pr-575
---
You open a frontend pull request. The diff is 400 lines, an AI agent wrote most of it, and the description says "adds the checkout flow". CI is green.

You read the diff. It looks reasonable. You still have no idea what the UI actually does.

So you do what you always do. You pull the branch, install dependencies, start the dev server, and click through the flow yourself.

Ten minutes later you approve the PR.

That ten minutes is the bottleneck now.

AI made writing code dramatically faster. Reviewing frontend behavior did not.

## Tests solve part of the problem

Tests already reduce a large part of that uncertainty.

With [twd-js](https://twd.dev/), they execute inside a real browser, against the real DOM, with the network mocked so runs stay deterministic. A green run means the entire flow actually executed.

But a green run only tells the reviewer that the assertions passed.

It does not tell them what the user sees.

Was the validation message attached to the correct field?

Did the modal actually close?

Does the empty state look intentional, or does it look broken?

Those are exactly the things reviewers still verify manually, and they are difficult to express as assertions alone.

## Put the flow in the pull request

Your tests already drive the application through the exact flow under review.

If reviewers could simply watch that execution, they would not need to pull the branch just to understand the UI.

`twd-cli` can record the run:

```bash
npx twd-cli run --record --test "checkout flow"
```

That produces:

```text
twd-artifacts/checkout-flow.mp4
```

Drop the video directly into the pull request description.

## The first problem you'll hit

The first time you try this, you discover something unexpected.

The tests finish in about a second.

The recording is technically correct.

It is also almost impossible for a human to follow.

## Slowing the video down is the wrong fix

The obvious solution is to stretch the recording afterwards.

A simple ffmpeg filter can do that, but it stretches the same frames across a longer duration. As playback slows down, the effective frame rate drops.

| Speed | Duration | Effective FPS |
| ----: | -------: | ------------: |
|    1x |    1.00s |            30 |
|  0.5x |    1.90s |          15.3 |
| 0.25x |    3.90s |           7.7 |

At quarter speed, you're watching an 8 FPS video.

It also slows every moment equally. The interesting interactions and the idle time both become longer. The result is not easier to understand. It is simply slower.

## This is where architecture matters

Most testing tools record a browser that is being driven from the outside.

The recording is a byproduct of automation, so once execution has finished, post processing is your only option.

TWD works differently.

Its commands execute as JavaScript inside the page itself.

Because TWD owns the command loop, it can control **when commands execute**, not just how the recording is encoded.

Instead of stretching frames afterwards, it spaces out execution while the test is running.

Frames are still captured at full frame rate.

Pauses happen only after meaningful interactions.

Typing is paced character by character instead of appearing all at once.

That produces a recording that feels natural to watch without sacrificing smoothness.

Which is why recordings are paced by default:

```bash
# Default: 300ms pause after each command
npx twd-cli run --record --test "checkout flow"

# Better for demos or stakeholder reviews
npx twd-cli run --record --record-pace 500 --test "checkout flow"
```

In practice, values between **200ms and 500ms** are usually enough to make interactions comfortable to follow while keeping recordings concise.

The result is still a smooth 30 FPS video.

Only the moments that matter become easier to observe.

## What the reviewer gets

The reviewer watches the actual flow.

Driven by the actual tests.

Running against the actual application.

Not a screen recording someone remembered to make.

Not a Loom video that becomes outdated after the next commit.

The recording is regenerated every time the tests run.

The review changes from:

> "Does this diff look correct?"

to:

> "Is this the behavior we actually wanted?"

That is the question worth a human's attention.

## The bottleneck moved

Every improvement in software development moves the bottleneck somewhere else.

Today, AI has made writing code significantly faster.

Frontend review is still largely manual because reviewers need to understand behavior, not just source code.

A green checkmark confirms that the tests passed.

It does not show what happened.

Browser based tests can produce something much more valuable than a success badge.

They can produce evidence.

Sometimes, that evidence is a short video that saves every reviewer ten minutes.

```bash
npx twd-cli run --record --test "the flow you changed"
```

If your tests already know how to reproduce the feature, your pull request should show it.

See the [Recording Runs documentation](https://twd.dev/recording) for all available options.
