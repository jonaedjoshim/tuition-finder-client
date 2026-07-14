// Small client-side presentation helpers.
// The backend does NOT store avatar colors/initials or relative time strings —
// these are derived on the frontend from real data (name, createdAt) instead.

const AVATAR_COLORS = [
  '#2D5BE3', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#BE185D', '#065F46',
];

// Deterministic color based on a string (so the same user always gets the same color)
export function colorFor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initialsFor(name = '') {
  return (name || 'U').trim().slice(0, 2).toUpperCase();
}

// "3 days ago", "2 hours ago", etc. from an ISO date string
export function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Maps frontend display labels <-> backend enum values
export const TUTOR_GENDER_TO_BACKEND = {
  'No Preference': 'any',
  'Male': 'male',
  'Female': 'female',
};
export const TUTOR_GENDER_FROM_BACKEND = {
  any: 'No Preference',
  male: 'Male',
  female: 'Female',
};

export const MEDIUM_TO_BACKEND = {
  'Bangla Medium': 'Bangla',
  'English Medium': 'English',
  'English Version': 'English Version',
  'Madrasa': 'Madrasa',
};
export const MEDIUM_FROM_BACKEND = {
  Bangla: 'Bangla Medium',
  English: 'English Medium',
  'English Version': 'English Version',
  Madrasa: 'Madrasa',
};

// Friendly message extractor for axios errors, matching backend's { message: "..." } shape
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback;
}
