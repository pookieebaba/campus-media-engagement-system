const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * generateQRToken — creates a secure QR token pair.
 * @param {Date} eventEndTime - The event end time; token expires 30 min after
 * @returns {{ rawToken: string, hashedToken: string, expires: Date }}
 */
function generateQRToken(eventEndTime) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Expires 30 minutes after event end
  const endMs = eventEndTime instanceof Date ? eventEndTime.getTime() : Date.now();
  const expires = new Date(endMs + 30 * 60 * 1000);

  return { rawToken, hashedToken, expires };
}

/**
 * generateQRCodeDataURL — generates a QR code image as a data URL.
 * @param {string} rawToken
 * @returns {Promise<string>} data URL (image/png base64)
 */
async function generateQRCodeDataURL(rawToken) {
  return QRCode.toDataURL(rawToken, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
  });
}

/**
 * verifyQRToken — compares rawToken against storedHash in constant time.
 * @param {string} rawToken
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyQRToken(rawToken, storedHash) {
  if (!rawToken || !storedHash) return false;
  const inputHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

module.exports = { generateQRToken, generateQRCodeDataURL, verifyQRToken };
