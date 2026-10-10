/**
 * Single source of truth for outward-facing links, dates and org facts.
 * Everything the site says about itself should be edited here, not in JSX.
 */

export const site = {
  name: 'San Francisco Math Initiative',
  shortName: 'SFMI',
  tagline: 'Spreading the joy of mathematics.',
  /** Absolute deployed URL, injected at build time from SITE_URL. */
  url: __SITE_URL__,
} as const;

export const links = {
  discord: 'https://discord.gg/Sdnzv87Jcx',
  instagram: 'https://www.instagram.com/san_francisco_math_initiative/',
  instagramHandle: '@san_francisco_math_initiative',
  mathcloud: 'https://mathcloud.replit.app/',
  academy: 'https://sfmathacademy.com/',
  academyTutoring: 'https://sfmathacademy.com/book-tutoring',
  academyCamp: 'https://sfmathacademy.com/camp',
  /** Contact address shown on the registration and about pages. */
  email: 'sfmathopen@gmail.com',
} as const;

/**
 * SFMO 2027 — the event the whole landing page is about.
 * `registrationOpensAt` gates the registration form; before it, the form
 * renders in a locked state with the date. It is compared in UTC.
 */
export const sfmo2027 = {
  code: 'SFMO',
  year: 2027,
  name: 'San Francisco Math Open',
  edition: 'SFMO 2027',
  theme: 'Under the Sea',
  dateLabel: 'January 2027',
  locationLabel: 'In person · San Francisco',
  registrationOpensAt: '2026-10-24T00:00:00-07:00',
  registrationOpensLabel: 'October 24, 2026',
  maxTeamSize: 4,
  minTeamSize: 1,
} as const;

export type Round = {
  code: string;
  name: string;
  detail: string;
  minutes: number;
  blurb: string;
  /** Format withheld until competition day. */
  mystery?: boolean;
};

/**
 * SFMO 2027 round format, in the order they run on the day. Minutes are the
 * working time; the day schedule below takes each round's slot from here, so
 * changing a round's length here moves every time after it.
 */
export const rounds: Round[] = [
  {
    code: 'I',
    name: 'Individual',
    detail: '20 problems',
    minutes: 60,
    blurb:
      'Short-answer problems climbing steadily in difficulty. Sit it alone — this is the round that separates the field.',
  },
  {
    code: '?',
    name: 'Mystery Dive',
    detail: 'Format revealed on the day',
    minutes: 45,
    blurb:
      'Team-based, and that is all we are saying. You will find out what it is when everyone else does.',
    mystery: true,
  },
  {
    code: 'G',
    name: 'Guts',
    detail: '6 sets of 4',
    minutes: 60,
    blurb:
      'Sets are handed out one at a time and you only move on once the set is in. Fast, loud, and the best spectator round we run.',
  },
];

/** Total time competitors spend on paper, excluding breaks and ceremonies. */
export const totalRoundMinutes = rounds.reduce((sum, round) => sum + round.minutes, 0);

/** The longest round, used to scale the dive-profile bars. */
export const longestRoundMinutes = Math.max(...rounds.map((round) => round.minutes));

function roundMinutes(name: Round['name']): number {
  const round = rounds.find((candidate) => candidate.name === name);
  if (!round) throw new Error(`No round named "${name}" in config.rounds`);
  return round.minutes;
}

export type DaySegment = {
  title: string;
  minutes: number;
  detail: string;
  /** Venue time the public never sees: setup and cleanup. Billed all the same. */
  staffOnly?: boolean;
};

/** When the venue booking starts. Every other time is computed from this. */
export const DAY_START = '08:30';

/**
 * Competition day, in order. The venue bills by the full hour from setup to
 * cleanup, so the day is built to fill exactly 6 hours — not a minute more,
 * since one minute over is charged as another hour.
 *  - Individual and Mystery Dive papers are graded over lunch and during Guts,
 *    so there is no grading wait at the end;
 *  - Guts is scored live, and the awards ceremony opens with the Individual and
 *    Mystery Dive results, so the Guts tally finishes while those are read out.
 * The slack lives in three blocks that can shrink if the day runs late: the
 * opening ceremony absorbs late arrivals, lunch absorbs a slow morning, and the
 * awards ceremony absorbs a slow tally — protecting the 6-hour line.
 */
