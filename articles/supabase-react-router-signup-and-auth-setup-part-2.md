---
title: 'Supabase + React Router: Signup and Auth Setup (Part 2)'
description: >-
  Let’s continue our series by adding some React code to handle user
  registration with Supabase.
date: '2025-07-05'
tags:
  - webdev
  - tutorial
  - supabase
  - reactrouter
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fp1zaerkc58350rfs0mzk.png
devto_url: >-
  https://dev.to/kevinccbsg/supabase-react-router-signup-and-auth-setup-part-2-3ngp
---
Let’s continue our series by adding some React code to handle **user registration** with Supabase.

- Creating a signup form using React Router's <Form>
- Registering users in Supabase
- Auto-creating profile rows with Supabase triggers
- Keeping your TypeScript types in sync
- Using .env for Supabase keys

If you’re following along from [Part 1](/posts/supabase-react-router-local-development-and-migrations-part-1), you can continue as is. But if you want to reset your repo or make sure you're on the correct branch:

```bash
# Repo https://github.com/kevinccbsg/react-router-tutorial-supabase
git reset --hard
git clean -d -f
git checkout 02-react-router-integration
```

---

## Signup Form

Let’s create src/pages/auth/Signup.tsx. We’ll use React Router’s `<Form>` to handle submission.

> Want to learn more about React Router Forms? Check out [this guide](/posts/react-router-data-mode-part-6-actions-forms-and-mutations).

```tsx
import { Form, Link } from "react-router";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const Signup = () => {
  return (
    <Card className="max-w-md mx-auto mt-10 p-6">
      <CardHeader>
        <h1 className="text-2xl font-bold">Signup</h1>
      </CardHeader>
      <CardContent>
        <Form method="POST">
          <div className="mb-4">
            <Label className="mb-2" htmlFor="email">Email</Label>
            <Input type="email" id="email" name="email" required />
          </div>
          <div className="mb-4">
            <Label className="mb-2" htmlFor="password">Password</Label>
            <Input type="password" id="password" name="password" required />
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit">Signup</Button>
            <Button type="button" asChild variant="link">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Signup;
```

Update your route configuration in `src/AppRoutes.tsx` file:

```tsx
import Signup from "./pages/auth/Signup";

const AppRoutes = createBrowserRouter([
  ...,
  {
    path: "/signup",
    Component: Signup,
  },
  ...
]);
```

To run the app:

```bash
npm run serve:dev
```

You can check the Sign up page in `http://localhost:5173/signup`.

## Supabase Client Setup

Install the Supabase JS SDK:

```bash
npm install @supabase/supabase-js
```

Then create a client in `src/services/supabase/client/supabase.ts`:

```tsx
import { createClient } from "@supabase/supabase-js";

const PROJECT_URL = import.meta.env.VITE_SUPABASE_PROJECT_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(PROJECT_URL, ANON_KEY);

export default supabase;
```

This code is okay, but we’re using **TypeScript**, and if we want help from **autocompletion** and type safety, we can export our Supabase types using this command:

```bash
npx supabase gen types --lang=typescript --local > src/services/supabase/client/database.types.ts
```
> Sometimes this command gets stuck if the Supabase CLI isn’t fully installed. If that happens, just run `npx supabase status`, and it will ask to install anything missing. After that, run the `gen types` command again.

Once we have the types, update the Supabase client:

```tsx
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const PROJECT_URL = import.meta.env.VITE_SUPABASE_PROJECT_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient<Database>(PROJECT_URL, ANON_KEY);

export default supabase;
```

Also, don’t forget to add the following environment variables in your `.env` file:

```bash
VITE_SUPABASE_PROJECT_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<YOUR_VITE_SUPABASE_ANON_KEY>
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/ # we will use this later
```
> Don’t forget to add .env to your .gitignore.

## Signup logic

We’ll create a new file at `src/services/supabase/auth/auth.t`s to register a user using Supabase’s `signUpUser` method:

```ts
import supabase from "../client/supabase";

interface UserPayload {
  email: string;
  password: string;
}

const REDIRECT_URL = import.meta.env.VITE_SUPABASE_REDIRECT_URL as string;

export const signUpUser = async (userPayload: UserPayload) => {  
  const { data, error } = await supabase.auth.signUp({
    email: userPayload.email,
    password: userPayload.password,
    options: {
      emailRedirectTo: REDIRECT_URL,
      data: {
        email: userPayload.email,
      },
    },
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
```

Since we’re using **React Router Data Mode**, we’ll now create a file `src/pages/auth/actions.ts` to include this logic in an action.

```tsx
import { signUpUser } from "@/services/supabase/auth/auth";
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
```

And finally, add the action to your route config:

```tsx
const AppRoutes = createBrowserRouter([
  ...,
  {
    path: "/signup",
    action: signup,
    Component: Signup,
  },
  ...
]);
```

When we submit the form, a new user is created in Supabase Auth:

![auth menu option](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uk2q0zznmogptm65e2w2.png)

## Linking Auth to Profiles (Trigger)

Creating a user via Supabase Auth doesn't automatically add them to the `profiles` table. To handle this, create a trigger and function in the SQL Editor:

```sql
-- inserts a row into public.profiles
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.raw_user_meta_data ->> 'email');
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
> This need to be executed in the supabase studio SQL Editor

Now, new users will also be added to the profiles table automatically.

## Deletion: Cascade from Auth to Profiles

Currently, deleting a user from Supabase Auth won’t remove their profile. To fix that, go to Supabase Studio → **profiles table** → and edit the foreign key for `id` to add **ON DELETE CASCADE**:

![delete cascade](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dg1e55fh633vdpo6posu.png)

Now, profiles will be deleted when their corresponding Auth user is removed.

## Remember to Create a Migration

Each time you make changes in Supabase Studio, don’t forget to create a migration:

```bash
npx supabase migration new create_auth_function_triggers
npx supabase db diff --schema public > migration.sql
# And copy migration.sql code to the new migration
```

## Conclusion

This post was packed with practical steps! Here's a quick summary of what we did:

- Built a signup form using React Router
- Created a Supabase client with TypeScript support
- Used the signUp method to register users
- Created a trigger to sync new Auth users with the profiles table
- Handled deletion cascades for cleaner data
- Ensured changes are stored with migrations

In the [next part](/posts/supabase-react-router-protect-routes-login-and-logout-part-3), we’ll cover:

- Login and logout
- Route protection with loaders and redirects
- Syncing the user session in your React app
