/**
 * SFMO email relay — sends the registration confirmation emails from the
 * Google account that owns this script (sfmathopen@gmail.com).
 *
 * The send-confirmation Edge Function writes every email; this script only
 * delivers them, and only for a caller holding the relay secret. Setup is in
 * supabase/README.md, section 7.
 *
 * Free Gmail accounts may email 100 recipients a day through Apps Script.
 */

const MAX_MESSAGES = 10; // one team: contact + up to four guardians

/**
 * Run this once from the editor (select "setup", then Run). It asks for
 * permission to send email as you, creates the relay secret if there is none
 * yet, and prints it in the execution log for the Supabase secrets.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('RELAY_SECRET');
  if (!secret) {
    secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('RELAY_SECRET', secret);
  }
  Logger.log('EMAIL_RELAY_SECRET = ' + secret);
  Logger.log('Emails left today: ' + MailApp.getRemainingDailyQuota());
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'Request body is not JSON.' });
  }

  const secret = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');
  if (!secret || typeof body.secret !== 'string' || body.secret !== secret) {
    return reply({ ok: false, error: 'Wrong or missing relay secret.' });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return reply({ ok: false, error: 'Send between 1 and ' + MAX_MESSAGES + ' messages.' });
  }
  const isEmail = (value) => typeof value === 'string' && /^[^@\s,;]+@[^@\s,;]+$/.test(value);
  for (const m of messages) {
    if (!isEmail(m.to) || (m.cc && !isEmail(m.cc)) || !m.subject || !m.text) {
      return reply({ ok: false, error: 'Each message needs one valid "to", a subject and text.' });
    }
  }

  // Check the whole batch fits today's quota before sending any of it, so a
  // team never gets half its emails.
  const recipients = messages.reduce((n, m) => n + (m.cc ? 2 : 1), 0);
  const left = MailApp.getRemainingDailyQuota();
  if (left < recipients) {
    return reply({ ok: false, error: 'Daily Gmail quota reached (' + left + ' left). Try again tomorrow.' });
  }

  for (const m of messages) {
    const options = { to: m.to, subject: m.subject, body: m.text, name: m.name || 'SFMO 2027' };
    if (m.html) options.htmlBody = m.html;
    if (m.cc) options.cc = m.cc;
    if (m.replyTo) options.replyTo = m.replyTo;
    MailApp.sendEmail(options);
  }
  return reply({ ok: true, sent: messages.length });
}

function reply(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
