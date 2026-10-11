/**
 * The two documents signed at registration. The registration page renders
 * them, and the guardian confirmation email links back to that page — so this
 * file is the one place to edit their wording.
 *
 * DRAFT: the liability waiver has not been reviewed by a lawyer. Have an adult
 * organiser (and ideally your venue's insurer) read it before registration opens.
 *
 * Each document also has a one-line `gist` shown above it. The gist is a
 * plain-language summary only; the full text is what people agree to, so
 * keep the two consistent when editing either.
 */
import type { PixelIconName } from '../components/PixelIcon';

export const MEDIA_RELEASE_GIST =
  'We may photograph the day and use the photos, unpaid, on our website, social media and other materials promoting our competitions.';

export const MEDIA_RELEASE =
  'During SFMO 2027 the San Francisco Math Initiative may take a limited number of photographs of competitors and teams. By signing below, the team captain grants the San Francisco Math Initiative permission to keep these photographs and to use them, without payment, on our website, on social media and in other materials promoting our competitions, now and in the future, and releases the San Francisco Math Initiative from any claims arising from that use.';

export type Clause = { title: string; icon: PixelIconName; text: string };

export const LIABILITY_WAIVER: { gist: string; intro: string; clauses: Clause[]; signing: string } = {
  gist: 'Your competitor may take part; you accept the everyday risks of an event; you release us from claims except for gross negligence or wilful misconduct; and we may arrange urgent medical care if we cannot reach you.',
  intro:
    'Each competitor\'s parent or legal guardian signs this waiver for that competitor. A competitor who is 18 or older signs it for themself. "We" means the San Francisco Math Initiative, its organisers and volunteers.',
  clauses: [
    {
      title: 'Permission',
      icon: 'check',
      text: 'I give permission for the competitor named next to my signature to take part in the San Francisco Math Open 2027 ("SFMO 2027"), in person or online.',
    },
    {
      title: 'Risks',
      icon: 'warn',
      text: 'I understand that taking part carries the ordinary risks of any day-long event — including travel to and from the venue, moving around a shared building, and food eaten during the day — and I accept those risks.',
    },
    {
      title: 'Release',
      icon: 'shield',
      text: 'To the fullest extent the law allows, I release us, our sponsors and the venue from claims for injury, illness, loss or damage arising from the competitor\'s participation, except where caused by gross negligence or wilful misconduct.',
    },
    {
      title: 'Supervision',
      icon: 'eye',
      text: 'At the venue, we supervise the competition rooms during scheduled sessions. Before check-in, after the awards ceremony, any time the competitor leaves the venue, and throughout the online division, the competitor is my responsibility.',
    },
    {
      title: 'Medical care',
      icon: 'cross',
      text: 'If the competitor needs urgent medical care and I cannot be reached, I authorise us to arrange it, and I accept responsibility for its cost. I will tell the organisers about any condition they should know about.',
    },
    {
      title: 'Conduct',
      icon: 'star',
      text: 'The competitor will follow the competition rules and staff instructions. We may remove a competitor whose conduct endangers others or breaks the rules.',
    },
    {
      title: 'Law',
      icon: 'scales',
      text: 'This waiver is governed by the laws of the State of California. If any part of it is unenforceable, the rest still applies.',
    },
  ],
  signing:
    'Typing your full name below is your signature, with the same effect as signing by hand.',
};
