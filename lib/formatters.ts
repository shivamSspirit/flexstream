/**
 * Formatting Utilities
 * Pure functions for formatting various data types
 * Follows Single Responsibility Principle
 */

// ============================================================================
// FILE SIZE FORMATTING
// ============================================================================

/**
 * Formats file size in bytes to human-readable format
 * @example formatFileSize(1024) => "1 KB"
 * @example formatFileSize(1536) => "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Formats a number with commas as thousand separators
 * @example formatNumber(1000) => "1,000"
 * @example formatNumber(1000000) => "1,000,000"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Formats a number to compact notation (K, M, B)
 * @example formatCompactNumber(1500) => "1.5K"
 * @example formatCompactNumber(1000000) => "1M"
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();

  const units = ['', 'K', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(num) / 3);
  const unitValue = (num / Math.pow(1000, order)).toFixed(1);

  return unitValue.replace(/\.0$/, '') + units[order];
}

/**
 * Formats a percentage
 * @example formatPercentage(0.1234) => "12.34%"
 * @example formatPercentage(0.1234, 0) => "12%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Formats a number as USD currency
 * @example formatUSD(1234.56) => "$1,234.56"
 */
export function formatUSD(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formats SOL amount with appropriate decimals
 * @example formatSOL(1.234567) => "1.23 SOL"
 */
export function formatSOL(amount: number, decimals: number = 2): string {
  return `${amount.toFixed(decimals)} SOL`;
}

/**
 * Formats token amount from lamports to human-readable
 * @example formatTokenAmount(1000000, 6) => "1.000000"
 */
export function formatTokenAmount(lamports: number, decimals: number): string {
  return (lamports / Math.pow(10, decimals)).toFixed(decimals);
}

// ============================================================================
// ADDRESS FORMATTING
// ============================================================================

/**
 * Truncates a blockchain address for display
 * @example truncateAddress("5GzBF...") => "5GzBF...abc123"
 */
export function truncateAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a wallet address for display with middle truncation
 * @example formatWalletAddress("5GzBF...") => "5Gz...123"
 */
export function formatWalletAddress(address: string): string {
  return truncateAddress(address, 3, 3);
}

// ============================================================================
// DATE/TIME FORMATTING
// ============================================================================

/**
 * Formats a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Formats a date to a readable string
 * @example formatDate(new Date()) => "Jan 1, 2025"
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date with time
 * @example formatDateTime(new Date()) => "Jan 1, 2025 at 3:45 PM"
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const datePart = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timePart = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${datePart} at ${timePart}`;
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Truncates text to a maximum length with ellipsis
 * @example truncateText("Hello World", 8) => "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Converts text to title case
 * @example toTitleCase("hello world") => "Hello World"
 */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Pluralizes a word based on count
 * @example pluralize(1, "item") => "item"
 * @example pluralize(2, "item") => "items"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

// ============================================================================
// SOCIAL METRICS FORMATTING
// ============================================================================

/**
 * Formats a count with label (e.g., "1.2K followers")
 */
export function formatCountWithLabel(
  count: number,
  singularLabel: string,
  pluralLabel?: string
): string {
  const formattedCount = formatCompactNumber(count);
  const label = pluralize(count, singularLabel, pluralLabel);
  return `${formattedCount} ${label}`;
}

/**
 * Formats market cap
 * @example formatMarketCap(1500000) => "$1.5M"
 */
export function formatMarketCap(value: number): string {
  if (value < 1000) return formatUSD(value, 0);

  const units = ['', 'K', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(value) / 3);
  const unitValue = (value / Math.pow(1000, order)).toFixed(1);

  return '$' + unitValue.replace(/\.0$/, '') + units[order];
}

// ============================================================================
// URL FORMATTING
// ============================================================================

/**
 * Builds a query string from an object
 * @example buildQueryString({ foo: "bar", baz: 123 }) => "foo=bar&baz=123"
 */
export function buildQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join('&');
}

/**
 * Extracts username from Twitter handle
 * @example extractTwitterUsername("@username") => "username"
 */
export function extractTwitterUsername(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1) : handle;
}

/**
 * Formats a URL for display (removes protocol)
 * @example formatDisplayUrl("https://example.com") => "example.com"
 */
export function formatDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
