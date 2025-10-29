/**
 * Application-wide constants
 * Centralizes magic numbers, URLs, and configuration values
 */

// ============================================================================
// FILE UPLOAD CONSTRAINTS
// ============================================================================

export const FILE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 6 * 1024 * 1024 * 1024, // 6GB
  MAX_SIZE_DISPLAY: '6GB',
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB for images
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
} as const;

// ============================================================================
// TOKEN CREATION CONSTRAINTS
// ============================================================================

export const TOKEN_CONSTRAINTS = {
  MIN_TICKER_LENGTH: 3,
  MAX_TICKER_LENGTH: 10,
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_SUPPLY: 1_000_000_000,
  TICKER_REGEX: /^[A-Z0-9]+$/,
} as const;

// ============================================================================
// BLOCKCHAIN CONFIGURATION
// ============================================================================

export const BLOCKCHAIN_CONFIG = {
  DEFAULT_COMMITMENT_LEVEL: 'confirmed',
  TRANSACTION_TIMEOUT_MS: 60000, // 60 seconds
  CONFIRMATION_TIMEOUT_MS: 90000, // 90 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
} as const;

// ============================================================================
// EXTERNAL URLS
// ============================================================================

export const EXTERNAL_URLS = {
  JUPITER_SWAP_BASE: 'https://jup.ag/swap/SOL-',
  JUPITER_APP: 'https://jup.ag',
  TWITTER_INTENT: 'https://twitter.com/intent/tweet',
  SOLANA_EXPLORER: 'https://solscan.io',
  METEORA_APP: 'https://app.meteora.ag',
} as const;

// ============================================================================
// UI TIMING CONSTANTS
// ============================================================================

export const UI_TIMING = {
  SUCCESS_MODAL_DELAY_MS: 2000,
  TOAST_DURATION_MS: 3000,
  CONFETTI_DURATION_MS: 3000,
  DEBOUNCE_DELAY_MS: 300,
  THROTTLE_DELAY_MS: 1000,
} as const;

// ============================================================================
// PAGINATION & LIMITS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INITIAL_LOAD_COUNT: 10,
  INFINITE_SCROLL_THRESHOLD: 0.8, // Load more when 80% scrolled
} as const;

// ============================================================================
// SOCIAL METRICS
// ============================================================================

export const SOCIAL_METRICS = {
  MIN_FOLLOWERS_FOR_VERIFIED: 1000,
  MIN_HOLDERS_FOR_TRENDING: 10,
  TRENDING_TIMEFRAME_HOURS: 24,
  HOT_POST_LIKE_THRESHOLD: 50,
  VIRAL_POST_SHARE_THRESHOLD: 100,
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE_CONFIG = {
  QUERY_STALE_TIME_MS: 60000, // 1 minute
  QUERY_CACHE_TIME_MS: 300000, // 5 minutes
  IMAGE_CACHE_MAX_AGE: 86400, // 24 hours
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // File Upload Errors
  FILE_TOO_LARGE: `File size must be under ${FILE_CONSTRAINTS.MAX_SIZE_DISPLAY}`,
  IMAGE_TOO_LARGE: 'Image must be under 10MB',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image or video.',
  INVALID_IMAGE_TYPE: 'Invalid image type. Supported formats: JPG, PNG, GIF, WEBP',

  // Token Creation Errors
  TICKER_TOO_SHORT: `Ticker must be at least ${TOKEN_CONSTRAINTS.MIN_TICKER_LENGTH} characters`,
  TICKER_TOO_LONG: `Ticker must be no more than ${TOKEN_CONSTRAINTS.MAX_TICKER_LENGTH} characters`,
  TICKER_INVALID_FORMAT: 'Ticker must contain only letters and numbers',
  TITLE_REQUIRED: 'Title is required',

  // Wallet Errors
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  WALLET_SIGNATURE_REJECTED: 'Transaction was rejected. Please try again.',
  INSUFFICIENT_BALANCE: 'Insufficient SOL balance for transaction',

  // API Errors
  SUPABASE_NOT_CONFIGURED: 'Database connection not configured',
  TRANSACTION_FAILED: 'Transaction failed on blockchain',
  UPLOAD_FAILED: 'Failed to upload file',
  USER_CREATION_FAILED: 'Failed to create or find user',

  // Network Errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',

  // Generic
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  IMAGE_UPLOADED: 'Image uploaded successfully!',
  TOKEN_CREATED: 'Token created successfully!',
  POST_PUBLISHED: 'Post published successfully!',
  TRANSACTION_CONFIRMED: 'Transaction confirmed on blockchain',
  PROFILE_UPDATED: 'Profile updated successfully',
  COMMENT_POSTED: 'Comment posted successfully',
} as const;

// ============================================================================
// ROUTE PATHS
// ============================================================================

export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  CREATE: '/create',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  POST_DETAIL: (id: string) => `/post/${id}`,
  USER_PROFILE: (username: string) => `/profile/${username}`,
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  POSTS_CREATE: '/api/posts/create',
  POSTS_CONFIRM: '/api/posts/confirm',
  POSTS_LIST: '/api/posts',
  USER_PROFILE: '/api/users/profile',
  CREATOR_COIN_ACTIVATE: '/api/creator-coin/activate',
  UPLOAD: '/api/upload',
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  WALLET_PREFERENCE: 'wallet_preference',
  THEME: 'theme',
  LAST_VISITED_PROFILE: 'last_visited_profile',
  DRAFT_POST: 'draft_post',
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
  BIO_MAX_LENGTH: 160,
  WEBSITE_REGEX: /^https?:\/\/.+/,
  TWITTER_HANDLE_REGEX: /^@?[a-zA-Z0-9_]{1,15}$/,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if file size is within allowed limit
 */
export function isFileSizeValid(fileSize: number, maxSize: number = FILE_CONSTRAINTS.MAX_SIZE_BYTES): boolean {
  return fileSize <= maxSize;
}

/**
 * Checks if file type is allowed for images
 */
export function isImageTypeValid(fileType: string): boolean {
  return FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(fileType as any);
}

/**
 * Checks if file type is allowed for videos
 */
export function isVideoTypeValid(fileType: string): boolean {
  return FILE_CONSTRAINTS.ALLOWED_VIDEO_TYPES.includes(fileType as any);
}

/**
 * Validates ticker format
 */
export function isTickerValid(ticker: string): boolean {
  return (
    ticker.length >= TOKEN_CONSTRAINTS.MIN_TICKER_LENGTH &&
    ticker.length <= TOKEN_CONSTRAINTS.MAX_TICKER_LENGTH &&
    TOKEN_CONSTRAINTS.TICKER_REGEX.test(ticker)
  );
}

/**
 * Validates username format
 */
export function isUsernameValid(username: string): boolean {
  return (
    username.length >= VALIDATION_RULES.USERNAME_MIN_LENGTH &&
    username.length <= VALIDATION_RULES.USERNAME_MAX_LENGTH &&
    VALIDATION_RULES.USERNAME_REGEX.test(username)
  );
}
