import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { PixelIcon } from '../components/PixelIcon';
import { SeoHead } from '../components/SeoHead';
import { DIVISIONS, links, type Division } from '../lib/config';
import { sendConfirmation, sendTestEmail, type DonationMethod } from '../lib/registration';
import { isSupabaseConfigured, readErrorMessage, supabase } from '../lib/supabase';
import {
  downloadWaiverPdf,
  resendWaiverLink,
  sendMergeNotice,
  waiverSigningLink,
} from '../lib/waiver';

type RosterMember = {
  slot: string;
  competitor_id: string;
  full_name: string;
  email: string | null;
  grade: string | null;
  guardian_name: string | null;
  guardian_email: string | null;
  /** Absent until supabase/schema.sql has been re-run with waiver signing. */
  waiver_token?: string;
  waiver_signed_name?: string | null;
  waiver_signed_at?: string | null;
  waiver_signer_role?: 'guardian' | 'self' | null;
  /** The team this competitor registered with, if staff moved them since. */
  original_team_code?: string | null;
};

type RosterRow = {
  id: string;
  team_code: string;
  team_name: string;
  division: Division | null;
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
  distance_attested: boolean;
  media_release: boolean;
  media_release_signed_by: string | null;
  media_release_signed_at: string | null;
  liability_waiver: boolean;
  liability_waiver_signed_by: string | null;
  liability_waiver_signed_at: string | null;
  donation_pledge: number | null;
  donation_method: DonationMethod | null;
  donation_received: boolean;
  confirmation_sent_at: string | null;
  open_to_merge?: boolean;
  /** Set on a team staff combined into another (it is then cancelled). */
  merged_into_code?: string | null;
};

/** A team's own size limit, whatever the settings say: answer sheets have four slots. */
const SLOT_CAP = 4;

const isLive = (row: RosterRow) => row.status !== 'cancelled';

function waiverCounts(row: RosterRow) {
  const signed = row.members.filter((member) => member.waiver_signed_at).length;
  return { signed, total: row.members.length };
}

function signedLabel(member: RosterMember) {
  if (!member.waiver_signed_at) return '';
  const who = member.waiver_signer_role === 'self' ? 'the competitor (18+)' : 'parent or guardian';
  return `Signed by ${member.waiver_signed_name ?? '—'} (${who}), ${new Date(member.waiver_signed_at).toLocaleString()}`;
}

const METHOD_LABEL: Record<DonationMethod, string> = {
  zelle: 'Zelle',
  online: 'Online',
  checkin: 'At check-in',
};

function pledgeLabel(row: RosterRow) {
  if (!row.donation_pledge) return '—';
  return `$${row.donation_pledge}${row.donation_method ? ` · ${METHOD_LABEL[row.donation_method]}` : ''}`;
}

/** Registrants control names, so escape them before writing raw HTML. */
function escapeHtml(text: unknown) {
  return String(text ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

function divisionLabel(division: Division | null) {
  return division ? DIVISIONS[division].label : '—';
}

type Settings = {
  registration_open: boolean;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  max_team_size: number;
  announcement: string | null;
};

const STATUSES = ['pending', 'confirmed', 'waitlist', 'cancelled'] as const;

type NeedsFilter = 'all' | 'waivers' | 'merge';

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
    'guardian_name',
    'guardian_email',
    'division',
    'distance_attested',
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
    'waiver_signed',
    'waiver_signed_by',
    'waiver_signer_role',
    'waiver_signed_at',
    'media_release_signed_by',
    'media_release_signed_at',
    'captain_waiver_ack_by',
    'captain_waiver_ack_at',
    'open_to_merge',
    'original_team_code',
    'merged_into',
    'donation_pledge',
    'donation_method',
    'donation_received',
    'confirmation_sent_at',
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
        member?.guardian_name ?? '',
        member?.guardian_email ?? '',
        divisionLabel(row.division),
        row.distance_attested ? 'yes' : '',
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
        member ? (member.waiver_signed_at ? 'yes' : 'no') : '',
        member?.waiver_signed_name ?? '',
        member?.waiver_signer_role ?? '',
        member?.waiver_signed_at ?? '',
        row.media_release_signed_by,
        row.media_release_signed_at,
        row.liability_waiver ? row.liability_waiver_signed_by : '',
        row.liability_waiver_signed_at,
        row.open_to_merge ? 'yes' : '',
        member?.original_team_code ?? '',
        row.merged_into_code ?? '',
        row.donation_pledge,
        row.donation_method ? METHOD_LABEL[row.donation_method] : '',
        row.donation_received ? 'yes' : '',
        row.confirmation_sent_at,
        row.created_at,
      ]
        .map(csvCell)
        .join(','),
    ),
  );

  return [header.join(','), ...lines].join('\n');
}

