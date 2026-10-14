// SFMO 2027 — registration confirmation emails (Supabase Edge Function).
//
// Called by the registration page right after a team registers, and by the
// staff portal's "Send now" / "Resend" buttons. It:
//   1. claims the team's one confirmation via the claim_confirmation() RPC —
//      which only succeeds for a matching team code + contact email, and only
//      once — so this endpoint can never be used to email arbitrary people or
//      to spam a team;
//   2. sends the team's confirmation to its contact (coach cc'd), and each
//      parent or guardian their private link to sign the liability waiver;
//   3. on any send failure, releases the claim so it can be retried.
//
// It also handles the liability waiver, which parents and guardians sign
// themselves at <site>/waiver?t=<token>:
//   { waiver_signed: token }  after signing: emails the signed PDF(s), once;
//   { waiver_pdf: token }     returns a signed PDF (the page's Download link);
//   { resend_waiver: token }  staff only: emails the signing link again;
//   { merge_notice: code }    staff only: tells both teams they were combined;
//   { test: true }            staff only: sample copies of the emails to you.
//
// The waiver text and the PDF fonts are fetched from the website
// (SITE_URL/legal/), so the site must be deployed for PDFs to work. The PDF
// library (pdf-lib, an npm: import) is loaded only when a PDF is made, so if
// it ever failed to load, registration emails would still go out. Paste this
// file into the Supabase dashboard editor, or deploy with the CLI (see
// supabase/README.md).
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
//   SITE_URL            default https://sfmathopen.org/
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Deploy with "Verify JWT" turned OFF: the page calls this with the public
// key, and the RPC above is what actually protects it.

// Mirrors `donation` in src/lib/config.ts — change both together.
const PER_COMPETITOR = 10;
const EVENT_DATE = 'Saturday, January 16, 2027'; // sfmo2027.dayLabel
const VENUE_AREA = 'South Bay / San Francisco'; // sfmo2027.venueArea
const ZELLE = '(925) 997-8182';
const DONATE_URL = 'https://sfmathacademy.com/donate';
const DEFAULT_SITE = 'https://sfmathopen.org/';
const site = () => env('SITE_URL', DEFAULT_SITE).replace(/\/?$/, '/');
const waiverLink = (token: string) => `${site()}waiver?t=${token}`;

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
type Guardian = {
  competitor_id: string;
  competitor_name: string;
  guardian_name: string;
  guardian_email: string;
  waiver_token: string;
  waiver_signed?: boolean;
};
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
  d === 'online' ? 'Online' : d === 'in_person' ? `In person (${VENUE_AREA} — venue still being finalised)` : '—';

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
    `${c.team_name} is registered for the San Francisco Math Open 2027, on ${EVENT_DATE}.`,
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
    'Liability waiver: each parent or guardian listed has been emailed a private link to sign it (competitors who are 18 or older sign their own). Every competitor needs a signed waiver before competition day.',
    '',
    'Questions? Just reply to this email.',
    '— The San Francisco Math Initiative',
  ].join('\n');
  const li = (s: string) => `<li style="margin:4px 0">${escapeHtml(s)}</li>`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#0a2b3f;max-width:560px">
