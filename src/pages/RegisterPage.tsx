import { useEffect, useMemo, useState } from 'react';
import { Countdown } from '../components/Countdown';
import { ArrowIcon, DiscordIcon } from '../components/Icons';
import { SeoHead } from '../components/SeoHead';
import { asset } from '../lib/asset';
import { links, sfmo2027 } from '../lib/config';
import {
  emptyMember,
  emptyTeam,
  fetchRegistrationWindow,
  isWindowOpenNow,
  lookupTeam,
  registerTeam,
  type RegistrationWindow,
  type TeamInput,
  type TeamReceipt,
} from '../lib/registration';
import { isSupabaseConfigured } from '../lib/supabase';

const WHAT_WE_ASK = [
  'A team name, and the school or club you are representing',
  `Up to ${sfmo2027.maxTeamSize} competitors — name, grade, and email for each`,
  'One contact person we can reach about logistics',
  'Agreement to the competition policies, published before registration opens',
];

function Receipt({ receipt }: { receipt: TeamReceipt }) {
  return (
    <div className="receipt">
      <p className="eyebrow">You are registered</p>
      <h2>Team {receipt.team_code} — {receipt.team_name}</h2>
      <p className="receipt__note">
        Save these IDs. Each competitor writes theirs on every answer sheet, and we use them for
        check-in on competition day. A copy has been recorded against{' '}
        <strong>{receipt.contact_email}</strong> — you can look it up again below at any time.
      </p>

      <ul className="id-list">
        {receipt.members.map((member) => (
          <li className="id-list__row" key={member.slot}>
            <span className="id-list__id pixel">{member.competitor_id}</span>
            <span className="id-list__name">
              {member.full_name}
              {member.grade ? <small> · Grade {member.grade}</small> : null}
            </span>
          </li>
        ))}
      </ul>

      <p className="receipt__status">
        Status: <span className="badge badge--sub">{receipt.status}</span>
      </p>
    </div>
  );
}

function LookupPanel() {
  const [teamCode, setTeamCode] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<TeamReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await lookupTeam(teamCode, email));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="section-head">
        <p className="eyebrow">Already registered?</p>
        <h2>Look up your team IDs</h2>
        <p className="lede">
          Enter your team ID and the contact email you registered with, and we will show your
          competitor IDs again.
        </p>
      </div>

      <form onSubmit={onSubmit} className="lookup-form">
        <div className="field">
          <label className="field__label" htmlFor="lookup-code">
            Team ID
          </label>
          <input
            id="lookup-code"
            className="input"
            value={teamCode}
            onChange={(event) => setTeamCode(event.target.value)}
            placeholder="07"
            inputMode="numeric"
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="lookup-email">
            Contact email
          </label>
          <input
            id="lookup-email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn--deep" disabled={busy}>
          {busy ? 'Looking…' : 'Find my team'}
        </button>
      </form>

      {error && (
        <div className="notice notice--warn lookup-result">
          <div>
            <p className="notice__title">Not found</p>
            <p className="notice__body">{error}</p>
          </div>
        </div>
      )}
      {result && (
        <div className="lookup-result">
          <Receipt receipt={result} />
        </div>
      )}
    </div>
  );
}

