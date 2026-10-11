-- ===========================================================================
-- SFMO — registrations schema
-- ===========================================================================
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is idempotent: safe to re-run after edits.
--
-- Security model, in short:
--   * The public site holds only the ANON key, which is safe to publish.
--   * Anonymous visitors have NO direct table access to teams/team_members.
--     They register through register_team(), a SECURITY DEFINER function that
--     validates input, enforces the open/closed window, and assigns IDs.
--   * Staff are rows in staff_members keyed to Supabase Auth users. Only they
--     can read or edit registrations, enforced by row level security.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Settings (single row, publicly readable)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                    smallint primary key default 1,
  registration_open     boolean not null default false,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  max_team_size         smallint not null default 4,
  announcement          text,
  updated_at            timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into public.site_settings (id, registration_open, registration_opens_at, max_team_size)
values (1, false, '2026-10-24T00:00:00-07:00', 4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------
create sequence if not exists public.team_number_seq as integer start 1;

create table if not exists public.teams (
  id              uuid primary key default gen_random_uuid(),
  team_number     integer not null unique default nextval('public.team_number_seq'),
  -- Zero-padded competition ID: team 7 is "07", whose members are 07A..07D.
  team_code       text generated always as (lpad(team_number::text, 2, '0')) stored unique,
  team_name       text not null,
  division        text,
  school          text,
  city            text,
  state_region    text,
  country         text,
  contact_name    text not null,
  contact_email   text not null,
  contact_phone   text,
  coach_name      text,
  coach_email     text,
  notes           text,
  -- pending → confirmed once we have verified the roster; waitlist / cancelled as needed.
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'waitlist', 'cancelled')),
  agreed_policies boolean not null default false,
  staff_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter sequence public.team_number_seq owned by public.teams.team_number;

-- ...and again as ADD COLUMN IF NOT EXISTS, because CREATE TABLE IF NOT EXISTS
-- skips an existing table entirely: a project created from an older version
-- of this file would otherwise never receive them.
--
-- division: 'in_person' or 'online'. Teams living within 100 miles of the Bay
--   Area must compete in person; distance_attested records the team's
--   statement that no member does, which an online registration requires.
-- media_release_*: the captain's release, given on behalf of the whole team,
--   for event photos to be kept and used on the website and our channels.
alter table public.teams add column if not exists distance_attested boolean not null default false;
alter table public.teams add column if not exists media_release boolean not null default false;
alter table public.teams add column if not exists media_release_signed_by text;
alter table public.teams add column if not exists media_release_signed_at timestamptz;

-- liability_waiver_*: the captain's confirmation that each competitor's
--   parent or guardian (or the competitor, if 18 or older) signed the waiver.
--   The per-competitor signatures live on team_members.
-- donation_*: the optional suggested donation. Pledge is whole dollars; the
--   method is how they plan to give; received is ticked by staff.
-- confirmation_sent_at: set when the confirmation email goes out, so it is
--   sent at most once (cleared again if sending fails, so it can be retried).
alter table public.teams add column if not exists liability_waiver boolean not null default false;
alter table public.teams add column if not exists liability_waiver_signed_by text;
alter table public.teams add column if not exists liability_waiver_signed_at timestamptz;
alter table public.teams add column if not exists donation_pledge integer
  check (donation_pledge is null or donation_pledge between 0 and 99999);
alter table public.teams add column if not exists donation_method text
  check (donation_method is null or donation_method in ('zelle', 'online', 'checkin'));
alter table public.teams add column if not exists donation_received boolean not null default false;
alter table public.teams add column if not exists confirmation_sent_at timestamptz;

create index if not exists teams_contact_email_idx on public.teams (lower(contact_email));
create index if not exists teams_status_idx on public.teams (status);
create index if not exists teams_created_at_idx on public.teams (created_at desc);

-- ---------------------------------------------------------------------------
-- Team members
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams (id) on delete cascade,
  slot          char(1) not null check (slot in ('A', 'B', 'C', 'D')),
  -- Denormalised "07A" so staff exports and check-in sheets need no join.
  competitor_id text,
  full_name     text not null,
  email         text,
  grade         text,
  school        text,
  created_at    timestamptz not null default now(),
  unique (team_id, slot)
);

create index if not exists team_members_team_id_idx on public.team_members (team_id);
create unique index if not exists team_members_competitor_id_idx
  on public.team_members (competitor_id);

-- The parent or guardian who signed this competitor's liability waiver (the
-- competitor's own name if 18 or older), and an address to confirm it to.
alter table public.team_members add column if not exists guardian_name text;
alter table public.team_members add column if not exists guardian_email text;

-- Keep competitor_id in sync with the parent team's code, however the row
-- was created (registration RPC, staff edit, or manual SQL).
create or replace function public.sync_competitor_id()
returns trigger
language plpgsql
as $$
begin
  select t.team_code || new.slot into new.competitor_id
  from public.teams t
  where t.id = new.team_id;
  return new;