<p>Hi ${escapeHtml(c.contact_name ?? 'there')},</p>
<p><strong>${escapeHtml(c.team_name)}</strong> is registered for the San Francisco Math Open 2027, on <strong>${EVENT_DATE}</strong>.</p>
<table style="border-collapse:collapse;margin:12px 0"><tr><td style="padding:2px 14px 2px 0;color:#3d6377">Team ID</td><td style="font-family:ui-monospace,monospace;font-weight:700">${escapeHtml(c.team_code)}</td></tr>
<tr><td style="padding:2px 14px 2px 0;color:#3d6377">Division</td><td>${escapeHtml(divisionLabel(c.division))}</td></tr></table>
<p style="margin-bottom:4px"><strong>Competitor IDs</strong> — each competitor writes theirs on every answer sheet:</p>
<ul style="margin-top:4px;padding-left:18px;font-family:ui-monospace,monospace">${c.members.map((m) => li(`${m.competitor_id}  ${m.full_name}${m.grade ? ` (grade ${m.grade})` : ''}`)).join('')}</ul>
<p style="margin-bottom:4px"><strong>Suggested donation (optional)</strong></p>
<p style="margin:4px 0">${escapeHtml(give.intro)}</p>
<ul style="margin-top:4px;padding-left:18px">${give.ways.map(li).join('')}</ul>
${give.split ? `<p style="margin:4px 0;color:#3d6377">${escapeHtml(give.split)}</p>` : ''}
<p>Look your team up again any time: <a href="${escapeHtml(lookup)}">${escapeHtml(lookup)}</a></p>
<p style="color:#3d6377"><strong>Liability waiver:</strong> each parent or guardian listed has been emailed a private link to sign it (competitors who are 18 or older sign their own). Every competitor needs a signed waiver before competition day.</p>
<p>Questions? Just reply to this email.<br>— The San Francisco Math Initiative</p></div>`;
  return { subject, text, html };
}

/** Buttons render in every client; the URL repeats below for plain text. */
const button = (href: string, label: string) =>
  `<p style="margin:18px 0"><a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 18px;background:#f2b52c;color:#0a2b3f;border:2px solid #0a2b3f;font-weight:700;text-decoration:none">${escapeHtml(label)}</a></p>`;

/**
 * The "please sign" email to one parent or guardian, for every competitor on
 * the team who named them. One link covers them all.
 */