function RegistrationForm({ settings }: { settings: RegistrationWindow }) {
  const [form, setForm] = useState<TeamInput>(emptyTeam);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<TeamReceipt | null>(null);

  function setField<K extends keyof TeamInput>(key: K, value: TeamInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setMember(index: number, key: keyof TeamInput['members'][number], value: string) {
    setForm((current) => ({
      ...current,
      members: current.members.map((member, position) =>
        position === index ? { ...member, [key]: value } : member,
      ),
    }));
  }

  function addMember() {
    setForm((current) =>
      current.members.length >= settings.maxTeamSize
        ? current
        : { ...current, members: [...current.members, emptyMember()] },
    );
  }

  function removeMember(index: number) {
    setForm((current) =>
      current.members.length <= 1
        ? current
        : { ...current, members: current.members.filter((_, position) => position !== index) },
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setReceipt(await registerTeam(form));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  if (receipt) return <Receipt receipt={receipt} />;

  return (
    <form onSubmit={onSubmit} className="reg-form">
      <fieldset className="reg-form__group" disabled={busy}>
        <legend className="reg-form__legend pixel">1 · Your team</legend>
        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="team_name">
              Team name <span className="req">*</span>
            </label>
            <input
              id="team_name"
              className="input"
              required
              maxLength={80}
              value={form.team_name}
              onChange={(event) => setField('team_name', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="school">
              School or club
            </label>
            <input
              id="school"
              className="input"
              value={form.school}
              onChange={(event) => setField('school', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              className="input"
              value={form.city}
              onChange={(event) => setField('city', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="state_region">
              State / region
            </label>
            <input
              id="state_region"
              className="input"
              value={form.state_region}
              onChange={(event) => setField('state_region', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              className="input"
              value={form.country}
              onChange={(event) => setField('country', event.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="reg-form__group" disabled={busy}>
        <legend className="reg-form__legend pixel">
          2 · Competitors ({form.members.length}/{settings.maxTeamSize})
        </legend>
        <p className="field__hint reg-form__hint">
          Members are assigned slots in this order. If your team ID is 07, these become 07A, 07B,
          07C and 07D.
        </p>

        {form.members.map((member, index) => (
          <div className="member" key={index}>
            <div className="member__head">
              <span className="member__slot pixel">
                {String.fromCharCode(65 + index)}
              </span>
              {form.members.length > 1 && (
                <button
                  type="button"
                  className="member__remove"
                  onClick={() => removeMember(index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="field__label" htmlFor={`member-name-${index}`}>
                  Full name <span className="req">*</span>
                </label>
                <input
                  id={`member-name-${index}`}
                  className="input"
                  required
                  value={member.full_name}
                  onChange={(event) => setMember(index, 'full_name', event.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={`member-email-${index}`}>
                  Email
                </label>
                <input
                  id={`member-email-${index}`}
                  className="input"
                  type="email"
                  value={member.email}
                  onChange={(event) => setMember(index, 'email', event.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={`member-grade-${index}`}>
                  Grade
                </label>
                <input
                  id={`member-grade-${index}`}
                  className="input"
                  value={member.grade}
                  onChange={(event) => setMember(index, 'grade', event.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={`member-school-${index}`}>
                  School (if different)
                </label>
                <input
                  id={`member-school-${index}`}
                  className="input"
                  value={member.school}
                  onChange={(event) => setMember(index, 'school', event.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        {form.members.length < settings.maxTeamSize && (
          <button type="button" className="btn" onClick={addMember}>
            + Add competitor {String.fromCharCode(65 + form.members.length)}
          </button>
        )}
      </fieldset>

      <fieldset className="reg-form__group" disabled={busy}>
        <legend className="reg-form__legend pixel">3 · Contact</legend>
        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="contact_name">
              Contact name <span className="req">*</span>
            </label>
            <input
              id="contact_name"
              className="input"
              required
              value={form.contact_name}
              onChange={(event) => setField('contact_name', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="contact_email">
              Contact email <span className="req">*</span>
            </label>
            <input
              id="contact_email"
              className="input"
              type="email"
              required
              value={form.contact_email}
              onChange={(event) => setField('contact_email', event.target.value)}
            />
            <p className="field__hint">We send confirmations and competition-day details here.</p>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="contact_phone">
              Phone (optional)
            </label>
            <input
              id="contact_phone"
              className="input"
              value={form.contact_phone}
              onChange={(event) => setField('contact_phone', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="coach_name">
              Coach name (optional)
            </label>
            <input
              id="coach_name"
              className="input"
              value={form.coach_name}
              onChange={(event) => setField('coach_name', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="coach_email">
              Coach email (optional)
            </label>
            <input
              id="coach_email"
              className="input"
              type="email"
              value={form.coach_email}
              onChange={(event) => setField('coach_email', event.target.value)}
            />
          </div>
        </div>

        <div className="field reg-form__notes">
          <label className="field__label" htmlFor="notes">
            Anything we should know?
          </label>
          <textarea
            id="notes"
            className="textarea"
            value={form.notes}
            onChange={(event) => setField('notes', event.target.value)}
            placeholder="Accessibility needs, travel constraints, questions…"
          />
        </div>
      </fieldset>

      <label className="checkbox reg-form__agree">
        <input
          type="checkbox"
          checked={form.agreed_policies}
          onChange={(event) => setField('agreed_policies', event.target.checked)}
          required
        />
        <span>
          Our team agrees to the SFMO 2027 competition policies, including the rules on outside
          assistance and collaboration during the contest.
        </span>
      </label>

      {error && (
        <div className="notice notice--warn">
          <div>
            <p className="notice__title">Could not register</p>
            <p className="notice__body">{error}</p>
          </div>
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
        {busy ? 'Submitting…' : 'Register our team'} <ArrowIcon />
      </button>
    </form>
  );
}

export function RegisterPage() {
  const [settings, setSettings] = useState<RegistrationWindow | null>(null);

  useEffect(() => {
    let active = true;
    fetchRegistrationWindow().then((result) => {
      if (active) setSettings(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const open = useMemo(() => (settings ? isWindowOpenNow(settings) : false), [settings]);
  const opensAt = settings?.opensAt ?? sfmo2027.registrationOpensAt;

  return (
    <>
      <SeoHead
        title="Register — SFMO 2027"
        description="Team registration for the San Francisco Math Open 2027. Teams of up to four. Registration opens October 24, 2026."
      />

      <section className="page-head page-head--reg">
        <img
          src={asset('art/submarine.png')}
          alt=""
          aria-hidden="true"
          className="page-head__sub"
        />
        <div className="wrap">
          <p className="eyebrow">SFMO 2027</p>
          <h1>Register a Team</h1>
          <p className="lede">
            Teams of up to {sfmo2027.maxTeamSize}, free to enter, in person in San Francisco. Every
            competitor gets an ID the moment you register.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap wrap--narrow">
          {settings === null && <p className="loading pixel">Checking registration…</p>}

          {settings && !open && (
            <div className="panel locked">
              <p className="eyebrow">Not open yet</p>
              <h2>Registration opens {sfmo2027.registrationOpensLabel}</h2>
              <p className="lede">
                {settings.announcement ??
                  'Team registration and the full competition details go live at 12:00 AM Pacific. Join the Discord and we will announce the moment it opens.'}
              </p>

              <Countdown
                target={opensAt}
                fallback={
                  <p className="locked__soon pixel">Opening any moment — refresh the page.</p>
                }
              />

              <div className="locked__what">
                <h3 className="dive__subhead">What we will ask for</h3>
                <ul className="ticks">
                  {WHAT_WE_ASK.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="btn-row">
                <a href={links.discord} target="_blank" rel="noreferrer" className="btn btn--deep btn--lg">
                  <DiscordIcon size={16} /> Get notified on Discord
                </a>
                <a href={`mailto:${links.email}`} className="btn btn--lg">
                  Email us a question
                </a>
              </div>

              {!isSupabaseConfigured && (
                <p className="locked__debug mono">
                  Registration backend not connected in this build.
                </p>
              )}
            </div>
          )}

          {settings && open && (
            <div className="panel">
              {settings.announcement && (
                <div className="notice notice--info">
                  <div>
                    <p className="notice__title">Notice</p>
                    <p className="notice__body">{settings.announcement}</p>
                  </div>
                </div>
              )}
              <RegistrationForm settings={settings} />
            </div>
          )}
        </div>
      </section>

      {isSupabaseConfigured && (
        <section className="section section--tight">
          <div className="wrap wrap--narrow">
            <LookupPanel />
          </div>
        </section>
      )}
    </>
  );
}
