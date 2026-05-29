// ─── App-Wide Constants ───────────────────────────────────────────────────────
// Put shared configuration values here so they are easy to find and change

export const JWT_TOKEN_EXPIRY = '30d';  // How long JWT tokens stay valid

export const SALT_ROUNDS = 10;          // BCrypt password hashing strength

// Default profile image when user doesn't upload one
export const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

// Max file size for uploaded images (5 MB)
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

// Allowed image file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// How old (in seconds) a Telegram auth token can be before we reject it
export const TELEGRAM_AUTH_MAX_AGE_SECONDS = 86400; // 24 hours
