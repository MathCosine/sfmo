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

export type SponsorTier = 'gold' | 'silver' | 'bronze';

export type CurrentSponsor = {
  name: string;
  tier: SponsorTier;
  url: string;
  /** Filename in public/sponsors/. */
  logo: string;
};

export const TIER_ORDER: SponsorTier[] = ['gold', 'silver', 'bronze'];

export const TIER_LABEL: Record<SponsorTier, string> = {
  gold: 'Gold sponsors',
  silver: 'Silver sponsors',
  bronze: 'Bronze sponsors',
};

export const sfmo2027Sponsors: CurrentSponsor[] = [
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
    name: 'Art of Problem Solving',
    tier: 'bronze',
    url: 'https://artofproblemsolving.com/',
    logo: 'aops.png',
  },
];
