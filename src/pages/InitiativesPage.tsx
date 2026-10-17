import { ExternalIcon } from '../components/Icons';
import { PixelIcon, type PixelIconName } from '../components/PixelIcon';
import { SeoHead } from '../components/SeoHead';
import { CampRoom, TutoringRoom } from '../components/ZoomArt';
import { links } from '../lib/config';

/** Tutoring rates: a single session, and the rate when booking several. */
const TUTORING_RATES = {
  single: 24.99,
  bundle: 19.99,
  bundleSessions: 4,
};

/** Last summer's AMC 8 camp, in numbers. */
const CAMP_STATS: Array<{ icon: PixelIconName; value: string; label: string }> = [
  { icon: 'people', value: '25+', label: 'students at our last AMC 8 camp' },
  { icon: 'heart', value: 'Free', label: 'with application' },
  { icon: 'star', value: 'Highly rated', label: 'campers gave it high reviews on average' },
];

/** From the camp's end-of-week feedback form, with campers' initials only. */
const TESTIMONIALS: Array<{ quote: string; who: string }> = [
  {
    quote:
      'The camp was amazing, and I believe every person learned something new here. The instructors are really nice and make the concepts easy to understand.',
    who: 'C.D.',
  },
  {
    quote:
      'This math program has overall prepared me for AMC 8 way more than before. I will be reviewing these materials again.',
    who: 'A.N.',
  },
];

const TUTORING_POINTS = [
  'Live 1-on-1 sessions via Zoom with AIME qualifiers',
  'Custom handout made specifically for your child',
  'Full courses for AP Calc BC & AMC 8',
  'Subjects: AMC 8, Mathcounts, AMC 10, PreAlgebra through AP Calc BC',
];

const CAMP_POINTS = [
  'Live interactive Zoom sessions — not pre-recorded',
  'Curriculum designed for AMC 8 score of 15-20+',
  'Daily office hours & small group sizes',
];

/** The camp's week-long sessions, shown as calendar pages. */
const CAMP_WEEKS: Array<{ month: string; days: string }> = [
  { month: 'Jun', days: '22–26' },
  { month: 'Jun–Jul', days: '29–3' },
  { month: 'Jul', days: '27–31' },
  { month: 'Aug', days: '3–7' },
];

/** A small calendar page with two binding rings. */
function CalendarPage({ month, days }: { month: string; days: string }) {
  return (
    <svg className="camp-week__page" viewBox="0 0 64 60" aria-hidden="true">
      <rect x="3" y="7" width="58" height="50" rx="4" className="camp-week__paper" />
      <rect x="3" y="7" width="58" height="16" rx="4" className="camp-week__band" />
      <rect x="3" y="17" width="58" height="6" className="camp-week__band" />
      <rect x="8" y="2" width="6" height="10" rx="3" className="camp-week__ring" />
      <rect x="50" y="2" width="6" height="10" rx="3" className="camp-week__ring" />
      <text x="32" y="19" textAnchor="middle" className="camp-week__month">
        {month}
      </text>
      <text x="32" y="45" textAnchor="middle" className="camp-week__days">
        {days}
      </text>
      <rect x="3" y="7" width="58" height="50" rx="4" className="camp-week__edge" />
    </svg>
  );
}

/** An opening quote mark, drawn on the pixel grid the rest of the site uses. */
function PixelQuote() {
  // Each mark is a "6": a tail curling down into a solid block.
  const cells = [
    [1, 0], [2, 0], [0, 1], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3], [2, 3],
  ];
  return (
    <svg className="testimonial__mark" viewBox="0 0 7 4" aria-hidden="true" shapeRendering="crispEdges">
      {cells.flatMap(([x, y]) => [
        <rect key={`a${x}${y}`} x={x} y={y} width="1" height="1" />,
        <rect key={`b${x}${y}`} x={x + 4} y={y} width="1" height="1" />,
      ])}
    </svg>
  );
}

const MATHCLOUD_FEATURES: Array<{ title: string; icon: PixelIconName; body: string }> = [
  {
    title: 'Easy to Use',
    icon: 'cursor',
    body: 'A streamlined interface designed for math competitions.',
  },
  {
    title: 'Live Feedback',
    icon: 'bolt',
    body: 'Instant confirmation of your submitted answers and progress tracking.',
  },
  {
    title: 'Robust Connection',
    icon: 'signal',
    body: 'Improved stability for reliable competition proctoring and submission.',
  },
];

