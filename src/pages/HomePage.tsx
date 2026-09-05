import { Link } from 'react-router-dom';
import { Bubbles } from '../components/Bubbles';
import { Countdown } from '../components/Countdown';
import { ArrowIcon, DiscordIcon, ExternalIcon } from '../components/Icons';
import { PixelWave } from '../components/PixelWave';
import { SeoHead } from '../components/SeoHead';
import { communityStats, competitions } from '../data/competitions';
import { asset } from '../lib/asset';
import { links, sfmo2027 } from '../lib/config';

const DIVE_PLAN = [
  {
    label: 'Where',
    title: 'In person, San Francisco',
    body: 'After two online years, our flagship contest surfaces in the city it is named after. Venue announced with registration.',
  },
  {
    label: 'When',
    title: 'January 2027',
    body: 'A single full day of mathematics. The exact date lands alongside registration on October 24.',
  },
  {
    label: 'Who',
    title: 'Teams of up to four',
    body: 'Bring a school team, a club, or three friends. Every competitor gets an ID of the form 07A through 07D.',
  },
  {
    label: 'Cost',
    title: 'Free to enter',
    body: 'Every contest we run is free. Tutoring and camp proceeds from our Academy fund the prize pool.',
  },
];

const EXPLORE = [
  {
    to: '/about',
    eyebrow: 'Who we are',
    title: 'About SFMI',
    body: 'Our mission, the students who run it, and the ten countries our competitors have written in from.',
  },
  {
    to: '/initiatives',
    eyebrow: 'What else we build',
    title: 'Initiatives',
    body: 'MathCloud, our own testing platform, and San Francisco Math Academy — including a free AMC 8 summer camp.',
  },
  {
    to: '/archive',
    eyebrow: 'What came before',
    title: 'Archive',
    body: 'SFPO 2026, SFM3 2026 and the inaugural SFMO 2026, plus past problem sets and training resources.',
  },
  {
    to: '/team',
    eyebrow: 'The crew',
    title: 'Meet the Team',
    body: 'Eight organizers, problem writers and volunteers. Every one of them is a student.',
  },
];

export function HomePage() {
  return (
    <>
      <SeoHead
        title="SFMO 2027 — San Francisco Math Open"
        description="The San Francisco Math Open returns in person to San Francisco in January 2027. A free math competition for students, run by students."
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
            <p className="hero__eyebrow pixel">
              {sfmo2027.edition} · {sfmo2027.theme}
            </p>
            <h1 className="hero__title">
              San Francisco
              <br />
              Math Open
            </h1>
            <p className="hero__date pixel">January 2027</p>
            <p className="hero__where">
              In person · San Francisco · Teams of up to {sfmo2027.maxTeamSize}
            </p>
            <p className="hero__blurb">
              Our flagship competition comes home. One day, one city, and a set of problems written
              by students who still remember what it feels like to sit the contest.
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
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The dive plan</p>
            <h2>What SFMO 2027 is</h2>
            <p className="lede">
              A free, student-run math competition, back in person for the first time. Here is what
              we can tell you now — the rest lands with registration.
            </p>
          </div>

          <div className="grid grid--4">
            {DIVE_PLAN.map((item) => (
              <article className="card" key={item.title}>
                <p className="card__eyebrow">{item.label}</p>
                <h3 className="card__title">{item.title}</h3>
                <p className="card__body">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="panel community">
            <div className="section-head section-head--center">
              <p className="eyebrow">A growing community</p>
              <h2>Math has no borders</h2>
              <p className="lede">
                Students from around the world have joined our contests, shared their solutions, and
                helped build this community.
              </p>
            </div>

            <div className="grid grid--3">
              {communityStats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <p className="stat__value">{stat.value}</p>
                  <p className="stat__label">{stat.label}</p>
                  <p className="community__detail">{stat.detail}</p>
                </div>
              ))}
            </div>

            <p className="community__foot">
              <Link to="/about">
                See where our competitors have written in from <ArrowIcon />
              </Link>
            </p>
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
              <Link className="card card--link" to={item.to} key={item.to}>
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
