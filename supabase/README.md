# Supabase setup

Everything the registration system needs is in `schema.sql`. Follow this once.

---

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project**.
2. Name it something like `sfmo`. Pick the region closest to San Francisco
   (**West US (North California)** or **West US (Oregon)**).
3. Set a database password and save it in your password manager — you will
   rarely need it, but it cannot be recovered.
4. The free tier is plenty: 500 MB database, 50,000 monthly active users.
   A few hundred teams is a rounding error.

## 2. Run the schema

1. In the project, open **SQL Editor** (left sidebar) → **New query**.
2. Paste the entire contents of `schema.sql`.
3. Click **Run**. It should finish with "Success. No rows returned."

It is safe to run again after edits — every statement is idempotent. Run
the **whole file** every time, never a piece of it: on an existing project it
upgrades in place (new columns, new functions) and keeps every registration.

## 3. Get the keys

**Project Settings → API**:

| Dashboard label   | Goes to                  |
| ----------------- | ------------------------ |
| **Project URL**   | `VITE_SUPABASE_URL`      |
| **anon** `public` | `VITE_SUPABASE_ANON_KEY` |

> The anon key is **meant to be public**. It ships inside the JavaScript
> bundle and anyone can read it out of the page. That is safe here because
> every table has row level security switched on and the public has no direct
> table access at all — registration goes through one locked-down function.
>
> The **`service_role`** key is the dangerous one. It bypasses every policy.
> Never put it in this repo, in a `VITE_` variable, or anywhere the browser
> can reach.