export function InitiativesPage() {
  return (
    <>
      <SeoHead
        title="Initiatives — MathCloud & San Francisco Math Academy"
        description="MathCloud, our competition testing platform, and San Francisco Math Academy: free AMC 8 summer camp and 1-on-1 tutoring."
      />

      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Supporting the initiative</p>
          <h1>Everything Else We Build</h1>
          <p className="lede">
            Two projects keep the competitions running: the academy that funds them, and the testing
            platform we wrote because nothing else fit.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">San Francisco Math Academy</p>
            <h2>Tutoring & summer camp</h2>
            <p className="lede">
              Expert math instruction taught by AIME qualifiers and AMC 8 perfect scorers. A portion
              of tutoring proceeds goes directly back into funding the competition — so by booking
              tutoring, you are also supporting our contests.
            </p>
          </div>

          <div className="camp-stats" aria-label="Our last AMC 8 camp">
            {CAMP_STATS.map((stat) => (
              <div className="camp-stats__item" key={stat.value}>
                <PixelIcon name={stat.icon} size={34} />
                <p className="camp-stats__value">{stat.value}</p>
                <p className="camp-stats__label">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="camp-stats__note">
            Our week-long AMC 8 prep camp runs free with application — live Zoom sessions, daily
            office hours and small groups. The Academy also proudly supports climate change
            initiatives.
          </p>

          <div className="grid grid--2 offer-grid">
            <article className="card card--warm offer">
              <TutoringRoom />
              <p className="card__eyebrow">Private 1-on-1 Tutoring</p>
              <h3 className="card__title offer__price">
                From ${TUTORING_RATES.bundle}
                <span>/hour</span>
              </h3>
              <dl className="rates">
                <div className="rates__row">
                  <dt>Single session</dt>
                  <dd>${TUTORING_RATES.single}/hour</dd>
                </div>
                <div className="rates__row rates__row--best">
                  <dt>{TUTORING_RATES.bundleSessions} or more sessions</dt>
                  <dd>${TUTORING_RATES.bundle}/hour</dd>
                </div>
              </dl>
              <p className="card__body">Custom lesson plan &amp; handout every session.</p>
              <ul className="ticks">
                {TUTORING_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="card__foot">
                <a
                  href={links.academyTutoring}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--primary"
                >
                  Book a tutoring session <ExternalIcon />
                </a>
              </div>
            </article>

            <article className="card card--warm offer">
              <CampRoom />
              <p className="card__eyebrow">Summer Camp — AMC 8 Prep</p>
              <h3 className="card__title offer__price">Free with application</h3>
              <p className="card__body">Week-long live camps for grades 3-8.</p>
              <ul className="ticks">
                {CAMP_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="camp-weeks__label">Week-long sessions</p>
              <ul className="camp-weeks">
                {CAMP_WEEKS.map((week) => (
                  <li className="camp-week" key={week.days}>
                    <CalendarPage month={week.month} days={week.days} />
                    <span className="visually-hidden">
                      {week.month} {week.days}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="card__foot">
                <a href={links.academyCamp} target="_blank" rel="noreferrer" className="btn btn--kelp">
                  View camp details <ExternalIcon />
                </a>
              </div>
            </article>
          </div>

          <div className="testimonials">
            <h3 className="testimonials__title">What campers said</h3>
            <div className="testimonials__grid">
              {TESTIMONIALS.map((item) => (
                <figure className="testimonial" key={item.who}>
                  <PixelQuote />
                  <blockquote className="testimonial__quote">{item.quote}</blockquote>
                  <figcaption className="testimonial__who">
                    {item.who} · AMC 8 camp student
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="section mathcloud">
        <div className="wrap">
          <div className="panel">
            <div className="section-head">
              <p className="eyebrow">Introducing MathCloud</p>
              <h2>The platform our contests run on</h2>
              <p className="lede">
                We heard your feedback from San Francisco Math Open 2026 and have been working hard
                to improve the competition experience. Thanks to our first participants for the
                valuable feedback — the system has improved significantly since.
              </p>
            </div>

            <div className="grid grid--3">
              {MATHCLOUD_FEATURES.map((feature) => (
                <div className="card" key={feature.title}>
                  <PixelIcon name={feature.icon} size={40} className="icon-card__icon" />
                  <h3 className="card__title">{feature.title}</h3>
                  <p className="card__body">{feature.body}</p>
                </div>
              ))}
            </div>

            <div className="btn-row mathcloud__actions">
              <a href={links.mathcloud} target="_blank" rel="noreferrer" className="btn btn--deep btn--lg">
                Explore the testing portal <ExternalIcon />
              </a>
              <a href={links.discord} target="_blank" rel="noreferrer" className="btn btn--lg">
                Join the Discord
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