export function waiverRequestEmail(
  team: { team_code: string; team_name: string },
  guardianName: string,
  to: string,
  competitors: Array<{ competitor_id: string; competitor_name: string; waiver_signed?: boolean }>,
  token: string,
) {
  const who = competitors.map((g) => `${g.competitor_name} (${g.competitor_id})`).join(' and ');
  const names = competitors.map((g) => g.competitor_name).join(' and ');
  const link = waiverLink(token);
  const done = competitors.every((g) => g.waiver_signed);
  const subject = done
    ? `SFMO 2027: waiver already signed for ${names}`
    : `Action needed: sign the SFMO 2027 waiver for ${names}`;
  const lead = done
    ? `The SFMO 2027 liability waiver for ${who} is already signed — thank you. You can view it, and download the signed copy, here:`
    : `${who} ${competitors.length > 1 ? 'are' : 'is'} registered for the San Francisco Math Open 2027 (${EVENT_DATE}) on team ${team.team_code}, ${team.team_name}, and you were named as the parent or guardian who signs their liability waiver. Please read it and sign it here — it takes about two minutes:`;
  const text = [
    `Hi ${guardianName},`,
    '',
    lead,
    link,
    '',
    ...(done ? [] : [
      'Every competitor needs a signed waiver before competition day. You will be emailed a signed copy (PDF) for your records.',
      '',
      'If you are not their parent or guardian, or you have questions, just reply to this email.',
      '',
    ]),
    '— The San Francisco Math Initiative',
  ].join('\n');
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#0a2b3f;max-width:560px">
<p>Hi ${escapeHtml(guardianName)},</p>
<p>${escapeHtml(lead)}</p>
${button(link, done ? 'View the signed waiver' : 'Review and sign the waiver')}
<p style="font-size:13px;color:#3d6377">Or copy this link: ${escapeHtml(link)}</p>
${done ? '' : `<p>Every competitor needs a signed waiver before competition day. You will be emailed a signed copy (PDF) for your records.</p>
<p>If you are not their parent or guardian, or you have questions, just reply to this email.</p>`}
<p>— The San Francisco Math Initiative</p></div>`;
  return { to: to.trim(), subject, text, html };
}

/** One "please sign" email per guardian address on the team. */
export function guardianEmails(c: Claim) {
  const byEmail = new Map<string, Guardian[]>();
  for (const g of c.guardians) {
    const key = g.guardian_email.trim().toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), g]);
  }
  return [...byEmail.values()].map((group) =>
    waiverRequestEmail(c, group[0].guardian_name, group[0].guardian_email, group, group[0].waiver_token),
  );
}

/** One email, whichever way it is delivered. */
export type Attachment = { filename: string; contentType: string; content: string /* base64 */ };
export type Message = {
  to: string;
  cc?: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Attachment[];
};

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
        ...(m.attachments?.length
          ? {
            attachments: m.attachments.map((a) => ({
              filename: a.filename, content_type: a.contentType, content: a.content,
            })),
          }
          : {}),
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
  const headers = { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' };
  const shape = (m: Message) => ({
    from, reply_to: replyTo, to: [m.to], ...(m.cc ? { cc: [m.cc] } : {}),
    subject: m.subject, html: m.html, text: m.text,
    ...(m.attachments?.length
      ? { attachments: m.attachments.map((a) => ({ filename: a.filename, content: a.content })) }
      : {}),
  });
  // The batch endpoint does not take attachments, so those go one by one.
  if (messages.some((m) => m.attachments?.length)) {
    for (const m of messages) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers, body: JSON.stringify(shape(m)),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    }
    return;
  }
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST', headers, body: JSON.stringify(messages.map(shape)),
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
    ...guardianEmails(c).map((g) => ({ to: g.to, subject: g.subject, html: g.html, text: g.text })),
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

/** Opens the signing page's "link not valid" message, which is right for a test. */
const SAMPLE_TOKEN = '00000000-0000-4000-8000-000000000000';

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
      { competitor_id: '00A', competitor_name: 'Ada Lovelace', guardian_name: 'SFMO staff', guardian_email: email, waiver_token: SAMPLE_TOKEN },
      { competitor_id: '00B', competitor_name: 'Alan Turing', guardian_name: 'SFMO staff', guardian_email: email, waiver_token: SAMPLE_TOKEN },
    ],
  };
}

async function sendTest(req: Request): Promise<Response> {
  let to: string | null = null;
  try {
    to = await staffEmail(req);
  } catch { /* treated as not staff */ }
  if (!to) return json(403, { sent: false, error: 'Test emails are for signed-in staff only.' });
  const messages = buildMessages(sampleClaim(to), site())
    .map((m) => ({ ...m, subject: `[TEST] ${m.subject}` }));
  try {
    await deliver(messages, env('REPLY_TO', 'sfmathopen@gmail.com'));
  } catch (error) {
    return json(502, { sent: false, error: String(error) });
  }
  return json(200, { sent: true, emails: messages.length, to });
}


// ---------------------------------------------------------------------------
// Liability waiver: records, PDFs, and the emails around them
// ---------------------------------------------------------------------------

type WaiverDoc = {
  id: string;
  title: string;
  event: string;
  eventLine: string;
  organizer: string;
  contact: string;
  published: string;
  notice: string;
  summary: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  acknowledgment: string;
};

export type WaiverCompetitor = {
  competitor_id: string;
  full_name: string;
  grade: string | null;
  signed: boolean;
  signed_name: string | null;
  signed_at: string | null;
  signer_role: 'guardian' | 'self' | null;
  signed_ip: string | null;
  signed_ua: string | null;
  doc_id: string | null;
  doc_sha256: string | null;
  waiver_token: string;
};

export type WaiverRecord = {
  team_code: string;
  team_name: string;
  division: 'in_person' | 'online' | null;
  status: string;
  guardian_name: string | null;
  guardian_email: string | null;
  waiver_token: string;
  competitors: WaiverCompetitor[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${name} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Large arrays overflow String.fromCharCode(...), so encode in chunks. */
export function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// The document and fonts are published with the site (public/legal), so the
// signing page and the PDF always use the same text. Cached per instance.
const docCache = new Map<string, { doc: WaiverDoc; sha256: string }>();
async function loadDoc(id: string) {
  if (!/^[a-z0-9-]{3,80}$/.test(id)) throw new Error(`Bad waiver document id: ${id}`);
  const cached = docCache.get(id);
  if (cached) return cached;
  const res = await fetch(`${site()}legal/${id}.json`);
  if (!res.ok) throw new Error(`Waiver document ${id}: ${res.status}`);
  const text = await res.text();
  const sha256 = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  const entry = { doc: JSON.parse(text) as WaiverDoc, sha256 };
  docCache.set(id, entry);
  return entry;
}

let fontCache: Promise<Record<'regular' | 'bold' | 'italic', Uint8Array>> | null = null;
function loadFonts() {
  fontCache ??= (async () => {
    const get = async (file: string) => {
      const res = await fetch(`${site()}legal/fonts/${file}`);
      if (!res.ok) throw new Error(`Font ${file}: ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    };
    const [regular, bold, italic] = await Promise.all([
      get('NotoSans-Regular.ttf'), get('NotoSans-Bold.ttf'), get('NotoSans-Italic.ttf'),
    ]);
    return { regular, bold, italic };
  })();
  fontCache.catch(() => { fontCache = null; });
  return fontCache;
}

