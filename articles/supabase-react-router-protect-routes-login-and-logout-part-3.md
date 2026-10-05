---
title: 'Supabase + React Router: protect routes, login and logout (Part 3)'
description: >-
  In this part of the series, we’ll implement user login, logout, and protect
  routes using Supabase and React Router.
date: '2025-07-13'
tags:
  - react
  - tutorial
  - supabase
  - reactrouter
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fp2rzn0n8euqpo7im9v8d.png
devto_url: >-
  https://dev.to/kevinccbsg/supabase-react-router-protect-routes-login-and-logout-part-3-3c9f
---
In this part of the series, we’ll implement user login, logout, and protect routes using Supabase and React Router.

What we’ll cover:

- How to protect routes using React Router loaders
- Creating a login form
- Logging users in and out with Supabase

If you’re following along from [Part 2](/posts/supabase-react-router-signup-and-auth-setup-part-2), you can continue as is. But if you want to reset your repo or make sure you're on the correct branch:

```bash
# Repo https://github.com/kevinccbsg/react-router-tutorial-supabase
git reset --hard
git clean -d -f
git checkout 03-login-logout
```

Then start the dev server:

```bash
npm run serve:dev
```

## Protecting Routes with React Router

Let’s start with route protection. First, we need a method to check if a user is logged in.

In `src/services/supabase/auth/auth.ts`, I added a `getAuthenticatedUser` function. It simply checks if the Supabase session is valid and gives us back the user's id and email.

```tsx
interface ProfileDBO {
  id: string;
  email: string;
}

export const getAuthenticatedUser = async (): Promise<ProfileDBO | null> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user ? {
    id: data.user.id,
    email: data.user.email || "",
  } : null;
};
```

Now we create a helper in `src/lib/auth.ts`. This will centralize the auth logic and redirect to `/login` if there's no session:

```tsx
import * as auth from "../services/supabase/auth/auth";
import { redirect } from "react-router";

export const requireUserSession = async () => {
  const user = await auth.getAuthenticatedUser();

  if (!user) {
    throw redirect('/login');
  }
  return user;
};
```

Here’s the important part. React Router v7 (as of now) doesn’t have un stable built-in middleware — so if you want to protect a route, you need to call `requireUserSession` manually in every private loader.

Even if your routes are nested, you must protect them individually. Loaders execute in parallel — so don’t assume a parent route check will handle it.

In our case, we’ll update `src/pages/loaders.ts` to protect the contacts list, contact detail, and contact form pages.

```ts
import { fetchContacts, fetchContactById } from "@/api/contacts";
import { requireUserSession } from "@/lib/auth";
import { LoaderFunctionArgs } from "react-router";

export const loadContacts = async () => {
  await requireUserSession();
  const contacts = await fetchContacts();
  return { contacts };
};

export const loadContactDetail = async ({ params }: LoaderFunctionArgs) => {
  await requireUserSession();
  const contactId = params.contactId;
  if (!contactId) {
    throw new Error("Contact ID is required");
  }
  const contact = await fetchContactById(contactId);
  return { contact };
};

export const loadContactForm = async () => {
  await requireUserSession();
}
```

Now if we go to `http://localhost:5173/` without being logged in, we’ll be redirected to `/login`.

To make sure `contacts/new` is also protected, we need to add the loader in our route config:

```ts
import { loadContactForm, loadContacts } from "./pages/loader";

const AppRoutes = createBrowserRouter([
  ...,
      {
        path: "contacts/new",
        loader: loadContactForm,
        action: newContactAction,
        Component: ContactForm,
      },
  ...
]);
```

And just like that, our private routes are no longer public.

## Logout

Let’s now handle logging out the user.

First, we add the Supabase sign-out logic in `src/services/supabase/auth/auth.ts`:

```ts
export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};
```

Then, in `src/lib/auth.ts`, we wrap it for consistent usage:

```ts
export const logout = async () => {
  await auth.logout();
};
```

Now let’s add the logout form in the UI. In `src/pages/Contacts.tsx`, we include a basic `<Form>` that will submit a POST request:

```tsx
{/* Sidebar */}
<div className="border-r p-4 flex flex-col gap-4">
  <Sidebar contacts={contacts.map(contact => ({
    id: contact.id,
    name: `${contact.firstName} ${contact.lastName}`,
  }))} pendingContactName={username}/>
  <div>
    <Form method="POST">
      <Button>
        Logout
      </Button>
    </Form>
  </div>
</div>
```

As this is a React Router `<Form>`, we need to connect it to an action.

In `src/pages/actions.ts`, we define a `contactsActions` handler:

```ts
// we import lib/auth
import { logout } from "@/lib/auth";


// we add this at the end of the file
export const contactsActions = async ({ request }: ActionFunctionArgs) => {
  const method = request.method.toUpperCase();

  const handlers: Record<string, () => Promise<Response | null>> = {
    POST: async () => {
      await logout();
      return redirect('/login');
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};
```

And then we plug it into the route config:

```ts
import { contactDetailActions, contactsActions, newContactAction } from "./pages/actions";


const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    id: "root",
    HydrateFallback: ContactsSkeletonPage,
    action: contactsActions,
    ...
  }
]<);
```

Now when the user clicks logout, they’ll be signed out and redirected to `/login`.


## Login

Time to build our login flow. This includes the Supabase login logic, a React Router action, and a form.

In `src/services/supabase/auth/auth.ts`, we add the login method:

```ts
export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
```

And in `src/lib/auth.ts`:

```ts
export const loginUser = async (email: string, password: string) => {
  await auth.signInWithPassword(email, password);
};
```

Then we create the login action in `src/pages/auth/actions.ts`:

```ts
export const login = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  await loginUser(email, password);
  return redirect('/');
};
```

Now let’s create the actual login page in `src/pages/auth/Login.tsx`:

```tsx
import { Form, Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Login = () => {
  return (
    <Card className="max-w-md mx-auto mt-10 p-6">
      <CardHeader>
        <h1 className="text-2xl font-bold">Login</h1>
      </CardHeader>
      <CardContent>
        <Form method="POST">
          <div className="mb-4">
            <Label className="mb-2" htmlFor="email">Email</Label>
            <Input type="email" id="email" name="email" />
          </div>
          <div className="mb-4">
            <Label className="mb-2" htmlFor="password">Password</Label>
            <Input type="password" id="password" name="password" />
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit">Login</Button>
            <Button type="button" asChild variant="link">
              <Link to="/signup">Signup</Link>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Login;
```

Finally, register the route in `src/AppRoutes.tsx`:

```tsx
import Login from "./pages/auth/Login";

const AppRoutes = createBrowserRouter([
  ...,
  {
    path: "/login",
    Component: Login,
  },
  ...
]);
```

Now you can visit `http://localhost:5173/login`, log in, and get redirected to the protected route.

---

## conclusion

We’ve added the core of our authentication system:

- Route protection using `requireUserSession`
- Logout handling with a POST action
- Login logic with Supabase and React Router

But there’s still room for improvement.

For example: every route call right now triggers a request to `/auth/v1/user`. It works — but it’s not the cleanest way to manage sessions. In the next part, we’ll look into using cookies or persistent state to make this smoother.

Also, we need to refactor the signup logic to live in the same place as the rest of our auth code.

Auth seems simple at first, but once you start wiring it up properly, you realize how much is going on. Hopefully this post helped you navigate that complexity.

See you in the [next one](/posts/supabase-react-router-optimizing-auth-requests-with-cookies-part-4)!
