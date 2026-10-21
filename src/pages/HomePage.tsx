import { Link } from 'react-router-dom';
import { Art } from '../components/Art';
import { Bubbles } from '../components/Bubbles';
import { Countdown } from '../components/Countdown';
import { ArrowIcon, DiscordIcon, ExternalIcon } from '../components/Icons';
import { PixelIcon, type PixelIconName } from '../components/PixelIcon';
import { PixelWave } from '../components/PixelWave';
import { Portrait } from '../components/Portrait';
import { SeoHead } from '../components/SeoHead';
import { SponsorWall } from '../components/SponsorWall';
import { pastEvents } from '../data/archive';
import { presentingSponsor } from '../data/sponsors';
import { communityStats, competitions, participantCountryWord } from '../data/competitions';
import { staff } from '../data/staff';
import { asset } from '../lib/asset';
import {
  DIVISIONS,
  IN_PERSON_RADIUS_MILES,
  SLOT_LETTERS,
  distanceRule,
  faq,
  links,
  longestRoundMinutes,
  rounds,
  sfmo2027,
  timedSchedule,
  totalRoundMinutes,
} from '../lib/config';
import { capitalise, clock, formatDuration, numberWord } from '../lib/words';

/** Competitors see doors-to-awards; setup and cleanup are staff-only. */
const publicDay = timedSchedule.filter((segment) => !segment.staffOnly);
const doorsOpen = publicDay[0];
const dayEnds = publicDay[publicDay.length - 1];
const describedRounds = rounds.filter((round) => !round.mystery).length;

/** The essentials, all derived from config so they never drift from it. */
const GLANCE: Array<{
  icon: PixelIconName;
  label: string;
  value: string;
  detail: string;
  link?: { href: string; label: string };
}> = [
  {
    icon: 'clock',
    label: 'When',
    value: sfmo2027.dayLabel,
    detail: `Doors at ${clock(doorsOpen.start)}, done by ${clock(dayEnds.end)}`,
  },
  {
    icon: 'pin',
    label: 'Where',
    value: sfmo2027.venue.name,
    detail: `${sfmo2027.venue.street}, ${sfmo2027.venue.cityLine} · online division for teams ${IN_PERSON_RADIUS_MILES}+ miles away`,
    link: { href: sfmo2027.venue.mapsUrl, label: 'Get directions' },
  },
  {
    icon: 'people',
    label: 'Who',
    value: sfmo2027.eligibility,
    detail: `Eligible to compete, no qualification needed · teams of up to ${sfmo2027.maxTeamSize}`,
  },
  {
    icon: 'star',
    label: 'Rounds',
    value: rounds.map((round) => round.name).join(' · '),
    detail: `${capitalise(formatDuration(totalRoundMinutes))} of problems`,
  },
  {
    icon: 'heart',
    label: 'Cost',
    value: 'Free',
    detail: 'A donation is suggested at registration, and it is completely optional',
  },
  {
    icon: 'trophy',
    label: 'Prizes',
    value: sfmo2027.prizePool,
    detail: 'In prizes, and counting',
  },
  {
    icon: 'idcard',
    label: 'Registration',
    value: `Opens ${sfmo2027.registrationOpensLabel}`,
    detail: 'Every competitor gets an ID the moment you register',
  },
];

/** Oldest first, so the track record reads as a story leading to 2027. */
const trackRecord = [...pastEvents].reverse();