export const daySchedule: DaySegment[] = [
  { title: 'Setup', minutes: 30, detail: 'Tables, signage, check-in desk.', staffOnly: true },
  { title: 'Doors & check-in', minutes: 30, detail: 'Collect your competitor IDs and find your table.' },
  {
    title: 'Opening ceremony',
    minutes: 20,
    detail: 'Welcome, the honour code, and how Guts works. Read the full rules before you arrive.',
  },
  {
    title: 'Individual round',
    minutes: roundMinutes('Individual'),
    detail: `20 problems, ${roundMinutes('Individual')} minutes, on your own.`,
  },
  { title: 'Short break', minutes: 15, detail: 'Papers in, Mystery Dive out.' },
  {
    title: 'Mystery Dive',
    minutes: roundMinutes('Mystery Dive'),
    detail: `${roundMinutes('Mystery Dive')} minutes. You find out when everyone does.`,
  },
  { title: 'Lunch', minutes: 40, detail: 'Argue about problem 17.' },
  {
    title: 'Guts round',
    minutes: roundMinutes('Guts'),
    detail: `6 sets of 4, ${roundMinutes('Guts')} minutes, live scoreboard.`,
  },
  {
    title: 'Awards ceremony',
    minutes: 30,
    detail: 'Individual and Mystery Dive results first, then Guts and the overall winners.',
  },
  { title: 'Cleanup', minutes: 30, detail: 'Tables down, room handed back.', staffOnly: true },
];

export type TimedSegment = DaySegment & { start: number; end: number };

/** The schedule with start/end times (minutes after midnight) filled in. */
export const timedSchedule: TimedSegment[] = (() => {
  const [hours, minutes] = DAY_START.split(':').map(Number);
  let cursor = hours * 60 + minutes;
  return daySchedule.map((segment) => {
    const timed = { ...segment, start: cursor, end: cursor + segment.minutes };
    cursor = timed.end;
    return timed;
  });
})();

/** Total venue time — what the hourly rate applies to, setup and cleanup included. */
export const venueMinutes = daySchedule.reduce((sum, segment) => sum + segment.minutes, 0);

/** Frequently asked questions shown on the landing page. */
export const faq = [
  {
    q: 'How much does it cost?',
    a: 'Nothing. Every contest we have run has been free to enter, and SFMO 2027 is no exception. Our sponsors and the proceeds from our Academy\'s tutoring and camps fund the prizes instead of entry fees.',
  },
  {
    q: 'Do I need a full team of four?',
    a: 'No. You can register with fewer and we will do our best to pair you up, though a full team of four is the intended experience — the Mystery Dive and Guts rounds are built around it.',
  },
  {
    q: 'Who can compete?',
    a: 'Any student who wants to — there is no qualification requirement. Where you live decides only your division: within 100 miles of the Bay Area you compete in person, and teams farther away can compete online.',
  },
  {
    q: 'What should we bring?',
    a: 'Pencils and yourselves. No calculators, no notes, no phones during rounds. Scratch paper is provided.',
  },
  {
    q: 'Can we compete online?',
    a: 'Only if you live more than 100 miles from the Bay Area. Anyone closer — from San Francisco and the Peninsula to the South Bay, the East Bay, the North Bay, and out as far as Sacramento, Santa Cruz and Monterey — competes in person.',
  },
  {
    q: 'When is the exact date and venue?',
    a: 'The in-person venue is still being finalised; we will announce it, with the exact date, as soon as both are confirmed. It is a single day in January 2027, in San Francisco, finishing in the early afternoon.',
  },
  {
    q: 'How do the competitor IDs work?',
    a: 'Your team gets a two-digit number when you register — say 07 — and each member is assigned a letter, so you compete as 07A through 07D. Write yours on every answer sheet.',
  },
] as const;

/**
 * The two SFMO 2027 divisions. Where a team lives decides which one it enters:
 * see `distanceRule`. Keys match the `division` values stored in Supabase.
 */
export const DIVISIONS = {
  in_person: {
    label: 'In person',
    detail: 'San Francisco · venue still being finalised',
  },
  online: {
    label: 'Online',
    detail: 'For teams living more than 100 miles from the Bay Area',
  },
} as const;

export type Division = keyof typeof DIVISIONS;

export const IN_PERSON_RADIUS_MILES = 100;

/**
 * The distance rule, worded once and shown on the landing page, the FAQ and
 * the registration form. The places named are examples, not the boundary.
 */
export const distanceRule = {
  rule: `If you live within ${IN_PERSON_RADIUS_MILES} miles of the Bay Area, you compete in person.`,
  reach:
    'That covers the whole Bay Area — San Francisco, the Peninsula, the South Bay (Cupertino, Saratoga, San Jose), the East Bay (San Ramon, Oakland, Fremont) and the North Bay — and reaches as far as Sacramento, Santa Cruz and Monterey.',
  online: 'The online division is for teams farther away.',
} as const;

/** Slot letters a team's members are assigned, in order. */
export const SLOT_LETTERS = ['A', 'B', 'C', 'D'] as const;
export type SlotLetter = (typeof SLOT_LETTERS)[number];