const pacific = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles', dateStyle: 'long', timeStyle: 'short',
  }) + ' Pacific';

const roleLabel = (role: WaiverCompetitor['signer_role']) =>
  role === 'self' ? 'the participant (18 or older)' : 'parent or legal guardian';

export const pdfFilename = (c: WaiverCompetitor) =>
  `SFMO-2027-waiver-${c.competitor_id}-${
    c.full_name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'competitor'
  }.pdf`;

/** One signed waiver, laid out as a document: details, full text, signature, audit trail. */
export async function waiverPdf(record: WaiverRecord, c: WaiverCompetitor): Promise<Uint8Array> {
  if (!c.signed || !c.signed_at || !c.doc_id) throw new Error(`${c.competitor_id} has not signed`);
  // Loaded here, not at the top, so a problem with the library can only
  // affect PDFs and never the registration emails.
  const { PDFDocument, rgb } = await import('npm:pdf-lib@1.17.1');
  const fontkit = (await import('npm:@pdf-lib/fontkit@1.1.1')).default;
  const [{ doc, sha256 }, fontBytes] = await Promise.all([loadDoc(c.doc_id), loadFonts()]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(fontBytes.regular, { subset: true });
  const bold = await pdf.embedFont(fontBytes.bold, { subset: true });
  const italic = await pdf.embedFont(fontBytes.italic, { subset: true });
  type Font = typeof regular;

  // Characters the font cannot draw (e.g. Chinese) print as "?"; the exact
  // name is kept in the database record.
  const supported = new Set(regular.getCharacterSet());
  const clean = (text: string) =>
    [...text].map((ch) => (supported.has(ch.codePointAt(0)!) || ch === ' ' ? ch : '?')).join('');

  pdf.setTitle(`${doc.title} — ${clean(c.full_name)} (${c.competitor_id})`);
  pdf.setAuthor(doc.organizer);
  pdf.setSubject(`${doc.event} · signed liability waiver`);
  pdf.setCreator('SFMO registration (sfmathopen.org)');
  pdf.setProducer('pdf-lib');

  const INK = rgb(0.04, 0.17, 0.25);
  const SOFT = rgb(0.24, 0.39, 0.47);
  const ACCENT = rgb(0.95, 0.71, 0.17);
  const RULE = rgb(0.8, 0.85, 0.88);
  const [W, H, M] = [612, 792, 56];
  const BOTTOM = M + 24;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const wrap = (text: string, font: Font, size: number, width: number) => {
    const lines: string[] = [];
    for (const para of clean(text).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
        else { lines.push(line); line = word; }
      }
      lines.push(line);
    }
    return lines;
  };
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) { page = pdf.addPage([W, H]); y = H - M; }
  };
  const write = (
    text: string,
    { font = regular, size = 9.5, color = INK, gap = 6, indent = 0, lead = 1.38 }:
      { font?: Font; size?: number; color?: ReturnType<typeof rgb>; gap?: number; indent?: number; lead?: number } = {},
  ) => {
    for (const line of wrap(text, font, size, W - 2 * M - indent)) {
      ensure(size * lead);
      y -= size * lead;
      page.drawText(line, { x: M + indent, y, size, font, color });
    }
    y -= gap;
  };

  // Header
  page.drawRectangle({ x: 0, y: H - 10, width: W, height: 10, color: ACCENT });
  write(doc.organizer.toUpperCase(), { font: bold, size: 8.5, color: SOFT, gap: 2 });
  write(doc.title, { font: bold, size: 16, gap: 2, lead: 1.25 });
  write(`${doc.event} · ${doc.eventLine}`, { size: 9.5, color: SOFT, gap: 12 });

  // Who and what was signed
  const facts: Array<[string, string]> = [
    ['Participant', `${c.full_name} · competitor ID ${c.competitor_id}${c.grade ? ` · grade ${c.grade}` : ''}`],
    ['Team', `${record.team_code} · ${record.team_name}`],
    ['Division', record.division === 'online' ? 'Online' : record.division === 'in_person' ? `In person (${VENUE_AREA})` : '—'],
    ['Signed by', `${c.signed_name} · ${roleLabel(c.signer_role)}`],
    ['Signed on', pacific(c.signed_at)],
  ];
  const boxTop = y;
  y -= 8;
  for (const [label, value] of facts) {
    ensure(14);
    y -= 13;
    page.drawText(label.toUpperCase(), { x: M + 10, y, size: 7.5, font: bold, color: SOFT });
    page.drawText(clean(value), { x: M + 92, y, size: 9.5, font: regular, color: INK });
  }
  y -= 10;
  page.drawRectangle({ x: M, y, width: W - 2 * M, height: boxTop - y, borderColor: INK, borderWidth: 1 });
  y -= 14;

  // The document itself
  write(doc.notice, { font: bold, size: 9, gap: 10 });
  for (const section of doc.sections) {
    ensure(40);
    write(section.heading, { font: bold, size: 10.5, gap: 3 });
    for (const paragraph of section.paragraphs) write(paragraph, { gap: 5 });
    y -= 3;
  }
  ensure(60);
  write(doc.acknowledgment, { font: bold, size: 9, gap: 14 });

  // Signature
  ensure(80);
  write('SIGNATURE', { font: bold, size: 7.5, color: SOFT, gap: 2 });
  write(c.signed_name ?? '', { font: italic, size: 20, gap: 2, lead: 1.3 });
  page.drawLine({ start: { x: M, y: y + 2 }, end: { x: M + 260, y: y + 2 }, thickness: 0.8, color: INK });
  y -= 6;
  write(
    `Signed electronically by ${c.signed_name}, ${roleLabel(c.signer_role)}${c.signer_role === 'self' ? '' : ` of ${c.full_name}`}, on ${pacific(c.signed_at)}.`,
    { size: 9, color: SOFT, gap: 14 },
  );

  // Audit trail
  ensure(120);
  const matches = c.doc_sha256 === sha256;
  const audit: Array<[string, string]> = [
    ['Signed at (UTC)', new Date(c.signed_at).toISOString()],
    ['IP address', c.signed_ip ?? 'not recorded'],
    ['Browser', (c.signed_ua ?? 'not recorded').slice(0, 160)],
    ['Document', `${doc.id} (published ${doc.published})`],
    ['Fingerprint signed', `SHA-256 ${c.doc_sha256 ?? '—'}`],
    ['Fingerprint check', matches
      ? 'Matches the published text of this document.'
      : `DOES NOT MATCH the published text (now ${sha256}). Contact ${doc.contact}.`],
    ['Signing link', `…${c.waiver_token.slice(-8)}`],
    ['This PDF made', new Date().toISOString()],
  ];
  const auditTop = y;
  y -= 6;
  write('SIGNATURE RECORD', { font: bold, size: 7.5, color: SOFT, gap: 2, indent: 10 });
  for (const [label, value] of audit) {
    const lines = wrap(value, regular, 8, W - 2 * M - 120);
    ensure(lines.length * 11 + 2);
    y -= 11;
    page.drawText(label, { x: M + 10, y, size: 7.5, font: bold, color: SOFT });
    lines.forEach((line, i) => {
      if (i) y -= 11;
      page.drawText(line, { x: M + 110, y, size: 8, font: regular, color: matches || label !== 'Fingerprint check' ? INK : rgb(0.75, 0.2, 0.1) });
    });
  }
  y -= 8;
  if (auditTop - y < H) {
    page.drawRectangle({ x: M, y, width: W - 2 * M, height: Math.min(auditTop - y, H - M - y), borderColor: RULE, borderWidth: 1 });
  }

  // Footer on every page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 6 }, end: { x: W - M, y: M - 6 }, thickness: 0.5, color: RULE });
    p.drawText(clean(`SFMO 2027 · signed liability waiver · ${c.competitor_id} ${c.full_name}`), { x: M, y: M - 18, size: 7.5, font: regular, color: SOFT });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: W - M - regular.widthOfTextAtSize(label, 7.5), y: M - 18, size: 7.5, font: regular, color: SOFT });
  });

  return await pdf.save();
}