Add both to GitHub: **Settings → Secrets and variables → Actions →
Secrets** → `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then re-run the
deploy workflow.

For local development put the same two values in `.env.local`.

## 4. Create staff accounts

Staff sign in at `/staff` with an email and password. Supabase does not let
the public sign themselves up as staff, so you create each account by hand.

**For each organiser:**

1. **Authentication → Users → Add user → Create new user**.
2. Enter their email and a temporary password. Tick **Auto Confirm User**
   (otherwise they must click a confirmation email first).
3. Copy the new user's **UID**.
4. **SQL Editor**, and run — replacing the UID and details:

```sql
insert into public.staff_members (user_id, email, full_name, role)
values ('PASTE-THE-UID-HERE', 'them@example.com', 'Their Name', 'staff');
```

Use `'admin'` instead of `'staff'` for anyone who should also be able to
delete teams and manage the staff list. Give yourself `admin`.

A user who exists in Authentication but has **no row** in `staff_members`
can sign in but will see nothing — every policy checks `is_staff()`. That is
the intended failure mode.

> **Recommended:** turn off public sign-ups so nobody can create an account
> at all. **Authentication → Providers → Email →** switch **Enable sign ups**
> off. Staff accounts are created by you in the dashboard regardless.

## 5. Opening registration

Registration is gated by one row in `site_settings`. Two ways to open it:

* **From the site:** sign in at `/staff` and click **Open registration**.
* **From SQL:**

```sql
update public.site_settings set registration_open = true where id = 1;
```

The `registration_opens_at` timestamp is a second gate — even with
`registration_open = true`, `register_team()` refuses before that moment, and
the public page shows a countdown. It is currently set to
**2026-10-24 00:00 Pacific**. To change it:

```sql
update public.site_settings
set registration_opens_at = '2026-10-24T00:00:00-07:00'
where id = 1;
```

You can also set `registration_closes_at`, `max_team_size`, and an
`announcement` string that appears on the registration page.

---

## 6. Project paused, or replacing it

Free-plan projects are **paused after a week of low activity**. While paused,
the public site cannot read the registration window, so `/register` quietly
shows "not open yet" and the staff portal cannot sign in. Nothing errors
loudly — so check it before registration opens on October 24.

**Keeping it awake.** The repo's **Keep Supabase awake** workflow
(`.github/workflows/supabase-keepalive.yml`) runs a one-row query every Monday
and Thursday using the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
secrets — no extra setup. Check it once: **Actions → Keep Supabase awake →
Run workflow**, and it should go green. Twice a week, not every two weeks,
because the pause comes after 7 idle days.

One catch: GitHub turns off scheduled workflows in a public repo after 60
days with no commits, and emails the repo owner when it does. If that email
arrives, open the workflow in the Actions tab and click **Enable workflow**.

**Restore it (keeps everything).** Dashboard → the project → **Restore**.
Supabase's docs currently allow a year to do this. The Project URL and anon
key do not change, so the GitHub secrets stay as they are. Then run the
latest `schema.sql` once more (step 2) — it is safe to re-run, and it adds
anything newer than what the project has, such as the division and media
release columns, the liability waiver and donation fields, and the
confirmation-email function.

**Replace it with a new project.** Follow steps 1–4 again on the new project,
then in GitHub replace the two secrets, `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`, with the new project's values, and re-run the
deploy workflow (Actions → Deploy to GitHub Pages → Run workflow). Two things
do not carry over to a new project: staff accounts (recreate them, step 4)
and any registrations already taken (export them from the staff portal's
**Export CSV** first). If you set up confirmation emails, redeploy the
function and re-enter its secrets on the new project too (step 7).

---

## 7. Confirmation emails

When a team registers, the site asks the `send-confirmation` Edge Function to
email:

* the team's **contact** (coach cc'd): team ID, every competitor ID, division,
  and how to give the suggested donation;
* each **parent or guardian** who signed the liability waiver: a short notice
  naming the competitors they signed for, with "reply if this wasn't you".

It sends **once per team**, and only when given a matching team ID *and*
contact email, so the endpoint cannot be used to email strangers. If sending
fails the team is still registered, the page says so, and staff can retry
from the portal (expand the team → **Send now** / **Resend**).

Emails go out through [Resend](https://resend.com) (free: 100 emails a day,
3,000 a month). A registration sends 1 email plus one per distinct guardian —
at most 5. If a busy day hits the daily cap, those teams show "Not sent" in
the portal; press **Send now** the next day.

**Setup, once (about 20 minutes, most of it waiting for DNS):**

1. **Resend account.** Sign up at <https://resend.com> with
   `sfmathopen@gmail.com`.
2. **Verify a sending domain.** Resend → **Domains → Add domain**. Use one you
   control, e.g. `sfmathacademy.com` (or `sfmathopen.org` once you own it).
   Resend shows 3–4 DNS records (an MX and TXT records for SPF and DKIM); add
   them exactly as shown wherever the domain's DNS is managed, then click
   **Verify**. Until a domain is verified, Resend only delivers to your own
   account address — fine for a test, not for teams.
3. **API key.** Resend → **API Keys → Create API key**, permission **Sending
   access**. Copy the `re_…` key — Resend shows it once.
4. **Function secrets.** Supabase dashboard → **Edge Functions → Secrets**
   (sometimes under Project Settings → Edge Functions). Add:

   | Name             | Value                                                                 |
   | ---------------- | --------------------------------------------------------------------- |
   | `RESEND_API_KEY` | the `re_…` key                                                        |
   | `EMAIL_FROM`     | `SFMO 2027 <registration@sfmathacademy.com>` — must use the verified domain |
   | `REPLY_TO`       | optional; defaults to `sfmathopen@gmail.com`, where replies land       |
   | `SITE_URL`       | optional; defaults to `https://mathcosine.github.io/sfmo/` — update it when you move to sfmathopen.org |

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to every
   function automatically. Never copy the service-role key anywhere else.
5. **Deploy the function.** **Edge Functions → Deploy a new function → Via
   Editor.** Name it exactly `send-confirmation`, replace the sample code with
   the whole of `supabase/functions/send-confirmation/index.ts`, and deploy.
   Then open the function's settings and turn **off** JWT verification ("Verify
   JWT" / "Enforce JWT verification"). The public page calls it with the
   public key; the team-ID-plus-email check is what protects it.

   With the Supabase CLI instead:
   `supabase functions deploy send-confirmation --no-verify-jwt`.
