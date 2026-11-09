iSAIDON — COMPLETE STARTER WEBSITE
=================================

This ZIP contains a complete static movie catalogue and Supabase-authenticated
admin dashboard.

FILES
-----
index.html                  Home page
iSaidon.streaming.html      Movie library with search/category filter
admin.html                 Admin login and movie management
assets/css/styles.css      Responsive site styling
assets/js/config.js        Supabase project URL + public key configuration
assets/js/app.js           Public movie catalogue logic
assets/js/admin.js         Admin sign-in, create, edit, delete
supabase/migrations/       Database/RLS SQL migration

IMPORTANT LEGAL NOTE
--------------------
Only add movies, posters and links that you own, are licensed to distribute,
or are in the public domain. This site is a catalogue and link manager; it
does not host movie files.

SETUP
-----

1. Configure Supabase
   Open assets/js/config.js.
   The project URL is prefilled for the Supabase project ID supplied earlier.
   Replace PASTE_YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE with your
   Supabase publishable key (or legacy anon key).

   NEVER paste a service_role key or secret key into browser code.

2. Create the database
   In Supabase Dashboard > SQL Editor, open and run:
   supabase/migrations/20261108000100_secure_movies_and_admin.sql

   This migration:
   - Creates the movies table if it does not exist.
   - Adds the fields used by this website if they are missing.
   - Allows public SELECT.
   - Removes old movie table policies and creates admin-only write policies.
   - Blocks anonymous INSERT, UPDATE and DELETE.

   NOTE: The migration drops existing policies on public.movies before
   recreating the intended policies. Review existing custom policies first
   if your project uses other workflows on this table.

3. Create your admin user
   In Supabase Dashboard > Authentication > Users, choose Add user.
   Create an account with your email and a strong password.
   Confirm the user if your project requires email confirmation.

4. Assign admin role
   In SQL Editor, replace YOUR_ADMIN_EMAIL and run:

   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
       || '{"role":"admin"}'::jsonb
   where email = 'YOUR_ADMIN_EMAIL';

   Verify:
   select email, raw_app_meta_data
   from auth.users
   where email = 'YOUR_ADMIN_EMAIL';

   Sign out and sign back in at admin.html after changing the role.

5. Run locally
   Do not rely on opening the HTML file directly with file://.
   Use VS Code with the Live Server extension, or any local static server.
   Open index.html through the local server.

6. Publish
   Upload the contents of this folder to your static hosting provider.
   Keep all paths and folders intact.

MOVIE FIELDS
------------
title        Required text
category     Required text
poster_url   Required URL to a poster you may use
movie_url    Required authorized viewing/download URL
description  Optional text
release_year Optional number

TROUBLESHOOTING
---------------
- "Set your Supabase ... key": add the publishable/anon key to config.js.
- "Invalid API key": confirm you copied the correct key from this project.
- "new row violates row-level security": confirm app_metadata.role is admin,
  sign out and back in, and ensure you ran the migration on this project.
- "column not found": run the migration on the same Supabase project used
  in config.js, then wait a moment and refresh.
- "Failed to fetch": check the project URL, internet connection and Supabase
  project status.

SECURITY
--------
The browser uses only the publishable/anon key. RLS is the security boundary.
Do not add a password or service_role/secret key to JavaScript.
Admin role must be assigned through trusted Supabase dashboard/SQL, never
through user-editable user_metadata.
