/**
 * A stepped, pixel-art wave used as the divider between sections.
 * Deliberately blocky: it ties the pixel display type to the sea theme and
 * reads as drawn rather than generated. Tiles horizontally at a fixed pixel
 * size so the squares never distort on wide screens.
 */

const COLUMN = 10;
const UNIT = 5;
/** Column heights in UNIT multiples — one period of a wave, hand-tuned. */
const HEIGHTS = [4, 4, 5, 6, 6, 6, 5, 4, 4, 3, 2, 1, 1, 1, 2, 3];

const TILE_WIDTH = COLUMN * HEIGHTS.length;
const TILE_HEIGHT = Math.max(...HEIGHTS) * UNIT;

type Props = {
  /** Body colour of the wave — usually the section it is flowing into. */
  fill?: string;
  /** Lighter cap on each column, for a two-tone printed look. */
  crest?: string;
  flip?: boolean;
  className?: string;
};

export function PixelWave({
  fill = 'var(--ink)',
  crest = 'var(--sub)',
  flip = false,
  className = '',
}: Props) {
  const id = flip ? 'pixel-wave-flip' : 'pixel-wave';

  return (
    <svg
      className={`pixel-wave ${flip ? 'pixel-wave--flip' : ''} ${className}`.trim()}
      width="100%"
      height={TILE_HEIGHT}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <defs>
        <pattern id={id} width={TILE_WIDTH} height={TILE_HEIGHT} patternUnits="userSpaceOnUse">
          {HEIGHTS.map((height, index) => {
            const x = index * COLUMN;
            const y = TILE_HEIGHT - height * UNIT;
            return (
              <g key={index}>
                <rect x={x} y={y} width={COLUMN} height={height * UNIT} fill={fill} />
                <rect x={x} y={y} width={COLUMN} height={UNIT} fill={crest} />
              </g>
            );
          })}
        </pattern>
      </defs>
      <rect width="100%" height={TILE_HEIGHT} fill={`url(#${id})`} />
    </svg>
  );
}
