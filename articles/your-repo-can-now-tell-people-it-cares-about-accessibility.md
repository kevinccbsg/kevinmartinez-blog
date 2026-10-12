---
title: Your Repo Can Now Tell People It Cares About Accessibility
description: >-
  GitHub now shows an Accessibility tab on every repository that has an
  ACCESSIBILITY.md. Here is why it matters, what we put in TWD's, and how to
  add yours in an afternoon.
date: '2026-10-05'
tags:
  - a11y
  - github
  - opensource
devto_url: >-
  https://dev.to/kevinccbsg/your-repo-can-now-tell-people-it-cares-about-accessibility-3al
---
Open any repository on GitHub and you see the same tabs: README, Code of Conduct, Contributing, Security. As of October 1, there can be one more: **Accessibility**.

GitHub now [highlights an `ACCESSIBILITY.md` file](https://github.blog/changelog/2026-10-01-accessibility-statements-highlighted-on-repository-overview/) on the repository overview and links to it from the About section. It is a small change, and it puts accessibility on the front page of your project, next to the files every contributor already reads.

We added one to [TWD](https://github.com/BRIKEV/twd) right away. Here is why, and what we learned.

## Why it matters

Picture someone who uses a screen reader trying out your library. Something in the docs doesn't work for them. Today, they have to guess: is this a known issue? Does anyone care? Where do I even report it?

An accessibility page answers all three before they ask. It says this project takes accessibility seriously, here is what we have tested, and here is how to tell us when something gets in your way.

It also helps the other side. Contributors see, in plain words, what is expected of a change that touches the UI.

## What we put in ours

TWD had a head start. In June we had it independently audited against WCAG 2.2 AA, fixed what the auditors found, and published a formal [accessibility statement](https://twd.dev/accessibility-statement).

We expected to copy and paste that statement. We didn't. A formal statement is written for compliance. The GitHub page is written for people, so we wrote it in plain language around three ideas:

**Be honest about what was tested.** Our audit covered the sidebar and the main docs pages, using a keyboard and the NVDA screen reader. So that is what the page claims. For everything else, WCAG 2.2 AA is our goal, and we say so.

**Make reporting easy.** Open an issue, send an email, or ask in Discussions. No need to know which guideline is involved, and no need to share anything personal. We commit to replying within 5 business days.

**Tell contributors what good looks like.** Keep it usable with a keyboard, keep focus visible, don't rely on colour alone, and include light and dark screenshots with UI changes.

You can read the result here: [TWD's ACCESSIBILITY.md](https://github.com/BRIKEV/twd/blob/main/ACCESSIBILITY.md).

## Add one to your project

You don't need an audit to start. You need an honest page.

1. Create `ACCESSIBILITY.md` in your repo root (or in `.github/` or `docs/`).
2. Start from [GitHub's template](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-an-accessibility-page-to-your-repository), or add it from your repo's **Community Standards** page.
3. Fill in the two sections that matter most: how to report a barrier, and what you have and haven't tested.

That's it. The tab appears on your repo's front page.

Accessibility work usually happens out of sight. Now it has a place on your repo's front page, where users and contributors will see it.