/** The "signed — here is your copy" email, with one PDF per competitor. */
export async function signedWaiverEmail(record: WaiverRecord): Promise<Message> {
  const signed = record.competitors.filter((c) => c.signed);
  const who = signed.map((c) => `${c.full_name} (${c.competitor_id})`).join(' and ');
  const signer = signed[0]?.signed_name ?? record.guardian_name ?? 'there';
  const when = signed[0]?.signed_at ? pacific(signed[0].signed_at) : '';
  const link = waiverLink(record.waiver_token);
  let attachments: Attachment[] = [];
  let note = 'Your signed copy is attached as a PDF. Please keep it for your records.';
  try {
    attachments = await Promise.all(signed.map(async (c) => ({
      filename: pdfFilename(c),
      contentType: 'application/pdf',
      content: toBase64(await waiverPdf(record, c)),
    })));
    if (signed.length > 1) note = 'Your signed copies are attached, one PDF per competitor. Please keep them for your records.';
  } catch (error) {
    console.error('waiver PDF failed', error);
    attachments = [];
    note = 'You can view your signed waiver, and download the signed PDF, at the link below.';
  }
  const subject = `Signed: SFMO 2027 waiver for ${signed.map((c) => c.full_name).join(' and ')}`;
  const text = [
    `Hi ${signer},`,
    '',
    `Thank you. You signed the SFMO 2027 liability waiver for ${who} on ${when}.`,
    '',
    note,
    `View it any time: ${link}`,
    '',
    'If anything here is wrong, just reply to this email.',
    '— The San Francisco Math Initiative',
  ].join('\n');
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#0a2b3f;max-width:560px">
<p>Hi ${escapeHtml(signer)},</p>
<p>Thank you. You signed the SFMO 2027 liability waiver for <strong>${escapeHtml(who)}</strong> on ${escapeHtml(when)}.</p>
<p>${escapeHtml(note)}</p>
<p>View it any time: <a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
<p>If anything here is wrong, just reply to this email.<br>— The San Francisco Math Initiative</p></div>`;
  return { to: (record.guardian_email ?? '').trim(), subject, text, html, attachments };
}

async function releaseWaiverPdf(tokens: string[]) {
  if (!tokens.length) return;
  await fetch(`${env('SUPABASE_URL')}/rest/v1/team_members?waiver_token=in.(${tokens.join(',')})`, {
    method: 'PATCH',
    headers: serviceHeaders(),
    body: JSON.stringify({ waiver_pdf_sent_at: null }),
  });
}

/** After signing: email the signed PDF(s), once per signature. */
async function waiverSigned(token: string): Promise<Response> {
  let record: WaiverRecord | null;
  try {
    record = await rpc<WaiverRecord | null>('claim_waiver_pdf', { p_token: token });
  } catch (error) {
    return json(500, { sent: false, error: String(error) });
  }
  if (!record) return json(200, { sent: false, reason: 'nothing new to send' });
  try {
    const message = await signedWaiverEmail(record);
    await deliver([message], env('REPLY_TO', 'sfmathopen@gmail.com'));
    return json(200, { sent: true, attached: message.attachments?.length ?? 0 });
  } catch (error) {
    await releaseWaiverPdf(record.competitors.filter((c) => c.signed).map((c) => c.waiver_token));
    return json(502, { sent: false, error: String(error) });
  }
}

/** The signing page's "Download PDF": the link is the key. */
async function waiverPdfDownload(token: string, competitorId: string | null): Promise<Response> {
  let record: WaiverRecord | null;
  try {
    record = await rpc<WaiverRecord | null>('waiver_record', { p_token: token });
  } catch (error) {
    return json(500, { error: String(error) });
  }
  if (!record) return json(404, { error: 'This waiver link is not valid.' });
  const pick =
    record.competitors.find((c) => c.signed && competitorId && c.competitor_id === competitorId) ??
    (competitorId ? undefined : record.competitors.find((c) => c.signed && c.waiver_token === token) ??
      record.competitors.find((c) => c.signed));
  if (!pick) return json(409, { error: 'There is no signed waiver to download yet.' });
  try {
    const bytes = await waiverPdf(record, pick);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFilename(pick)}"`,
        'Access-Control-Expose-Headers': 'Content-Disposition',
      },
    });
  } catch (error) {
    return json(500, { error: `Could not make the PDF: ${String(error)}` });
  }
}

