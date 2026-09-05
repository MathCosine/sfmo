import { Link } from 'react-router-dom';
import { ArrowIcon } from '../components/Icons';
import { SeoHead } from '../components/SeoHead';
import { WorldMap } from '../components/WorldMap';
import { communityStats, participantCountries } from '../data/competitions';
import { boardMembers, contributors } from '../data/staff';
import { asset } from '../lib/asset';
import { links } from '../lib/config';

const PRINCIPLES = [
  {
    title: 'Free, always',
    body: 'Every contest we have run has been free to enter. Cost should never be the reason a student does not sit a competition, so we fund prizes through our Academy instead of entry fees.',
  },
  {
    title: 'Written by students',
    body: 'Our problem writers are in high school right now. They remember which hints actually help and which problems only look clever, and it shows in the problem sets.',
  },
  {
    title: 'Open to anywhere',
    body: 'Competitors have written our contests from ten countries across four continents. Our online events have no geographic requirement and never will.',
  },
  {
    title: 'Built, not bought',
    body: 'When the off-the-shelf testing platforms did not fit, we wrote our own. MathCloud runs our contests and is shaped by feedback from the students who use it.',
  },
];

export function AboutPage() {
  const teamSize = boardMembers.length + contributors.length;

  return (
    <>
      <SeoHead
        title="About — San Francisco Math Initiative"
        description="Our mission, our team, and the community of problem solvers from ten countries who have joined our contests."
      />

      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Who we are</p>
          <h1>San Francisco Math Initiative</h1>
          <p className="lede">
            A student-run nonprofit initiative that writes and hosts free mathematics competitions —
            three a year, one every season, open to anyone who wants to sit them.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="mission">
            <div>
              <p className="eyebrow">Our mission</p>
              <h2>Spreading the joy of mathematics</h2>
              <p className="mission__body">
                The San Francisco Math Initiative exists because good competition mathematics should
                not be a closed room. We write problems we would have wanted to solve, we run the
                contests ourselves, and we keep them free.
              </p>
              <p className="mission__body">
                What began as one online competition in 2026 has grown into three annual events, a
                testing platform of our own, and a tutoring academy whose proceeds fund the prize
                pool. All of it is run by {teamSize} students.
              </p>
              <div className="btn-row mission__actions">
                <Link to="/team" className="btn btn--primary">
                  Meet the team <ArrowIcon />
                </Link>
                <Link to="/archive" className="btn">
                  Read our history
                </Link>
              </div>
            </div>
            <div className="mission__art">
              <img src={asset('art/submarine.png')} alt="" aria-hidden="true" className="mission__sub" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="grid grid--3">
            {communityStats.map((stat) => (
              <div className="stat" key={stat.label}>
                <p className="stat__value">{stat.value}</p>
                <p className="stat__label">{stat.label}</p>
                <p className="community__detail">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Past participants from</p>
            <h2>Math has no borders</h2>
            <p className="lede">
              Students from around the world have joined our contests, shared their solutions, and
              helped build this community. These are the places our competitors have called home.
            </p>
          </div>

          <WorldMap />

          <ul className="countries">
            {participantCountries.map((country) => (
              <li className="countries__item" key={country.mapName}>
                <span
                  className={`countries__pin ${country.home ? 'countries__pin--home' : ''}`}
                  aria-hidden="true"
                />
                {country.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">How we work</p>
            <h2>Four things we do not compromise on</h2>
          </div>
          <div className="grid grid--2">
            {PRINCIPLES.map((principle, index) => (
              <article className="card card--warm principle" key={principle.title}>
                <span className="principle__number pixel">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="card__title">{principle.title}</h3>
                <p className="card__body">{principle.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="panel join-panel">
            <div>
              <p className="eyebrow">Get in touch</p>
              <h2>Sponsors, coaches, and curious students</h2>
              <p className="lede">
                If you want to sponsor a contest, bring a school team, or just ask what a Guts Round
                is — the Discord is the fastest way to reach us.
              </p>
            </div>
            <div className="btn-row">
              <a href={links.discord} target="_blank" rel="noreferrer" className="btn btn--deep btn--lg">
                Join the Discord
              </a>
              <a href={`mailto:${links.email}`} className="btn btn--lg">
                Email us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
