/**
 * mailer.js
 *
 * Development  → Uses Nodemailer's built-in Ethereal test account.
 *                No configuration needed. On first send, an Ethereal account
 *                is created automatically. Each sent email prints a preview URL
 *                to the console: open it in any browser to read the email.
 *
 * Production   → Uses SMTP credentials from environment variables:
 *                SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *
 * Usage:
 *   const { sendMail } = require('./mailer');
 *   await sendMail({ to, subject, html });
 */

const nodemailer = require('nodemailer');

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.NODE_ENV === 'production') {
    // ── Production: use configured SMTP ──────────────────────────────────────
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        'Production mailer requires SMTP_HOST, SMTP_USER, and SMTP_PASS in environment.'
      );
    }
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // ── Development: auto-create free Ethereal test account ──────────────────
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[mailer] Ethereal test account ready:', testAccount.user);
  }

  return _transporter;
}

/**
 * Send an email.
 *
 * @param {object} opts
 * @param {string}   opts.to       Recipient email address
 * @param {string}   opts.subject  Email subject
 * @param {string}   opts.html     HTML body
 * @param {string}  [opts.text]    Plain-text fallback (auto-generated if omitted)
 * @param {string}  [opts.from]    Sender (defaults to SMTP_USER or cmes@cmes.edu)
 */
async function sendMail({ to, subject, html, text, from }) {
  const transporter = await getTransporter();

  const fromAddress =
    from ||
    process.env.SMTP_USER ||
    'CMES System <noreply@cmes.edu>';

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });

  // In development, print the Ethereal preview URL so you can read the email
  if (process.env.NODE_ENV !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[mailer] Email sent to ${to}`);
      console.log(`[mailer] Preview URL: ${previewUrl}`);
    }
  }

  return info;
}

module.exports = { sendMail };