/** Staff: email a parent or guardian their signing link again. */
async function resendWaiver(req: Request, token: string): Promise<Response> {
  let staff: string | null = null;
  try {
    staff = await staffEmail(req);
  } catch { /* not staff */ }
  if (!staff) return json(403, { sent: false, error: 'Only signed-in staff can resend waiver links.' });
  const record = await rpc<WaiverRecord | null>('waiver_record', { p_token: token }).catch(() => null);
  if (!record || !record.guardian_email) return json(404, { sent: false, error: 'No parent or guardian email for that competitor.' });
  const message = waiverRequestEmail(
    record,
    record.guardian_name ?? 'there',
    record.guardian_email,
    record.competitors.map((c) => ({ competitor_id: c.competitor_id, competitor_name: c.full_name, waiver_signed: c.signed })),
    token,
  );
  try {
    await deliver([message], env('REPLY_TO', 'sfmathopen@gmail.com'));
  } catch (error) {
    return json(502, { sent: false, error: String(error) });
  }
  return json(200, { sent: true, to: record.guardian_email });
}

type MergeSummary = {
  from: { team_code: string; team_name: string; contact_name: string | null; contact_email: string; coach_email: string | null };
  into: { team_code: string; team_name: string; contact_name: string | null; contact_email: string; coach_email: string | null; division: string | null };
  moved: Array<{ competitor_id: string; full_name: string }>;
  roster: Array<{ competitor_id: string; full_name: string }>;
};

