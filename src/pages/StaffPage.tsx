import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SeoHead } from '../components/SeoHead';
import { links } from '../lib/config';
import { isSupabaseConfigured, readErrorMessage, supabase } from '../lib/supabase';

type RosterMember = {
  slot: string;
  competitor_id: string;
  full_name: string;
  email: string | null;
  grade: string | null;
};

type RosterRow = {
  id: string;
  team_code: string;
  team_name: string;
  division: string | null;
  school: string | null;
  city: string | null;
  state_region: string | null;
  country: string | null;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  coach_name: string | null;
  coach_email: string | null;
  notes: string | null;
  staff_notes: string | null;
  status: string;
  created_at: string;
  members: RosterMember[];
};

type Settings = {
  registration_open: boolean;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  max_team_size: number;
  announcement: string | null;
};

const STATUSES = ['pending', 'confirmed', 'waitlist', 'cancelled'] as const;

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One row per competitor — the shape check-in sheets and mail merges want. */
function toCsv(rows: RosterRow[]): string {
  const header = [
    'competitor_id',
    'team_code',
    'team_name',
    'slot',
    'full_name',
    'grade',
    'member_email',
    'division',
    'school',
    'city',
    'state_region',
    'country',
    'status',
    'contact_name',
    'contact_email',
    'contact_phone',
    'coach_name',
    'coach_email',
    'notes',
    'staff_notes',
    'registered_at',
  ];

  const lines = rows.flatMap((row) =>
    (row.members.length ? row.members : [null]).map((member) =>
      [
        member?.competitor_id ?? '',
        row.team_code,
        row.team_name,
        member?.slot ?? '',
        member?.full_name ?? '',
        member?.grade ?? '',
        member?.email ?? '',
        row.division,
        row.school,
        row.city,
        row.state_region,
        row.country,
        row.status,
        row.contact_name,
        row.contact_email,
        row.contact_phone,
        row.coach_name,
        row.coach_email,
        row.notes,
        row.staff_notes,
        row.created_at,
      ]
        .map(csvCell)
        .join(','),
    ),
  );

  return [header.join(','), ...lines].join('\n');
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError(readErrorMessage(signInError, 'Sign in failed.'));
      return;
    }
    onSignedIn();
  }

  return (
    <form className="panel staff-signin" onSubmit={onSubmit}>
      <p className="eyebrow">Staff only</p>
      <h2>Sign in</h2>
      <p className="lede">
        Staff accounts are created by an admin in Supabase. If you should have access and do not,
        ask in the organisers channel.
      </p>

      <div className="field">
        <label className="field__label" htmlFor="staff-email">
          Email
        </label>
        <input
          id="staff-email"
          className="input"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="staff-password">
          Password
        </label>
        <input
          id="staff-password"
          className="input"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && (
        <div className="notice notice--warn">
          <div>
            <p className="notice__title">Could not sign in</p>
            <p className="notice__body">{error}</p>
          </div>
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    const [rosterResult, settingsResult] = await Promise.all([
      supabase.from('team_roster').select('*').order('created_at', { ascending: false }),
      supabase
        .from('site_settings')
        .select('registration_open, registration_opens_at, registration_closes_at, max_team_size, announcement')
        .eq('id', 1)
        .maybeSingle(),
    ]);

    if (rosterResult.error) {
      setError(
        readErrorMessage(
          rosterResult.error,
          'Could not load registrations. Your account may not be in the staff list yet.',
        ),
      );
    } else {
      setRows((rosterResult.data ?? []) as RosterRow[]);
    }
    if (settingsResult.data) setSettings(settingsResult.data as Settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!needle) return true;
      const haystack = [
        row.team_code,
        row.team_name,
        row.school,
        row.contact_name,
        row.contact_email,
        row.country,
        ...row.members.map((member) => `${member.competitor_id} ${member.full_name}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, query, statusFilter]);

  const competitorCount = useMemo(
    () =>
      rows
        .filter((row) => row.status !== 'cancelled')
        .reduce((total, row) => total + row.members.length, 0),
    [rows],
  );

  async function updateStatus(id: string, status: string) {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('teams').update({ status }).eq('id', id);
    if (updateError) {
      setError(readErrorMessage(updateError, 'Could not update that team.'));
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
  }

  async function toggleRegistration() {
    if (!supabase || !settings) return;
    const next = !settings.registration_open;
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ registration_open: next, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (updateError) {
      setError(readErrorMessage(updateError, 'Could not change the registration window.'));
      return;
    }
    setSettings({ ...settings, registration_open: next });
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sfmo-2027-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="staff">
      <div className="staff__bar">
        <div>
          <p className="eyebrow">Staff portal</p>
          <h1 className="staff__title">SFMO 2027 registrations</h1>
          <p className="staff__who mono">Signed in as {session.user.email}</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => void load()}>
            Refresh
          </button>
          <button type="button" className="btn btn--deep" onClick={downloadCsv}>
            Export CSV
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void supabase?.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid grid--4 staff__stats">
        <div className="stat">
          <p className="stat__value">{rows.length}</p>
          <p className="stat__label">teams registered</p>
        </div>
        <div className="stat">
          <p className="stat__value">{competitorCount}</p>
          <p className="stat__label">competitors</p>
        </div>
        <div className="stat">
          <p className="stat__value">{rows.filter((row) => row.status === 'confirmed').length}</p>
          <p className="stat__label">confirmed</p>
        </div>
        <div className="stat">
          <p className="stat__value">{rows.filter((row) => row.status === 'pending').length}</p>
          <p className="stat__label">pending review</p>
        </div>
      </div>

      {settings && (
        <div className={`notice ${settings.registration_open ? 'notice--ok' : 'notice--warn'}`}>
          <div>
            <p className="notice__title">
              Registration is {settings.registration_open ? 'OPEN' : 'CLOSED'}
            </p>
            <p className="notice__body">
              {settings.registration_opens_at
                ? `Scheduled to open ${new Date(settings.registration_opens_at).toLocaleString()}. `
                : ''}
              Teams of up to {settings.max_team_size}. The public form respects this switch
              immediately.
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => void toggleRegistration()}>
            {settings.registration_open ? 'Close registration' : 'Open registration'}
          </button>
        </div>
      )}

      {error && (
        <div className="notice notice--warn">
          <div>
            <p className="notice__title">Something went wrong</p>
            <p className="notice__body">{error}</p>
          </div>
        </div>
      )}

      <div className="staff__filters">
        <div className="field">
          <label className="field__label" htmlFor="staff-search">
            Search
          </label>
          <input
            id="staff-search"
            className="input"
            placeholder="Team, competitor ID, school, email…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="staff-status">
            Status
          </label>
          <select
            id="staff-status"
            className="select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>
            {STATUSES.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading pixel">Loading registrations…</p>
      ) : filtered.length === 0 ? (
        <div className="notice notice--info">
          <div>
            <p className="notice__title">Nothing here yet</p>
            <p className="notice__body">
              No teams match this filter. Once registration opens on October 24 they will appear
              here as they come in.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Team</th>
                <th>Competitors</th>
                <th>School</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    className="staff__row"
                  >
                    <td className="mono">{row.team_code}</td>
                    <td>
                      <strong>{row.team_name}</strong>
                    </td>
                    <td className="mono">
                      {row.members.map((member) => member.competitor_id).join(' ')}
                    </td>
                    <td>{row.school ?? '—'}</td>
                    <td>
                      {row.contact_name ?? '—'}
                      <br />
                      <small>{row.contact_email}</small>
                    </td>
                    <td>
                      <select
                        className="select select--inline"
                        value={row.status}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => void updateStatus(row.id, event.target.value)}
                      >
                        {STATUSES.map((status) => (
                          <option value={status} key={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="mono">{new Date(row.created_at).toLocaleDateString()}</td>
                  </tr>
                  {expanded === row.id && (
                    <tr className="staff__detail">
                      <td colSpan={7}>
                        <div className="staff__detail-grid">
                          <div>
                            <h4 className="dive__subhead">Roster</h4>
                            <ul className="id-list">
                              {row.members.map((member) => (
                                <li className="id-list__row" key={member.slot}>
                                  <span className="id-list__id pixel">{member.competitor_id}</span>
                                  <span className="id-list__name">
                                    {member.full_name}
                                    {member.grade ? <small> · Grade {member.grade}</small> : null}
                                    {member.email ? <small> · {member.email}</small> : null}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="dive__subhead">Details</h4>
                            <dl className="facts">
                              <div className="facts__row">
                                <dt>Location</dt>
                                <dd>
                                  {[row.city, row.state_region, row.country]
                                    .filter(Boolean)
                                    .join(', ') || '—'}
                                </dd>
                              </div>
                              <div className="facts__row">
                                <dt>Coach</dt>
                                <dd>{row.coach_name ?? '—'}</dd>
                              </div>
                              <div className="facts__row">
                                <dt>Phone</dt>
                                <dd>{row.contact_phone ?? '—'}</dd>
                              </div>
                              <div className="facts__row">
                                <dt>Notes</dt>
                                <dd>{row.notes ?? '—'}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StaffPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <SeoHead
        title="Staff Portal — SFMO"
        description="Internal registration management for the San Francisco Math Initiative."
        noindex
      />

      <section className="section">
        <div className="wrap">
          {!isSupabaseConfigured ? (
            <div className="panel">
              <p className="eyebrow">Staff portal</p>
              <h1>Backend not connected</h1>
              <p className="lede">
                This build has no Supabase credentials, so there is nothing to sign in to. Set
                VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and redeploy — see DEPLOY.md.
              </p>
              <p className="lede">
                Questions: <a href={`mailto:${links.email}`}>{links.email}</a>
              </p>
            </div>
          ) : !ready ? (
            <p className="loading pixel">Checking session…</p>
          ) : session ? (
            <Dashboard session={session} />
          ) : (
            <SignIn onSignedIn={() => undefined} />
          )}
        </div>
      </section>
    </>
  );
}
