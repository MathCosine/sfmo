/**
 * The two documents behind registration.
 *
 * The liability waiver itself lives in public/legal/<id>.json (see
 * waiverDoc in src/lib/config.ts): parents and guardians read and sign that
 * text at /waiver, and the signed PDF prints it. What is here is only the
 * plain-language summary shown on the registration page — keep it consistent
 * with the JSON whenever either changes.
 *
 * The media release is accepted by the team captain at registration, and its
 * full text is here.
 */
import type { PixelIconName } from '../components/PixelIcon';

export const MEDIA_RELEASE_GIST =
  'We may photograph the day and use the photos, unpaid, on our website, social media and other materials promoting our competitions.';

export const MEDIA_RELEASE =
  'During SFMO 2027 the San Francisco Math Initiative may take a limited number of photographs of competitors and teams. By signing below, the team captain grants the San Francisco Math Initiative permission to keep these photographs and to use them, without payment, on our website, on social media and in other materials promoting our competitions, now and in the future, and releases the San Francisco Math Initiative from any claims arising from that use.';

export type Clause = { title: string; icon: PixelIconName; text: string };

/** Matches `summary` in the waiver JSON. */
export const WAIVER_GIST =
  'Your competitor may take part; you accept the risks of a day-long event; you release the organizers, sponsors and venue from claims except gross negligence or willful misconduct; and staff may arrange emergency medical care if you cannot be reached.';

/** The waiver's main points, section by section. A summary, not the waiver. */
export const WAIVER_KEY_POINTS: Clause[] = [
  {
    title: 'Permission',
    icon: 'check',
    text: 'The competitor may take part in SFMO 2027, in person or online. Taking part is voluntary.',
  },
  {
    title: 'Risks',
    icon: 'warn',
    text: 'You accept the risks of a day-long event — travel, falls, crowded rooms, food and allergies, illness — including those from ordinary negligence.',
  },
  {
    title: 'Release',
    icon: 'shield',
    text: 'You release the organizers, sponsors and venue from claims, except for gross negligence or willful misconduct.',
  },
  {
    title: 'Medical care',
    icon: 'cross',
    text: 'Tell us about medical needs beforehand. If we cannot reach you in an emergency, staff may arrange care, at your cost.',
  },
  {
    title: 'Supervision',
    icon: 'eye',
    text: 'We supervise the competition rooms during sessions. Before check-in, after the awards, off-site and online, the competitor is your responsibility.',
  },
  {
    title: 'Conduct',
    icon: 'star',
    text: 'The competitor follows the rules and staff instructions. We may remove anyone who breaks the rules or endangers others.',
  },
  {
    title: 'Signing online',
    icon: 'doc',
    text: 'You sign by typing your name. We record when and from what browser, and email you the signed PDF.',
  },
  {
    title: 'Law',
    icon: 'scales',
    text: 'California law applies. If one part is unenforceable, the rest still stands.',
  },
];
