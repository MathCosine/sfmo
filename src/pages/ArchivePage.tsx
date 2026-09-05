import { useState } from 'react';
import { ExternalIcon } from '../components/Icons';
import { SeoHead } from '../components/SeoHead';
import { SponsorPlate } from '../components/SponsorPlate';
import { pastEvents, type PastEvent } from '../data/archive';
import { advancedResources, problemSets, resources } from '../data/resources';

function EventSection({ event }: { event: PastEvent }) {
  return (
    <article className="dive" id={event.id}>
      <header className="dive__head">
        <div className="dive__badge pixel">{event.code}</div>
        <div>
          <h2>{event.headline}</h2>
          <p className="dive__meta mono">
            {event.dateLabel} · {event.locationLabel}
          </p>
        </div>
        <div className="dive__stats">
          {event.stats.map((stat) => (
            <div className="dive__stat" key={stat.label}>
              <span className="dive__stat-value pixel">{stat.value}</span>
              <span className="dive__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      <p className="dive__summary">{event.summary}</p>

      {event.chips && (
        <div className="tag-row dive__chips">
          {event.chips.map((chip) => (
            <span className="badge" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      )}

      {event.divisions && (
        <div className="grid grid--2 dive__block">
          {event.divisions.map((division) => (
            <div className="card" key={division.name}>
              <h3 className="card__title">{division.name}</h3>
              <p className="card__body">{division.detail}</p>
            </div>
          ))}
        </div>
      )}

      {event.highlights && (
        <div className="dive__block">
          <h3 className="dive__subhead">Event Highlights</h3>
          <div className="grid grid--3">
            {event.highlights.map((item) => (
              <div className="card" key={item.name}>
                <h4 className="card__title">{item.name}</h4>
                <p className="card__body">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {event.rounds && (
        <div className="dive__block">
          <h3 className="dive__subhead">Competition Rounds</h3>
          <div className="grid grid--3">
            {event.rounds.map((round) => (
              <div className="card" key={round.name}>
                <h4 className="card__title">{round.name}</h4>
                <p className="card__body">{round.detail}</p>
                {round.meta && <p className="dive__round-meta mono">{round.meta}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {event.testimonial && (
        <blockquote className="quote">
          <p>“{event.testimonial.quote}”</p>
          <cite>— {event.testimonial.attribution}</cite>
        </blockquote>
      )}

      {event.facts && (
        <div className="dive__block">
          <h3 className="dive__subhead">{event.code} in Brief</h3>
          <dl className="facts">
            {event.facts.map((fact) => (
              <div className="facts__row" key={fact.label}>
                <dt>{fact.label}</dt>
                <dd className="mono">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {event.schedule && (
        <div className="dive__block">
          <h3 className="dive__subhead">{event.scheduleNote ?? 'Event Day Schedule'}</h3>
          <ol className="schedule">
            {event.schedule.map((entry) => (
              <li className="schedule__row" key={entry.time}>
                <span className="schedule__time mono">{entry.time}</span>
                <span className="schedule__body">
                  <strong>{entry.title}</strong>
                  <span>{entry.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {event.sponsors && (
        <div className="dive__block">
          <h3 className="dive__subhead">{event.name} Sponsors</h3>
          <ul className="sponsors">
            {event.sponsors.map((sponsor) => (
              <SponsorPlate sponsor={sponsor} key={sponsor.name} />
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function EventTabs() {
  const [active, setActive] = useState(pastEvents[0].id);
  const current = pastEvents.find((event) => event.id === active) ?? pastEvents[0];

  /** Left/right arrows move between tabs, as keyboard users expect. */
  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const index = pastEvents.findIndex((item) => item.id === active);
    const next = pastEvents[(index + delta + pastEvents.length) % pastEvents.length];
    setActive(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Past events" onKeyDown={onKeyDown}>
        {pastEvents.map((event) => (
          <button
            key={event.id}
            id={`tab-${event.id}`}
            type="button"
            role="tab"
            className="tabs__tab"
            aria-selected={event.id === active}
            aria-controls={`panel-${event.id}`}
            tabIndex={event.id === active ? 0 : -1}
            onClick={() => setActive(event.id)}
          >
            <span className="tabs__code pixel">{event.code}</span>
            <span className="tabs__meta">
              <strong>{event.name}</strong>
              <small>{event.dateLabel.replace(/^Held /, '')}</small>
            </span>
          </button>
        ))}
      </div>

      <div id={`panel-${current.id}`} role="tabpanel" aria-labelledby={`tab-${current.id}`}>
        <EventSection event={current} />
      </div>
    </>
  );
}

export function ArchivePage() {
  return (
    <>
      <SeoHead
        title="Archive — Past Contests & Resources"
        description="SFPO 2026, SFM3 2026 and SFMO 2026 recaps, past problem sets, and recommended training resources."
      />

      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Past events &amp; resources</p>
          <h1>The Archive</h1>
          <p className="lede">
            A look back at previous editions, plus problem sets and recommended resources to sharpen
            your skills.
          </p>
          <p className="lede archive-hint">
            Three editions so far. Pick one — or jump straight to the{' '}
            <a href="#resources">problem sets and resources</a>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <EventTabs />
        </div>
      </section>

      <section className="section" id="resources">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Problem sets &amp; resources</p>
            <h2>Sharpen your skills</h2>
            <p className="lede">
              Past contest materials and recommended resources. Problem sets are posted here after
              each competition.
            </p>
          </div>

          <div className="grid grid--3">
            {problemSets.map((set) => (
              <article className="card" key={set.title}>
                <h3 className="card__title">{set.title}</h3>
                <p className="card__body">{set.description}</p>
                <div className="card__foot">
                  {set.href ? (
                    <a href={set.href} target="_blank" rel="noreferrer" className="btn btn--primary">
                      {set.actionLabel} <ExternalIcon />
                    </a>
                  ) : (
                    <span className="badge badge--muted">{set.actionLabel}</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="grid grid--2 resource-grid">
            <div className="card card--warm">
              <h3 className="card__title">Foundational training</h3>
              <ul className="link-list">
                {resources.map((resource) => (
                  <li key={resource.url} className={resource.highlight ? 'link-list__star' : ''}>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      {resource.title} <ExternalIcon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card card--warm">
              <h3 className="card__title">Advanced challenges</h3>
              <ul className="link-list">
                {advancedResources.map((resource) => (
                  <li key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      {resource.title} <ExternalIcon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
