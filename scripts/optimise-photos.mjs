/**
 * Normalises the portraits in public/crew.
 *
 * Photos uploaded straight from a phone or a screenshot arrive as multi-
 * megabyte PNGs — one of ours was 4.5 MB. They are displayed in a card about
 * 260px wide, so almost all of that is thrown away by the browser after being
 * downloaded. This resizes to a sensible ceiling and writes real JPEG.
 *
 * Idempotent: re-running on already-optimised files is a no-op in practice.
 *
 *   node scripts/optimise-photos.mjs
 */
import { readdir, rename, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = 'public/crew';
/** Cards are ~260px wide; 2x for retina plus headroom for a bigger layout. */
const MAX_WIDTH = 900;
const MAX_HEIGHT = 1200;
const QUALITY = 82;

const files = (await readdir(DIR)).filter((name) => /\.(jpe?g|png)$/i.test(name));
let before = 0;
let after = 0;

for (const name of files) {
  const path = join(DIR, name);
  const original = (await stat(path)).size;
  before += original;

  const image = sharp(path);
  const meta = await image.metadata();

  // Never upscale — a 204px source stays 204px rather than being blurred up.
  const resized =
    meta.width && meta.height && (meta.width > MAX_WIDTH || meta.height > MAX_HEIGHT)
      ? image.resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
      : image;

  const tmp = `${path}.tmp`;
  await resized
    // Flatten onto white: some sources have alpha, which JPEG cannot carry.
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toFile(tmp);

  const optimised = (await stat(tmp)).size;
  if (optimised < original) {
    await unlink(path);
    await rename(tmp, path);
    after += optimised;
    console.log(
      `${name.padEnd(16)} ${meta.width}x${meta.height} ${fmt(original)} -> ${fmt(optimised)}`,
    );
  } else {
    await unlink(tmp);
    after += original;
    console.log(`${name.padEnd(16)} ${meta.width}x${meta.height} ${fmt(original)} (kept)`);
  }
}

console.log(`\nTotal ${fmt(before)} -> ${fmt(after)}`);

function fmt(bytes) {
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)}MB` : `${Math.round(bytes / 1e3)}KB`;
}
