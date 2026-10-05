---
title: 'Supabase + React Router: Local Development and Migrations (Part 1)'
description: >-
  Welcome to a new series where we explore Supabase and its integration with
  React Router. Throughout the posts, we’ll cover topics like:
date: '2025-07-03'
tags:
  - webdev
  - supabase
  - react
  - tutorial
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fm817b8x5olf1x91rmey0.png
devto_url: >-
  https://dev.to/kevinccbsg/supabase-react-router-local-development-and-migrations-part-1-4f5b
---
Welcome to a new series where we explore **Supabase** and its integration with **React Router**. Throughout the posts, we’ll cover topics like:

- Local development with Supabase and creating migrations
- [Signup and Auth Setup](/posts/supabase-react-router-signup-and-auth-setup-part-2)
- [Login and protect routes](/posts/supabase-react-router-protect-routes-login-and-logout-part-3)
- [Optimizing Auth Requests with Cookies](/posts/supabase-react-router-optimizing-auth-requests-with-cookies-part-4)
- [Replacing Mock Data and Enabling RLS](/posts/supabase-react-router-replacing-mock-data-and-enabling-rls-part-5)
- [Testing Supabase functions and RLS rules](/posts/supabase-react-router-testing-supabase-service-part-6)
- Automating migration updates using GitHub Actions

In this first post, we’ll focus on running Supabase **locally**. Most tutorials guide you through the Supabase dashboard, but if you want to test advanced features or collaborate with a team, working locally is essential.

We’ll also show how to include database changes as **migrations** in your repository so every developer can reproduce the exact setup.

## Requirements

Make sure you have:

- Docker installed
- Node.js version 20 or higher

## Setting Up a Local Supabase Project

We’ll start by setting up our base project. You can clone the repo here:

```bash
git clone git@github.com:kevinccbsg/react-router-tutorial-supabase.git
cd react-router-tutorial-supabase
git checkout 01-setup
npm i
```

Then run the following command to initialize Supabase locally. This setup follows the [official Supabase documentation](https://supabase.com/docs/guides/local-development):

```bash
npx supabase init
```

You’ll be asked a couple of questions; you can safely skip them (press `N`):

```bash
Generate VS Code settings for Deno? [y/N]
Generate IntelliJ Settings for Deno? [y/N]
Finished supabase init.
```

This command creates a `supabase/` directory with a `config.toml` file. This file contains your local Supabase configuration. You can adjust ports, email settings, and more. Read more [here](https://supabase.com/docs/guides/local-development/cli/config).

To spin up your local Supabase services (Postgres, Studio, etc.), run:

```bash
npx supabase start
```

This might take a couple of minutes. Once done, you should see output like this:

```bash
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: anon_key
service_role key: service_role_key
   S3 Access Key: S3_Access_Key
   S3 Secret Key: S3_Access_Key
       S3 Region: local
```

You can now open http://127.0.0.1:54323 to access Supabase Studio locally.

Each developer in your team will need to run the same setup locally. Later, we’ll explain how to apply changes to the database using migrations so everyone stays in sync.

You can always check the status of your services with:

```bash
npx supabase status
```

## Creating Migrations

Let’s create our first migration. We could write raw SQL, but let’s do it using the Supabase Studio for this example.

We’re building a simple app where each user has a list of contacts.

**Data Models**

```ts
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  favorite: boolean;
  avatar?: string;
}

interface User {
  id: string;
  email: string;
}
```

**Creating Tables**

Start by creating the `profiles` and `contacts` tables through the Supabase Studio:

Profiles table:

![Profiles table](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zap4nnvh5jhz8nffi1t2.png)

Contacts table:

![contact table intro](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lgsape5omxry5utm6qvc.png)
![contact table fields](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8zi8seam4ie8kffoh2ww.png)

Here’s the SQL definition:

```sql
create table public.profiles (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  email text not null,
  constraint profiles_pkey primary key (id)
) TABLESPACE pg_default;

create table public.contacts (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  first_name text not null,
  last_name text not null,
  username text not null,
  email text not null,
  phone text not null,
  favorite boolean not null,
  avatar text null,
  profile_id uuid not null,
  constraint contacts_pkey primary key (id),
  constraint contacts_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;
```

Now that our tables are ready, let’s persist those changes as a migration.

## Saving Changes as a Migration

Run this command to create a new migration file:

```bash
npx supabase migration new create_profiles_contacts_tables
```

This creates a file inside the `supabase/migrations/` folder, but it’s empty by default. To generate the actual SQL for the migration based on the changes we made in Supabase Studio:

```bash
npx supabase db diff --schema public > migration.sql
```

This generates a `migration.sql` file with all the SQL commands. Copy its contents into the newly created migration file.

> ⚠️ Tip: Add `migration.sql` to your `.gitignore` file. It’s just a temp file.

To apply migrations or reset the local database (useful when syncing with teammates):

```bash
npx supabase db reset
```

## Conclusion

In this first part, we’ve set up a local Supabase environment using the CLI, explored how to create tables through Supabase Studio, and learned how to track those changes using migrations.

This setup ensures every developer on your team can work with the same local database structure and share changes through version control.

In the [next post](/posts/supabase-react-router-signup-and-auth-setup-part-2), we’ll dive into authentication with Supabase and show how to use React Router to protect routes based on user sessions.
