---
title: Testing shadcn/ui components with TWD
description: >-
  I’ve put together a small documentation site that shows how to test shadcn/ui
  components using TWD, built on top of Testing Library.
date: '2025-12-23'
tags:
  - react
  - testing
  - twd
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F45lh90to7fs5y08n85mc.png
devto_url: 'https://dev.to/kevinccbsg/testing-shadcnui-components-with-twd-259a'
---
I’ve put together a small documentation site that shows **how to test shadcn/ui components using TWD**, built on top of **Testing Library**.

If you already use Testing Library, this means you can keep the same queries and assertions while gaining the benefits of Testing While Developing: running tests directly inside your real application as you build UI.

This approach helps:

- Validate real shadcn components in real screens
- Turn manual UI checks into repeatable tests
- Keep tests close to real user interactions
- Reuse Testing Library knowledge and patterns

You can find the docs and examples here: https://brikev.github.io/twd-shadcn/

The goal is not to replace existing testing tools, but to make UI testing part of the **everyday development workflow**.

---

## Example: testing a Collapsible component

Given a simple shadcn/ui `Collapsible` component:

```tsx
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function CollapsibleDemo() {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline">Toggle content</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-4 p-4 border rounded-md">
          Here is some hidden content
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

With TWD, the test focuses on real user behavior and uses familiar Testing Library-style queries:

```ts
import { twd, screenDom, userEvent } from 'twd-js';
import { describe, it, expect } from 'twd-js/runner';

describe('Collapsible Component', () => {
  it('toggles content visibility on trigger click', async () => {
    await twd.visit('/collapsible');

    const toggleButton = await screenDom.findByRole('button', { name: 'Toggle content' });
    twd.should(toggleButton, 'be.visible');

    // Initially collapsed (content not in DOM)
    let content = screenDom.queryByText('Here is some hidden content');
    expect(content).eql(null);

    // Open
    await userEvent.click(toggleButton);
    const opened = await screenDom.findByText('Here is some hidden content');
    twd.should(opened, 'be.visible');

    // Close
    await userEvent.click(toggleButton);
    const closed = screenDom.queryByText('Here is some hidden content');
    expect(closed).eql(null);
  });
});
```

The test runs inside the real application, validating the component exactly as a user would interact with it.
