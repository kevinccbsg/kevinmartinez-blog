---
title: Supabase + React Router – Optimizing Auth Requests with Cookies (Part 4)
description: >-
  In this part of the series, we’re still working on authentication — but this
  time, we’re going to optimize repeated calls to Supabase’s auth.getUser().
date: '2025-07-14'
tags:
  - tutorial
  - react
  - supabase
  - reactrouter
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fnyum4obnqlvnc83adb69.png
devto_url: >-
  https://dev.to/kevinccbsg/supabase-react-router-optimizing-auth-requests-with-cookies-part-4-38fb
---
In this part of the series, we’re still working on authentication — but this time, we’re going to **optimize repeated calls** to Supabase’s `auth.getUser()`.

Every time a protected route runs or the page reloads, our app reaches out to Supabase to validate the session. That’s fine, but in a real-world app, it quickly becomes wasteful. So we’re going to fix that by **caching the session in a cookie**, and only refreshing it every 15 minutes.

What we’ll cover:

- Refactoring our auth logic and moving it to a utils module
- Using cookies to reduce unnecessary calls to getUser

If you’re following along from [Part 4](/posts/supabase-react-router-optimizing-auth-requests-with-cookies-part-4), you can continue as is. But if you want to reset your repo or make sure you're on the correct branch:

```bash
# Repo https://github.com/kevinccbsg/react-router-tutorial-supabase
git reset --hard
git clean -d -f
git checkout 04-validate-auth-improvement
```

Then start the dev server:

```bash
npm run serve:dev
```

---

## Moving Auth Logic to a Utility Module

To keep our code organized, we’ll move all the auth-related logic into `src/lib/auth.ts`. This includes login, signup, logout, and session validation.

Here’s how the file should look now:

```ts
import * as auth from "../services/supabase/auth/auth";
import { redirect } from "react-router";

export const requireUserSession = async () => {
  const user = await auth.getAuthenticatedUser();

  if (!user) {
    throw redirect('/login');
  }
  return user;
};

export const logout = async () => {
  await auth.logout();
};

export const loginUser = async (email: string, password: string) => {
  await auth.signInWithPassword(email, password);
};

export const signUpUser = async (userPayload: { email: string; password: string }) => {
  await auth.signUpUser({
    email: userPayload.email,
    password: userPayload.password,
  });
};
```

And in your `actions.ts`, the login/signup actions will now delegate to these helpers:

```ts
import { loginUser, signUpUser } from "@/lib/auth";
import { ActionFunctionArgs, redirect } from "react-router";

export const signup = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const userPayload = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  await signUpUser(userPayload);
  return redirect('/');
};

export const login = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  await loginUser(email, password);
  return redirect('/');
};
```

## Caching the User Session with Cookies

Now let’s solve the issue of hitting `auth.getUser()` too often.

We’ll use a **cookie to store the user ID**, and we’ll keep it around for 15 minutes. If the cookie is present, we skip the Supabase call. If it’s missing or expired, we refresh it.

First, install the cookie utility:

```bash
npm i --save js-cookie
npm i --save-dev @types/js-cookie
```

Now in `src/lib/auth.ts`, add the cookie helpers:

```ts
import Cookies from "js-cookie";

interface User {
  id: string;
}

const mode = import.meta.env.MODE;

/**
 * Sets the user cookie with a 15-minute expiration.
 * @param user - The user object to store.
 */
const setUserCookie = async (user: User): Promise<void> => {
  const signedData = btoa(JSON.stringify(user));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  Cookies.set("user", signedData, {
    path: "/",
    sameSite: "strict",
    expires: expiresAt,
    secure: mode === "production",
  });
};

/**
 * Gets the raw user cookie string, if present.
 * @returns The base64-encoded user cookie or undefined.
 */
const getUserCookie = (): string | undefined => {
  return Cookies.get("user");
};

/**
 * Removes the user cookie.
 */
const clearUserCookie = (): void => {
  Cookies.remove("user");
};

/**
 * Parses and returns the decoded user object from the cookie.
 * @returns The user object or null if not found or invalid.
 */
const getUserFromCookie = (): User | null => {
  const signedData = getUserCookie();
  if (!signedData) return null;

  try {
    const data = atob(signedData);
    return JSON.parse(data) as User;
  } catch (error) {
    console.error("Invalid user cookie", error);
    return null;
  }
};
```

We’re only storing the `id` for now. In real-world apps, you might store more (like a role or name), but for our purpose, the ID is enough to validate the session.

Next, let’s add methods to keep the cookie in sync with Supabase:

```ts
/**
 * Gets the currently authenticated user from Supabase and stores it in the cookie.
 * @returns The user object if authenticated, otherwise null.
 */
const fetchAndStoreUser = async (): Promise<User | null> => {
  const user = await auth.getAuthenticatedUser();
  if (!user) return null;

  await setUserCookie({ id: user.id });
  return { id: user.id };
};

/**
 * Returns the current user session from cookie if valid,
 * otherwise fetches from Supabase and sets the cookie.
 * @returns The user object or null.
 */
export const getUserSession = async (): Promise<User | null> => {
  const user = getUserFromCookie();
  if (user) return user;

  return await fetchAndStoreUser();
};
```

This logic checks the cookie first. If it’s missing, it calls Supabase and refreshes the cookie.

## Updating the Auth Flows

We’ll now update our `requireUserSession` and `logout` methods to use the new cookie logic:

```ts
export const requireUserSession = async () => {
  const user = await getUserSession();

  if (!user) {
    throw redirect('/login');
  }
  return user;
};

export const logout = async () => {
  await auth.logout();
  clearUserCookie();
};
```

With this change, you’ll notice something important: **no more repeated** `GET /auth/v1/user` calls on every navigation. The app becomes faster and more efficient, especially in SPAs where routing happens often.

---

## Conclusion

We’ve just made a subtle but important optimization to our authentication flow. By caching the user ID in a cookie for 15 minutes, we cut down on redundant network requests, and made our app more responsive.

As I mentioned in earlier parts — auth is full of little trade-offs and details like this. But solving them step by step really pays off.

In the [next part](/posts/supabase-react-router-replacing-mock-data-and-enabling-rls-part-5), we’ll switch our fake JSON Server data to real Supabase tables. That means new records, and with that comes the need for **RLS (Row-Level Security)** — one of Supabase’s most powerful features.
