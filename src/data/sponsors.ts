/**
 * SFMO 2027 sponsors, shown on the landing page.
 *
 * Add a sponsor by dropping its logo in public/sponsors/ (transparent PNG)
 * and adding a row here. Tiers render in TIER_ORDER, and a tier with no
 * sponsors renders nothing — so a gold sponsor appears at the top the moment
 * one is added, with no layout change.
 *
 * Past editions' sponsors live with their event in src/data/archive.ts.
 */

/** A presenting sponsor is billed with the event itself ("presented by"),
 * in the hero as well as at the top of the sponsor wall. */
export type SponsorTier = 'presenting' | 'gold' | 'silver' | 'bronze';

export type CurrentSponsor = {
  name: string;
  tier: SponsorTier;
  url: string;
  /** Filename in public/sponsors/. */
  logo: string;
  /**
   * Override the light logo plate, for a mark designed for a dark ground
   * (white text that would vanish on the default plate). `foreground` colours
   * the name shown if the logo fails to load.
   */
  plate?: { background: string; foreground: string };
};

export const TIER_ORDER: SponsorTier[] = ['presenting', 'gold', 'silver', 'bronze'];

export const TIER_LABEL: Record<SponsorTier, string> = {
  presenting: 'Presenting sponsor',
  gold: 'Gold sponsors',
  silver: 'Silver sponsors',
  bronze: 'Bronze sponsors',
};

export const sfmo2027Sponsors: CurrentSponsor[] = [
  {
    name: 'X-Camp Academy',
    tier: 'presenting',
    url: 'https://x-camp.academy/',
    logo: 'xcamp.webp',
  },
  {
    name: 'PiMath',
    tier: 'gold',
    url: 'https://www.paquinmath.org/',
    logo: 'pimath.png',
  },
  {
    name: 'Jane Street',
    tier: 'gold',
    url: 'https://www.janestreet.com/',
    logo: 'janestreet.svg',
  },
  {
    name: 'AwesomeMath',
    tier: 'silver',
    url: 'https://www.awesomemath.org/',
    logo: 'awesomemath.png',
  },
  {
    name: 'Areteem Institute',
    tier: 'silver',
    url: 'https://areteem.org/',
    logo: 'areteem.png',
  },
  {
    name: 'YRI Fellowship',
    tier: 'silver',
    url: 'https://www.yriscience.com/',
    logo: 'yri.png',
  },
  {
    name: 'CodeCrafters',
    tier: 'silver',
    url: 'https://codecrafters.io/',
    logo: 'codecrafters.svg',
  },
  {
    name: 'RISE Research',
    tier: 'silver',
    url: 'https://riseglobaleducation.com/',
    logo: 'rise.png',
  },
  {
    name: 'National Math Camps',
    tier: 'silver',
    url: 'https://nationalmathcamps.org/',
    logo: 'nationalmathcamps.png',
  },
  {
    name: 'Art of Problem Solving',
    tier: 'bronze',
    url: 'https://artofproblemsolving.com/',
    logo: 'aops.png',
  },
  {
    name: '.xyz',
    tier: 'bronze',
    url: 'https://xyz.xyz/',
    logo: 'xyz.png',
  },
  {
    name: 'MehtA+',
    tier: 'bronze',
    url: 'https://mehtaplus.com/',
    logo: 'mehtaplus.png',
  },
];

/** The presenting sponsor, if there is one, for the "presented by" credit. */
export const presentingSponsor = sfmo2027Sponsors.find((sponsor) => sponsor.tier === 'presenting');
