---
title: Supabase + React Router – Testing supabase service (Part 6)
description: >-
  In this part of the series, we shift gears toward validating our logic with
  real tests. This time, we’ll focus on testing the Supabase services directly -
  not…
date: '2025-07-27'
tags:
  - react
  - tutorial
  - testing
  - supabase
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fxrcht5ygtudd3x7xq87g.png
devto_url: >-
  https://dev.to/kevinccbsg/supabase-react-router-testing-supabase-service-part-6-4o9f
---
In this part of the series, we shift gears toward validating our logic with real tests. This time, we’ll focus on testing the Supabase services directly - not mocks, but actual database operations.

We’ll walk through setting up Vitest, working with real Supabase data, and verifying that our RLS (Row Level Security) behaves as expected.

If you’re following along from [Part 5](/posts/supabase-react-router-replacing-mock-data-and-enabling-rls-part-5), you can continue as is. But if you want to reset your repo or make sure you're on the correct branch:

```bash
# Repo https://github.com/kevinccbsg/react-router-tutorial-supabase
git reset --hard
git clean -d -f
git checkout 06-testing
npm run serve:dev
```

---

## Testing setup

Vitest is already included, but if you’re missing it, install:

```bash
npm i --save-dev vitest dotenv
```

In `tests/vitest.setup.ts`, we load environment variables needed for Supabase:

```ts
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file
```

Make sure to include the correct type definitions in `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "vite/client"],
    ...
  },
  "include": ["vite.config.ts", "tests"]
}
```

These settings ensure tests run with access to the environment and proper typings.

## Fixing component tests

This project already includes component tests. If you're new to testing in React Router apps, check out [this post](/posts/react-router-data-mode-part-10-testing-with-vitest-and-react-testing-library) for a deeper walkthrough.

For now, we just need to patch `src/tests/contactDetail.spec.tsx` so it uses updated mock contact data and aligns with the new Supabase structure.

```ts
import { createRoutesStub } from "react-router";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ContactsPage from "@/pages/Contacts";
import ContactDetail from "@/pages/ContactDetail";
import ContactsSkeletonPage from "@/Layouts/HomeSkeleton";
import userEvent from "@testing-library/user-event";

// We include a Workaround for jsdom bug with URLSearchParams in Node v22.14+
// Ensures globalThis.URLSearchParams is the Node.js implementation
import { URLSearchParams } from "node:url";
// @ts-expect-error: Overriding globalThis.URLSearchParams for jsdom bug workaround
globalThis.URLSearchParams = URLSearchParams;

// We add a new interface
interface Contact {
  id: string;
  email: string;
  favorite: boolean;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  profileId: string;
  avatar: string | undefined;
}

describe("Contact Detail Page", () => {
  let Stub: ReturnType<typeof createRoutesStub>;

  // We update the mock response
  const contacts: Contact[] = [
    {
      id: "1",
      firstName: "Jane",
      lastName: "Doe",
      username: "jane_doe",
      avatar: "https://i.pravatar.cc/150?img=1",
      email: "jane.doe@example.com",
      phone: "+1 555-1234",
      profileId: "profile_1",
      favorite: true,
    },
  ];
  beforeEach(() => {
    Stub = createRoutesStub([
      {
        path: "/",
        id: "root",
        Component: ContactsPage,
        HydrateFallback: ContactsSkeletonPage,
        loader() {
          return { contacts };
        },
        children: [
          {
            path: "contacts/:contactId",
            action: async () => {
              await new Promise(resolve => setTimeout(resolve, 500));
              return null;
            },
            Component: ContactDetail,
          },
        ],
      },
    ]);
  });

  it("Render detail page", async () => {
    render(<Stub initialEntries={["/contacts/1"]} />);
    await waitFor(() => screen.findByText('jane_doe'));
  });

  it("Render detail page with missing contact", async () => {
    render(<Stub initialEntries={["/contacts/2"]} />);
    await waitFor(() => screen.findByText('Contact not found'));
  });

  it("should optimistically toggle favorite icon on click", async () => {
    const user = userEvent.setup();
    render(<Stub initialEntries={["/contacts/1"]} />);
    await waitFor(() => screen.findByText('jane_doe'));
    const favoriteButton = screen.getByLabelText("Favorite");
    await user.click(favoriteButton);
    expect(screen.getByLabelText("Not Favorite")).toBeInTheDocument();
    const toggleFavFetcher = screen.getByTestId("toggle-favorite");
    expect(toggleFavFetcher).toBeDisabled();
  });
});
```

## Testing Supabase Services

Now let’s test the actual Supabase service methods inside `src/services/supabase`. These tests will validate that our RLS (Row Level Security) rules work and that real data is handled correctly.

> ⚠️ These tests require your Supabase instance to be running.

We first set up an admin client using the service role — this allows us to clean up users between tests. Add this to `tests/services/supabase/setup.ts`:

