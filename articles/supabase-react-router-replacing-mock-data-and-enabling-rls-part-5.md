---
title: Supabase + React Router – Replacing Mock Data and Enabling RLS (Part 5)
description: >-
  In this part of the series, we’re finally saying goodbye to the mock data and
  connecting our app to real Supabase tables. The goal is to make sure the
  contacts…
date: '2025-07-16'
tags:
  - tutorial
  - react
  - supabase
  - reactrouter
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fl49ciash09z8mdrugfvr.png
devto_url: >-
  https://dev.to/kevinccbsg/supabase-react-router-replacing-mock-data-and-enabling-rls-part-5-3b7k
---
In this part of the series, we’re finally saying goodbye to the mock data and connecting our app to real Supabase tables. The goal is to make sure the contacts we create live in the actual database and are protected by proper access rules using Supabase RLS (Row-Level Security).

If you’re following along from [Part 4](/posts/supabase-react-router-optimizing-auth-requests-with-cookies-part-4), you can continue as is. But if you want to reset your repo or make sure you're on the correct branch:

```bash
# Repo https://github.com/kevinccbsg/react-router-tutorial-supabase
git reset --hard
git clean -d -f
git checkout 05-contacts-supabase-data
```

Then start the dev server:

```bash
npm run serve:dev
```

---

## Connecting to Supabase (Bye, JSON Server)

Let’s start by replacing our mock logic with real Supabase calls. First, we’ll create a service file at `src/services/supabase/contacts/contacts.ts` and add a `createContact` method:

```ts
import supabase from "../client/supabase";

interface Contact {
  email: string;
  favorite: boolean;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  profileId: string;
  avatar?: string;
}

export const createContact = async (contact: Contact) => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([{
      email: contact.email,
      favorite: contact.favorite,
      first_name: contact.firstName,
      last_name: contact.lastName,
      username: contact.username,
      phone: contact.phone,
      avatar: contact.avatar,
      profile_id: contact.profileId,
    }]).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
```

Next, we update our `newContactAction` in `src/pages/actions.ts` to use this method:

```ts
export const newContactAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  const handlers: Record<string, () => Promise<Response | { error: string; }>> = {
    POST: async () => {
      const newContact: NewContact = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        avatar: formData.get('avatar') as string || undefined,
      };
      const user = await getUserSession();
      if (!user) {
        return redirect('/login');
      }
      const newContactResponse = await createContact({
        ...newContact,
        favorite: false, // Default value for new contacts
        profileId: user.id,
      });
      return redirect(`/contacts/${newContactResponse.id}`);
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};
```

If we go to `http://localhost:5173/contacts/new` and we try to create a new contact we will get an error. 

At this point, everything seems wired up — but if you try to create a contact (`http://localhost:5173/contacts/new`), you’ll hit this error:

```
Unexpected Application Error!
new row violates row-level security policy for table "contacts"
```

This is because Supabase enables RLS by default. And that’s a good thing. It means you’re in control of who can read or write data.

## Enabling RLS Policies (Don't Panic)

This part is where a lot of people get stuck. They hit the RLS wall and either disable it or set up a backend proxy just to avoid it.

That’s a mistake, in my opinion. RLS might feel intimidating at first, but once you get used to writing policies, it becomes just another tool in your toolbox. And you only need a bit of SQL to get started.

So let’s go to the Supabase table editor and create our first RLS policy to allow authenticated users to insert rows.

![Create contact policy](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rex6o8nhb7ryhy16s4e6.png)

If you try again, though, it still won’t work — because our insert includes a .select(), so we also need a select policy:

![Select contact policy](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ox07mnxdefd1segsk70z.png)

Once both policies are in place, new contacts are created and appear right in the Supabase table editor.

## When It Still Doesn’t Work

RLS errors are frustrating because the feedback is vague or nonexistent. One useful habit is to double-check which operations you're actually using: `insert`, `select`, `update`, etc. You may need policies for more than one of them.

And if you get a `name resolution failed error` — that just means Supabase Studio is confused. Restart your local instance with:

```bash
npx supabase stop
npx supabase start
```

## Getting the Contacts List

We’ll now load real contacts from Supabase instead of the mock API. In your service file `src/services/supabase/contacts/contacts.ts`, add this method:

```ts
export const getContacts = async (profileId: string): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(contact => ({
    id: contact.id,
    email: contact.email,
    favorite: contact.favorite,
    firstName: contact.first_name,
    lastName: contact.last_name,
    username: contact.username,
    phone: contact.phone,
    profileId: contact.profile_id,
    avatar: contact.avatar || undefined,
  }));
};
```

And update the loader in `src/pages/loader.ts`:

```ts
import { requireUserSession } from "@/lib/auth";
import { getContacts } from "@/services/supabase/contacts/contacts";

export const loadContacts = async () => {
  const user = await requireUserSession();
  const contacts = await getContacts(user.id);
  return { contacts };
};

export const loadContactForm = async () => {
  await requireUserSession();
}
```

## Updating and Deleting Contacts

Now let's support the rest of the CRUD operations: deleting a contact and marking it as a favorite.

In the `src/services/supabase/contacts/contacts.ts` file, add:

```ts
export const deleteContact = async (id: string) => {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const updateFavoriteStatus = async (id: string, favorite: boolean) => {
  const { error } = await supabase
    .from('contacts')
    .update({ favorite })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};
```
Then in your `src/pages/actions.ts`, remove the old mock imports and use the Supabase methods instead:

```ts
// remove old mock imports
// import { deleteContact, updateFavoriteStatus } from "@/api/contacts";

// add Supabase methods instead
import { createContact, deleteContact, updateFavoriteStatus } from "@/services/supabase/contacts/contacts";
```

If you test it now, these operations will fail too — you guessed it — because of missing RLS policies.

So head to the Supabase table editor and add two more:

![Delete contact RLS](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ius1jdq77yi0xagin7w2.png)


![Update contact RLS](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bgpmj60z7etxm9zdhgmk.png)

Once that’s done, the full flow works: create, update, delete, and load contacts — all with secure, user-scoped access.

## Cleaning Up

Now that we’re done with `json-server`, you can delete the `src/api` folder and just run the app with:

```bash
npm run dev
```

## Recording Everything as a Migration

Just like we did back in [Part 1](/posts/supabase-react-router-local-development-and-migrations-part-1), let’s generate a migration for the changes made via Supabase Studio:

```bash
npx supabase migration new create_contact_rls
# copy the code of migration.sql in the new file created in the previous command
npx supabase db diff --schema public > migration.sql
```

This ensures your database stays versioned and sharable across environments.

## Conclusion

This was a big step. We replaced all mock code with real Supabase logic, enforced access with RLS, and cleaned up our frontend to reflect it.

A lot of people give up on Supabase here — but RLS is worth learning. It's not magic, but it gives you the confidence that your data is safe, and you don’t need to write an extra backend just for filtering or permission checks.

Next time, we’ll talk about testing — a topic many skip entirely. We’ll write tests to make sure our Supabase integration behaves exactly as expected.
