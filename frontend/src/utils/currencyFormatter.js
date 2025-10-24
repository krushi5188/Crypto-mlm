/**
 * Currency Formatter with i18n support
 * Formats currency values according to user's locale and preferences
 */

// Currency configurations for different regions
const currencyConfigs = {
  USD: {
    symbol: '$',
    code: 'USD',
    decimals: 2,
    locales: ['en-US', 'en']
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    decimals: 2,
    locales: ['es-ES', 'fr-FR', 'de-DE', 'es', 'fr']
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    decimals: 2,
    locales: ['en-GB']
  },
  JPY: {
    symbol: '¥',
    code: 'JPY',
    decimals: 0,
    locales: ['ja-JP']
  },
  CNY: {
    symbol: '¥',
    code: 'CNY',
    decimals: 2,
    locales: ['zh-CN', 'zh']
  },
  USDT: {
    symbol: 'USDT',
    code: 'USDT',
    decimals: 2,
    locales: ['en-US', 'en'] // Default to US formatting
  }
};

/**
 * Format currency with locale-specific formatting
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (USD, EUR, USDT, etc.)
 * @param {string} locale - Locale code (en-US, es-ES, etc.)
 * @param {object} options - Additional formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (
  amount,
  currency = 'USDT',
  locale = null,
  options = {}
) => {
  // Get currency config
  const config = currencyConfigs[currency] || currencyConfigs.USDT;

  // Determine locale
  const userLocale =
    locale ||
    localStorage.getItem('i18nextLng') ||
    navigator.language ||
    'en-US';

  // For crypto currencies, always show symbol after
  if (currency === 'USDT') {
    const formatted = new Intl.NumberFormat(userLocale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
      ...options
    }).format(amount);
    return `${formatted} ${config.symbol}`;
  }

  // For fiat currencies, use native Intl formatting
  try {
    return new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
      ...options
    }).format(amount);
  } catch (error) {
    // Fallback if currency code not supported
    const formatted = new Intl.NumberFormat(userLocale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
      ...options
    }).format(amount);
    return `${config.symbol}${formatted}`;
  }
};

/**
 * Format number with locale-specific formatting
 * @param {number} value - The number to format
 * @param {string} locale - Locale code
 * @param {object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, locale = null, options = {}) => {
  const userLocale =
    locale ||
    localStorage.getItem('i18nextLng') ||
    navigator.language ||
    'en-US';

  return new Intl.NumberFormat(userLocale, options).format(value);
};

/**
 * Format percentage with locale-specific formatting
 * @param {number} value - The percentage value (0-100)
 * @param {string} locale - Locale code
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, locale = null, decimals = 2) => {
  const userLocale =
    locale ||
    localStorage.getItem('i18nextLng') ||
    navigator.language ||
    'en-US';

  return new Intl.NumberFormat(userLocale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

/**
 * Parse currency string to number
 * Removes currency symbols and formatting
 * @param {string} currencyString - Formatted currency string
 * @returns {number} Numeric value
 */
export const parseCurrency = (currencyString) => {
  if (typeof currencyString === 'number') return currencyString;
  if (!currencyString) return 0;

  // Remove all non-numeric characters except decimal point and minus
  const cleaned = currencyString.toString().replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Get currency symbol for a currency code
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = 'USDT') => {
  const config = currencyConfigs[currency] || currencyConfigs.USDT;
  return config.symbol;
};

/**
 * Format compact number (1K, 1M, 1B)
 * @param {number} value - The number to format
 * @param {string} locale - Locale code
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (value, locale = null) => {
  const userLocale =
    locale ||
    localStorage.getItem('i18nextLng') ||
    navigator.language ||
    'en-US';

  try {
    return new Intl.NumberFormat(userLocale, {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  } catch (error) {
    // Fallback for browsers that don't support compact notation
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
};

/**
 * Get appropriate currency for locale
 * @param {string} locale - Locale code
 * @returns {string} Currency code
 */
export const getCurrencyForLocale = (locale = null) => {
  const userLocale =
    locale ||
    localStorage.getItem('i18nextLng') ||
    navigator.language ||
    'en-US';

  // Map locales to currencies
  const localeToCurrency = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'es': 'EUR',
    'es-ES': 'EUR',
    'fr': 'EUR',
    'fr-FR': 'EUR',
    'de': 'EUR',
    'de-DE': 'EUR',
    'zh': 'CNY',
    'zh-CN': 'CNY',
    'ja': 'JPY',
    'ja-JP': 'JPY'
  };

  // Extract language code if full locale
  const langCode = userLocale.split('-')[0];

  return (
    localeToCurrency[userLocale] ||
    localeToCurrency[langCode] ||
    'USDT' // Default to USDT for crypto platform
  );
};

export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  parseCurrency,
  getCurrencySymbol,
  formatCompactNumber,
  getCurrencyForLocale
};