/** Both teams' emails after staff combine them. */
export function mergeEmails(s: MergeSummary): Message[] {
  const lookup = `${site()}register`;
  const list = (rows: MergeSummary['roster']) => rows.map((r) => `  ${r.competitor_id}  ${r.full_name}`);
  const li = (rows: MergeSummary['roster']) =>
    rows.map((r) => `<li style="margin:3px 0">${escapeHtml(`${r.competitor_id}  ${r.full_name}`)}</li>`).join('');
  const wrapHtml = (inner: string) =>
    `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#0a2b3f;max-width:560px">${inner}<p>Questions? Just reply to this email.<br>— The San Francisco Math Initiative</p></div>`;
  const cc = (team: { coach_email: string | null; contact_email: string }) =>
    team.coach_email && team.coach_email.trim().toLowerCase() !== team.contact_email.trim().toLowerCase()
      ? { cc: team.coach_email.trim() } : {};

  const fromText = [
    `Hi ${s.from.contact_name ?? 'there'},`,
    '',
    `To make a full team for SFMO 2027 (${EVENT_DATE}), we have combined ${s.from.team_name} with team ${s.into.team_code}, ${s.into.team_name}.`,
    '',
    'Your competitors\' new IDs — please use these on every answer sheet:',
    ...list(s.moved),
    '',
    `The full team ${s.into.team_code}:`,
    ...list(s.roster),
    '',
    `Signed liability waivers move with each competitor, so there is nothing to sign again. Your old team ID (${s.from.team_code}) still works to look up these IDs: ${lookup}`,
    '',
    'Questions? Just reply to this email.',
    '— The San Francisco Math Initiative',
  ].join('\n');
  const fromHtml = wrapHtml(`<p>Hi ${escapeHtml(s.from.contact_name ?? 'there')},</p>
<p>To make a full team for SFMO 2027 (${EVENT_DATE}), we have combined <strong>${escapeHtml(s.from.team_name)}</strong> with team <strong>${escapeHtml(s.into.team_code)}, ${escapeHtml(s.into.team_name)}</strong>.</p>
<p style="margin-bottom:4px"><strong>Your competitors' new IDs</strong> — please use these on every answer sheet:</p>
<ul style="margin-top:4px;padding-left:18px;font-family:ui-monospace,monospace">${li(s.moved)}</ul>
<p style="margin-bottom:4px">The full team ${escapeHtml(s.into.team_code)}:</p>
<ul style="margin-top:4px;padding-left:18px;font-family:ui-monospace,monospace">${li(s.roster)}</ul>
<p style="color:#3d6377">Signed liability waivers move with each competitor, so there is nothing to sign again. Your old team ID (${escapeHtml(s.from.team_code)}) still works to look up these IDs: <a href="${escapeHtml(lookup)}">${escapeHtml(lookup)}</a></p>`);

  const intoText = [
    `Hi ${s.into.contact_name ?? 'there'},`,
    '',
    `Good news: ${s.moved.length === 1 ? 'a competitor has' : `${s.moved.length} competitors have`} joined your team for SFMO 2027 (${EVENT_DATE}).`,
    '',
    `Team ${s.into.team_code}, ${s.into.team_name}, is now:`,
    ...list(s.roster),
    '',
    'Questions? Just reply to this email.',
    '— The San Francisco Math Initiative',
  ].join('\n');
  const intoHtml = wrapHtml(`<p>Hi ${escapeHtml(s.into.contact_name ?? 'there')},</p>
<p>Good news: ${s.moved.length === 1 ? 'a competitor has' : `${s.moved.length} competitors have`} joined your team for SFMO 2027 (${EVENT_DATE}).</p>
<p style="margin-bottom:4px">Team ${escapeHtml(s.into.team_code)}, ${escapeHtml(s.into.team_name)}, is now:</p>
<ul style="margin-top:4px;padding-left:18px;font-family:ui-monospace,monospace">${li(s.roster)}</ul>`);

  return [
    { to: s.from.contact_email, ...cc(s.from), subject: `SFMO 2027: you've been combined with team ${s.into.team_code}`, text: fromText, html: fromHtml },
    { to: s.into.contact_email, ...cc(s.into), subject: `SFMO 2027: new teammates on team ${s.into.team_code}`, text: intoText, html: intoHtml },
  ];
}

