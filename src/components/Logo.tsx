/**
 * SFMO mark — the Golden Gate towers with a sigma slung beneath the span,
 * redrawn on a pixel grid so it belongs to the same family as the display
 * type. The original line-art logo dissolves into grey mush at nav size;
 * this keeps the silhouette readable down to about 30px tall.
 *
 * Geometry is a list of [x, y, width, height] rectangles in grid cells,
 * which is much easier to keep correct than an ASCII map. Sizing goes
 * through `scale` (px per cell) so cells always land on whole pixels and
 * the art never renders half-lit.
 */

type Rect = [x: number, y: number, width: number, height: number];

const COLS = 24;
const ROWS = 18;

const BRIDGE: Rect[] = [
  // Left tower: two legs, a cap and a crossbeam — the detail that reads
  // as "Golden Gate" rather than "goalposts".
  [5, 2, 1, 13],
  [7, 2, 1, 13],
  [5, 2, 3, 1],
  [5, 6, 3, 1],
  // Right tower.
  [16, 2, 1, 13],
  [18, 2, 1, 13],
  [16, 2, 3, 1],
  [16, 6, 3, 1],
  // Side cables, sweeping up from the anchorages to each tower top.
  [0, 8, 1, 1],
  [1, 7, 1, 1],
  [2, 6, 1, 1],
  [3, 5, 1, 1],
  [4, 4, 1, 1],
  [19, 4, 1, 1],
  [20, 5, 1, 1],
  [21, 6, 1, 1],
  [22, 7, 1, 1],
  [23, 8, 1, 1],
  // Main cable, sagging deeply between the towers.
  [8, 4, 1, 1],
  [9, 6, 1, 1],
  [10, 8, 1, 1],
  [11, 9, 1, 1],
  [12, 9, 1, 1],
  [13, 8, 1, 1],
  [14, 6, 1, 1],
  [15, 4, 1, 1],
  // Two suspenders dropping from the cable to the roadway.
  [9, 7, 1, 4],
  [14, 7, 1, 4],
  // Roadway deck.
  [0, 11, 24, 1],
];

// Σ, hung in the arch below the span.
const SIGMA: Rect[] = [
  [9, 12, 5, 1],
  [10, 13, 1, 1],
  [11, 14, 1, 1],
  [10, 15, 1, 1],
  [9, 16, 5, 1],
];

type Props = {
  /** Pixels per grid cell. Whole numbers keep the art crisp. */
  scale?: number;
  className?: string;
  /** Colour of the bridge structure. Defaults to the current text colour. */
  color?: string;
  /** Colour of the sigma. Defaults to the submarine yellow. */
  accent?: string;
  /** Supplying a title makes the mark a labelled image rather than decoration. */
  title?: string;
};

export function Logo({
  scale = 2,
  className,
  color = 'currentColor',
  accent = 'var(--sub)',
  title,
}: Props) {
  return (
    <svg
      className={className}
      width={COLS * scale}
      height={ROWS * scale}
      viewBox={`0 0 ${COLS} ${ROWS}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <g fill={color}>
        {BRIDGE.map(([x, y, w, h], index) => (
          <rect key={index} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g fill={accent}>
        {SIGMA.map(([x, y, w, h], index) => (
          <rect key={index} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  );
}
