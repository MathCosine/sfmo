// SFMO 2027 — registration confirmation emails (Supabase Edge Function).
//
// Called by the registration page right after a team registers, and by the
// staff portal's "Send now" / "Resend" buttons. It:
//   1. claims the team's one confirmation via the claim_confirmation() RPC —
//      which only succeeds for a matching team code + contact email, and only
//      once — so this endpoint can never be used to email arbitrary people or
//      to spam a team;
//   2. sends the team's confirmation to its contact (coach cc'd), plus a short
//      notice to each parent/guardian named on the liability waiver;
//   3. on any send failure, releases the claim so it can be retried.
//
// The staff portal's "Send me a test email" button calls it with
// { test: true }: for a signed-in staff member only, it sends sample copies
// of both emails to that staff member's own address and touches no data.
//
// No imports on purpose: paste this file into the Supabase dashboard editor
// (Edge Functions → Deploy a new function → Via Editor) and it runs as-is.
//
// Secrets (Dashboard → Edge Functions → Secrets). Set ONE way of sending:
//   AgentMail (simplest — an API key and an inbox, no DNS):
//     AGENTMAIL_API_KEY   from the AgentMail console
//     AGENTMAIL_INBOX     the inbox address, e.g. sfmo2027@agentmail.to
//   or Gmail, from sfmathopen@gmail.com, via supabase/gmail-relay/Code.gs:
//     EMAIL_RELAY_URL     the Apps Script web app URL (ends in /exec)
//     EMAIL_RELAY_SECRET  printed by the script's setup()
//   or Resend, from a domain you have verified there:
//     RESEND_API_KEY      re_...
//     EMAIL_FROM          e.g.  SFMO 2027 <registration@sfmathopen.org>
// Optional either way:
//   REPLY_TO            default sfmathopen@gmail.com
//   SITE_URL            default https://mathcosine.github.io/sfmo/
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Deploy with "Verify JWT" turned OFF: the page calls this with the public
// key, and the RPC above is what actually protects it.

// Mirrors `donation` in src/lib/config.ts — change both together.
const PER_COMPETITOR = 10;
const ZELLE = '(925) 997-8182';
const DONATE_URL = 'https://sfmathacademy.com/donate';

const env = (name: string, fallback?: string) => {
  const value = Deno.env.get(name) ?? fallback;
  if (value === undefined) throw new Error(`Missing secret: ${name}`);
  return value;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

type Member = { slot: string; competitor_id: string; full_name: string; grade: string | null };
type Guardian = { competitor_id: string; competitor_name: string; guardian_name: string; guardian_email: string };
export type Claim = {
  team_code: string;
  team_name: string;
  division: 'in_person' | 'online' | null;
  contact_name: string | null;
  contact_email: string;
  coach_email: string | null;
  donation_pledge: number | null;
  donation_method: 'zelle' | 'online' | 'checkin' | null;
  members: Member[];
  guardians: Guardian[];
};

/** Everything that reaches an inbox passes through here: names are user input. */
export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Service-role key: legacy keys are JWTs and go in both headers; newer
// sb_secret_ keys go in `apikey` only.
function serviceHeaders() {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: key,
    ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
    'Content-Type': 'application/json',
  };
}

async function claim(teamCode: string, contactEmail: string): Promise<Claim | null> {
  const res = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/claim_confirmation`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify({ p_team_code: teamCode, p_contact_email: contactEmail }),
  });
  if (!res.ok) throw new Error(`claim_confirmation failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Claim | null;
}

async function release(teamCode: string) {
  await fetch(`${env('SUPABASE_URL')}/rest/v1/teams?team_code=eq.${encodeURIComponent(teamCode)}`, {
    method: 'PATCH',
    headers: serviceHeaders(),
    body: JSON.stringify({ confirmation_sent_at: null }),
  });
}

const divisionLabel = (d: Claim['division']) =>
  d === 'online' ? 'Online' : d === 'in_person' ? 'In person (San Francisco — venue still being finalised)' : '—';