6. **Test.** Sign in at `/staff`, expand any team, and press **Send now**. If
   it fails, the function's **Logs** tab in Supabase says why (most often a
   typo in `EMAIL_FROM`, or a domain not yet verified).

The email wording lives in `index.ts` and repeats the donation details from
`src/lib/config.ts` (the function cannot import site code) — change both
together.

---

## How the pieces fit

```
                      ┌─────────────────────────────┐
 public visitor  ───► │  register_team(payload)     │  SECURITY DEFINER
 (anon key)           │  • checks the open window   │  runs as owner, so it
                      │  • validates the roster     │  can write even though
                      │  • assigns 07 / 07A..07D    │  anon has no table
                      └──────────────┬──────────────┘  access of its own
                                     ▼
                        teams  ◄──►  team_members
                                     ▲
                      ┌──────────────┴──────────────┐
 staff (signed in) ─► │  row level security:        │
                      │  is_staff() must be true    │
                      └─────────────────────────────┘
```

**Team and competitor IDs.** `teams.team_number` comes from a Postgres
sequence, so it is assigned atomically — two teams registering in the same
second cannot collide. `team_code` is a generated column, `lpad(number, 2,
'0')`, so team 7 is `07`. Each member row gets a slot letter `A`–`D` in the
order they were entered, and a trigger writes `competitor_id` as team code +
slot: `07A`, `07B`, `07C`, `07D`. Registrants see these immediately on the
confirmation screen, and can retrieve them later with **Look up your team
IDs** using the team ID plus their contact email.

**Abuse guard.** One contact email may register at most 5 non-cancelled
teams. Raise it in `register_team()` if a coach legitimately needs more.

**Divisions and the distance rule.** `teams.division` is `in_person` or
`online`. Anyone living within 100 miles of the Bay Area competes in person,
so an online registration is refused unless the team confirms no member
does (`distance_attested`).

**Media release and liability waiver.** Both documents are shown in full on
the form; their text lives in `src/data/waivers.ts`. Each competitor's parent
or guardian (or the competitor, if 18+) signs the waiver by typing their own
name and email — stored on `team_members` as `guardian_name` /
`guardian_email`. The captain then signs once by typing their name, which
`register_team()` checks against the roster (ignoring case and extra spaces),
and ticks one box for each document. That signature and time are stored on
the team for both. `register_team()` refuses a registration missing any of it.

**Suggested donation.** Optional, $10 per competitor suggested (so $40 for a
full team; set in `src/lib/config.ts`). The team records a pledge for the
whole team (`donation_pledge`, whole dollars) and how it plans to give
(`donation_method`: `zelle`, `online`, or `checkin`; check-in is refused for
the online division). Nothing is charged by the site. Staff tick
`donation_received` in the portal when the money arrives.

---

## Useful queries

```sql
-- Everything, one row per competitor (what the check-in sheet wants)
select m.competitor_id, t.team_code, t.team_name, m.full_name, m.grade,
       t.school, t.status
from public.team_members m
join public.teams t on t.id = m.team_id
order by t.team_code, m.slot;

-- Headline numbers
select count(*) as teams,
       (select count(*) from public.team_members) as competitors
from public.teams where status <> 'cancelled';

-- Confirm a whole batch
update public.teams set status = 'confirmed' where status = 'pending';

-- Donations: pledged vs. received
select donation_method, count(*) as teams, sum(donation_pledge) as pledged,
       count(*) filter (where donation_received) as received
from public.teams
where status <> 'cancelled' and donation_pledge > 0
group by donation_method;

-- Teams whose confirmation email has not gone out
select team_code, team_name, contact_email from public.teams
where confirmation_sent_at is null and status <> 'cancelled';
```

The staff portal also exports the same competitor-level view as CSV, honouring
whatever search and status filter is active.
