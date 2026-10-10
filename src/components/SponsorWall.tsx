import { useState } from 'react';
import {
  TIER_LABEL,
  TIER_ORDER,
  sfmo2027Sponsors,
  type CurrentSponsor,
} from '../data/sponsors';
import { asset } from '../lib/asset';
import { links } from '../lib/config';
import { ExternalIcon } from './Icons';

function SponsorCard({ sponsor }: { sponsor: CurrentSponsor }) {
  // A mistyped logo filename shows the name instead of a broken image.
  const [failed, setFailed] = useState(false);

  return (
    <a
      className={`sponsor-card sponsor-card--${sponsor.tier}`}
      href={sponsor.url}
      target="_blank"
      rel="noreferrer"
    >
      {/* Logo plates stay light in both themes: brand marks are drawn for a
          light ground, and AoPS navy or Areteem black vanish on dark blue. */}
      <span
        className="sponsor-card__plate"
        style={
          sponsor.plate
            ? { background: sponsor.plate.background, color: sponsor.plate.foreground }
            : undefined
        }
      >
        {failed ? (
          <span className="sponsor-card__fallback">{sponsor.name}</span>
        ) : (
          <img
            className="sponsor-card__logo"
            src={asset(`sponsors/${sponsor.logo}`)}
            alt={sponsor.name}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </span>
      <span className="sponsor-card__foot">
        <span className="sponsor-card__name">{sponsor.name}</span>
        <span className="sponsor-card__visit label">
          Visit <ExternalIcon size={11} />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </span>
      </span>
    </a>
  );
}

export function SponsorWall() {
  const tiers = TIER_ORDER.map((tier) => ({
    tier,
    sponsors: sfmo2027Sponsors.filter((sponsor) => sponsor.tier === tier),
  })).filter((group) => group.sponsors.length > 0);

  if (tiers.length === 0) return null;

  return (
    <section className="section sponsors-wall" aria-labelledby="sponsors-heading">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Made possible by</p>
          <h2 id="sponsors-heading">SFMO 2027 Sponsors</h2>
          <p className="lede">
            Entry is free because these organisations help fund the prizes. Thank you.
          </p>
        </div>

        {tiers.map(({ tier, sponsors }) => (
          <div className="sponsor-tier" key={tier}>
            <h3 className={`sponsor-tier__label sponsor-tier__label--${tier}`}>
              {TIER_LABEL[tier]}
            </h3>
            <div className={`sponsor-grid sponsor-grid--${tier}`}>
              {sponsors.map((sponsor) => (
                <SponsorCard sponsor={sponsor} key={sponsor.name} />
              ))}
            </div>
          </div>
        ))}

        <p className="sponsors-wall__cta">
          Interested in sponsoring SFMO 2027?{' '}
          <a href={`mailto:${links.email}?subject=Sponsoring%20SFMO%202027`}>Email us</a>.
        </p>
      </div>
    </section>
  );
}