```ts
import { createClient, User } from "@supabase/supabase-js";
import type { Database } from "../../../src/services/supabase/client/database.types";

const SERVICE_ROLE = process.env.VITE_SUPABASE_SERVICE_ROLE as string;
const PROJECT_URL = process.env.VITE_SUPABASE_PROJECT_URL as string;

const supabaseAdmin = createClient<Database>(PROJECT_URL, SERVICE_ROLE, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
    storageKey: "supabase.auth.token",
  },
});

export const deleteUser = async (user: User) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    throw error;
  }
};

export const cleanup = async () => {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  for (const user of data.users) {
    await deleteUser(user);
  }
};

const generateRandomHash = (length = 16) => {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => dec.toString(36))
    .join("")
    .substring(0, length);
};

export const randomUserData = () => ({
  email: `${generateRandomHash()}@example.com`,
  password: "password",
  firstName: "John",
  lastName: "Doe",
});
```

We’ll reuse these utilities in all Supabase tests.

##  Testing Auth Services

Create the file `tests/services/supabase/auth/auth.spec.ts` and add:

```ts
import {
  getAuthenticatedUser,
  logout,
  signUpUser,
  signInWithPassword,
} from "../../../../src/services/supabase/auth/auth";
import { cleanup, randomUserData } from "../setup";

describe("Auth Services", () => {
  beforeEach(async () => {
    await cleanup();
  });
  describe("signUpUser", () => {
    it("should register a user with a password", async () => {
      const response = await signUpUser(randomUserData());
      expect(response.session).toBeDefined();
      expect(response.user).toBeDefined();
    });
  });

  describe("getAuthenticatedUser", () => {
    it("should not get the current authenticated user if not signed in", async () => {
      const user = await getAuthenticatedUser();
      expect(user).toBeNull();
    });
    it("should get the current authenticated user", async () => {
      const userPayload = randomUserData();
      await signUpUser(userPayload);
      const response = await signInWithPassword(userPayload.email, userPayload.password);
      const user = await getAuthenticatedUser();
      expect(user?.id).toEqual(response.user.id);
    });

    it("should not get the current authenticated user if not signed in", async () => {
      await logout();
      const user = await getAuthenticatedUser();
      expect(user).toBeNull();
    });
  });
});
```

These tests verify both user creation and session behavior, confirming that authentication works as expected.

## Testing Contact Services

Next, we test CRUD operations for contacts — including listing, deleting, and toggling favorite status:

```ts
import { signUpUser } from "../../../../src/services/supabase/auth/auth";
import { createContact, getContacts, deleteContact, updateFavoriteStatus, Contact } from "../../../../src/services/supabase/contacts/contacts";
import { cleanup, randomUserData } from "../setup";

let contact: Contact = {
  email: "max@example.com",
  favorite: false,
  firstName: "Max",
  lastName: "Mustermann",
  username: "maxmustermann",
  phone: "123456789",
  profileId: "profile-1",
  avatar: "https://example.com/avatar.jpg",
};

describe("Contacts Services", () => {
  let userId: string;
  beforeEach(async () => {
    await cleanup();
    const response = await signUpUser(randomUserData());
    userId = response.user!.id;
    contact = {
      ...contact,
      profileId: userId, // Use the signed-up user's ID as profileId
    };
  });

  it("should create a new contact and list it", async () => {
    await createContact(contact);
    const contacts = await getContacts(contact.profileId);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toEqual({
      id: expect.any(String),
      email: contact.email,
      favorite: contact.favorite,
      firstName: contact.firstName,
      lastName: contact.lastName,
      username: contact.username,
      phone: contact.phone,
      profileId: contact.profileId,
      avatar: contact.avatar,
    });
  });

  it('should delete a contact', async () => {
    await createContact(contact);
    const contacts = await getContacts(contact.profileId);
    expect(contacts).toHaveLength(1);

    await deleteContact(contacts[0].id);
    const updatedContacts = await getContacts(contact.profileId);
    expect(updatedContacts).toHaveLength(0);
  });

  it('should update favorite contact', async () => {
    await createContact(contact);
    const contacts = await getContacts(contact.profileId);
    expect(contacts).toHaveLength(1);

    await updateFavoriteStatus(contacts[0].id, true);
    const updatedContacts = await getContacts(contact.profileId);
    expect(updatedContacts[0].favorite).toBe(true);
  });
});
```

This confirms our Supabase methods integrate correctly with RLS. Each user sees only their own data, and cleanup prevents conflicts.

## Running Tests Sequentially

By default, Vitest runs tests in parallel — but this can lead to conflicts when Supabase enforces foreign key constraints (e.g., deleting users mid-test). To avoid this, we configure tests to run sequentially.

Update `vite.config.ts`:

```ts
/// <reference types="vitest" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    exclude: [...configDefaults.exclude],
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    fileParallelism: false,
    poolOptions: {
      threads: {
        isolate: true,
        singleThread: true,
        maxThreads: 1,
      },
    },
  },
  server: {
    watch: {
      ignored: ["**/data/data.json"],
    },
  },
})
```

With this setup, your tests run reliably without race conditions or foreign key errors.

---

## Conclusion

These integration tests confirm your Supabase logic works and your RLS rules hold up under real usage. While valuable, they should be combined with component and unit tests (especially for edge cases and UI state).

In the next and final part, we’ll wrap up the series by adding CI support automating Supabase migrations.
