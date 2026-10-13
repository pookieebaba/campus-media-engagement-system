/**
 * Returns true if the string is a valid email address.
 */
export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Returns true if the password meets the minimum requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one digit
 */
export function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Returns true if the student ID is a non-empty string.
 */
export function isValidStudentId(id) {
  if (!id) return false;
  return /^[A-Za-z0-9_-]{3,30}$/.test(String(id).trim());
}
