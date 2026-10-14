import { asset } from './asset';
import { waiverDoc } from './config';
import { anonKey, readErrorMessage, requireSupabase, supabase, url } from './supabase';

/** public/legal/<id>.json — the full waiver, as signed and as printed in the PDF. */
export type WaiverDocument = {
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

export type LoadedWaiverDocument = { doc: WaiverDocument; sha256: string };

export type SignerRole = 'guardian' | 'self';

export type WaiverCompetitor = {
  competitor_id: string;
  full_name: string;
  grade: string | null;
  signed: boolean;
  signed_name: string | null;
  signed_at: string | null;
  signer_role: SignerRole | null;
  /** The competitor this particular link was sent for. */
  is_link_owner: boolean;
};

/** What a signing link can see: the team, and the competitors it covers. */
export type WaiverStatus = {
  team_code: string;
  team_name: string;
  division: 'in_person' | 'online' | null;
  guardian_name: string | null;
  competitors: WaiverCompetitor[];
};

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

let cached: Promise<LoadedWaiverDocument> | null = null;

/**
 * Fetches the published waiver and fingerprints the exact bytes. The
 * fingerprint is stored with each signature, and the PDF checks it against
 * the published file, so nobody can quietly change what was signed.
 */
export function loadWaiverDocument(): Promise<LoadedWaiverDocument> {
  cached ??= (async () => {
    const response = await fetch(asset(`legal/${waiverDoc.id}.json`), { cache: 'no-cache' });
    if (!response.ok) throw new Error('We could not load the waiver. Please refresh the page.');
    const text = await response.text();
    const sha256 = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
    return { doc: JSON.parse(text) as WaiverDocument, sha256 };
  })();
  cached.catch(() => {
    cached = null;
  });
  return cached;
}

export async function getWaiver(token: string): Promise<WaiverStatus> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('get_waiver', { p_token: token });
  if (error) throw new Error(readErrorMessage(error, 'This waiver link is not valid.'));
  return data as WaiverStatus;
}

export async function signWaiver(
  token: string,
  input: { name: string; role: SignerRole; agree: boolean; docId: string; sha256: string },
): Promise<WaiverStatus> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('sign_waiver', {
    p_token: token,
    p_signed_name: input.name,
    p_signer_role: input.role,
    p_agree: input.agree,
    p_doc_id: input.docId,
    p_doc_sha256: input.sha256,
    p_user_agent: navigator.userAgent.slice(0, 400),
  });
  if (error) throw new Error(readErrorMessage(error, 'We could not record your signature. Please try again.'));
  return data as WaiverStatus;
}

/**
 * Asks the Edge Function to email the signed PDF. It sends once per
 * signature, so calling it twice is harmless. Never throws: the signature is
 * already saved, and the PDF can always be downloaded from the page.
 */
export async function emailSignedWaiver(token: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.functions.invoke('send-confirmation', {
      body: { waiver_signed: token },
    });
    return !error && Boolean(data?.sent);
  } catch {
    return false;
  }
}

/** Reads `{ error }` out of a failed function call, whatever shape it took. */
async function functionError(error: unknown, data: unknown, fallback: string) {
  let detail = (data as { error?: string } | null)?.error ?? readErrorMessage(error, fallback);
  const response = (error as { context?: unknown } | null)?.context;
  if (response instanceof Response) {
    try {
      detail = (await response.json())?.error ?? detail;
    } catch {
      /* not JSON — keep what we have */
    }
  }
  return detail;
}

/**
 * Downloads one signed waiver as a PDF. Called directly rather than through
 * functions.invoke, which tries to read every reply as text or JSON.
 */
export async function downloadWaiverPdf(token: string, competitorId?: string): Promise<void> {
  const client = requireSupabase();
  if (!url || !anonKey) throw new Error('The registration database is not connected yet.');
  // The same headers functions.invoke would send.
  const { data } = await client.auth.getSession();
  const response = await fetch(`${url}/functions/v1/send-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${data.session?.access_token ?? anonKey}`,
    },
    body: JSON.stringify({ waiver_pdf: token, competitor_id: competitorId }),
  });
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/pdf')) {
    let detail = 'We could not make the PDF. Please try again in a minute.';
    try {
      detail = (await response.json())?.error ?? detail;
    } catch {
      /* not JSON */
    }
    throw new Error(detail);
  }
  const blob = await response.blob();
  const filename =
    /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ??
    `SFMO-2027-waiver${competitorId ? `-${competitorId}` : ''}.pdf`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
}

/** Staff only: email a parent or guardian their signing link again. */
export async function resendWaiverLink(token: string): Promise<{ sent: boolean; message: string }> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('send-confirmation', {
    body: { resend_waiver: token },
  });
  if (!error && data?.sent) return { sent: true, message: `Sent the signing link to ${data.to}.` };
  return { sent: false, message: await functionError(error, data, 'Could not send the link.') };
}

/** Staff only: tell both teams' captains and guardians about a merge. */
export async function sendMergeNotice(fromCode: string): Promise<{ sent: boolean; message: string }> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('send-confirmation', {
    body: { merge_notice: fromCode },
  });
  if (!error && data?.sent) return { sent: true, message: `Emailed ${data.emails} people about the change.` };
  return { sent: false, message: await functionError(error, data, 'Could not send the emails.') };
}

/** The signing link a parent or guardian receives, for staff to copy. */
export function waiverSigningLink(token: string): string {
  return new URL(`waiver?t=${token}`, window.location.origin + import.meta.env.BASE_URL).toString();
}
