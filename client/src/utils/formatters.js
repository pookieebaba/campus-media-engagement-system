/**
 * Format a date as "Jan 15, 2025"
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a time string or Date as "10:30 AM"
 */
export function formatTime(time) {
  if (!time) return '—';
  const d = typeof time === 'string' && !time.includes('T')
    ? new Date(`1970-01-01T${time}`)
    : new Date(time);
  if (isNaN(d.getTime())) return time;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Format a full datetime as "Jan 15, 2025, 10:30 AM"
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date relative to now: "2 hours ago", "in 3 days"
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diffMs = d - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'seconds');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minutes');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hours');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'days');
  return formatDate(date);
}

/**
 * Format a student ID for display
 */
export function formatStudentId(id) {
  if (!id) return '—';
  return String(id).toUpperCase();
}

/**
 * Capitalize first letter
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Trigger browser download for a CSV blob
 */
export function formatCSVExport(blob, filename = 'export.csv') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
