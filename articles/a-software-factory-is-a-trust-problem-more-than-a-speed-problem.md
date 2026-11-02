---
title: 'A Software Factory Is a Trust Problem More Than a Speed Problem'
description: 'When agents write most of the code, the tooling you pick is the only thing that tells you whether to trust what comes out. What to look for when you build an AI software factory, and why popularity is no longer the deciding factor.'
date: '2026-11-02'
tags:
  - ai
  - devops
  - testing
  - architecture
---

Everyone building with agents is chasing the same number: how fast can we go from idea to merged pull request. That number is the easy one now. An agent can produce a complete, tested, plausible feature in eleven minutes.

The hard number is the other one. **How long until you know it is right?**

That is what a software factory actually has to solve. Not producing output, which is cheap, but trusting it, which is not. And trust does not come from a better prompt. It comes from tooling that tells you, quickly and without interpretation, what changed and whether it still works.

So this is not a list of tools. It is what I look for in any tool before it goes anywhere near a factory.

## 1. It tells you what changed

A factory where you cannot see what happened is a factory you will stop trusting the first time something breaks.

That starts with **observability in the product**: traces, metrics and logs from day one, ideally on an open standard like [OpenTelemetry](https://opentelemetry.io/) so the data is not trapped in one vendor. When an agent ships a change, production should be able to tell you what it did before a user does. I put this first because it is the one most teams postpone, and postponing it means every agent change goes out blind.

It continues with **observability of the factory itself**. Every step an agent took should leave something a human can read at human pace: a ticket comment, a run report, a spec, a video of the tests running. If the only evidence of a change is the diff, you are reviewing the agent's opinion of what it built, not what it built.

## 2. It is deterministic and fast

Agents do not need long markdown files listing every rule of your architecture. They need checks that fail.

A rule written in prose is a suggestion. A rule enforced by a linter is a fact. I have written about this before in [Prose does not beat determinism](https://kevinmartinez.dev/posts/prose-does-not-beat-determinism-stop-asking-your-ai-agent-to-remember/), and it holds for the whole factory:

- **CI from the first commit.** Not when the project "gets serious". The first agent pull request is the first one that needs it.
- **Linters and type checks** for the rules you would otherwise write in a `CONVENTIONS.md`.
- **Commit conventions** enforced by a hook, so agent commits read the same as human ones and changelogs write themselves.
- **Static analysis that always runs**: secret scanning like [gitleaks](https://github.com/gitleaks/gitleaks), code analysis like SonarCloud or whatever fits your stack. These are boring, and boring is the point. They do not depend on the agent remembering anything.

Markdown still has a job. It records **intent**: what was agreed and why. Checks record **rules**. Mixing the two is how you end up with a 900 line instructions file that the agent reads, half follows, and nobody can verify.

## 3. It is simple enough to change

The easier the architecture is for a human to read, the easier it is for an agent to work in. And the easier it is to work in, the easier it is to throw away.

That last part matters more every month. The tools and models you use today will not be the ones you use in a year. A factory that cannot drop a piece and replace it is a factory that will slowly calcify around its first decisions.

Two things keep it changeable:

- **No speculative architecture.** Build for the requirements you know. An agent asked to "make it extensible" will happily generate a framework for a problem you never had.
- **No lock-in you cannot price.** Hosted is fine. The question is how much it costs to leave. If your framework decides where you deploy, or your test runner only works inside one platform, you have handed a decision that should be yours to someone whose business model depends on it.

## 4. It proves its own quality

This is my strongest filter, and the one that rules out popular tools most often.

If a tool cannot show me how it checks itself, I do not use it. That goes double for anything that is itself an AI component: a skill, a plugin, an MCP server, an agent prompt. Before adopting one I look at three things:

1. **Its CI.** Does it run anything on every change, or does a new version just appear?
2. **How it is distributed.** Versioned, with a changelog, or a file you copy and hope?
3. **Its evals.** Is there evidence the skill does something useful, measured over more than one run, or is the evidence "I tried it and it worked"?

The third is the one almost nobody has yet. I wrote about why it matters in ["I tried it and it worked" is not a test](https://kevinmartinez.dev/posts/i-tried-it-and-it-worked-is-not-a-test-for-your-claude-code-skills/).

A note on popularity, because it is the objection I hear most. **Popularity is no longer a proxy for ease of use, because agents read the docs for you.** A small, well-tested tool with clear docs is as easy for an agent to adopt as the market leader. Popularity still matters for maintenance: you want the thing to exist in three years. It is a tiebreaker, not the deciding vote.

## 5. Testing you can review at human pace

Testing is where trust is either earned or faked, and agents make faking it very easy. When the same agent writes the code and the test, a green tick is the same model's opinion expressed twice.

What I look for in frontend testing specifically:

- **Every scenario mocked and deterministic**, so the suite can run on every iteration of an agent loop without flaking.
- **Contract testing against the backend**, so the mocks the tests rely on cannot drift away from the real API.
- **Something a human can watch.** A short video of each test running, attached to the pull request, tells a reviewer in thirty seconds what the diff takes five minutes to suggest.

This is the set I ended up building into [TWD](https://twd.dev) for my own work, which is why I am biased. But the criteria matter more than the tool: whatever you use for any framework, ask whether it gives you all three.

## 6. The chain has no shortcuts

None of the above survives a team that routes around it.

A factory is a chain. A request becomes a ticket, the ticket becomes a spec, the spec a plan, the plan a change, the change gets verified against the ticket and handed over. Break one link (a requirement agreed in a chat, a fix pushed without an issue, a hero developer who "just does it") and you lose the thing the whole factory exists to produce: a record you can trust.

I call this [chain of custody](https://kevinmartinez.dev/posts/chain-of-custody-every-requirement-arrives-signed-for/), borrowing the forensic term, and it has its own post.

It also means the factory is not an engineering project. Product, design and stakeholders work inside the same chain or the chain does not exist. That is the hardest part of all of this, and [it gets its own post too](https://kevinmartinez.dev/posts/your-software-factory-is-not-an-engineering-project/).

## The one question

Strip all of this down and every tool gets the same question:

> **Can it tell me, quickly and deterministically, what changed and whether it still works?**

If yes, it belongs in the factory, popular or not. If no, it does not, popular or not. And when the answer changes, throw it away. A factory you are afraid to rebuild is not a factory, it is legacy that happens to be automated.
