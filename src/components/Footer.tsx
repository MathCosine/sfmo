import { Link } from 'react-router-dom';
import { links, site, sfmo2027 } from '../lib/config';
import { DiscordIcon, InstagramIcon } from './Icons';
import { Logo } from './Logo';
import { PixelWave } from './PixelWave';

export function Footer() {
  return (
    <footer className="footer">
      <PixelWave fill="var(--trench)" crest="var(--abyss)" className="footer__wave" />

      <div className="wrap">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">
              <Logo scale={3} color="#dff1fa" />
              <p className="footer__title">{sfmo2027.edition}</p>
            </div>
            <p className="footer__blurb">
              {site.name} — {site.tagline} Three free competitions a year, written and run by
              students.
            </p>
            <div className="footer__social">
              <a href={links.discord} target="_blank" rel="noreferrer" className="footer__social-btn">
                <DiscordIcon size={16} />
                Discord
              </a>
              <a
                href={links.instagram}
                target="_blank"
                rel="noreferrer"
                className="footer__social-btn"
              >
                <InstagramIcon size={16} />
                {links.instagramHandle}
              </a>
            </div>
          </div>

          <div>
            <p className="footer__heading">Site</p>
            <ul className="footer__list">
              <li>
                <Link to="/">SFMO 2027</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
              <li>
                <Link to="/about">About SFMI</Link>
              </li>
              <li>
                <Link to="/initiatives">Initiatives</Link>
              </li>
              <li>
                <Link to="/archive">Archive</Link>
              </li>
              <li>
                <Link to="/team">Team</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer__heading">Elsewhere</p>
            <ul className="footer__list">
              <li>
                <a href={links.mathcloud} target="_blank" rel="noreferrer">
                  MathCloud Testing Portal
                </a>
              </li>
              <li>
                <a href={links.academy} target="_blank" rel="noreferrer">
                  SF Math Academy
                </a>
              </li>
              <li>
                <a href={`mailto:${links.email}`}>{links.email}</a>
              </li>
              <li>
                <Link to="/staff">Staff Portal</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bar">
          <span>© {new Date().getFullYear()} San Francisco Math Open. {site.tagline}</span>
          <span className="mono">SFMO 2027 · {sfmo2027.theme}</span>
        </div>
      </div>
    </footer>
  );
}
