import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { links } from '../lib/config';
import { useTheme } from '../lib/useTheme';
import { DiscordIcon, MenuIcon, ThemeIcon } from './Icons';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { to: '/', label: 'SFMO 2027', end: true },
  { to: '/about', label: 'About' },
  { to: '/initiatives', label: 'Initiatives' },
  { to: '/archive', label: 'Archive' },
  { to: '/team', label: 'Team' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  // Close the mobile panel whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="nav">
      <nav className="wrap nav__inner" aria-label="Main">
        <Link to="/" className="nav__brand">
          <Logo scale={2} className="nav__mark" title="San Francisco Math Open" />
          <span className="nav__wordmark">
            <b>SFMO</b>
            <span>Math Initiative</span>
          </span>
        </Link>

        <div className="nav__links" data-open={open}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav__link">
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav__actions">
          <a
            className="nav__icon-btn"
            href={links.discord}
            target="_blank"
            rel="noreferrer"
            title="Join our Discord"
          >
            <DiscordIcon />
            <span className="visually-hidden">Join our Discord</span>
          </a>

          <button
            type="button"
            className="nav__icon-btn"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to surface mode' : 'Switch to deep dive mode'}
          >
            <ThemeIcon dark={theme === 'dark'} />
            <span className="visually-hidden">
              {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            </span>
          </button>

          <Link to="/register" className="btn btn--primary">
            Register
          </Link>

          <button
            type="button"
            className="nav__icon-btn nav__toggle"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </nav>
    </header>
  );
}
