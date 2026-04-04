// Simple currency conversion utility
// In production, this should be replaced with a real currency API

const EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  AUD: 1.35,
  CAD: 1.25,
  CNY: 6.45,
};

const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!EXCHANGE_RATES[fromCurrency] || !EXCHANGE_RATES[toCurrency]) {
    throw new Error('Unsupported currency');
  }

  // Convert to USD first, then to target currency
  const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = usdAmount * EXCHANGE_RATES[toCurrency];

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
};

const getSupportedCurrencies = () => {
  return Object.keys(EXCHANGE_RATES);
};

const formatCurrency = (amount, currency) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    CNY: '¥',
  };

  return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
};

module.exports = {
  convertCurrency,
  getSupportedCurrencies,
  formatCurrency,
  EXCHANGE_RATES,
};