end;
$$;

drop trigger if exists team_members_sync_competitor_id on public.team_members;
create trigger team_members_sync_competitor_id
  before insert or update of team_id, slot on public.team_members
  for each row execute function public.sync_competitor_id();

-- updated_at bookkeeping
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teams_touch_updated_at on public.teams;
create trigger teams_touch_updated_at
  before update on public.teams
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Staff directory
-- ---------------------------------------------------------------------------
create table if not exists public.staff_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so policies on staff_members itself do not recurse.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.staff_members s where s.user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = auth.uid() and s.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.staff_members enable row level security;

drop policy if exists "settings readable by everyone" on public.site_settings;
create policy "settings readable by everyone"
  on public.site_settings for select
  using (true);

drop policy if exists "settings writable by staff" on public.site_settings;
create policy "settings writable by staff"
  on public.site_settings for update
  to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Teams and members: staff only. The public never touches these directly;
-- registration goes through register_team(), which runs as the owner.
drop policy if exists "teams staff read" on public.teams;
create policy "teams staff read"
  on public.teams for select to authenticated using (public.is_staff());

drop policy if exists "teams staff write" on public.teams;
create policy "teams staff write"
  on public.teams for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "teams staff insert" on public.teams;
create policy "teams staff insert"
  on public.teams for insert to authenticated with check (public.is_staff());

drop policy if exists "teams admin delete" on public.teams;
create policy "teams admin delete"
  on public.teams for delete to authenticated using (public.is_admin());

drop policy if exists "members staff read" on public.team_members;
create policy "members staff read"
  on public.team_members for select to authenticated using (public.is_staff());

drop policy if exists "members staff write" on public.team_members;
create policy "members staff write"
  on public.team_members for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "members staff insert" on public.team_members;
create policy "members staff insert"
  on public.team_members for insert to authenticated with check (public.is_staff());

drop policy if exists "members staff delete" on public.team_members;
create policy "members staff delete"
  on public.team_members for delete to authenticated using (public.is_staff());

drop policy if exists "staff read directory" on public.staff_members;
create policy "staff read directory"
  on public.staff_members for select to authenticated using (public.is_staff());

drop policy if exists "admins manage directory" on public.staff_members;
create policy "admins manage directory"
  on public.staff_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public registration entry point
