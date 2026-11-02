---
title: 'Chain of Custody: Every Requirement Arrives Signed For'
description: 'Forensic investigators do not ask whether evidence is true, they ask whether anyone can prove where it has been. Software built with agents needs the same discipline, applied to intent instead of evidence.'
date: '2026-11-02'
tags:
  - ai
  - productivity
  - agile
  - softwareengineering
---

In a forensic investigation, a piece of evidence with a gap in its history is not wrong. It is **inadmissible**.

Nobody claims the knife was swapped. The problem is that nobody can prove it was not. Between the crime scene and the courtroom, every person who held it signed for it, dated it, and handed it on. One missing signature and the evidence is worthless, no matter how good it is.

That is the discipline software built with agents is missing. Not for evidence, but for **intent**.

## The gap everyone knows

A product owner writes a ticket. It says roughly what they want. A developer fills the gaps with their own judgement and starts building. Halfway through, the product owner asks for a change in a chat. The developer makes it. The ticket never hears about it.

Six weeks later nobody can say what was agreed, why the code does what it does, or whether it does what was asked. The knowledge lived in two heads, and one of them has left.

This is not a process failure. It is the default state of software work.

## Why agents make it worse

The instinct is that AI closes the gap: the machine reads the ticket, the machine writes the code.

It does the opposite. An agent given an ambiguous requirement does not stop and ask. It resolves the ambiguity confidently, silently, and in seconds, then builds a complete, tested, plausible implementation of the wrong thing. A human who misunderstands a ticket produces a mess you can see. An agent that misunderstands a ticket produces something that looks finished.

**Speed does not cause drift. Speed removes the pauses in which drift used to be noticed.**

## The chain

Six links. Each one is held by a person, produces an artifact, and hands it to the next. The rule that matters is not the number of steps. It is that **no link reads anything the previous link did not write down.**

| Link | Produces | Guards against |
|---|---|---|
| **Intake** | The raw request | Nothing yet. Under-specified is normal here |
| **Refinement** | A spec with a definition of done | Building a confident interpretation of an ambiguity |
| **Planning** | An approach, reviewed before code exists | Discovering the approach was wrong after building it |
| **Execution** | The change, tests written first, divergences recorded | A plan followed into a wall, or work that quietly went elsewhere |
| **Verification** | A verdict: does the delivery match the ticket *as it stands now*? | The untracked request and the moved goalpost |
| **Handover** | Everything attached to the change, legible to a stranger | The amnesia that made the original problem unfixable |

If you work in security, the name will sound familiar. There, chain of custody means build provenance (SLSA, SBOMs): proof that the binary you deploy came from the source you reviewed, and nobody touched it on the way. That chain protects the **code**. This one protects the **reason the code exists**: proof that what was built is what was asked for. Same three questions: who held it, when, and what did they sign for.

Verification is the link most teams have never had. It compares what was delivered against the live ticket, not the frozen spec. The frozen spec and the code were agreed at the same moment, so comparing them always agrees. Comparing against the live ticket is where the chat conversation finally surfaces: something in the delivery that nothing in the record asked for.

## The principles

The chain rests on a handful of rules. Three carry most of the weight:

**An unwritten agreement did not happen.** Not because people are dishonest, but because memory is not a medium and chat is not a record.

**No definition of done, no start.** The most important question anyone can answer about a request is *how would you know it works?* A request without an answer cannot be built, only approximated. Sending it back with that one question is a valid answer.

**Humans hold the gates.** Every step runs because a person decided it should. Agents do not advance themselves through the chain. The permission to proceed is the human contribution at every link.

The rest follow from those: review the plan before the code exists, because correcting a document costs a sentence and correcting a codebase costs a day. Freeze the target, so a change of mind becomes a new, dated agreement instead of a silent edit. Treat evidence as a test, not an assertion: "it works" is a claim, a test that fails when the behaviour disappears is evidence.

## What the developer becomes

> **A developer is no longer responsible for producing the output. They are responsible for the output being correct.**

It is not a demotion. It is the difference between the person who builds the bridge and the person who signs that it is safe. The work moves from authorship to custody.

If that sounds like less work, try doing it honestly for a week.

## What it costs

A model that hides its costs is the thing this model exists to prevent, so here they are.

It front-loads work: the first day looks idle to anyone counting commits. It means saying no, sometimes to senior people. It creates artifacts that need a home. And it turns the quick corridor request into a visible amendment, which will feel like friction to the person making it. That friction is the point.

## "This is slow. My way is fast."

It is the first objection, it is made in good faith, and half of it is true. Skipping the chain is faster to the first commit. It is not faster to something correct.

The fast way survived because nobody ever saw the bill. Nobody writes "two days reconstructing what we meant" on a ticket. That time gets charged to the next estimate, the onboarding, the rewrite, the quarter where velocity mysteriously halved.

A wrong assumption costs a sentence in refinement, a paragraph in planning, a day in review, and a fortune in production. Same assumption, four prices.

And agents add an argument that did not exist before. Sloppy thinking used to hide inside a long build: when a feature took a week, the thinking was a rounding error against the typing. Take the build down to eleven minutes and there is nothing left for it to hide behind.

So stop measuring time to first commit. Measure time to **knowing you are done**.
