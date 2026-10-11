// SFMO 2027 — registration confirmation emails (Supabase Edge Function).
//
// Called by the registration page right after a team registers, and by the
// staff portal's "Send confirmation email" button. It:
//   1. claims the team's one confirmation via the claim_confirmation() RPC —
//      which only succeeds for a matching team code + contact email, and only
//      once — so this endpoint can never be used to email arbitrary people or
//      to spam a team;
//   2. sends the team's confirmation to its contact (coach cc'd), plus a short
//      notice to each parent/guardian named on the liability waiver, through
//      Resend's batch API;
//   3. on any send failure, releases the claim so it can be retried.
//
// No imports on purpose: paste this file into the Supabase dashboard editor
// (Edge Functions → Deploy a new function → Via Editor) and it runs as-is.
//
// Secrets (Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY  required  re_...
//   EMAIL_FROM      required  e.g.  SFMO 2027 <registration@sfmathacademy.com>
//   REPLY_TO        optional  default sfmathopen@gmail.com
//   SITE_URL        optional  default https://mathcosine.github.io/sfmo/
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
    `Online: ${DONATE_URL} — add "Team ${c.team_code}" after your name`,
    ...(c.division === 'online' ? [] : ['At check-in on competition day']),
  ];
  const size = c.members.length;
  const intro = c.donation_pledge && c.donation_pledge > 0
    ? `You said you plan to give $${c.donation_pledge}${c.donation_method ? ` (${{ zelle: 'Zelle', online: 'online', checkin: 'at check-in' }[c.donation_method]})` : ''} — thank you.`
    : `Entry is free. If you can, we suggest $${PER_COMPETITOR} per competitor — $${PER_COMPETITOR * size} for your team — to help cover the venue.`;
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
    'Suggested donation',
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
<p style="margin-bottom:4px"><strong>Suggested donation</strong></p>
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

async function sendBatch(messages: Array<Record<string, unknown>>) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { sent: false, error: 'POST only' });

  let teamCode = '', contactEmail = '';
  try {
    const body = await req.json();
    teamCode = String(body?.team_code ?? '').trim();
    contactEmail = String(body?.contact_email ?? '').trim();
  } catch { /* fall through to the check below */ }
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

  const from = env('EMAIL_FROM');
  const replyTo = env('REPLY_TO', 'sfmathopen@gmail.com');
  const site = env('SITE_URL', 'https://mathcosine.github.io/sfmo/');
  const team = teamEmail(claimed, site);
  const coach = claimed.coach_email?.trim();
  const messages = [
    {
      from, reply_to: replyTo, to: [claimed.contact_email], subject: team.subject, html: team.html, text: team.text,
      ...(coach && coach.toLowerCase() !== claimed.contact_email.toLowerCase() ? { cc: [coach] } : {}),
    },
    ...guardianEmails(claimed, site).map((g) => ({
      from, reply_to: replyTo, to: [g.to], subject: g.subject, html: g.html, text: g.text,
    })),
  ];

  try {
    await sendBatch(messages);
  } catch (error) {
    await release(claimed.team_code); // let it be retried
    return json(502, { sent: false, error: String(error) });
  }
  return json(200, { sent: true, emails: messages.length, to: claimed.contact_email });
}

Deno.serve(handle);