-- ---------------------------------------------------------------------------
-- Input shape:
--   {
--     "team_name": "Kelp Forest", "division": "Open", "school": "...",
--     "city": "...", "state_region": "...", "country": "...",
--     "contact_name": "...", "contact_email": "...", "contact_phone": "...",
--     "coach_name": "...", "coach_email": "...", "notes": "...",
--     "division": "in_person" | "online", "distance_attested": true,
--     "media_release": true, "media_release_signed_by": "<captain's full name>",
--     "liability_waiver": true,
--     "donation_pledge": 20, "donation_method": "zelle" | "online" | "checkin",
--     "agreed_policies": true,
--     "members": [ { "full_name": "...", "email": "...", "grade": "9", "school": "...",
--                    "guardian_name": "...", "guardian_email": "..." } ]
--   }
--
-- Returns { team_code, team_name, status, members: [{ slot, competitor_id, full_name }] }
create or replace function public.register_team(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  settings      public.site_settings;
  new_team      public.teams;
  member        jsonb;
  members       jsonb := coalesce(payload -> 'members', '[]'::jsonb);
  member_count  integer := jsonb_array_length(members);
  slot_letters  constant char(1)[] := array['A', 'B', 'C', 'D'];
  idx           integer := 0;
  contact       text := btrim(coalesce(payload ->> 'contact_email', ''));
  team_name     text := btrim(coalesce(payload ->> 'team_name', ''));
  division      text := btrim(coalesce(payload ->> 'division', ''));
  signer        text := btrim(coalesce(payload ->> 'media_release_signed_by', ''));
  pledge_text   text := btrim(coalesce(payload ->> 'donation_pledge', ''));
  pledge        integer;
  method        text := nullif(btrim(coalesce(payload ->> 'donation_method', '')), '');
  existing      integer;
begin
  select * into settings from public.site_settings where id = 1;

  if settings is null or not settings.registration_open then
    raise exception 'Registration is not open yet.' using errcode = 'P0001';
  end if;

  if settings.registration_opens_at is not null and now() < settings.registration_opens_at then
    raise exception 'Registration is not open yet.' using errcode = 'P0001';
  end if;

  if settings.registration_closes_at is not null and now() > settings.registration_closes_at then
    raise exception 'Registration has closed.' using errcode = 'P0001';
  end if;

  if team_name = '' then
    raise exception 'A team name is required.' using errcode = 'P0001';
  end if;

  if contact !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid contact email is required.' using errcode = 'P0001';
  end if;

  if member_count < 1 or member_count > settings.max_team_size then
    raise exception 'A team needs between 1 and % members.', settings.max_team_size
      using errcode = 'P0001';
  end if;

  if division not in ('in_person', 'online') then
    raise exception 'Choose the in-person or the online division.' using errcode = 'P0001';
  end if;

  -- The distance rule: anyone within 100 miles of the Bay Area competes in
  -- person, so an online team must state that none of its members does.
  if division = 'online'
     and coalesce((payload ->> 'distance_attested')::boolean, false) is not true then
    raise exception 'Online registration requires confirming that no member of your team lives within 100 miles of the Bay Area.'
      using errcode = 'P0001';
  end if;

  if coalesce((payload ->> 'media_release')::boolean, false) is not true then
    raise exception 'The team captain must agree to the media release.' using errcode = 'P0001';
  end if;

  -- The release is signed by the captain, who must be on the roster. Names are
  -- compared case- and whitespace-insensitively so "jane  doe" matches "Jane Doe".
  if signer = '' or not exists (
    select 1 from jsonb_array_elements(members) m
    where lower(regexp_replace(btrim(m ->> 'full_name'), '\s+', ' ', 'g'))
        = lower(regexp_replace(signer, '\s+', ' ', 'g'))
  ) then
    raise exception 'The media release must be signed by one of the competitors on your team, exactly as their name is entered.'
      using errcode = 'P0001';
  end if;

  -- Liability waiver: a parent or guardian signs for each competitor (the
  -- competitor themselves if 18 or older), then the captain confirms it for
  -- the team. Checked before anything is written.
  if exists (
    select 1 from jsonb_array_elements(members) m
    where btrim(coalesce(m ->> 'guardian_name', '')) = ''
       or btrim(coalesce(m ->> 'guardian_email', '')) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ) then
    raise exception 'Every competitor needs a parent or guardian''s name and email for the liability waiver.'
      using errcode = 'P0001';
  end if;

  if coalesce((payload ->> 'liability_waiver')::boolean, false) is not true then
    raise exception 'The team captain must confirm the liability waiver.' using errcode = 'P0001';
  end if;

  -- Suggested donation: optional, so blank means none. Whole dollars only.
  if pledge_text <> '' then
    if pledge_text !~ '^[0-9]{1,5}$' then
      raise exception 'The donation amount must be a whole number of dollars.' using errcode = 'P0001';
    end if;
    pledge := pledge_text::integer;
  end if;

  if coalesce(pledge, 0) = 0 then
    method := null;
  elsif method is null or method not in ('zelle', 'online', 'checkin') then
    raise exception 'Choose how you plan to give: Zelle, online, or at check-in.' using errcode = 'P0001';
  elsif method = 'checkin' and division = 'online' then
    raise exception 'Online teams have no check-in, so please give by Zelle or online instead.'
      using errcode = 'P0001';
  end if;

  if coalesce((payload ->> 'agreed_policies')::boolean, false) is not true then
    raise exception 'You must agree to the competition policies.' using errcode = 'P0001';
  end if;

  -- Light abuse guard: one contact address may not spam registrations.
  select count(*) into existing
  from public.teams
  where lower(contact_email) = lower(contact) and status <> 'cancelled';

  if existing >= 5 then
    raise exception 'This email has already registered the maximum number of teams. Email us instead.'
      using errcode = 'P0001';
  end if;

  insert into public.teams (
    team_name, division, school, city, state_region, country,
    contact_name, contact_email, contact_phone,
    coach_name, coach_email, notes, agreed_policies,
    distance_attested, media_release, media_release_signed_by, media_release_signed_at,
    liability_waiver, liability_waiver_signed_by, liability_waiver_signed_at,
    donation_pledge, donation_method
  )
  values (
    team_name,
    division,
    nullif(btrim(coalesce(payload ->> 'school', '')), ''),
    nullif(btrim(coalesce(payload ->> 'city', '')), ''),
    nullif(btrim(coalesce(payload ->> 'state_region', '')), ''),
    nullif(btrim(coalesce(payload ->> 'country', '')), ''),
    nullif(btrim(coalesce(payload ->> 'contact_name', '')), ''),
    contact,
    nullif(btrim(coalesce(payload ->> 'contact_phone', '')), ''),
    nullif(btrim(coalesce(payload ->> 'coach_name', '')), ''),
    nullif(btrim(coalesce(payload ->> 'coach_email', '')), ''),
    nullif(btrim(coalesce(payload ->> 'notes', '')), ''),
    true,
    division = 'online',
    true,
    signer,
    now(),
    true,
    signer,
    now(),
    pledge,
    method
  )
  returning * into new_team;

  for member in select * from jsonb_array_elements(members)
  loop
    idx := idx + 1;
    if btrim(coalesce(member ->> 'full_name', '')) = '' then
      raise exception 'Every team member needs a name.' using errcode = 'P0001';
    end if;

    insert into public.team_members
      (team_id, slot, full_name, email, grade, school, guardian_name, guardian_email)
    values (
      new_team.id,
      slot_letters[idx],
      btrim(member ->> 'full_name'),
      nullif(btrim(coalesce(member ->> 'email', '')), ''),
      nullif(btrim(coalesce(member ->> 'grade', '')), ''),
      nullif(btrim(coalesce(member ->> 'school', '')), ''),
      btrim(member ->> 'guardian_name'),
      btrim(member ->> 'guardian_email')
    );
  end loop;

  return public.team_receipt(new_team.id);
end;
$$;

-- Shared shape for "here is your team and everyone's competitor ID".
create or replace function public.team_receipt(p_team_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'team_code', t.team_code,
    'team_name', t.team_name,
    'division', t.division,
    'status', t.status,
    'contact_email', t.contact_email,
    'created_at', t.created_at,
    'donation_pledge', t.donation_pledge,
    'donation_method', t.donation_method,
    'members', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'slot', m.slot,
            'competitor_id', m.competitor_id,
            'full_name', m.full_name,
            'grade', m.grade
          ) order by m.slot
        )
        from public.team_members m
        where m.team_id = t.id
      ),
      '[]'::jsonb
    )
  )
  from public.teams t
  where t.id = p_team_id;