function donation(c: Claim) {
  const memo = `SFMO 2027 Team ${c.team_code}`;
  const ways = [
    `Zelle: ${ZELLE} — put "${memo}" in the memo (Zelle shows the account holder's personal name, not SFMO; that's expected)`,
    `Online, on our academy's donation page: ${DONATE_URL} — add "Team ${c.team_code}" after your name`,
    ...(c.division === 'online' ? [] : ['At check-in on competition day']),
  ];
  const size = c.members.length;
  const intro = c.donation_pledge && c.donation_pledge > 0
    ? `You said you plan to give $${c.donation_pledge}${c.donation_method ? ` (${{ zelle: 'Zelle', online: 'online', checkin: 'at check-in' }[c.donation_method]})` : ''} — thank you! It is still completely optional: if plans change, there is no need to tell us.`
    : `Giving is completely optional — your team is fully registered either way. If you would like to help cover the venue, we suggest $${PER_COMPETITOR} per competitor ($${PER_COMPETITOR * size} for your team):`;
  const split = size > 1
    ? `Splitting it? Each competitor can send their own $${PER_COMPETITOR} with their competitor ID instead, e.g. "SFMO 2027 ${c.members[1].competitor_id}".`
    : null;
  return { intro, ways, split };
}

/** The confirmation sent to the team's contact (coach cc'd). */
export function teamEmail(c: Claim, siteUrl: string) {
  const subject = `You're registered for SFMO 2027 — Team ${c.team_code}, ${c.team_name}`;
  const ids = c.members.map((m) => `  ${m.competitor_id}  ${m.full_name}${m.grade ? ` (grade ${m.grade})` : ''}`);
  const lookup = `${siteUrl.replace(/\/?$/, '/')}register`;
  const give = donation(c);
  const text = [
    `Hi ${c.contact_name ?? 'there'},`,
    '',
    `${c.team_name} is registered for the San Francisco Math Open 2027.`,
    '',
    `Team ID: ${c.team_code}`,
    `Division: ${divisionLabel(c.division)}`,
    '',
    'Competitor IDs — each competitor writes theirs on every answer sheet:',
    ...ids,
    '',
    'Suggested donation (optional)',
    give.intro,
    ...give.ways.map((w) => `  • ${w}`),
    ...(give.split ? [give.split] : []),
    '',
    `Look your team up again any time: ${lookup}`,
    'A separate liability waiver confirmation has gone to each parent or guardian listed.',
    '',
    'Questions? Just reply to this email.',
    '— The San Francisco Math Initiative',
  ].join('\n');
  const li = (s: string) => `<li style="margin:4px 0">${escapeHtml(s)}</li>`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#0a2b3f;max-width:560px">
<p>Hi ${escapeHtml(c.contact_name ?? 'there')},</p>
<p><strong>${escapeHtml(c.team_name)}</strong> is registered for the San Francisco Math Open 2027.</p>
<table style="border-collapse:collapse;margin:12px 0"><tr><td style="padding:2px 14px 2px 0;color:#3d6377">Team ID</td><td style="font-family:ui-monospace,monospace;font-weight:700">${escapeHtml(c.team_code)}</td></tr>
<tr><td style="padding:2px 14px 2px 0;color:#3d6377">Division</td><td>${escapeHtml(divisionLabel(c.division))}</td></tr></table>
<p style="margin-bottom:4px"><strong>Competitor IDs</strong> — each competitor writes theirs on every answer sheet:</p>
<ul style="margin-top:4px;padding-left:18px;font-family:ui-monospace,monospace">${c.members.map((m) => li(`${m.competitor_id}  ${m.full_name}${m.grade ? ` (grade ${m.grade})` : ''}`)).join('')}</ul>
<p style="margin-bottom:4px"><strong>Suggested donation (optional)</strong></p>
<p style="margin:4px 0">${escapeHtml(give.intro)}</p>
<ul style="margin-top:4px;padding-left:18px">${give.ways.map(li).join('')}</ul>
${give.split ? `<p style="margin:4px 0;color:#3d6377">${escapeHtml(give.split)}</p>` : ''}
<p>Look your team up again any time: <a href="${escapeHtml(lookup)}">${escapeHtml(lookup)}</a></p>
<p style="color:#3d6377">A separate liability waiver confirmation has gone to each parent or guardian listed.</p>
<p>Questions? Just reply to this email.<br>— The San Francisco Math Initiative</p></div>`;
  return { subject, text, html };
}

/** One notice per guardian address, covering every competitor they signed for. */
export function guardianEmails(c: Claim, siteUrl: string) {
  const byEmail = new Map<string, Guardian[]>();
  for (const g of c.guardians) {
    const key = g.guardian_email.trim().toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), g]);
  }
  const waiverUrl = `${siteUrl.replace(/\/?$/, '/')}register#waivers`;
  return [...byEmail.values()].map((signed) => {
    const names = signed.map((g) => `${g.competitor_name} (${g.competitor_id})`);
    const who = names.join(' and ');
    const subject = `SFMO 2027: liability waiver signed for ${signed.map((g) => g.competitor_name).join(' and ')}`;
    const text = [
      `Hi ${signed[0].guardian_name},`,
      '',
      `You were named as the parent or guardian who signed the SFMO 2027 liability waiver for ${who}, on team ${c.team_code} (${c.team_name}). The team's captain also agreed to our media release (photos) for the whole team.`,
      '',
      `You can read both documents here: ${waiverUrl}`,
      '',
      "If this wasn't you, or you don't agree, reply to this email before competition day and we'll sort it out.",
      '',
      '— The San Francisco Math Initiative',
    ].join('\n');
    const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#0a2b3f;max-width:560px">
<p>Hi ${escapeHtml(signed[0].guardian_name)},</p>
<p>You were named as the parent or guardian who signed the SFMO 2027 <strong>liability waiver</strong> for <strong>${escapeHtml(who)}</strong>, on team ${escapeHtml(c.team_code)} (${escapeHtml(c.team_name)}). The team's captain also agreed to our media release (photos) for the whole team.</p>
<p>You can read both documents here: <a href="${escapeHtml(waiverUrl)}">${escapeHtml(waiverUrl)}</a></p>
<p>If this wasn't you, or you don't agree, reply to this email before competition day and we'll sort it out.</p>
<p>— The San Francisco Math Initiative</p></div>`;
    return { to: signed[0].guardian_email.trim(), subject, text, html };
  });
}

/** One email, whichever way it is delivered. */
export type Message = { to: string; cc?: string; subject: string; text: string; html: string };

const SENDER_NAME = 'SFMO 2027';

/**
 * AgentMail. It has no batch endpoint, so the team's emails go one by one;
 * replies are pointed at REPLY_TO rather than the AgentMail inbox.
 */
async function sendViaAgentMail(messages: Message[], replyTo: string) {
  const key = env('AGENTMAIL_API_KEY');
  const inbox = encodeURIComponent(env('AGENTMAIL_INBOX').trim());
  for (const m of messages) {
    const res = await fetch(`https://api.agentmail.to/v0/inboxes/${inbox}/messages/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: m.to, ...(m.cc ? { cc: m.cc } : {}), reply_to: replyTo,
        subject: m.subject, text: m.text, html: m.html,
      }),
    });
    if (!res.ok) throw new Error(`AgentMail ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** Gmail, through the Apps Script relay in supabase/gmail-relay/Code.gs. */
async function sendViaGmail(messages: Message[], replyTo: string) {
  const res = await fetch(env('EMAIL_RELAY_URL'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env('EMAIL_RELAY_SECRET'),
      messages: messages.map((m) => ({ ...m, name: SENDER_NAME, replyTo })),
    }),
    redirect: 'follow', // Apps Script answers via a redirect to its output
  });
  const text = await res.text();
  let result: { ok?: boolean; error?: string } = {};
  try {
    result = JSON.parse(text);
  } catch { /* Google served an HTML error page */ }
  if (!res.ok || result.ok !== true) {
    throw new Error(`Gmail relay: ${result.error ?? `${res.status} ${text.slice(0, 200)}`}`);
  }
}

/** Resend's batch API, for sending from a verified domain instead. */
async function sendViaResend(messages: Message[], replyTo: string) {
  const from = env('EMAIL_FROM');
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(messages.map((m) => ({
      from, reply_to: replyTo, to: [m.to], ...(m.cc ? { cc: [m.cc] } : {}),
      subject: m.subject, html: m.html, text: m.text,
    }))),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function deliver(messages: Message[], replyTo: string) {
  if (Deno.env.get('AGENTMAIL_API_KEY')) return sendViaAgentMail(messages, replyTo);
  if (Deno.env.get('EMAIL_RELAY_URL')) return sendViaGmail(messages, replyTo);
  if (Deno.env.get('RESEND_API_KEY')) return sendViaResend(messages, replyTo);
  throw new Error('No way to send email is set up: add AGENTMAIL_API_KEY and AGENTMAIL_INBOX (or the Gmail relay or Resend secrets) to the function secrets.');
}

/** The team's confirmation (coach cc'd) plus one notice per guardian. */
function buildMessages(c: Claim, site: string): Message[] {
  const team = teamEmail(c, site);
  const coach = c.coach_email?.trim();
  return [
    {
      to: c.contact_email, subject: team.subject, html: team.html, text: team.text,
      ...(coach && coach.toLowerCase() !== c.contact_email.toLowerCase() ? { cc: coach } : {}),
    },
    ...guardianEmails(c, site).map((g) => ({ to: g.to, subject: g.subject, html: g.html, text: g.text })),
  ];
}

/**
 * The signed-in staff member's email, or null. The function is deployed
 * without JWT verification, so the session token is checked here: Supabase
 * Auth validates it, then the staff list is read with the service key.
 */
async function staffEmail(req: Request): Promise<string | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token.startsWith('eyJ')) return null; // the public key is not a session
  const auth = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, {
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${token}` },
  });
  if (!auth.ok) return null;
  const user = await auth.json();
  if (typeof user?.id !== 'string' || typeof user?.email !== 'string') return null;
  const staff = await fetch(
    `${env('SUPABASE_URL')}/rest/v1/staff_members?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`,
    { headers: serviceHeaders() },
  );
  if (!staff.ok) return null;
  return ((await staff.json()) as unknown[]).length > 0 ? user.email : null;
}

