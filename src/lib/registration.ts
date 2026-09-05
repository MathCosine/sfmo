import { readErrorMessage, requireSupabase, supabase } from './supabase';
import { sfmo2027 } from './config';

export type MemberInput = {
  full_name: string;
  email: string;
  grade: string;
  school: string;
};

export type TeamInput = {
  team_name: string;
  division: string;
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
  division: string | null;
  status: string;
  contact_email: string;
  created_at: string;
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

export function emptyMember(): MemberInput {
  return { full_name: '', email: '', grade: '', school: '' };
}

export function emptyTeam(): TeamInput {
  return {
    team_name: '',
    division: '',
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
