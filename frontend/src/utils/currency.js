// Currency utilities for the application
export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  PKR: 'Rs',
  AED: 'د.إ',
};

export const CURRENCY_NAMES = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CNY: 'Chinese Yuan',
  PKR: 'Pakistani Rupee',
  AED: 'UAE Dirham',
};

export const getCurrencySymbol = (currency) => {
  return CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.USD;
};

export const formatCurrency = (amount, currency = 'USD') => {
  const symbol = getCurrencySymbol(currency);
  const finalAmount = amount || 0;
  return `${symbol}${finalAmount.toFixed(2)}`;
};