# GamersArchives.org — Supabase-connected beta

This is the GitHub Pages-ready upgrade for GamersArchives.org.

## What changed

- Email/password member registration and sign-in
- Saved public member profiles
- Shared tournaments, duel challenges, clips, forum threads, and chat messages
- Supabase Realtime refresh for live lobby chat inserts
- Row Level Security policies for browser-safe database access
- Server-controlled daily Vault Spin reward with one claim per signed-in member per day
- Video links for archive clips; direct file storage remains a later upgrade

## Step 1 — Set the authentication redirect URL

In Supabase Dashboard, open **Authentication → URL Configuration**.

Set **Site URL** to:

```text
https://iishadowkiingii.github.io/gamersarchives-site/
```

Add the same address under **Redirect URLs**.

## Step 2 — Run the database setup

In Supabase Dashboard, open **SQL Editor → New query**.

Copy everything from `supabase-setup.sql`, paste it into the editor, and click **Run**.

## Step 3 — Upload the new GitHub files

In your GitHub repository `gamersarchives-site`, upload the contents of this folder and replace the existing files.

The important files are:

```text
index.html
styles.css
app.js
config.js
supabase-setup.sql
README.md
assets/
```

Commit the changes. GitHub Pages will update the live site after the commit is deployed.

## Optional founder role

After you create your own website account, open SQL Editor and run this with your actual new username:

```sql
update public.profiles
set role = 'founder', credits = 4250
where username = 'your_username';
```

## Security note

`config.js` contains the public Supabase URL and publishable browser key. This is expected for a browser application. The database tables are protected by Row Level Security policies in `supabase-setup.sql`.

Never put a Supabase secret key, service-role key, or database password into this repository.