/** A made-up team, so a test email shows exactly what a real one looks like. */
export function sampleClaim(email: string): Claim {
  return {
    team_code: '00', team_name: 'Test Team (not a real registration)', division: 'in_person',
    contact_name: 'SFMO staff', contact_email: email, coach_email: null,
    donation_pledge: null, donation_method: null,
    members: [
      { slot: 'A', competitor_id: '00A', full_name: 'Ada Lovelace', grade: '11' },
      { slot: 'B', competitor_id: '00B', full_name: 'Alan Turing', grade: '10' },
    ],
    guardians: [
      { competitor_id: '00A', competitor_name: 'Ada Lovelace', guardian_name: 'SFMO staff', guardian_email: email },
      { competitor_id: '00B', competitor_name: 'Alan Turing', guardian_name: 'SFMO staff', guardian_email: email },
    ],
  };
}

async function sendTest(req: Request): Promise<Response> {
  let to: string | null = null;
  try {
    to = await staffEmail(req);
  } catch { /* treated as not staff */ }
  if (!to) return json(403, { sent: false, error: 'Test emails are for signed-in staff only.' });
  const messages = buildMessages(sampleClaim(to), env('SITE_URL', 'https://mathcosine.github.io/sfmo/'))
    .map((m) => ({ ...m, subject: `[TEST] ${m.subject}` }));
  try {
    await deliver(messages, env('REPLY_TO', 'sfmathopen@gmail.com'));
  } catch (error) {
    return json(502, { sent: false, error: String(error) });
  }
  return json(200, { sent: true, emails: messages.length, to });
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { sent: false, error: 'POST only' });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch { /* fall through to the checks below */ }
  if (body.test === true) return sendTest(req);

  const teamCode = String(body.team_code ?? '').trim();
  const contactEmail = String(body.contact_email ?? '').trim();
  if (!/^\d{1,4}$/.test(teamCode) || !contactEmail.includes('@')) {
    return json(400, { sent: false, error: 'team_code and contact_email are required' });
  }

  let claimed: Claim | null;
  try {
    claimed = await claim(teamCode, contactEmail);
  } catch (error) {
    return json(500, { sent: false, error: String(error) });
  }
  // Unknown team, wrong email, or already sent: say nothing more.
  if (!claimed) return json(200, { sent: false, reason: 'nothing to send' });

  const replyTo = env('REPLY_TO', 'sfmathopen@gmail.com');
  const messages = buildMessages(claimed, env('SITE_URL', 'https://mathcosine.github.io/sfmo/'));

  // Everything that can fail — including a missing secret — happens in here,
  // so the claim is always released for a retry.
  try {
    await deliver(messages, replyTo);
  } catch (error) {
    await release(claimed.team_code); // let it be retried
    return json(502, { sent: false, error: String(error) });
  }
  return json(200, { sent: true, emails: messages.length, to: claimed.contact_email });
}

Deno.serve(handle);
