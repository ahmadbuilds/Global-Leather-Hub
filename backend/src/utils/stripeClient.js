const Stripe = require('stripe');

let stripeInstance;

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

//Stripe amounts are in smallest currency unit except zero-decimal currencies
const amountToStripeUnit = (amount, currency) => {
  const upper = (currency || 'USD').toUpperCase();
  const zeroDecimal = new Set([
    'BIF',
    'CLP',
    'DJF',
    'GNF',
    'JPY',
    'KMF',
    'KRW',
    'MGA',
    'PYG',
    'RWF',
    'UGX',
    'VND',
    'VUV',
    'XAF',
    'XOF',
    'XPF',
  ]);
  if (zeroDecimal.has(upper)) return Math.round(amount);
  return Math.round(amount * 100);
};

const stripeUnitToAmount = (unitAmount, currency) => {
  const upper = (currency || 'USD').toUpperCase();
  const zeroDecimal = new Set([
    'BIF',
    'CLP',
    'DJF',
    'GNF',
    'JPY',
    'KMF',
    'KRW',
    'MGA',
    'PYG',
    'RWF',
    'UGX',
    'VND',
    'VUV',
    'XAF',
    'XOF',
    'XPF',
  ]);
  if (zeroDecimal.has(upper)) return Math.round(unitAmount);
  const amt = (unitAmount || 0) / 100;
  return Math.round(amt * 100) / 100;
};

module.exports = { getStripe, amountToStripeUnit, stripeUnitToAmount };
