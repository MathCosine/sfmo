import { readErrorMessage, requireSupabase, supabase } from './supabase';
import { sfmo2027, type Division } from './config';

export type MemberInput = {
  full_name: string;
  email: string;
  grade: string;
  school: string;
  /** Parent or guardian who signed this competitor's liability waiver (the
   * competitor themself if 18 or older). Their typed name is the signature. */
  guardian_name: string;
  guardian_email: string;
};

export type DonationMethod = 'zelle' | 'online' | 'checkin';

export type TeamInput = {
  team_name: string;
  /** Empty until the registrant picks one; the form will not submit without it. */
  division: Division | '';
  /** Required for online: no member lives within 100 miles of the Bay Area. */
  distance_attested: boolean;
  /** The captain's media release, given for the whole team. */
  media_release: boolean;
  /** Captain's typed signature; must match a competitor's name on the roster.
   * The same signature confirms the liability waiver. */
  media_release_signed_by: string;
  /** Captain confirms every competitor's guardian has signed the waiver. */
  liability_waiver: boolean;
  /** Whole dollars; null when the team chose not to pledge. Optional. */
  donation_pledge: number | null;
  donation_method: DonationMethod | null;
  school: string;
  city: string;
  state_region: string;
  country: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  coach_name: string;
  coach_email: string;
  notes: string;
  agreed_policies: boolean;
  members: MemberInput[];
};

export type ReceiptMember = {
  slot: string;
  competitor_id: string;
  full_name: string;
  grade: string | null;
};

export type TeamReceipt = {
  team_code: string;
  team_name: string;
  division: Division | null;
  status: string;
  contact_email: string;
  created_at: string;
  donation_pledge: number | null;
  donation_method: DonationMethod | null;
  members: ReceiptMember[];
};

export type RegistrationWindow = {
  open: boolean;
  opensAt: string | null;
  closesAt: string | null;
  maxTeamSize: number;
  announcement: string | null;
  /** True when we could not reach Supabase and fell back to build-time config. */
  offline: boolean;
};

const fallbackWindow: RegistrationWindow = {
  open: false,
  opensAt: sfmo2027.registrationOpensAt,
  closesAt: null,
  maxTeamSize: sfmo2027.maxTeamSize,
  announcement: null,
  offline: true,
};

/**
 * Reads the live open/closed state. Staff flip `registration_open` in the
 * portal, so the date in config.ts is only a fallback for display.
 */
export async function fetchRegistrationWindow(): Promise<RegistrationWindow> {
  if (!supabase) return fallbackWindow;

  const { data, error } = await supabase
    .from('site_settings')
    .select('registration_open, registration_opens_at, registration_closes_at, max_team_size, announcement')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) return fallbackWindow;

  return {
    open: Boolean(data.registration_open),
    opensAt: data.registration_opens_at ?? sfmo2027.registrationOpensAt,
    closesAt: data.registration_closes_at ?? null,
    maxTeamSize: data.max_team_size ?? sfmo2027.maxTeamSize,
    announcement: data.announcement ?? null,
    offline: false,
  };
}

/** True when the window is open AND we are inside its date bounds. */
export function isWindowOpenNow(window: RegistrationWindow, now = new Date()): boolean {
  if (!window.open) return false;
  if (window.opensAt && now < new Date(window.opensAt)) return false;
  if (window.closesAt && now > new Date(window.closesAt)) return false;
  return true;
}

export async function registerTeam(input: TeamInput): Promise<TeamReceipt> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('register_team', { payload: input });

  if (error) {
    throw new Error(readErrorMessage(error, 'Registration failed. Please try again.'));
  }
  return data as TeamReceipt;
}

export async function lookupTeam(teamCode: string, contactEmail: string): Promise<TeamReceipt> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('lookup_team', {
    p_team_code: teamCode,
    p_contact_email: contactEmail,
  });

  if (error) {
    throw new Error(readErrorMessage(error, 'We could not find that team.'));
  }
  return data as TeamReceipt;
}

/**
 * Asks the send-confirmation Edge Function to email the team and each
 * guardian. It only sends once per team, and only for a matching team ID and
 * contact email, so calling it again is harmless. Never throws: registration
 * has already succeeded, and the email is a courtesy on top.
 */
export async function sendConfirmation(teamCode: string, contactEmail: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.functions.invoke('send-confirmation', {
      body: { team_code: teamCode, contact_email: contactEmail },
    });
    return !error && Boolean(data?.sent);
  } catch {
    return false;
  }
}

/**
 * Staff only: sends sample copies of both confirmation emails to the
 * signed-in staff member, to check the email setup while registration is
 * closed. Writes nothing to the database.
 */
export async function sendTestEmail(): Promise<{ sent: boolean; message: string }> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('send-confirmation', {
    body: { test: true },
  });
  if (!error && data?.sent) {
    return { sent: true, message: `Sent ${data.emails} test emails to ${data.to}. Check your inbox and spam folder.` };
  }
  let detail: string = data?.error ?? error?.message ?? 'Unknown error.';
  // A non-2xx reply arrives as an error whose context is the raw response.
  const response = (error as { context?: unknown } | null)?.context;
  if (response instanceof Response) {
    try {
      detail = (await response.json())?.error ?? detail;
    } catch {
      /* not JSON — keep the generic message */
    }
  }
  return { sent: false, message: detail };
}

export function emptyMember(): MemberInput {
  return { full_name: '', email: '', grade: '', school: '', guardian_name: '', guardian_email: '' };
}

export function emptyTeam(): TeamInput {
  return {
    team_name: '',
    division: '',
    distance_attested: false,
    media_release: false,
    media_release_signed_by: '',
    liability_waiver: false,
    donation_pledge: null,
    donation_method: null,
    school: '',
    city: '',
    state_region: '',
    country: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    coach_name: '',
    coach_email: '',
    notes: '',
    agreed_policies: false,
    members: [emptyMember()],
  };
}
