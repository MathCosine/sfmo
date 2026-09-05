import { useState } from 'react';
import { asset } from '../lib/asset';

/**
 * A slot for a hand-drawn PNG in public/art.
 *
 * The layout is built assuming the drawing exists, but the component removes
 * itself entirely if the file is missing — so a new illustration goes live by
 * committing the file under the right name, with no code change, and a slot
 * that has not been drawn yet leaves no gap or broken-image icon behind.
 */
export function Art({
  name,
  className,
  alt = '',
  width,
}: {
  /** Filename without extension, e.g. "anglerfish" for public/art/anglerfish.png */
  name: string;
  className?: string;
  /** Leave empty for decoration; set it when the drawing carries meaning. */
  alt?: string;
  width?: number;
}) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;

  return (
    <img
      src={asset(`art/${name}.png`)}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
      loading="lazy"
      decoding="async"
      width={width}
      onError={() => setMissing(true)}
    />
  );
}
