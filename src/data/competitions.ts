/** The three annual contests — one every season, all free to enter. */

export type Competition = {
  code: string;
  glyph: string;
  name: string;
  kind: string;
  dateLabel: string;
  status: 'upcoming' | 'past';
  blurb: string;
};

export const competitions: Competition[] = [
  {
    code: 'SFMO',
    glyph: 'Open',
    name: 'San Francisco Math Open',
    kind: 'Flagship',
    dateLabel: 'January 2027',
    status: 'upcoming',
    blurb: 'Our flagship competition returns in person to San Francisco next January.',
  },
  {
    code: 'SFM3',
    glyph: 'Mini Meet',
    name: 'San Francisco Mini Math Meet',
    kind: 'Mini Meet',
    dateLabel: 'August 2027',
    status: 'upcoming',
    blurb: 'A free, full-day online meet for grades 3–12 — three rounds, two divisions.',
  },
  {
    code: 'SFPO',
    glyph: 'Proof',
    name: 'San Francisco Proof Open',
    kind: 'Proof',
    dateLabel: 'August 2026',
    status: 'past',
    blurb: 'Our proof-writing competition has concluded — see the SFPO recap in the Archive.',
  },
];

/**
 * Countries past participants have called home.
 *
 * `mapName` must match the name in src/data/worldMap.ts exactly — the two
 * differ for a handful of countries, so it is stated rather than guessed.
 * `home` marks where SFMO itself is run, shaded a tier darker on the map.
 */
export type ParticipantCountry = { label: string; mapName: string; home?: boolean };

export const participantCountries: ParticipantCountry[] = [
  { label: 'USA', mapName: 'United States of America', home: true },
  { label: 'Uzbekistan', mapName: 'Uzbekistan' },
  { label: 'Kazakhstan', mapName: 'Kazakhstan' },
  { label: 'Indonesia', mapName: 'Indonesia' },
  { label: 'China', mapName: 'China' },
  { label: 'Montenegro', mapName: 'Montenegro' },
  { label: 'Romania', mapName: 'Romania' },
  { label: 'India', mapName: 'India' },
  { label: 'Philippines', mapName: 'Philippines' },
  { label: 'Canada', mapName: 'Canada' },
];

export const communityStats = [
  {
    value: '150+',
    label: 'registrants for past contests',
    detail: 'A community of problem solvers and teams from around the world.',
  },
  {
    value: '$5,000+',
    label: 'in prizes for past contests',
    detail: 'Celebrating curiosity, collaboration, and excellent mathematics.',
  },
  {
    value: '10',
    label: 'countries represented',
    detail: 'Our contest community spans continents.',
  },
];
