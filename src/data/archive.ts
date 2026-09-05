/** Past editions, rendered on the Archive page. Newest first. */

export type ScheduleEntry = { time: string; title: string; detail: string };
export type DivisionEntry = { name: string; detail: string };
export type RoundEntry = { name: string; detail: string; meta?: string };
export type FactEntry = { label: string; value: string };

/**
 * A sponsor renders as a typeset plate until a logo file exists, at which
 * point the logo takes over. `logo` is a filename in public/sponsors/.
 */
export type Sponsor = { name: string; logo?: string; url?: string };

export type PastEvent = {
  id: string;
  code: string;
  name: string;
  fullName: string;
  dateLabel: string;
  locationLabel: string;
  headline: string;
  summary: string;
  stats: FactEntry[];
  divisions?: DivisionEntry[];
  rounds?: RoundEntry[];
  highlights?: RoundEntry[];
  schedule?: ScheduleEntry[];
  scheduleNote?: string;
  facts?: FactEntry[];
  testimonial?: { quote: string; attribution: string };
  chips?: string[];
  sponsors?: Sponsor[];
};

export const pastEvents: PastEvent[] = [
  {
    id: 'sfpo-2026',
    code: 'SFPO',
    name: 'SFPO 2026',
    fullName: 'San Francisco Proof Open',
    dateLabel: 'Held August 29th, 2026',
    locationLabel: 'Online — Worldwide',
    headline: 'San Francisco Proof Open 2026',
    summary:
      'A team-based proof-writing competition for grades 5–12, featuring two divisions, individual proof problems, and a fast-paced Guts Round. Thank you to every student, coach, volunteer, and supporter who made SFPO possible!',
    stats: [
      { label: 'Divisions', value: '2' },
      { label: 'Team members', value: '4' },
    ],
    divisions: [
      { name: 'Division A', detail: 'Advanced — three challenging proof problems' },
      { name: 'Division B', detail: 'Intermediate — five accessible proof problems' },
    ],
    highlights: [
      { name: 'Proof Writing', detail: 'Olympiad-style problems' },
      { name: 'Team Competition', detail: 'Collaborate with friends' },
      { name: 'Guts Round', detail: '27 rapid-fire problems' },
    ],
    facts: [
      { label: 'Date', value: 'August 29, 2026' },
      { label: 'Format', value: 'Online worldwide' },
      { label: 'Individual round', value: '2 hours' },
      { label: 'Guts Round', value: '1 hour 30 minutes' },
    ],
    testimonial: {
      quote: "This competition is so woooow and the best I've ever done!",
      attribution: 'RY, SFPO participant',
    },
  },
  {
    id: 'sfm3-2026',
    code: 'SFM3',
    name: 'SFM3 2026',
    fullName: 'Mini Math Meet',
    dateLabel: 'Held May 2nd, 2026',
    locationLabel: 'Online — Worldwide',
    headline: 'San Francisco Mini Math Meet 2026',
    summary:
      'A free, full-day online competition for grades 3–12, run by the SFMO team. Two divisions (Middle School and High School), three exciting rounds, and over $1,000 in prizes. Thank you to every student, coach, and volunteer who joined us!',
    stats: [
      { label: 'Divisions', value: '2' },
      { label: 'Rounds', value: '3' },
    ],
    divisions: [
      { name: 'Middle School Division', detail: 'Grades 3 – 8 — open to all' },
      { name: 'High School Division', detail: 'Grades 9 – 12 — non-USAJMO qualifiers' },
    ],
    rounds: [
      {
        name: 'Individual Round',
        detail: 'Test your personal problem-solving skills across a range of difficulty levels.',
        meta: '20 problems in 60 minutes',
      },
      {
        name: 'Team Round',
        detail: 'Collaborate with teammates to tackle challenging multi-part problems together.',
        meta: '15 problems in 45 minutes',
      },
      {
        name: 'Elimination Round',
        detail:
          'A fast-paced head-to-head Math Bowl–style round where the best mathematicians rise to the top.',
        meta: 'Single-elimination bracket • 5 questions per match • Best of 5 wins • Tiebreaker rounds resolve ties',
      },
    ],
    scheduleNote: 'Event Day Schedule (PST)',
    schedule: [
      { time: '9:30 — 10:00 PST', title: 'Check-in', detail: 'Meeting opens, competitor check-in begins' },
      {
        time: '10:00 — 10:30 PST',
        title: 'Opening Ceremony',
        detail: 'Welcome, instructions, and competition overview',
      },
      { time: '10:30 — 11:45 PST', title: 'Individual Round', detail: '20 problems in 60 minutes' },
      { time: '11:45 — 12:30 PST', title: 'Lunch Break', detail: 'Take a breather and refuel' },
      { time: '12:30 — 1:30 PST', title: 'Team Round', detail: '15 problems in 45 minutes' },
      {
        time: '1:30 — 3:30 PST',
        title: 'Elimination Rounds',
        detail: 'Math-bowl style single-elimination matches',
      },
    ],
    sponsors: [
      { name: 'San Francisco Math Academy', url: 'https://sfmathacademy.replit.app/' },
      { name: 'thomas.tidy' },
    ],
  },
  {
    id: 'sfmo-2026',
    code: 'SFMO',
    name: 'SFMO 2026',
    fullName: 'San Francisco Math Open',
    dateLabel: 'Held 2026',
    locationLabel: 'Online',
    headline: 'San Francisco Math Open 2026',
    summary:
      'The inaugural San Francisco Math Open brought together over 80 talented competitors and distributed over $2,000 in prizes — a celebration of mathematical curiosity and community. Thank you to the sponsors below who made it possible.',
    stats: [
      { label: 'Competitors', value: '80+' },
      { label: 'In Prizes', value: '$2K+' },
    ],
    chips: ['Inaugural Edition', 'Online Format', 'Multi-Round Competition'],
    sponsors: [
      { name: 'Art of Problem Solving', url: 'https://artofproblemsolving.com/' },
      { name: 'AwesomeMath', url: 'https://www.awesomemath.org/' },
      { name: 'Wolfram', url: 'https://www.wolfram.com/' },
      { name: 'MathGauss' },
      { name: 'ARETEEM Institute' },
      { name: 'Leading Aces Academy' },
    ],
  },
];
