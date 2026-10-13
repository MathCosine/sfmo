# Deploying SFMO

Two systems: **GitHub Pages** serves the site, **Supabase** stores
registrations. They are independent — the site builds and works with no
Supabase at all (the registration form just says the backend is not
connected).

---

## 1. Turn on GitHub Pages  ← do this first

**This is the one step that cannot be automated.** The Actions token is not
allowed to create a Pages site, so a repo admin has to flip the switch once:

1. **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   (Not "Deploy from a branch" — the workflow in
   `.github/workflows/deploy.yml` publishes the built site.)
3. **Actions → Deploy to GitHub Pages → Run workflow**, or just push to
   `main`. It builds and deploys in about a minute.

The site lands at `https://mathcosine.github.io/sfmo/`.

Until this is done, every run fails at the `configure-pages` step with
*"Get Pages site failed … verify that the repository has Pages enabled"*.
The build itself succeeds — only the publish step is blocked.

### Cost

For a **public** repository, GitHub Actions and Pages are free with no minute
limit, so the deploy costs nothing. If this repo is **private**, each deploy
burns about **1–2 minutes** of the account's Actions allowance (2,000
min/month on Free, 3,000 on Pro). Even deploying ten times a day that is under
10% of the Free allowance. The build itself is one job, dependencies are
cached, and no source maps are produced, which keeps it near the floor.

---

## 2. Moving to a custom domain (sfmathopen.org / sfmoofficial.org)

Connecting a domain to GitHub Pages is free: you only pay the registrar
(Spaceship, Namecheap, Cloudflare…) for the domain itself. The base path is
not hard-coded anywhere, so the switch is settings only, with no code change.

**Step 1 — verify the domain with GitHub (recommended).** This stops anyone
else from pointing your domain at their own Pages site. On GitHub: your
profile picture → **Settings → Pages** (under "Code, planning, and
automation") → **Add a domain**. GitHub shows a `TXT` record; add it at your
registrar (step 2's DNS page), then click **Verify**.

**Step 2 — DNS at your registrar.** On the domain's DNS records page, first
delete any records the registrar added for `@` and `www` (a parking page or
forwarding), then add:

| Type    | Host / Name | Value                    |
| ------- | ----------- | ------------------------ |
| `A`     | `@`         | `185.199.108.153`        |
| `A`     | `@`         | `185.199.109.153`        |
| `A`     | `@`         | `185.199.110.153`        |
| `A`     | `@`         | `185.199.111.153`        |
| `AAAA`  | `@`         | `2606:50c0:8000::153`    |
| `AAAA`  | `@`         | `2606:50c0:8001::153`    |
| `AAAA`  | `@`         | `2606:50c0:8002::153`    |
| `AAAA`  | `@`         | `2606:50c0:8003::153`    |
| `CNAME` | `www`       | `mathcosine.github.io`   |

The `AAAA` (IPv6) records are optional but recommended. DNS changes can take
up to 24 hours to spread, though usually far less.

**Step 3 — repository variables.** Settings → Secrets and variables →
Actions → **Variables** tab → New repository variable:

| Name            | Value                        |
| --------------- | ---------------------------- |
| `SITE_BASE`     | `/`                          |
| `SITE_URL`      | `https://sfmathopen.org/`    |
| `CUSTOM_DOMAIN` | `sfmathopen.org`             |

**Step 4 — Settings → Pages → Custom domain**, enter `sfmathopen.org`,
**Save**, and wait for the DNS check to pass. Then straight away:

**Step 5 — redeploy.** Actions → *Deploy to GitHub Pages* → **Run workflow**.
Do steps 4 and 5 back to back: once the custom domain is saved, GitHub
redirects `mathcosine.github.io/sfmo` to the new domain, and the site only
loads there after this rebuild (about two minutes).

**Step 6 — HTTPS.** Back in Settings → Pages, tick **Enforce HTTPS** once it
becomes available — GitHub says this can take up to 24 hours.

**Step 7 — tell the other services.**
- Supabase → Edge Functions → Secrets: set `SITE_URL` to
  `https://sfmathopen.org/`, so links in the confirmation emails point at the
  new address.
- Google Search Console: see section 3.

That is the whole switch. `SITE_BASE` drives Vite's `base`, the router's
`basename`, and every asset URL; `SITE_URL` drives canonical tags, Open Graph
URLs and `sitemap.xml`. The deploy writes a `CNAME` file when
`CUSTOM_DOMAIN` is set; GitHub ignores it for Actions deploys (the Pages
setting is what counts), but it does no harm.

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
6. Optional but recommended: confirmation emails (an AgentMail key, about 5 minutes)
   ([`supabase/README.md` §7](supabase/README.md#7-confirmation-emails)).

The **Keep Supabase awake** workflow then queries the project every Monday
and Thursday with the same two secrets, so the free project never pauses.

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
