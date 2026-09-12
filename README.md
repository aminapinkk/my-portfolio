# My Portfolio — GitHub Pages + Supabase

This version uses GitHub Pages for the website and Supabase for authentication, Postgres metadata and file storage.

## 1. Create a Supabase project

Create a project at https://supabase.com/.

Then open **SQL Editor** and run the complete file:

`supabase/schema.sql`

This creates the `works` table, Row Level Security policies, and the public `portfolio-files` storage bucket.

## 2. Create the owner account

In Supabase Dashboard go to **Authentication → Users** and create your owner user with an email and password. The website has login only; public visitors cannot create accounts.

## 3. Get the browser-safe key

In your Supabase project settings/API page, copy the **Project URL** and the browser-safe **Publishable key** (or legacy `anon` key if your project still labels it that way).

Never put a `service_role`/secret key into the website.

Edit `config.js`:

```js
window.SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT-REF.supabase.co',
  publishableKey: 'YOUR_SUPABASE_PUBLISHABLE_KEY'
};
```

## 4. Put the project on GitHub

Create a GitHub repository, upload the contents of this folder to the repository root, and enable GitHub Pages from **Settings → Pages**. Choose **Deploy from a branch**, then `main` and `/ (root)`.

Your site will be published at the GitHub Pages URL for the repository.

## 5. Supabase Auth redirect URL

In Supabase Authentication URL settings, add your final GitHub Pages URL as an allowed site/redirect URL. Example:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

## Security model

- Anyone can view the portfolio and its public artwork files.
- Only the authenticated owner can insert/update/delete works.
- Files are stored in Supabase Storage; metadata is stored in Postgres.
- The browser uses only the publishable/anon key. Never expose a service role key.


## This copy is preconfigured

The browser-safe Supabase project URL and publishable key are already filled in in `config.js`. Do not replace them with a secret/service_role key.

### Supabase setup
1. In Supabase SQL Editor, run the entire `supabase/schema.sql` file once.
2. In Authentication → Users, create your owner account with an email and password.
3. Upload this folder to a GitHub repository.
4. Enable GitHub Pages using the included workflow.

After that, visitors can view the portfolio, while the signed-in owner can upload and delete works. Artwork files are stored in Supabase Storage and metadata is stored in the `works` table, so refreshing the page does not remove them.