$$;

-- Lets a team pull their IDs back up later without an account.
create or replace function public.lookup_team(p_team_code text, p_contact_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  found_id uuid;
begin
  select id into found_id
  from public.teams
  where team_code = lpad(btrim(p_team_code), 2, '0')
    and lower(contact_email) = lower(btrim(p_contact_email))
    and status <> 'cancelled';

  if found_id is null then
    raise exception 'No team found for that team ID and email.' using errcode = 'P0001';
  end if;

  return public.team_receipt(found_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.team_receipt(uuid) from public, anon, authenticated;
grant execute on function public.register_team(jsonb) to anon, authenticated;
grant execute on function public.lookup_team(text, text) to anon, authenticated;

-- Called only by the send-confirmation Edge Function, with the service role.
-- Atomically claims a team's one confirmation email: returns everything the
-- email needs and stamps confirmation_sent_at, or returns null if the team is
-- unknown, the email does not match, or a confirmation already went out.
-- Requiring team code + contact email (the same pair lookup_team uses) means
-- a caller can only ever trigger an email to a team's own registered contact.
create or replace function public.claim_confirmation(p_team_code text, p_contact_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed public.teams;
begin
  update public.teams
  set confirmation_sent_at = now()
  where team_code = lpad(btrim(p_team_code), 2, '0')
    and lower(contact_email) = lower(btrim(p_contact_email))
    and status <> 'cancelled'
    and confirmation_sent_at is null
  returning * into claimed;

  if claimed.id is null then
    return null;
  end if;

  return public.team_receipt(claimed.id) || jsonb_build_object(
    'contact_name', claimed.contact_name,
    'coach_email', claimed.coach_email,
    'guardians', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'competitor_id', m.competitor_id,
            'competitor_name', m.full_name,
            'guardian_name', m.guardian_name,
            'guardian_email', m.guardian_email
          ) order by m.slot
        )
        from public.team_members m
        where m.team_id = claimed.id and m.guardian_email is not null
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.claim_confirmation(text, text) from public, anon, authenticated;
grant execute on function public.claim_confirmation(text, text) to service_role;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Staff dashboard convenience view: one row per team with a member summary.
create or replace view public.team_roster
with (security_invoker = on) as
select
  t.id,
  t.team_code,
  t.team_name,
  t.division,
  t.school,
  t.city,
  t.state_region,
  t.country,
  t.contact_name,
  t.contact_email,
  t.contact_phone,
  t.coach_name,
  t.coach_email,
  t.notes,
  t.staff_notes,
  t.status,
  t.created_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'slot', m.slot,
          'competitor_id', m.competitor_id,
          'full_name', m.full_name,
          'email', m.email,
          'grade', m.grade,
          'guardian_name', m.guardian_name,
          'guardian_email', m.guardian_email
        ) order by m.slot
      )
      from public.team_members m
      where m.team_id = t.id
    ),
    '[]'::jsonb
  ) as members,
  t.distance_attested,
  t.media_release,
  t.media_release_signed_by,
  t.media_release_signed_at,
  t.liability_waiver,
  t.liability_waiver_signed_by,
  t.liability_waiver_signed_at,
  t.donation_pledge,
  t.donation_method,
  t.donation_received,
  t.confirmation_sent_at
from public.teams t;
