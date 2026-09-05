import { ExternalIcon } from '../components/Icons';
import { SeoHead } from '../components/SeoHead';
import { links } from '../lib/config';

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
  'Sessions: Jun 22-26, Jun 29-Jul 3, Jul 27-31, Aug 3-7',
];

const MATHCLOUD_FEATURES = [
  {
    title: 'Easy to Use',
    body: 'A streamlined interface designed for math competitions.',
  },
  {
    title: 'Live Feedback',
    body: 'Instant confirmation of your submitted answers and progress tracking.',
  },
  {
    title: 'Robust Connection',
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

          <div className="notice notice--ok">
            <div>
              <p className="notice__title">Free AMC 8 summer camp</p>
              <p className="notice__body">
                Our week-long AMC 8 prep camp ran free with application and drew over 30 participants
                — live Zoom sessions, daily office hours, and small groups. The Academy also proudly
                supports climate change initiatives.
              </p>
            </div>
          </div>

          <div className="grid grid--2 offer-grid">
            <article className="card card--warm offer">
              <p className="card__eyebrow">Private 1-on-1 Tutoring</p>
              <h3 className="card__title">$14.99/hour</h3>
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
              <p className="card__eyebrow">Summer Camp — AMC 8 Prep</p>
              <h3 className="card__title">Free with application</h3>
              <p className="card__body">Week-long live camps for grades 3-8.</p>
              <ul className="ticks">
                {CAMP_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="card__foot">
                <a href={links.academyCamp} target="_blank" rel="noreferrer" className="btn btn--kelp">
                  View camp details <ExternalIcon />
                </a>
              </div>
            </article>
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
