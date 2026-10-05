---
title: 'TWD 1.2.x release - Component mocking, test and ci improvements'
description: >-
  We have some amazing news in the TWD ecosystem! The new v1.2.x release brings
  several powerful and much-requested features:
date: '2025-11-26'
tags:
  - webdev
  - tutorial
  - react
  - twd
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fvc0x7kmvb3hsux2mlsg1.webp
devto_url: >-
  https://dev.to/kevinccbsg/twd-12x-release-component-mocking-test-and-ci-improvements-1lc3
---
We have some amazing news in the TWD ecosystem! The new v1.2.x release brings several powerful and much-requested features:

- `describe.only` and `describe.skip`
- A brand-new CI tool to simplify integration
- **Component mocking** to test scenarios that normally require external hardware or APIs

Let’s dive into the details

## New Describe Methods

As you may know, many test runners let you run only specific `describe` blocks or skip them entirely. TWD now includes the same functionality.

In the sidebar, you’ll see `(only)` next to any describe block that is scoped with `describe.only`.

![test with describe only](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/g9tdha0l6ajfuyskmw24.png)

---

## CI Improvements

Previously, running TWD in CI required Puppeteer and a custom script (still supported if you want full control). But to make the process easier, we’ve moved all of that into a new CLI tool:

[twd-cli](https://github.com/BRIKEV/twd-cli)

Now your entire CI step is just:

```
npx twd-cli run
```

By default, this will run tests using the following configuration:

```json
{
  "url": "http://localhost:5173",
  "timeout": 10000,
  "coverage": true,
  "coverageDir": "./coverage",
  "nycOutputDir": "./.nyc_output",
  "headless": true,
  "puppeteerArgs": ["--no-sandbox", "--disable-setuid-sandbox"]
}
```

You can override any of these by adding a `twd.config.json` file in your project root.

### Example GitHub Action

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Cache Puppeteer browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/puppeteer
    key: ${{ runner.os }}-puppeteer-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-puppeteer-

- name: Install Chrome for Puppeteer
  run: npx puppeteer browsers install chrome

- name: Run TWD tests
  run: npx twd-cli run
```

---

## Component Mocking

To explain this feature properly, I recommend downloading the tutorial repo:

```
git clone git@github.com:BRIKEV/twd-docs-tutorial.git
cd twd-docs-tutorial
git checkout 07-component-mocking
npm i
# install twd-js version higher or equal than 1.2.1
```

Then visit: `http://localhost:5173/qr-scanner` you’ll see this page:

![qr code scanner page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e5yupxr5jqrues5fma5i.png)

The page includes a QR reader. But how do we test something that relies on **external factors** like:

- A real camera
- A real QR code
- Browser permissions

What do we actually need to test?

- That the UI behaves correctly when the QR is valid
- And behaves correctly when errors occur

If we look at the component:

```tsx
const handleScan = (detectedCodes: Array<{ rawValue: string }>) => {
};

const handleError = (error: Error) => {
};

<Scanner
  onScan={handleScan}
  onError={(error: unknown) => handleError(error as Error)}
/>
```

So… shouldn’t there be a way to force those events from our test?

Yes. And now TWD allows exactly that.

## Adding the Component Mock

Create a test file: `qrScanner.twd.test.tsx`

```ts
import { describe, it } from "twd-js/runner";
import { twd, screenDom } from "twd-js";

describe("QR Scanner Page", () => {
  it("should display the QR scanner page", async () => {
    await twd.visit("/qr-scanner");

    const qrScanner = await screenDom.getByText("QR Scanner");
    twd.should(qrScanner, "be.visible");

    const qrScannerButton = await screenDom.getByText("Scan QR Code");
    twd.should(qrScannerButton, "be.visible");
    
    const detectedCodes = await screenDom.getByText("No codes detected yet");
    twd.should(detectedCodes, "be.visible");
  });
});
```

> Since it's a TSX file, remember to update:
`const testModules = import.meta.glob("./**/*.twd.test.{ts,tsx}");`

Up to this point we’re just testing UI text. But the important part is the scanner, so let’s mock it.

### Mark the component as mockable

In the source code, wrap the scanner:

```tsx
<MockedComponent name="qrScanner">
  <Scanner
    onScan={handleScan}
    onError={(error: unknown) => handleError(error as Error)}
  />
</MockedComponent>
```

### Add the mock in our test

We'll replace the scanner with a button that triggers the `onScan` event:

```ts
twd.mockComponent("qrScanner", ({
  onScan,
}: {
  onScan: (detectedCodes: Array<{ rawValue: string }>) => void;
}) => {
  return <div>
    <button onClick={() => onScan([{ rawValue: "1234567890" }])}>QR code scanned</button>
  </div>;
});
```

Now we can test everything that depends on the scan result:

```tsx
import { describe, it } from "twd-js/runner";
import { twd, screenDom, userEvent } from "twd-js";

describe("QR Scanner Page", () => {
  it("should display the QR scanner page", async () => {
    twd.mockComponent("qrScanner", ({
      onScan,
    }: {
      onScan: (detectedCodes: Array<{ rawValue: string }>) => void;
    }) => {
      return <div>
        <button onClick={() => onScan([{ rawValue: "1234567890" }])}>QR code scanned mocked</button>
      </div>;
    });
    await twd.visit("/qr-scanner");

    const qrScanner = await screenDom.getByText("QR Code Scanner");
    twd.should(qrScanner, "be.visible");

    const qrScannerHeading = await screenDom.getByText("Scan QR Code");
    twd.should(qrScannerHeading, "be.visible");
    
    let detectedCodes = await screenDom.getByText("No codes detected yet");
    twd.should(detectedCodes, "be.visible");

    const qrCodeScannedButton = await screenDom.getByText("QR code scanned mocked");
    twd.should(qrCodeScannedButton, "be.visible");
    await userEvent.click(qrCodeScannedButton);

    detectedCodes = await screenDom.getByText("1 code(s) detected");
    twd.should(detectedCodes, "be.visible");
    const detectedCode = await screenDom.getByText("1234567890");
    twd.should(detectedCode, "be.visible");
  });
});
```

![Test with qr mocked](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vgcktspdn9u3ac4sx676.png)

Some people might think this isn't testing the “real” feature — but it **absolutely is**.
We’re validating that:

- When a scan succeeds, the UI updates correctly
- We don’t depend on external hardware
- Our feature behaves as expected under all scenarios

This is exactly what TWD is designed for:
**Focus on your features, not on third-party constraints**.

---

## Final Thoughts

We hope you love these new features. We’ll continue improving TWD to make UI testing simpler, more powerful, and more enjoyable.

If you have ideas, issues, or suggestions, feel free to open a discussion or PR. Happy testing!
