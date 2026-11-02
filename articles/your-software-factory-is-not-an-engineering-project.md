---
title: 'Your Software Factory Is Not an Engineering Project'
description: 'The hardest part of building a software factory with agents is not the tooling. It is getting product, design and stakeholders to work inside the same chain, and deciding whether to build around them or with them.'
date: '2026-11-02'
tags:
  - ai
  - productivity
  - agile
  - teamwork
---

I have seen teams afraid to ask their product owner to create a GitHub account.

Not unwilling. Afraid. So instead they build a bridge: a bot that copies tickets from the tool product uses into issues, a sync job that copies comments back, a dashboard that renders the markdown specs somewhere product will look at them. Weeks of engineering so that nobody outside engineering has to change anything.

Every bridge is a place where the record can split in two. And the record is the whole point.

## Software is not only engineering

[A software factory is a trust problem more than a speed problem](https://kevinmartinez.dev/posts/a-software-factory-is-a-trust-problem-more-than-a-speed-problem/), and trust needs a chain: request, spec, plan, change, verification, handover. Every link reads what the previous one wrote down. I call it [chain of custody](https://kevinmartinez.dev/posts/chain-of-custody-every-requirement-arrives-signed-for/).

Look at who holds the links. The request comes from product or a stakeholder. The definition of done needs product. Acceptance needs whoever asked. Design decides what the screen looks like before anyone builds it. Engineering holds maybe half of the chain.

If those people work outside it, the chain does not exist. You have an engineering pipeline with a chat window bolted to the front, and the chat window is where every important decision happens.

## Two ways to handle it

You can **build around people**. Keep product in their tool, keep design in theirs, and engineer the sync. It feels kind. It is also the overengineered option: more moving parts, more places for agents to read a stale copy, and a record that nobody fully owns.

Or you can **bring people in**. Product writes and answers in the same issues the agents read. Design attaches the decision to the ticket, not to a thread. Stakeholders accept or reject a pull request by watching the video of the tests running, not by asking someone in a meeting whether it is done.

I do not think one is always right. But be honest about which one you chose, and why. "They would never use GitHub" is often a guess nobody has tested.

## What you are actually asking for

It helps to be precise about what joining the chain means for a non-engineer, because it is less than people fear:

- **Write the request where the work happens.** One place, not a chat plus a doc plus a call.
- **Answer one question: how would you know it works?** That is the definition of done, and it is a product question, not a technical one.
- **Never answer a technical question.** If the answer requires reading the code, it is not theirs to give. A good chain asks product only what product can answer.
- **Accept against evidence.** A short video, a run report, a plain-language explanation of the pull request. Not the diff.

That is it. No markdown expertise, no git, no terminal. A browser and an account.

## The real resistance

The resistance is rarely about the tool. It is about the corridor.

Today, a product owner can ask for a change in a chat and get it by the afternoon. In a factory, that same request becomes a visible amendment to the ticket: dated, re-approved, verified. To the person making the request, that feels like friction, and it is. It is the friction of a decision becoming a record.

The same goes for engineers. The developer who "just does it" without an issue, the hero who fixes production from memory, the cowboy who ships faster than the chain allows. Each one is faster today and breaks the chain for everyone tomorrow. If one link skips the record, every link after it is working from a guess.

## The part tooling cannot fix

Everything else in a factory can be bought, installed or written: CI, linters, tests, observability, agents. This cannot. If the people who define the work are not willing to work inside the chain, no amount of tooling will produce a factory. You will produce faster engineering, which is not the same thing.

So before choosing tools, ask the question that decides whether they will matter: **is everyone who holds a link willing to hold it in the open?**

If the answer is no, that is the first project. Not the pipeline.
