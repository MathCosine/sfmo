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
  academy: 'https://sfmathacademy.replit.app/',
  academyTutoring: 'https://sfmathacademy.replit.app/book-tutoring',
  academyCamp: 'https://sfmathacademy.replit.app/camp',
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

/** SFMO 2027 round format. Times are the working duration, not including breaks. */
export const rounds: Round[] = [
  {
    code: 'I',
    name: 'Individual',
    detail: '20 problems',
    minutes: 90,
    blurb:
      'Short-answer problems climbing steadily in difficulty. Sit it alone — this is the round that separates the field.',
  },
  {
    code: 'G',
    name: 'Guts',
    detail: '9 sets of 4',
    minutes: 90,
    blurb:
      'Sets are handed out one at a time and you only move on once the set is in. Fast, loud, and the best spectator round we run.',
  },
  {
    code: 'T',
    name: 'Team',
    detail: '10 problems',
    minutes: 60,
    blurb:
      'Harder than the Individual round and meant to be split up. Four heads, one answer sheet, one hour.',
  },
  {
    code: '?',
    name: 'Mystery Dive',
    detail: 'Format revealed on the day',
    minutes: 60,
    blurb:
      'Team-based, and that is all we are saying. You will find out what it is when everyone else does.',
    mystery: true,
  },
];

/** Frequently asked questions shown on the landing page. */
export const faq = [
  {
    q: 'How much does it cost?',
    a: 'Nothing. Every contest we have run has been free to enter, and SFMO 2027 is no exception. Tutoring and camp proceeds from our Academy fund the prizes instead of entry fees.',
  },
  {
    q: 'Do I need a full team of four?',
    a: 'No. You can register with fewer and we will do our best to pair you up, though a full team of four is the intended experience — the Team and Mystery Dive rounds are built around it.',
  },
  {
    q: 'Who can compete?',
    a: 'Any student who wants to. There is no qualification requirement and no geographic restriction on who may register.',
  },
  {
    q: 'What should we bring?',
    a: 'Pencils and yourselves. No calculators, no notes, no phones during rounds. Scratch paper is provided.',
  },
  {
    q: 'When is the exact date and venue?',
    a: 'Both are announced with registration on October 24, 2026. It is a single full day in January 2027, in San Francisco.',
  },
  {
    q: 'How do the competitor IDs work?',
    a: 'Your team gets a two-digit number when you register — say 07 — and each member is assigned a letter, so you compete as 07A through 07D. Write yours on every answer sheet.',
  },
] as const;

/** Slot letters a team's members are assigned, in order. */
export const SLOT_LETTERS = ['A', 'B', 'C', 'D'] as const;
export type SlotLetter = (typeof SLOT_LETTERS)[number];