/** Staff: tell both teams about a combination. */
async function mergeNotice(req: Request, fromCode: string): Promise<Response> {
  let staff: string | null = null;
  try {
    staff = await staffEmail(req);
  } catch { /* not staff */ }
  if (!staff) return json(403, { sent: false, error: 'Only signed-in staff can send this.' });
  const summary = await rpc<MergeSummary | null>('merge_summary', { p_from_code: fromCode }).catch(() => null);
  if (!summary) return json(404, { sent: false, error: `Team ${fromCode} has not been combined with another team.` });
  try {
    await deliver(mergeEmails(summary), env('REPLY_TO', 'sfmathopen@gmail.com'));
  } catch (error) {
    return json(502, { sent: false, error: String(error) });
  }
  return json(200, { sent: true, emails: 2 });
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { sent: false, error: 'POST only' });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch { /* fall through to the checks below */ }
  if (body.test === true) return sendTest(req);
  const token = (key: string) => (typeof body[key] === 'string' && UUID.test(body[key] as string) ? (body[key] as string) : null);
  if (body.waiver_signed !== undefined) {
    const t = token('waiver_signed');
    return t ? waiverSigned(t) : json(400, { sent: false, error: 'Bad waiver link.' });
  }
  if (body.waiver_pdf !== undefined) {
    const t = token('waiver_pdf');
    const cid = typeof body.competitor_id === 'string' ? body.competitor_id : null;
    return t ? waiverPdfDownload(t, cid) : json(400, { error: 'Bad waiver link.' });
  }
  if (body.resend_waiver !== undefined) {
    const t = token('resend_waiver');
    return t ? resendWaiver(req, t) : json(400, { sent: false, error: 'Bad waiver link.' });
  }
  if (body.merge_notice !== undefined) {
    const code = String(body.merge_notice).trim();
    return /^\d{1,4}$/.test(code) ? mergeNotice(req, code) : json(400, { sent: false, error: 'Bad team code.' });
  }

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
  const messages = buildMessages(claimed, site());

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
