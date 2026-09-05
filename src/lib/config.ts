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
  email: 'sanfranciscomathopen@gmail.com',
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

/** Slot letters a team's members are assigned, in order. */
export const SLOT_LETTERS = ['A', 'B', 'C', 'D'] as const;
export type SlotLetter = (typeof SLOT_LETTERS)[number];