const EXPLORE: Array<{ to: string; icon: PixelIconName; eyebrow: string; title: string; body: string }> = [
  {
    to: '/about',
    icon: 'compass',
    eyebrow: 'Who we are',
    title: 'About SFMI',
    body: `Our mission, the students who run it, and the ${participantCountryWord} countries our competitors have written in from.`,
  },
  {
    to: '/initiatives',
    icon: 'bulb',
    eyebrow: 'What else we build',
    title: 'Initiatives',
    body: 'MathCloud, our own testing platform, and San Francisco Math Academy — including a free AMC 8 summer camp.',
  },
  {
    to: '/archive',
    icon: 'book',
    eyebrow: 'What came before',
    title: 'Archive',
    body: 'SFPO 2026, SFM3 2026 and the inaugural SFMO 2026, plus past problem sets and training resources.',
  },
  {
    to: '/team',
    icon: 'people',
    eyebrow: 'The crew',
    title: 'Meet the Team',
    body: `The ${numberWord(staff.length)} students who run SFMI.`,
  },
];

export function HomePage() {
  return (
    <>
      <SeoHead
        title="SFMO 2027 — San Francisco Math Open"
        description="The San Francisco Math Open returns in person on January 16, 2027, in San Jose. A free math competition for middle and high schoolers, run by students, with $20,000+ in prizes and counting."
      />

      {/* ---------------------------------------------------------------- */}
      <section className="hero">
        <Bubbles />
        <img
          src={asset('art/seaweed.png')}
          alt=""
          className="hero__seaweed hero__seaweed--left"
          aria-hidden="true"
        />
        <img
          src={asset('art/seaweed.png')}
          alt=""
          className="hero__seaweed hero__seaweed--right"
          aria-hidden="true"
        />

        <div className="wrap hero__inner">
          <div className="hero__copy">
            <p className="hero__eyebrow label">
              {sfmo2027.edition} · {sfmo2027.theme}
            </p>
            <h1 className="hero__title">
              San Francisco
              <br />
              Math Open
            </h1>
            <p className="hero__date pixel">
              <time dateTime={sfmo2027.date}>{sfmo2027.dateLabel}</time>
            </p>
            {presentingSponsor && (
              <a
                className="hero__presented"
                href={presentingSponsor.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="hero__presented-label label">Presented by</span>
                {/* On its own light plate: the wordmark is dark grey, drawn
                    for a light ground, and would vanish in the night theme. */}
                <span className="hero__presented-plate">
                  <img
                    src={asset(`sponsors/${presentingSponsor.logo}`)}
                    alt={presentingSponsor.name}
                    width={1100}
                    height={322}
                  />
                </span>
              </a>
            )}
            <p className="hero__prizes">
              <PixelIcon name="trophy" size={22} />
              <span>
                <strong>{sfmo2027.prizePool}</strong> in prizes and counting
              </span>
            </p>
            <p className="hero__where">
              For {sfmo2027.eligibility.toLowerCase()} · In person in {sfmo2027.venueArea} ·
              Online division · Teams of up to {sfmo2027.maxTeamSize}
            </p>
            <p className="hero__blurb">
              Our flagship competition comes home: one day in the Bay Area,{' '}
              {numberWord(rounds.length)} rounds, and a set of problems worth puzzling over with
              your team.
            </p>
            <div className="btn-row hero__actions">
              <Link to="/register" className="btn btn--primary btn--lg">
                Register a team <ArrowIcon />
              </Link>
              <a href={links.discord} target="_blank" rel="noreferrer" className="btn btn--deep btn--lg">
                <DiscordIcon size={16} /> Join the Discord
              </a>
            </div>
          </div>

          <div className="hero__art">
            <img
              src={asset('art/submarine.png')}
              alt="A cat piloting a yellow submarine through the water"
              className="hero__sub"
              width={574}
              height={435}
            />
          </div>
        </div>

        <PixelWave fill="var(--abyss)" crest="var(--sub)" className="hero__wave" />
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="status-band">
        <PixelWave flip fill="var(--abyss)" crest="var(--sub)" className="status-band__wave" />
        <div className="wrap status-band__inner">
          <div>
            <p className="eyebrow">Registration</p>
            <h2 className="status-band__title">Opens {sfmo2027.registrationOpensLabel}</h2>
            <p className="status-band__body">
              Team registration and the full competition details go live at 12:00 AM Pacific. Join
              the Discord and we will ping you the moment it opens.
            </p>
          </div>
          <Countdown
            target={sfmo2027.registrationOpensAt}
            fallback={
              <Link to="/register" className="btn btn--primary btn--lg">
                Registration is open <ArrowIcon />
              </Link>
            }
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section section--tight glance">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The essentials</p>
            <h2>SFMO 2027 at a glance</h2>
          </div>

          <div className="glance__layout">
            <dl className="glance-sheet">
              {GLANCE.map((row) => (
                <div className="glance-sheet__row" key={row.label}>
                  <PixelIcon name={row.icon} size={36} />
                  <dt className="label">{row.label}</dt>
                  <dd>
                    <strong>{row.value}</strong>
                    <span>{row.detail}</span>
                    {row.link && (
                      <a
                        className="glance-sheet__link"
                        href={row.link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.link.label} <ExternalIcon />
                      </a>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="divisions__cards">
              <article className="card division-card">
                <PixelIcon name="sub" size={56} className="division-card__icon" />
                <div>
                  <p className="card__eyebrow">{DIVISIONS.in_person.label}</p>
                  <h3 className="card__title">{sfmo2027.venueArea}</h3>
                  <p className="card__body">
                    The main event, at the {sfmo2027.venue.name}, {sfmo2027.venue.street}.{' '}
                    <a href={sfmo2027.venue.mapsUrl} target="_blank" rel="noreferrer">
                      Get directions
                    </a>
                  </p>
                  <p className="division-card__tag label">
                    Within {IN_PERSON_RADIUS_MILES} mi of the Bay Area
                  </p>
                </div>
              </article>
              <article className="card division-card">
                <PixelIcon name="laptop" size={56} className="division-card__icon" />
                <div>
                  <p className="card__eyebrow">{DIVISIONS.online.label}</p>
                  <h3 className="card__title">From anywhere farther</h3>
                  <p className="card__body">
                    For teams living more than {IN_PERSON_RADIUS_MILES} miles from the Bay Area.
                  </p>
                  <p className="division-card__tag division-card__tag--far label">
                    {IN_PERSON_RADIUS_MILES}+ mi away
                  </p>
                </div>
              </article>
              <div className="rule-callout">
                <p className="rule-callout__title label">The distance rule</p>
                <p className="rule-callout__rule">{distanceRule.rule}</p>
                <p className="rule-callout__body">
                  {distanceRule.reach} {distanceRule.online}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section who">
        <div className="wrap">
          <div className="who__intro">
            <div className="section-head">
              <p className="eyebrow">Who we are</p>
              <h2>Run by students, for students</h2>
              <p className="lede">
                The San Francisco Math Initiative is a student-run nonprofit that writes and hosts
                free mathematics competitions — three a year, one every season, open to anyone who
                wants to sit them.
              </p>
            </div>

            <Link to="/team" className="crew-strip">
              <span className="crew-strip__faces" aria-hidden="true">
                {staff.map((member) => (
                  <span className="crew-strip__face" key={member.slug}>
                    <Portrait
                      slug={member.slug}
                      name={member.name}
                      position={member.photoPosition}
                    />
                  </span>
                ))}
              </span>
              <span className="crew-strip__caption">
                Run by {numberWord(staff.length)} students.
              </span>
              <span className="crew-strip__more label">
                Meet the team <ArrowIcon />
              </span>
            </Link>
          </div>

          <div className="grid grid--3 who__stats">
            {communityStats.map((stat) => (
              <div className="stat" key={stat.label}>
                <p className="stat__value">{stat.value}</p>
                <p className="stat__label">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="who__map-link">
            <Link to="/about">
              See the {participantCountryWord} countries our competitors have written in{' '}
              <span className="nowrap">
                from <ArrowIcon />
              </span>
            </Link>
          </p>

          <h3 className="dive__subhead who__subhead">Our contests so far</h3>
          <ol className="track">
            {trackRecord.map((event) => (
              <li className="track__item" key={event.id}>
                <Link className="track__card" to={{ pathname: '/archive', hash: `#${event.id}` }}>
                  <span className="track__code pixel">{event.code}</span>
                  <span className="track__name">{event.name}</span>
                  <span className="track__when mono">
                    {event.dateLabel.replace(/^Held /, '')} · {event.locationLabel}
                  </span>
                  <span className="track__teaser">{event.teaser}</span>
                  <span className="track__stats">
                    {event.stats.map((fact) => (
                      <span key={fact.label}>
                        <strong>{fact.value}</strong> {fact.label.toLowerCase()}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
            <li className="track__item track__item--next">
              <Link className="track__card" to="/register">
                <span className="track__code pixel">{sfmo2027.code}</span>
                <span className="track__name">{sfmo2027.edition}</span>
                <span className="track__when mono">
                  {sfmo2027.dateLabel} · {sfmo2027.venueArea} + online
                </span>
                <span className="track__teaser">
                  In person in {sfmo2027.venueArea}, with an online division. Registration
                  opens{' '}
                  {sfmo2027.registrationOpensLabel}.
                </span>
                <span className="track__next label">
                  Next up <ArrowIcon />
                </span>
              </Link>
            </li>
          </ol>
        </div>
      </section>

      <SponsorWall />

      {/* ---------------------------------------------------------------- */}
      <section className="section rounds">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The dive plan</p>
            <h2>{capitalise(numberWord(rounds.length))} rounds, one day</h2>
            <p className="lede">
              {capitalise(formatDuration(totalRoundMinutes))} of mathematics, split{' '}
              {numberWord(rounds.length)} ways. {capitalise(numberWord(describedRounds))} of them we
              can describe.
            </p>
          </div>

          <ol className="round-list">
            {rounds.map((round, index) => (
              <li className={`round ${round.mystery ? 'round--mystery' : ''}`} key={round.name}>
                <div className="round__depth" aria-hidden="true">
                  <span className="round__code pixel">{round.code}</span>
                  <span className="round__rule" />
                </div>
                <div className="round__body">
                  <div className="round__head">
                    <h3>{round.name}</h3>
                    <span className="round__meta mono">
                      {round.detail} · {round.minutes} min
                    </span>
                  </div>
                  <p className="card__body">{round.blurb}</p>
                </div>
                <div className="round__bar" aria-hidden="true">
                  {/* Bar length is proportional to the round's duration. */}
                  <span style={{ height: `${(round.minutes / longestRoundMinutes) * 100}%` }} />
                  <small className="mono">{round.minutes}&apos;</small>
                </div>
                <span className="round__index label" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </li>
            ))}
          </ol>

          <div className="grid grid--2 rounds__extras">
            <article className="card card--warm prize">
              <Art name="treasure" className="prize__art" />
              <div>
                <p className="card__eyebrow">Prizes</p>
                <h3 className="card__title">Free to enter, real prizes</h3>
                <p className="card__body">
                  We have put over $5,000 into past contests and none of it came from entry fees —
                  our sponsors and our tutoring and summer camp fund the pool instead. The SFMO 2027
                  breakdown is announced with registration.
                </p>
              </div>
            </article>
            <article className="card card--warm id-card">
              <p className="card__eyebrow">Your ID</p>
              <h3 className="card__title">One number per team, one letter each</h3>
              <ul className="id-tags" aria-label="Example competitor IDs for team 07">
                {SLOT_LETTERS.map((letter) => (
                  <li key={letter} className="id-tags__tag pixel">
                    07{letter}
                  </li>
                ))}
              </ul>
              <p className="card__body">
                Your team gets its number the moment you register. It goes on every answer sheet,
                and it is how we check you in on the day.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section deep-band">
        <PixelWave fill="var(--trench)" crest="var(--abyss)" className="deep-band__wave" />
        <Art name="anglerfish" className="deep-band__art" />
        <div className="wrap deep-band__inner">
          <div>
            <p className="eyebrow">Competition day</p>
            <h2>How the day runs</h2>
            <p className="deep-band__note">
              {sfmo2027.dayLabel}: doors at {clock(doorsOpen.start)}, done by{' '}
              {clock(dayEnds.end)}.
              Exact times are announced when registration opens — this is the shape of it.
            </p>
          </div>
          <ol className="daylog">
            {publicDay.map((slot) => (
              <li className={`daylog__row ${slot.round ? 'daylog__row--round' : ''}`} key={slot.title}>
                <span className="daylog__time label">{clock(slot.start)}</span>
                <span className="daylog__body">
                  <strong>{slot.title}</strong>
                  <span>{slot.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <PixelWave flip fill="var(--trench)" crest="var(--abyss)" className="deep-band__wave-bottom" />
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section">
        <div className="wrap">
          <div className="faq-layout">
            <aside className="faq-aside">
              <div className="section-head">
                <p className="eyebrow">Before you ask</p>
                <h2>Questions we get</h2>
              </div>
              <div className="faq-aside__card">
                <PixelIcon name="question" size={48} />
                <p className="faq-aside__title">Still wondering?</p>
                <p className="faq-aside__body">
                  Ask in the Discord or email us, and an organiser will get back to you.
                </p>
                <div className="btn-row">
                  <a href={links.discord} target="_blank" rel="noreferrer" className="btn btn--deep">
                    <DiscordIcon size={16} /> Discord
                  </a>
                  <a href={`mailto:${links.email}`} className="btn">
                    Email us
                  </a>
                </div>
              </div>
            </aside>
            <div className="faq">
              {faq.map((item) => (
                <details className="faq__item" key={item.q}>
                  <summary className="faq__q">{item.q}</summary>
                  <p className="faq__a">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section calendar">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Our yearly calendar</p>
            <h2>Three competitions, one mission</h2>
            <p className="lede">
              We host a free math event every season — one of these is always coming next.
            </p>
          </div>

          <ol className="calendar__list">
            {competitions.map((event) => (
              <li className="calendar__item" key={event.code}>
                <div className="calendar__code pixel">
                  <span>{event.code}</span>
                  <small>{event.glyph}</small>
                </div>
                <div className="calendar__body">
                  <div className="calendar__head">
                    <h3>{event.name}</h3>
                    <span
                      className={`badge ${event.status === 'upcoming' ? 'badge--sub' : 'badge--muted'}`}
                    >
                      {event.status === 'upcoming' ? 'Upcoming' : 'Past event'}
                    </span>
                  </div>
                  <p className="calendar__date mono">{event.dateLabel}</p>
                  <p className="card__body">{event.blurb}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section explore">
        <div className="wrap">
          <div className="section-head section-head--center">
            <p className="eyebrow">Explore more</p>
            <h2>Where would you like to go next?</h2>
          </div>

          <div className="grid grid--2">
            {EXPLORE.map((item) => (
              <Link className="card card--link explore-card" to={item.to} key={item.to}>
                <PixelIcon name={item.icon} size={44} className="explore-card__icon" />
                <p className="card__eyebrow">{item.eyebrow}</p>
                <h3 className="card__title">{item.title}</h3>
                <p className="card__body">{item.body}</p>
                <p className="card__foot card__more">
                  Learn more <ArrowIcon />
                </p>
              </Link>
            ))}
          </div>

          <div className="btn-row explore__actions">
            <a href={links.mathcloud} target="_blank" rel="noreferrer" className="btn btn--deep">
              MathCloud Testing Portal <ExternalIcon />
            </a>
            <a href={links.discord} target="_blank" rel="noreferrer" className="btn btn--kelp">
              <DiscordIcon size={16} /> Join the Discord
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
