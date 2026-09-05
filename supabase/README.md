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

It is safe to run again after edits — every statement is idempotent.

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
```

The staff portal also exports the same competitor-level view as CSV, honouring
whatever search and status filter is active.
