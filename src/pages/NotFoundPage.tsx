import { Link } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';
import { asset } from '../lib/asset';

export function NotFoundPage() {
  return (
    <>
      <SeoHead
        title="Page not found — SFMO"
        description="That page does not exist."
        noindex
      />

      <section className="section notfound">
        <div className="wrap wrap--narrow">
          <img src={asset('art/submarine.png')} alt="" aria-hidden="true" className="notfound__sub" />
          <p className="eyebrow">Error 404</p>
          <h1>Nothing down here</h1>
          <p className="lede">
            The page you were looking for has drifted off. The sub is fine, but there is no contest
            at this depth.
          </p>
          <div className="btn-row notfound__actions">
            <Link to="/" className="btn btn--primary btn--lg">
              Back to SFMO 2027
            </Link>
            <Link to="/archive" className="btn btn--lg">
              Browse the archive
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
