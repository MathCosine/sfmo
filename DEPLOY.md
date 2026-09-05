# Deploying SFMO

Two systems: **GitHub Pages** serves the site, **Supabase** stores
registrations. They are independent — the site builds and works with no
Supabase at all (the registration form just says the backend is not
connected).

---

## 1. Turn on GitHub Pages

One-time, in this repository:

1. **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   (Not "Deploy from a branch" — the workflow in
   `.github/workflows/deploy.yml` publishes the built site.)
3. Push to `main`. The workflow builds and deploys automatically.

The site lands at `https://mathcosine.github.io/sfmo/`.

### Cost

For a **public** repository, GitHub Actions and Pages are free with no minute
limit, so the deploy costs nothing. If this repo is **private**, each deploy
burns about **1–2 minutes** of the account's Actions allowance (2,000
min/month on Free, 3,000 on Pro). Even deploying ten times a day that is under
10% of the Free allowance. The build itself is one job, dependencies are
cached, and no source maps are produced, which keeps it near the floor.

---

## 2. Moving to a custom domain (sfmathopen.org / sfmoofficial.org)

The base path is not hard-coded anywhere. To switch:

**Step 1 — DNS at your registrar.** For an apex domain (`sfmathopen.org`),
create four `A` records pointing at GitHub's Pages IPs:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Also add a `CNAME` record for `www` → `mathcosine.github.io.`

If you would rather use `www.sfmathopen.org` as the real address, skip the
`A` records and just point `www` at `mathcosine.github.io.`

**Step 2 — repository variables.** Settings → Secrets and variables →
Actions → **Variables** tab → New repository variable:

| Name            | Value                        |
| --------------- | ---------------------------- |
| `SITE_BASE`     | `/`                          |
| `SITE_URL`      | `https://sfmathopen.org/`    |
| `CUSTOM_DOMAIN` | `sfmathopen.org`             |

**Step 3 — Settings → Pages → Custom domain.** Enter the domain and tick
**Enforce HTTPS** once the certificate is issued (can take up to an hour).

**Step 4 — redeploy.** Actions → *Deploy to GitHub Pages* → **Run workflow**.
No commit needed.

That is the whole switch. `SITE_BASE` drives Vite's `base`, the router's
`basename`, and every asset URL; `SITE_URL` drives canonical tags, Open Graph
URLs and `sitemap.xml`.

---

## 3. Google Search Console

Do this **after** the custom domain is live, so you only verify once.

1. Go to <https://search.google.com/search-console> and add a property.
2. Choose **Domain** (not URL prefix) — it covers `www`, apex, http and https
   in one go.
3. Google gives you a `TXT` record. Add it at your registrar:
   - Type: `TXT`, Host/Name: `@`, Value: the `google-site-verification=...`
     string Google shows.
4. Click **Verify** (DNS can take 10–60 minutes to propagate).
5. **Sitemaps → Add a new sitemap →** enter `sitemap.xml`.

If you want to verify *before* the domain move, use the **URL prefix** method
with `https://mathcosine.github.io/sfmo/` instead, and paste the HTML tag
Google gives you into the marked placeholder in `index.html`:

```html
<!-- GOOGLE SEARCH CONSOLE -->
<meta name="google-site-verification" content="PASTE_HERE" />
```

### Why deep links are indexable

GitHub Pages has no server-side routing, so single-page apps normally fall
back to a `404.html` redirect trick, which Search Console dislikes. Instead
the build emits a **real HTML file per route** (`/about/index.html`,
`/archive/index.html`, …), each with its own `<title>`, description and
canonical URL. Every route returns a genuine `200`. `robots.txt` and
`sitemap.xml` are generated at build time against whatever `SITE_URL` is set
to, so they stay correct through the domain move.

---

## 4. Supabase

Full walkthrough in [`supabase/README.md`](supabase/README.md). Short version:

1. Create a project at <https://supabase.com/dashboard>.
2. SQL Editor → paste all of `supabase/schema.sql` → **Run**.
3. Project Settings → API → copy the **Project URL** and the **anon public**
   key.
4. In GitHub: Settings → Secrets and variables → Actions → **Secrets** tab →
   add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Re-run the deploy workflow.

---

## 5. Local development

```bash
npm install
cp .env.example .env.local     # optional; fill in Supabase keys
npm run dev                    # http://localhost:5173/sfmo/
```

`npm run build` then `npm run preview` reproduces the deployed build exactly,
including the per-route HTML files.

To refresh the self-hosted fonts (rarely needed):

```bash
node scripts/fetch-fonts.mjs
```