/** Unique, order-preserving, blank-free. */
function uniq(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) seen.add(trimmed.toLowerCase());
  }
  return [...seen];
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

/** Pick a team in the same division with room, and move this team's competitors into it. */
function MergeBox({
  row,
  rows,
  target,
  onTarget,
  busy,
  onMerge,
}: {
  row: RosterRow;
  rows: RosterRow[];
  target: string;
  onTarget: (id: string) => void;
  busy: boolean;
  onMerge: (into: RosterRow) => void;
}) {
  const candidates = rows
    .filter(
      (other) =>
        other.id !== row.id &&
        isLive(other) &&
        other.division === row.division &&
        other.members.length + row.members.length <= SLOT_CAP,
    )
    .sort(
      (a, b) =>
        Number(Boolean(b.open_to_merge)) - Number(Boolean(a.open_to_merge)) ||
        a.members.length - b.members.length ||
        a.team_code.localeCompare(b.team_code),
    );
  const chosen = candidates.find((other) => other.id === target);
  const id = `merge-${row.id}`;
  return (
    <div className="staff__merge">
      <h4 className="dive__subhead">
        <PixelIcon name="people" size={22} /> Combine with another team
      </h4>
      {candidates.length === 0 ? (
        <p className="field__hint">
          No other {divisionLabel(row.division).toLowerCase()} team has room for{' '}
          {row.members.length} more.
        </p>
      ) : (
        <>
          <label className="field__label" htmlFor={id}>
            Move {row.members.length === 1 ? 'this competitor' : `these ${row.members.length} competitors`} into
          </label>
          <div className="staff__merge-row">
            <select
              id={id}
              className="select"
              value={chosen ? target : ''}
              onChange={(event) => onTarget(event.target.value)}
            >
              <option value="">Choose a team…</option>
              {candidates.map((other) => (
                <option value={other.id} key={other.id}>
                  {other.team_code} · {other.team_name} ({other.members.length}/{SLOT_CAP}
                  {other.open_to_merge ? ', open to combining' : ''})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--deep btn--sm"
              disabled={!chosen || busy}
              onClick={() => chosen && onMerge(chosen)}
            >
              {busy ? 'Combining…' : 'Combine'}
            </button>
          </div>
          <p className="field__hint">
            Team {row.team_code} is then cancelled and its competitors get new IDs on the chosen
            team. Both teams&apos; contacts are emailed. Teams that asked to be combined are listed
            first.
          </p>
        </>
      )}
    </div>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState<'all' | Division>('all');
  const [needsFilter, setNeedsFilter] = useState<NeedsFilter>('all');
  /** Key of the waiver action in flight, e.g. "pdf:07A". */
  const [waiverBusy, setWaiverBusy] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');
  const [merging, setMerging] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState<{ busy: boolean; sent?: boolean; message?: string }>({
    busy: false,
  });

  async function runTestEmail() {
    setTestEmail({ busy: true });
    setTestEmail({ busy: false, ...(await sendTestEmail()) });
  }

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
      if (divisionFilter !== 'all' && row.division !== divisionFilter) return false;
      if (needsFilter === 'waivers' && !(isLive(row) && waiverCounts(row).signed < row.members.length)) {
        return false;
      }
      if (needsFilter === 'merge' && !(isLive(row) && row.open_to_merge && row.members.length < SLOT_CAP)) {
        return false;
      }
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
  }, [rows, query, statusFilter, divisionFilter, needsFilter]);

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

  /** Ticks at once (it is used at a busy check-in desk) and rolls back on failure. */
  async function setReceived(id: string, received: boolean) {
    if (!supabase) return;
    const mark = (value: boolean) =>
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, donation_received: value } : row)),
      );
    mark(received);
    const { error: updateError } = await supabase
      .from('teams')
      .update({ donation_received: received })
      .eq('id', id);
    if (updateError) {
      mark(!received);
      setError(readErrorMessage(updateError, 'Could not update that donation.'));
    }
  }

  /**
   * The Edge Function only ever sends a team's confirmation once, so a resend
   * first clears the stamp, then asks for it again.
   */
  async function resendConfirmation(row: RosterRow) {
    if (!supabase) return;
    if (
      row.confirmation_sent_at &&
      !window.confirm(`Send Team ${row.team_code}'s confirmation emails again?`)
    ) {
      return;
    }
    setSending(row.id);
    const { error: clearError } = await supabase
      .from('teams')
      .update({ confirmation_sent_at: null })
      .eq('id', row.id);
    const sent = !clearError && (await sendConfirmation(row.team_code, row.contact_email));
    setSending(null);
    if (!sent) {
      setError(
        'Could not send that confirmation. Check the send-confirmation function and its secrets in Supabase (see supabase/README.md).',
      );
      void load();
      return;
    }
    setCopied(`Confirmation sent to Team ${row.team_code}`);
    window.setTimeout(() => setCopied(null), 2500);
    void load();
  }

  function flash(message: string) {
    setCopied(message);
    window.setTimeout(() => setCopied(null), 3500);
  }

  async function waiverPdf(member: RosterMember) {
    if (!member.waiver_token) return;
    setWaiverBusy(`pdf:${member.competitor_id}`);
    try {
      await downloadWaiverPdf(member.waiver_token, member.competitor_id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not download that waiver.');
    } finally {
      setWaiverBusy(null);
    }
  }

  async function resendWaiver(member: RosterMember) {
    if (!member.waiver_token) return;
    if (!window.confirm(`Email ${member.guardian_email ?? 'the parent or guardian'} the waiver link for ${member.full_name} again?`)) {
      return;
    }
    setWaiverBusy(`mail:${member.competitor_id}`);
    const result = await resendWaiverLink(member.waiver_token);
    setWaiverBusy(null);
    if (result.sent) flash(result.message);
    else setError(`Could not resend the waiver link: ${result.message}`);
  }

  /**
   * Combines a small team into another. The database moves the competitors
   * to free letters on the target and cancels the source; then both teams'
   * contacts (and coaches) are emailed the new IDs.
   */
  async function mergeInto(from: RosterRow, into: RosterRow) {
    if (!supabase) return;
    const taken = new Set(into.members.map((member) => member.slot));
    const free = ['A', 'B', 'C', 'D'].filter((letter) => !taken.has(letter));
    const moves = from.members
      .slice()
      .sort((a, b) => a.slot.localeCompare(b.slot))
      .map((member, index) => `  ${member.competitor_id} ${member.full_name} → ${into.team_code}${free[index]}`)
      .join('\n');
    if (
      !window.confirm(
        `Combine team ${from.team_code} (${from.team_name}) into team ${into.team_code} (${into.team_name})?\n\n${moves}\n\nTeam ${from.team_code} will be marked cancelled and "combined into ${into.team_code}". Signed waivers move with each competitor. Both teams' contacts will be emailed the new IDs.`,
      )
    ) {
      return;
    }
    setMerging(true);
    const { error: mergeError } = await supabase.rpc('merge_teams', { p_from: from.id, p_into: into.id });
    if (mergeError) {
      setMerging(false);
      setError(readErrorMessage(mergeError, 'Could not combine those teams.'));
      return;
    }
    const notice = await sendMergeNotice(from.team_code);
    setMerging(false);
    setMergeTarget('');
    setExpanded(into.id);
    if (notice.sent) flash(`Combined ${from.team_code} into ${into.team_code}. ${notice.message}`);
    else setError(`Combined ${from.team_code} into ${into.team_code}, but the emails failed: ${notice.message} Email both teams the new IDs yourself.`);
    void load();
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

  /**
   * Clipboard writes need a user gesture and can still be refused (permissions,
   * insecure context), so fall back to a prompt the user can copy out of by
   * hand rather than silently doing nothing.
   */
  async function copy(label: string, values: string[]) {
    const text = values.join(', ');
    if (!text) {
      setCopied(`No ${label.toLowerCase()} to copy`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`Copied ${values.length} ${label.toLowerCase()}`);
    } catch {
      window.prompt(`Copy ${label} (${values.length}):`, text);
      setCopied(null);
      return;
    }
    window.setTimeout(() => setCopied(null), 2500);
  }

  const competitorEmails = useMemo(
    () => uniq(filtered.flatMap((row) => row.members.map((member) => member.email))),
    [filtered],
  );
  const contactEmails = useMemo(
    () => uniq(filtered.flatMap((row) => [row.contact_email, row.coach_email])),
    [filtered],
  );
  const guardianEmails = useMemo(
    () => uniq(filtered.flatMap((row) => row.members.map((member) => member.guardian_email))),
    [filtered],
  );
  const unsignedGuardianEmails = useMemo(
    () =>
      uniq(
        filtered
          .filter(isLive)
          .flatMap((row) =>
            row.members.filter((member) => !member.waiver_signed_at).map((member) => member.guardian_email),
          ),
      ),
    [filtered],
  );

  const waiverTotals = useMemo(() => {
    const live = rows.filter(isLive);
    return {
      signed: live.reduce((sum, row) => sum + waiverCounts(row).signed, 0),
      total: live.reduce((sum, row) => sum + row.members.length, 0),
      openToMerge: live.filter((row) => row.open_to_merge && row.members.length < SLOT_CAP).length,
    };
  }, [rows]);

  /** Live (non-cancelled) teams and competitors per division, for the tabs. */
  const divisionCounts = useMemo(() => {
    const live = rows.filter((row) => row.status !== 'cancelled');
    const count = (match: (row: RosterRow) => boolean) => {
      const teams = live.filter(match);
      return {
        teams: teams.length,
        competitors: teams.reduce((total, row) => total + row.members.length, 0),
      };
    };
    return {
      all: count(() => true),
      in_person: count((row) => row.division === 'in_person'),
      online: count((row) => row.division === 'online'),
    };
  }, [rows]);

  const giving = useMemo(() => {
    const live = rows.filter((row) => row.status !== 'cancelled');
    const pledged = live.filter((row) => (row.donation_pledge ?? 0) > 0);
    return {
      teams: pledged.length,
      pledged: pledged.reduce((sum, row) => sum + (row.donation_pledge ?? 0), 0),
      received: live.filter((row) => row.donation_received).length,
    };
  }, [rows]);

  /** Bulk-set status on everything currently in view. */
  async function setAllStatus(status: string) {
    if (!supabase || filtered.length === 0) return;
    if (!window.confirm(`Set ${filtered.length} team(s) to "${status}"? This affects only the teams currently shown.`)) {
      return;
    }
    const ids = filtered.map((row) => row.id);
    const { error: bulkError } = await supabase.from('teams').update({ status }).in('id', ids);
    if (bulkError) {
      setError(readErrorMessage(bulkError, 'Bulk update failed.'));
      return;
    }
    setRows((current) => current.map((row) => (ids.includes(row.id) ? { ...row, status } : row)));
  }

  /** A printable check-in sheet: one line per competitor, ID first. */
  function printCheckIn() {
    const lines = filtered
      .filter(isLive)
      .flatMap((row) =>
        row.members.map(
          (member) =>
            `<tr><td class="id">${escapeHtml(member.competitor_id)}</td><td>${escapeHtml(member.full_name)}</td><td>${escapeHtml(row.team_name)}</td><td>${escapeHtml(member.grade)}</td><td class="${member.waiver_signed_at ? 'ok' : 'missing'}">${member.waiver_signed_at ? 'Signed' : 'MISSING'}</td><td class="box"></td></tr>`,
        ),
      )
      .join('');
    const win = window.open('', '_blank');
    if (!win) {
      setCopied('Pop-up blocked — allow pop-ups to print');
      return;
    }
    win.document.write(
      `<!doctype html><title>SFMO 2027 check-in</title><style>
        body{font:13px/1.4 system-ui,sans-serif;margin:28px}
        h1{font-size:17px;margin:0 0 14px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #333;padding:5px 7px;text-align:left}
        th{background:#f0c000}
        .id{font-family:ui-monospace,monospace;font-weight:700}
        .box{width:70px}
        .missing{font-weight:700;color:#b3261e}
        .ok{color:#2e6b2a}
      </style><h1>SFMO 2027 — check-in (${filtered.filter(isLive).length} teams)</h1>
      <table><thead><tr><th>ID</th><th>Name</th><th>Team</th><th>Grade</th><th>Waiver</th><th>Signed in</th></tr></thead>
      <tbody>${lines}</tbody></table>`,
    );
    win.document.close();
    win.print();
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
      <p className="staff__giving mono">
        Donations: ${giving.pledged} pledged by {giving.teams} team{giving.teams === 1 ? '' : 's'} ·{' '}
        {giving.received} marked received
      </p>
      <p className="staff__giving mono">
        Waivers: {waiverTotals.signed} of {waiverTotals.total} competitors signed ·{' '}
        {waiverTotals.openToMerge} small team{waiverTotals.openToMerge === 1 ? '' : 's'} open to
        combining
      </p>

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

      <div className="staff__tools">
        <p className="staff__tools-label label">
          Acting on {filtered.length} team{filtered.length === 1 ? '' : 's'} in view
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => void copy('competitor emails', competitorEmails)}>
            Copy competitor emails ({competitorEmails.length})
          </button>
          <button type="button" className="btn" onClick={() => void copy('contact emails', contactEmails)}>
            Copy contact emails ({contactEmails.length})
          </button>
          <button type="button" className="btn" onClick={() => void copy('guardian emails', guardianEmails)}>
            Copy guardian emails ({guardianEmails.length})
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void copy('emails of guardians yet to sign', unsignedGuardianEmails)}
            title="Parents and guardians who still have a waiver to sign, for a reminder"
          >
            Copy unsigned-waiver emails ({unsignedGuardianEmails.length})
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              void copy(
                'competitor IDs',
                filtered.flatMap((row) => row.members.map((member) => member.competitor_id)),
              )
            }
          >
            Copy competitor IDs
          </button>
          <button type="button" className="btn" onClick={printCheckIn}>
            Print check-in sheet
          </button>
          <button type="button" className="btn btn--kelp" onClick={() => void setAllStatus('confirmed')}>
            Confirm all in view
          </button>
          <button
            type="button"
            className="btn"
            disabled={testEmail.busy}
            onClick={() => void runTestEmail()}
            title="Sends sample copies of both confirmation emails to you only"
          >
            {testEmail.busy ? 'Sending…' : 'Send me a test email'}
          </button>
        </div>
        {copied && <p className="staff__copied mono">{copied}</p>}
        {testEmail.message && (
          <p
            className={`staff__copied mono ${testEmail.sent ? '' : 'staff__copied--warn'}`}
            role="status"
          >
            {testEmail.sent ? '✓ ' : 'Test email failed: '}
            {testEmail.message}
          </p>
        )}
      </div>

      <div className="division-tabs" role="group" aria-label="Show division">
        {(['all', 'in_person', 'online'] as const).map((key) => {
          const counts = divisionCounts[key];
          return (
            <button
              type="button"
              key={key}
              className={`division-tab ${divisionFilter === key ? 'division-tab--on' : ''}`}
              aria-pressed={divisionFilter === key}
              onClick={() => setDivisionFilter(key)}
            >
              {key === 'all' ? (
                <PixelIcon name="people" size={32} />
              ) : (
                <PixelIcon name={key === 'in_person' ? 'sub' : 'laptop'} size={32} />
              )}
              <span className="division-tab__text">
                <span className="division-tab__label">
                  {key === 'all' ? 'All teams' : DIVISIONS[key].label}
                </span>
                <span className="division-tab__count mono">
                  {counts.teams} team{counts.teams === 1 ? '' : 's'} · {counts.competitors}{' '}
                  competitor{counts.competitors === 1 ? '' : 's'}
                </span>
              </span>
            </button>
          );
        })}
      </div>

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
        <div className="field">
          <label className="field__label" htmlFor="staff-needs">
            Needs attention
          </label>
          <select
            id="staff-needs"
            className="select"
            value={needsFilter}
            onChange={(event) => setNeedsFilter(event.target.value as NeedsFilter)}
          >
            <option value="all">Everything</option>
            <option value="waivers">Waivers still to sign</option>
            <option value="merge">Small teams open to combining</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading label">Loading registrations…</p>
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
                <th>Division</th>
                <th>Competitors</th>
                <th>Waivers</th>
                <th>School</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Donation</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => {
                      setExpanded(expanded === row.id ? null : row.id);
                      setMergeTarget('');
                    }}
                    className="staff__row"
                  >
                    <td className="mono">{row.team_code}</td>
                    <td>
                      <strong>{row.team_name}</strong>
                      {row.merged_into_code && (
                        <span className="badge badge--muted staff__tag">→ team {row.merged_into_code}</span>
                      )}
                      {isLive(row) && row.open_to_merge && row.members.length < SLOT_CAP && (
                        <span className="badge staff__tag">open to combine</span>
                      )}
                    </td>
                    <td>{divisionLabel(row.division)}</td>
                    <td className="mono">
                      {row.members.map((member) => member.competitor_id).join(' ') || '—'}
                    </td>
                    <td>
                      {row.members.length === 0 ? (
                        '—'
                      ) : (
                        <span
                          className={`badge ${waiverCounts(row).signed === row.members.length ? 'badge--kelp' : 'badge--sub'}`}
                        >
                          {waiverCounts(row).signed}/{row.members.length}
                        </span>
                      )}
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
                    <td>
                      <span className="staff__pledge">{pledgeLabel(row)}</span>
                      <label className="checkbox staff__received" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={row.donation_received}
                          onChange={(event) => void setReceived(row.id, event.target.checked)}
                        />
                        <span>Received</span>
                      </label>
                    </td>
                    <td className="mono">{new Date(row.created_at).toLocaleDateString()}</td>
                  </tr>
                  {expanded === row.id && (
                    <tr className="staff__detail">
                      <td colSpan={10}>
                        <div className="staff__detail-grid">
                          <div>
                            <h4 className="dive__subhead">Roster</h4>
                            <ul className="id-list">
                              {row.members.map((member) => (
                                <li className="id-list__row staff__member" key={member.competitor_id}>
                                  <span className="id-list__id pixel">{member.competitor_id}</span>
                                  <span className="id-list__name">
                                    {member.full_name}
                                    {(member.grade || member.email || member.original_team_code) && (
                                      <small>
                                        {[
                                          member.grade && `Grade ${member.grade}`,
                                          member.email,
                                          member.original_team_code &&
                                            `moved from team ${member.original_team_code}`,
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      </small>
                                    )}
                                    <small className="staff__guardian">
                                      Parent or guardian: {member.guardian_name ?? '—'}
                                      {member.guardian_email ? ` · ${member.guardian_email}` : ''}
                                    </small>
                                    <small
                                      className={`staff__waiver ${member.waiver_signed_at ? 'staff__waiver--ok' : 'staff__waiver--todo'}`}
                                    >
                                      {member.waiver_signed_at
                                        ? signedLabel(member)
                                        : member.waiver_token
                                          ? 'Waiver not signed yet'
                                          : 'Waiver signing not set up — re-run supabase/schema.sql'}
                                    </small>
                                  </span>
                                  {member.waiver_token && (
                                    <span className="staff__member-actions">
                                      {member.waiver_signed_at && (
                                        <button
                                          type="button"
                                          className="btn btn--sm"
                                          disabled={waiverBusy === `pdf:${member.competitor_id}`}
                                          onClick={() => void waiverPdf(member)}
                                        >
                                          {waiverBusy === `pdf:${member.competitor_id}` ? 'Preparing…' : 'PDF'}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="btn btn--sm"
                                        onClick={() =>
                                          void copy('signing link', [waiverSigningLink(member.waiver_token!)])
                                        }
                                        title="The parent or guardian's private link. Anyone with it can sign, so only send it to them."
                                      >
                                        Copy link
                                      </button>
                                      {!member.waiver_signed_at && member.guardian_email && (
                                        <button
                                          type="button"
                                          className="btn btn--sm"
                                          disabled={waiverBusy === `mail:${member.competitor_id}`}
                                          onClick={() => void resendWaiver(member)}
                                        >
                                          {waiverBusy === `mail:${member.competitor_id}` ? 'Sending…' : 'Email link'}
                                        </button>
                                      )}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                            {isLive(row) && row.members.length > 0 && row.members.length < SLOT_CAP && (
                              <MergeBox
                                row={row}
                                rows={rows}
                                target={mergeTarget}
                                onTarget={setMergeTarget}
                                busy={merging}
                                onMerge={(into) => void mergeInto(row, into)}
                              />
                            )}
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
                              <div className="facts__row">
                                <dt>Media release</dt>
                                <dd>
                                  {row.media_release && row.media_release_signed_by
                                    ? `Signed by ${row.media_release_signed_by}${
                                        row.media_release_signed_at
                                          ? `, ${new Date(row.media_release_signed_at).toLocaleDateString()}`
                                          : ''
                                      }`
                                    : 'Not signed'}
                                </dd>
                              </div>
                              <div className="facts__row">
                                <dt>Liability waivers</dt>
                                <dd>
                                  {waiverCounts(row).signed} of {row.members.length} signed by a
                                  parent or guardian
                                  {row.liability_waiver && row.liability_waiver_signed_by
                                    ? `. Captain ${row.liability_waiver_signed_by} acknowledged${
                                        row.liability_waiver_signed_at
                                          ? `, ${new Date(row.liability_waiver_signed_at).toLocaleDateString()}`
                                          : ''
                                      }`
                                    : ''}
                                </dd>
                              </div>
                              {row.merged_into_code && (
                                <div className="facts__row">
                                  <dt>Combined</dt>
                                  <dd>
                                    Into team {row.merged_into_code}. Its competitors are listed
                                    there now.
                                  </dd>
                                </div>
                              )}
                              {isLive(row) && row.members.length < SLOT_CAP && (
                                <div className="facts__row">
                                  <dt>Combining</dt>
                                  <dd>{row.open_to_merge ? 'Open to being combined' : 'Did not ask to be combined'}</dd>
                                </div>
                              )}
                              {row.staff_notes && (
                                <div className="facts__row">
                                  <dt>Staff notes</dt>
                                  <dd className="staff__notes">{row.staff_notes}</dd>
                                </div>
                              )}
                              <div className="facts__row">
                                <dt>Donation</dt>
                                <dd>
                                  {pledgeLabel(row)}
                                  {row.donation_received ? ' — received' : ''}
                                </dd>
                              </div>
                              <div className="facts__row">
                                <dt>Confirmation</dt>
                                <dd>
                                  {row.confirmation_sent_at
                                    ? `Emailed ${new Date(row.confirmation_sent_at).toLocaleString()}`
                                    : 'Not sent'}{' '}
                                  <button
                                    type="button"
                                    className="btn btn--sm"
                                    disabled={sending === row.id}
                                    onClick={() => void resendConfirmation(row)}
                                  >
                                    {sending === row.id
                                      ? 'Sending…'
                                      : row.confirmation_sent_at
                                        ? 'Resend'
                                        : 'Send now'}
                                  </button>
                                </dd>
                              </div>
                              {row.division === 'online' && (
                                <div className="facts__row">
                                  <dt>Distance rule</dt>
                                  <dd>
                                    {row.distance_attested
                                      ? 'Attested: no member within 100 mi of the Bay Area'
                                      : 'Not attested'}
                                  </dd>
                                </div>
                              )}
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
            <p className="loading label">Checking session…</p>
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
