import { participantCountries } from '../data/competitions';
import { MAP_HEIGHT, MAP_WIDTH, countryShapes } from '../data/worldMap';

/**
 * Choropleth of where competitors have written our contests from.
 *
 * Three tiers of blue rather than two: unvisited countries sit at a low
 * contrast so they read as context rather than data, participants take a
 * saturated mid blue, and the host country goes a tier deeper again. Colour
 * alone never carries the meaning — the legend and the country list below
 * the map say the same thing in words.
 *
 * Paths are pre-projected at build time (scripts/build-world-map.mjs), so
 * this ships no mapping library.
 */

const participants = new Map(participantCountries.map((c) => [c.mapName, c]));

export function WorldMap() {
  return (
    <figure className="worldmap">
      <svg
        className="worldmap__svg"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-labelledby="worldmap-title"
        preserveAspectRatio="xMidYMid meet"
      >
        <title id="worldmap-title">
          World map highlighting the {participantCountries.length} countries our competitors have
          entered from: {participantCountries.map((c) => c.label).join(', ')}.
        </title>
        {countryShapes.map((shape) => {
          const match = participants.get(shape.name);
          const tier = match ? (match.home ? 'home' : 'participant') : 'quiet';
          return <path key={shape.name} d={shape.d} className={`worldmap__c worldmap__c--${tier}`} />;
        })}
      </svg>

      <figcaption className="worldmap__legend">
        <span className="worldmap__key">
          <i className="worldmap__swatch worldmap__swatch--home" /> Where we run SFMO
        </span>
        <span className="worldmap__key">
          <i className="worldmap__swatch worldmap__swatch--participant" /> Competitors have entered
          from here
        </span>
        <span className="worldmap__key">
          <i className="worldmap__swatch worldmap__swatch--quiet" /> Not yet
        </span>
      </figcaption>
    </figure>
  );
}
