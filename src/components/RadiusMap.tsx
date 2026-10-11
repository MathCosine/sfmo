import { IN_PERSON_RADIUS_MILES } from '../lib/config';

/**
 * The distance rule as a sonar screen: San Francisco at the centre, the
 * 100-mile ring drawn to scale, and real cities placed by latitude and
 * longitude. Cities inside the ring compete in person; outside, online.
 *
 * Positions use an equirectangular projection around San Francisco, which is
 * accurate to well under a mile at these distances.
 */
const ORIGIN = { lat: 37.7749, lon: -122.4194 };
const MILES_PER_DEG_LAT = 69.0;
const MILES_PER_DEG_LON = 69.17 * Math.cos((ORIGIN.lat * Math.PI) / 180);

type Place = { name: string; lat: number; lon: number; side?: 'left' | 'below' };

/** Chosen to be clearly inside or clearly outside, never near the line.
 *  Coastal labels sit on the ocean side, where there is room. */
const PLACES: Place[] = [
  { name: 'Sacramento', lat: 38.5816, lon: -121.4944 },
  { name: 'San Jose', lat: 37.3382, lon: -121.8863 },
  { name: 'Santa Cruz', lat: 36.9741, lon: -122.0308, side: 'left' },
  { name: 'Monterey', lat: 36.6002, lon: -121.8947, side: 'left' },
  { name: 'Reno', lat: 39.5296, lon: -119.8138, side: 'left' },
  { name: 'Fresno', lat: 36.7378, lon: -119.7871, side: 'below' },
];

/** One unit = one mile. */
function locate(place: Place) {
  const x = (place.lon - ORIGIN.lon) * MILES_PER_DEG_LON;
  const y = -(place.lat - ORIGIN.lat) * MILES_PER_DEG_LAT;
  return { ...place, x, y, miles: Math.round(Math.hypot(x, y)) };
}

const located = PLACES.map(locate);
const R = IN_PERSON_RADIUS_MILES;
const SCREEN = 200;

export function RadiusMap() {
  return (
    <svg
      className="sonar"
      viewBox={`${-SCREEN - 6} ${-SCREEN - 6} ${2 * SCREEN + 12} ${2 * SCREEN + 12}`}
      role="img"
      aria-labelledby="sonar-title sonar-desc"
    >
      <title id="sonar-title">The {R}-mile rule, to scale</title>
      <desc id="sonar-desc">
        {`A ring ${R} miles around San Francisco. Inside it, competing in person: ${located
          .filter((p) => p.miles <= R)
          .map((p) => `${p.name} (${p.miles} miles)`)
          .join(', ')}. Outside it, competing online: ${located
          .filter((p) => p.miles > R)
          .map((p) => `${p.name} (${p.miles} miles)`)
          .join(', ')}.`}
      </desc>
      <defs>
        <radialGradient id="sonar-glow">
          <stop offset="0%" stopColor="var(--sonar-ring)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--sonar-ring)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sonar-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--sonar-ring)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--sonar-ring)" stopOpacity="0.32" />
        </linearGradient>
        <clipPath id="sonar-clip">
          <circle r={SCREEN} />
        </clipPath>
      </defs>

      <circle r={SCREEN + 4} className="sonar__bezel" />
      <circle r={SCREEN} className="sonar__screen" />

      <g clipPath="url(#sonar-clip)">
        {/* Grid: rings every 50 miles and crosshairs. */}
        {[50, 150].map((r) => (
          <circle key={r} r={r} className="sonar__grid" />
        ))}
        <line x1={-SCREEN} x2={SCREEN} y1={0} y2={0} className="sonar__grid" />
        <line y1={-SCREEN} y2={SCREEN} x1={0} x2={0} className="sonar__grid" />

        <circle r={R} fill="url(#sonar-glow)" />
        <path
          className="sonar__sweep"
          d={`M0 0 L${SCREEN} 0 A${SCREEN} ${SCREEN} 0 0 0 ${SCREEN * Math.cos(-Math.PI / 5)} ${SCREEN * Math.sin(-Math.PI / 5)} Z`}
          fill="url(#sonar-sweep)"
        />
        <text x={-112} y={-150} className="sonar__sea">
          PACIFIC
        </text>
      </g>

      {/* The rule itself. */}
      <circle r={R} className="sonar__ring" />
      {/* Left of centre, clear of Reno's label in the north-east. */}
      <text x={-30} y={-R - 9} className="sonar__ring-label" textAnchor="middle">
        {R} MILES
      </text>

      {located.map((place) => {
        const inside = place.miles <= R;
        const left = place.side === 'left';
        const below = place.side === 'below';
        const anchor = below ? 'middle' : left ? 'end' : 'start';
        const tx = below ? 0 : left ? -11 : 11;
        return (
          <g key={place.name} transform={`translate(${place.x.toFixed(1)} ${place.y.toFixed(1)})`}>
            <rect
              x={-5}
              y={-5}
              width={10}
              height={10}
              className={inside ? 'sonar__dot' : 'sonar__dot sonar__dot--out'}
            />
            <text x={tx} y={below ? 22 : -1} textAnchor={anchor} className="sonar__name">
              {place.name}
            </text>
            <text
              x={tx}
              y={below ? 35 : 12}
              textAnchor={anchor}
              className={inside ? 'sonar__miles' : 'sonar__miles sonar__miles--out'}
            >
              {place.miles} mi
              <tspan className="sonar__verdict"> · {inside ? 'in person' : 'online'}</tspan>
            </text>
          </g>
        );
      })}

      {/* San Francisco: the origin. */}
      <rect x={-8} y={-8} width={16} height={16} className="sonar__home" />
      <rect x={-8} y={-8} width={16} height={16} className="sonar__ping" />
      <text x={-14} y={4} textAnchor="end" className="sonar__name sonar__name--home">
        San Francisco
      </text>
    </svg>
  );
}
