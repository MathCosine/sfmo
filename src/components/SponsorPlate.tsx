import { useState } from 'react';
import type { Sponsor } from '../data/archive';
import { asset } from '../lib/asset';

/**
 * Shows a sponsor's logo when one has been added to public/sponsors/, and a
 * typeset plate otherwise — so a missing logo reads as a design choice
 * rather than a hole in the page.
 */
export function SponsorPlate({ sponsor }: { sponsor: Sponsor }) {
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(sponsor.logo) && !failed;

  const inner = showLogo ? (
    <img
      className="sponsors__logo"
      src={asset(`sponsors/${sponsor.logo}`)}
      alt={sponsor.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    sponsor.name
  );

  if (sponsor.url) {
    return (
      <li className="sponsors__item">
        <a href={sponsor.url} target="_blank" rel="noreferrer" className="sponsors__link">
          {inner}
        </a>
      </li>
    );
  }

  return <li className="sponsors__item">{inner}</li>;
}
