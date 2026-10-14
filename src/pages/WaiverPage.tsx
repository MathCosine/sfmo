import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowIcon } from '../components/Icons';
import { PixelIcon } from '../components/PixelIcon';
import { SeoHead } from '../components/SeoHead';
import { asset } from '../lib/asset';
import { links } from '../lib/config';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  downloadWaiverPdf,
  emailSignedWaiver,
  getWaiver,
  loadWaiverDocument,
  signWaiver,
  type LoadedWaiverDocument,
  type SignerRole,
  type WaiverCompetitor,
  type WaiverStatus,
} from '../lib/waiver';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type EmailState = 'sending' | 'sent' | 'failed';

const pacific = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'long',
    timeStyle: 'short',
  }) + ' Pacific';

const today = () =>
  new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long' });

const normalise = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

const joinNames = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/**
 * The PDF draws signatures in Noto Sans Italic; load the same face here so
 * the preview looks like what lands in the PDF. Falls back to italic text.
 */
function useSignatureFont() {
  useEffect(() => {
    if (typeof FontFace === 'undefined') return;
    const face = new FontFace('SFMO Signature', `url(${asset('legal/fonts/NotoSans-Italic.ttf')})`, {
      style: 'italic',
    });
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch(() => {
        /* the fallback italic is fine */
      });
  }, []);
}

