import { useState } from 'react';
import { asset } from '../lib/asset';

type Props = {
  slug: string;
  name: string;
  position?: string;
  contain?: boolean;
};

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Portraits live in public/crew/<slug>.jpg. If one is missing the card falls
 * back to a pixel monogram rather than a broken image, so the page is never
 * waiting on a photo to look finished.
 */
export function Portrait({ slug, name, position = '50% 25%', contain = false }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="portrait portrait--fallback" aria-hidden="true">
        <span className="pixel">{initials(name)}</span>
      </div>
    );
  }

  return (
    <img
      className="portrait"
      src={asset(`crew/${slug}.jpg`)}
      alt={name}
      loading="lazy"
      decoding="async"
      style={{ objectPosition: position, objectFit: contain ? 'contain' : 'cover' }}
      onError={() => setFailed(true)}
    />
  );
}
