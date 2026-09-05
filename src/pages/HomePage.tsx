import { Link } from 'react-router-dom';
import { Art } from '../components/Art';
import { Bubbles } from '../components/Bubbles';
import { Countdown } from '../components/Countdown';
import { ArrowIcon, DiscordIcon, ExternalIcon } from '../components/Icons';
import { PixelWave } from '../components/PixelWave';
import { SeoHead } from '../components/SeoHead';
import { communityStats, competitions } from '../data/competitions';
import { asset } from '../lib/asset';
import { faq, links, rounds, sfmo2027 } from '../lib/config';


const DAY = [
  { time: '08:30', title: 'Doors & check-in', detail: 'Collect your competitor IDs and find your table.' },
  { time: '09:30', title: 'Opening ceremony', detail: 'Rules, the honour code, and how Guts actually works.' },
  { time: '10:00', title: 'Individual round', detail: '20 problems, 90 minutes, on your own.' },
  { time: '11:45', title: 'Team round', detail: '10 problems, 60 minutes, four heads.' },
  { time: '12:45', title: 'Lunch', detail: 'Provided. Argue about problem 17.' },
  { time: '13:45', title: 'Mystery Dive', detail: '60 minutes. You find out when everyone does.' },
  { time: '15:00', title: 'Guts round', detail: '9 sets of 4, 90 minutes, live scoreboard.' },
  { time: '16:45', title: 'Awards', detail: 'Results, prizes, and the shortlist reveal.' },
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
      <section className="section rounds">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The dive plan</p>
            <h2>Four rounds, one day</h2>
            <p className="lede">
              Five hours of mathematics, split four ways. Three of them we can describe.
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
                  <span style={{ height: `${(round.minutes / 90) * 100}%` }} />
                  <small className="mono">{round.minutes}&apos;</small>
                </div>
                <span className="round__index pixel" aria-hidden="true">
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
                  our tutoring and summer camp fund the pool instead. The SFMO 2027 breakdown is
                  announced with registration.
                </p>
              </div>
            </article>
            <article className="card card--warm">
              <p className="card__eyebrow">Your ID</p>
              <h3 className="card__title">07A through 07D</h3>
              <p className="card__body">
                Register and your team is assigned a number on the spot. Each member gets a letter,
                so you compete as 07A, 07B, 07C and 07D. It goes on every answer sheet and it is how
                we check you in on the day.
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
              A single full day in January. Exact times land with the venue on October 24 — this is
              the shape of it.
            </p>
          </div>
          <ol className="daylog">
            {DAY.map((slot) => (
              <li className="daylog__row" key={slot.time}>
                <span className="daylog__time pixel">{slot.time}</span>
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
          <div className="section-head">
            <p className="eyebrow">Before you ask</p>
            <h2>Questions we get</h2>
          </div>
          <div className="faq">
            {faq.map((item) => (
              <details className="faq__item" key={item.q}>
                <summary className="faq__q">{item.q}</summary>
                <p className="faq__a">{item.a}</p>
              </details>
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