/** The waiver, set as a document. The same JSON is printed in the PDF. */
function WaiverDocumentView({ loaded }: { loaded: LoadedWaiverDocument }) {
  const { doc } = loaded;
  return (
    <article className="legal" aria-labelledby="legal-title">
      <header className="legal__head">
        <p className="legal__org label">{doc.organizer}</p>
        <h2 className="legal__title" id="legal-title">
          {doc.title}
        </h2>
        <p className="legal__event">
          {doc.event} · {doc.eventLine}
        </p>
      </header>
      <p className="legal__notice">{doc.notice}</p>
      {doc.sections.map((section) => (
        <section className="legal__section" key={section.heading}>
          <h3 className="legal__heading">{section.heading}</h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
      <p className="legal__ack">{doc.acknowledgment}</p>
      <p className="legal__meta mono">
        Document {doc.id} · published {doc.published} · SHA-256 {loaded.sha256.slice(0, 16)}…
      </p>
    </article>
  );
}

function CompetitorList({
  status,
  onDownload,
  downloading,
}: {
  status: WaiverStatus;
  onDownload?: (competitor: WaiverCompetitor) => void;
  downloading?: string | null;
}) {
  return (
    <ul className="waiver-who">
      {status.competitors.map((competitor) => (
        <li className="waiver-who__row" key={competitor.competitor_id}>
          <span className="id-list__id pixel">{competitor.competitor_id}</span>
          <span className="waiver-who__name">
            {competitor.full_name}
            {competitor.grade ? <small>Grade {competitor.grade}</small> : null}
            {competitor.signed && competitor.signed_at && (
              <small className="waiver-who__signed">
                Signed by {competitor.signed_name} ({competitor.signer_role === 'self' ? 'competitor' : 'parent or guardian'}),{' '}
                {pacific(competitor.signed_at)}
              </small>
            )}
          </span>
          {competitor.signed ? (
            <span className="waiver-who__end">
              <span className="badge badge--kelp">Signed</span>
              {onDownload && (
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => onDownload(competitor)}
                  disabled={downloading === competitor.competitor_id}
                >
                  {downloading === competitor.competitor_id ? 'Preparing…' : 'Download PDF'}
                </button>
              )}
            </span>
          ) : (
            <span className="badge badge--sub">Needs signature</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SignForm({
  token,
  status,
  loaded,
  onSigned,
}: {
  token: string;
  status: WaiverStatus;
  loaded: LoadedWaiverDocument;
  onSigned: (next: WaiverStatus) => void;
}) {
  const unsigned = status.competitors.filter((competitor) => !competitor.signed);
  const owner = status.competitors.find((competitor) => competitor.is_link_owner);
  const canSignSelf = Boolean(owner && !owner.signed);
  const [role, setRole] = useState<SignerRole | ''>('');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const covers = role === 'self' && owner ? [owner] : unsigned;
  const looksLikeCompetitor =
    role === 'guardian' &&
    name.trim() !== '' &&
    status.competitors.some((competitor) => normalise(competitor.full_name) === normalise(name));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!role) {
      setError('Choose whether you are signing as the parent or guardian, or as the competitor.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await signWaiver(token, {
        name,
        role,
        agree: agree && consent,
        docId: loaded.doc.id,
        sha256: loaded.sha256,
      });
      onSigned(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not record your signature.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sign-box" onSubmit={onSubmit}>
      <h2 className="sign-box__title">
        <PixelIcon name="doc" size={30} /> Sign the waiver
      </h2>

      <fieldset className="sign-box__group" disabled={busy}>
        <legend className="field__label">I am signing as</legend>
        <label className={`division-option ${role === 'guardian' ? 'division-option--on' : ''}`}>
          <input
            type="radio"
            name="role"
            value="guardian"
            checked={role === 'guardian'}
            onChange={() => setRole('guardian')}
            required
          />
          <span className="division-option__label label">Parent or legal guardian</span>
          <span className="division-option__detail">
            of {joinNames(unsigned.map((competitor) => competitor.full_name))}, with authority to
            sign for them
          </span>
        </label>
        {canSignSelf && owner && (
          <label className={`division-option ${role === 'self' ? 'division-option--on' : ''}`}>
            <input
              type="radio"
              name="role"
              value="self"
              checked={role === 'self'}
              onChange={() => setRole('self')}
            />
            <span className="division-option__label label">The competitor, 18 or older</span>
            <span className="division-option__detail">
              I am {owner.full_name} and signing for myself
            </span>
          </label>
        )}
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor="signed_name">
          Your full legal name <span className="req">*</span>
        </label>
        <input
          id="signed_name"
          className="input"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          value={name}
          disabled={busy}
          onChange={(event) => setName(event.target.value)}
          aria-describedby="signed-name-hint"
        />
        <p
          id="signed-name-hint"
          className={`field__hint ${looksLikeCompetitor ? 'field__hint--warn' : ''}`}
        >
          {looksLikeCompetitor
            ? 'That is a competitor’s name. A parent or guardian signs with their own name.'
            : role === 'self'
              ? 'Type your own full name, as it appears on the team.'
              : 'Type your own full name — not the competitor’s.'}
        </p>
      </div>

      <div className="sig-preview" aria-live="polite">
        <span className="sig-preview__label label">Signature</span>
        <span className="sig-preview__name">{name.trim() || ' '}</span>
        <span className="sig-preview__line" aria-hidden="true" />
        <span className="sig-preview__date">
          {role === 'self' ? 'Participant' : 'Parent or legal guardian'} · {today()}
        </span>
      </div>

      <div className="doc__confirms">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={agree}
            disabled={busy}
            onChange={(event) => setAgree(event.target.checked)}
            required
          />
          <span>
            I have read the whole waiver above, I understand it, and I agree to it for{' '}
            {joinNames(covers.map((competitor) => competitor.full_name)) || 'the competitor'}. I
            understand that I am giving up legal rights, including the right to sue for ordinary
            negligence.
          </span>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={consent}
            disabled={busy}
            onChange={(event) => setConsent(event.target.checked)}
            required
          />
          <span>
            I agree to sign electronically. My typed name is my signature, with the same effect as
            signing by hand, and I agree to receive the signed copy by email.
          </span>
        </label>
      </div>

      {error && (
        <div className="notice notice--warn">
          <div>
            <p className="notice__title">Not signed yet</p>
            <p className="notice__body">{error}</p>
          </div>
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
        {busy
          ? 'Signing…'
          : covers.length > 1
            ? `Sign for ${covers.length} competitors`
            : 'Sign the waiver'}{' '}
        <ArrowIcon />
      </button>
      <p className="field__hint">
        With your signature we record the time, your browser and, where available, your network
        address, as evidence of who signed. A signed PDF is emailed to you.
      </p>
    </form>
  );
}

export function WaiverPage() {
  const [params] = useSearchParams();
  const token = (params.get('t') ?? '').trim();
  const hasToken = UUID.test(token);
  useSignatureFont();

  const [loaded, setLoaded] = useState<LoadedWaiverDocument | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [status, setStatus] = useState<WaiverStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState(false);
  const [email, setEmail] = useState<EmailState | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    loadWaiverDocument().then(setLoaded, (caught: Error) => setDocError(caught.message));
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    if (!isSupabaseConfigured) {
      setStatusError('Signing is not connected on this copy of the site. Please email us.');
      return;
    }
    let active = true;
    getWaiver(token).then(
      (result) => active && setStatus(result),
      (caught: Error) => active && setStatusError(caught.message),
    );
    return () => {
      active = false;
    };
  }, [hasToken, token]);

  function onSigned(next: WaiverStatus) {
    setStatus(next);
    setJustSigned(true);
    setEmail('sending');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    emailSignedWaiver(token).then((sent) => setEmail(sent ? 'sent' : 'failed'));
  }

  async function onDownload(competitor: WaiverCompetitor) {
    setDownloading(competitor.competitor_id);
    setDownloadError(null);
    try {
      await downloadWaiverPdf(token, competitor.competitor_id);
    } catch (caught) {
      setDownloadError(caught instanceof Error ? caught.message : 'Could not download the PDF.');
    } finally {
      setDownloading(null);
    }
  }

  const unsigned = status?.competitors.filter((competitor) => !competitor.signed) ?? [];
  const anySigned = status?.competitors.some((competitor) => competitor.signed) ?? false;
  const allSigned = Boolean(status) && unsigned.length === 0;

  return (
    <>
      <SeoHead
        title="Liability waiver — SFMO 2027"
        description="Read and sign the SFMO 2027 participant waiver."
        noindex
      />

      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">SFMO 2027</p>
          <h1>Liability waiver</h1>
          <p className="lede">
            {hasToken
              ? 'Every competitor needs a waiver signed by a parent or legal guardian — or by the competitor, if they are 18 or older — before competition day. It takes about two minutes.'
              : 'The waiver every competitor’s parent or legal guardian signs for SFMO 2027. After a team registers, we email each parent or guardian a private link to sign it here.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap wrap--narrow waiver-page">
          {hasToken && !status && !statusError && <p className="loading label">Opening your waiver…</p>}

          {statusError && (
            <div className="notice notice--warn">
              <div>
                <p className="notice__title">We could not open this link</p>
                <p className="notice__body">
                  {statusError} Questions? Email{' '}
                  <a href={`mailto:${links.email}`}>{links.email}</a>.
                </p>
              </div>
            </div>
          )}

          {status && (
            <div className="panel waiver-team">
              {justSigned && (
                <div className="notice notice--ok waiver-team__done" role="status">
                  <div>
                    <p className="notice__title">Signed — thank you</p>
                    <p className="notice__body">
                      {email === 'sending' && 'Emailing you a signed copy…'}
                      {email === 'sent' &&
                        'We have emailed you a signed copy (PDF). You can also download it below.'}
                      {email === 'failed' &&
                        'Your signature is saved. We could not email the PDF just now, so please download it below.'}
                    </p>
                  </div>
                </div>
              )}
              <p className="eyebrow">
                Team {status.team_code} · {status.team_name}
              </p>
              <h2 className="waiver-team__title">
                {allSigned
                  ? 'All signed'
                  : `${unsigned.length} waiver${unsigned.length === 1 ? '' : 's'} to sign`}
              </h2>
              <CompetitorList
                status={status}
                onDownload={anySigned ? onDownload : undefined}
                downloading={downloading}
              />
              {downloadError && (
                <p className="field__hint field__hint--warn" role="alert">
                  {downloadError}
                </p>
              )}
              {allSigned && (
                <p className="field__hint">
                  Nothing more to do. Keep the PDF for your records; we keep a copy too. If anything
                  here is wrong, email <a href={`mailto:${links.email}`}>{links.email}</a>.
                </p>
              )}
            </div>
          )}

          {docError && (
            <div className="notice notice--warn">
              <div>
                <p className="notice__title">Could not load the waiver</p>
                <p className="notice__body">{docError}</p>
              </div>
            </div>
          )}

          {loaded &&
            (allSigned ? (
              <details className="panel waiver-docs">
                <summary className="waiver-docs__summary">Read the waiver that was signed</summary>
                <WaiverDocumentView loaded={loaded} />
              </details>
            ) : (
              <WaiverDocumentView loaded={loaded} />
            ))}

          {status && loaded && unsigned.length > 0 && (
            // Keyed by who is left, so each new signer starts from a blank form.
            <SignForm
              key={unsigned.map((competitor) => competitor.competitor_id).join()}
              token={token}
              status={status}
              loaded={loaded}
              onSigned={onSigned}
            />
          )}

          {!hasToken && (
            <div className="notice notice--info">
              <div>
                <p className="notice__title">Looking for your signing link?</p>
                <p className="notice__body">
                  It is in the email we sent the parent or guardian named at registration. Can&apos;t
                  find it? Email <a href={`mailto:${links.email}`}>{links.email}</a> with the
                  team ID and we will send it again. Not registered yet?{' '}
                  <Link to="/register">Register a team</Link>.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
