const { parse } = require('csv-parse/sync');

// Control characters regex (strip anything that could cause formula injection or encoding issues)
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * sanitizeCSVValue — strips control characters from a string value.
 * @param {*} v
 * @returns {string}
 */
function sanitizeCSVValue(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(CONTROL_CHARS_RE, '').trim();
}

/**
 * parseCSV — parses a CSV buffer into an array of row objects.
 * Uses csv-parse/sync with columns:true, skip_empty_lines:true, trim:true.
 * @param {Buffer|string} buffer
 * @returns {Object[]}
 */
function parseCSV(buffer) {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  // Sanitize all values
  return rows.map((row) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(row)) {
      sanitized[sanitizeCSVValue(key)] = sanitizeCSVValue(value);
    }
    return sanitized;
  });
}

/**
 * validateStudentRow — validates a parsed CSV row for student import.
 * Required fields: name, email, studentId, blockCode
 * @param {Object} row
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateStudentRow(row) {
  const errors = [];

  if (!row.name || row.name.length < 2) {
    errors.push('name is required and must be at least 2 characters');
  }
  if (!row.email || !/^\S+@\S+\.\S+$/.test(row.email)) {
    errors.push('email must be a valid email address');
  }
  if (!row.studentId || row.studentId.length < 3) {
    errors.push('studentId is required and must be at least 3 characters');
  }
  if (!row.blockCode || row.blockCode.length < 1) {
    errors.push('blockCode is required');
  }

  // Optional: validate name length
  if (row.name && row.name.length > 100) {
    errors.push('name cannot exceed 100 characters');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { parseCSV, validateStudentRow, sanitizeCSVValue };
