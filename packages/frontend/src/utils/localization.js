/**
 * Localization utilities for formatting prices, distances, and dates
 * based on user's locale and selected city
 */

/**
 * Format price with proper currency symbol and locale
 * @param {number} amount - The price amount
 * @param {string} currency - Currency code (USD, EUR, GBP, JPY, TWD)
 * @param {string} locale - Locale string (en-US, en-GB, fr-FR, ja-JP, zh-TW)
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, currency = 'USD', locale = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      TWD: 'NT$'
    };
    return `${symbols[currency] || '$'}${amount}`;
  }
};

/**
 * Format distance based on locale (metric vs imperial)
 * @param {number} meters - Distance in meters
 * @param {string} locale - Locale string
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters, locale = 'en-US') => {
  // US uses imperial system
  if (locale === 'en-US') {
    const feet = meters * 3.28084;
    const miles = meters * 0.000621371;
    
    if (miles >= 0.1) {
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${Math.round(feet)} ft`;
    }
  }
  
  // Rest of the world uses metric
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

/**
 * Format date and time based on locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale string
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatDateTime = (date, locale = 'en-US', includeTime = true) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  try {
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    // Fallback formatting
    return dateObj.toLocaleString();
  }
};

/**
 * Get parking terminology based on locale
 * @param {string} term - Term to translate
 * @param {string} locale - Locale string
 * @returns {string} Localized term
 */
export const getParkingTerm = (term, locale = 'en-US') => {
  const terms = {
    'garage': {
      'en-US': 'Parking Garage',
      'en-GB': 'Car Park',
      'fr-FR': 'Parking Couvert',
      'ja-JP': '駐車場',
      'zh-TW': '停車場'
    },
    'street': {
      'en-US': 'Street Parking',
      'en-GB': 'On-Street Parking',
      'fr-FR': 'Stationnement de Rue',
      'ja-JP': '路上駐車',
      'zh-TW': '路邊停車'
    },
    'lot': {
      'en-US': 'Parking Lot',
      'en-GB': 'Car Park',
      'fr-FR': 'Parking',
      'ja-JP': '駐車場',
      'zh-TW': '停車場'
    },
    'available': {
      'en-US': 'Available',
      'en-GB': 'Available',
      'fr-FR': 'Disponible',
      'ja-JP': '空車',
      'zh-TW': '可用'
    },
    'occupied': {
      'en-US': 'Occupied',
      'en-GB': 'Occupied',
      'fr-FR': 'Occupé',
      'ja-JP': '満車',
      'zh-TW': '已滿'
    }
  };
  
  return terms[term]?.[locale] || terms[term]?.['en-US'] || term;
};

/**
 * Get duration string based on locale
 * @param {number} hours - Duration in hours
 * @param {string} locale - Locale string
 * @returns {string} Formatted duration string
 */
export const formatDuration = (hours, locale = 'en-US') => {
  const translations = {
    'en-US': {
      hour: 'hour',
      hours: 'hours',
      minute: 'minute',
      minutes: 'minutes'
    },
    'en-GB': {
      hour: 'hour',
      hours: 'hours',
      minute: 'minute',
      minutes: 'minutes'
    },
    'fr-FR': {
      hour: 'heure',
      hours: 'heures',
      minute: 'minute',
      minutes: 'minutes'
    },
    'ja-JP': {
      hour: '時間',
      hours: '時間',
      minute: '分',
      minutes: '分'
    },
    'zh-TW': {
      hour: '小時',
      hours: '小時',
      minute: '分鐘',
      minutes: '分鐘'
    }
  };
  
  const t = translations[locale] || translations['en-US'];
  
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} ${minutes === 1 ? t.minute : t.minutes}`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  let result = `${wholeHours} ${wholeHours === 1 ? t.hour : t.hours}`;
  if (minutes > 0) {
    result += ` ${minutes} ${minutes === 1 ? t.minute : t.minutes}`;
  }
  
  return result;
};

/**
 * Get city display name with country
 * @param {string} city - City name
 * @param {string} country - Country name
 * @param {string} locale - Locale string
 * @returns {string} Formatted city display name
 */
export const formatCityName = (city, country, locale = 'en-US') => {
  // For now, return city, country format
  // Could be extended to support different formats per locale
  return `${city}, ${country}`;
};

/**
 * Detect user's preferred locale from browser
 * @returns {string} Detected locale string
 */
export const detectUserLocale = () => {
  // Try to get from browser
  const browserLocale = navigator.language || navigator.userLanguage;
  
  // Map common browser locales to our supported locales
  const localeMap = {
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'fr': 'fr-FR',
    'fr-FR': 'fr-FR',
    'ja': 'ja-JP',
    'ja-JP': 'ja-JP',
    'zh': 'zh-TW',
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-TW' // Map simplified Chinese to traditional for now
  };
  
  // Check if we support this locale
  const mappedLocale = localeMap[browserLocale] || localeMap[browserLocale.split('-')[0]];
  
  return mappedLocale || 'en-US'; // Default to en-US
};

/**
 * Get appropriate currency for a locale
 * @param {string} locale - Locale string
 * @returns {string} Currency code
 */
export const getCurrencyForLocale = (locale) => {
  const currencyMap = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'fr-FR': 'EUR',
    'ja-JP': 'JPY',
    'zh-TW': 'TWD'
  };
  
  return currencyMap[locale] || 'USD';
};
