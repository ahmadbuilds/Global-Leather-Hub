const fetch = require('node-fetch');

class CurrencyService {
  constructor() {
    this.rates = {
      USD: 1, 
    };
    this.lastUpdated = null;
    this.apiUrl = 'https://open.er-api.com/v6/latest/USD';
  }

  //fetching the latest Exchange Rates
  async fetchRates() {
    try {
      console.log('Fetching latest exchange rates...');
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.rates) {
        this.rates = { ...this.rates, ...data.rates };
        this.lastUpdated = new Date();
        console.log(`Successfully updated exchange rates at ${this.lastUpdated.toISOString()}`);
      } else {
        throw new Error('Invalid response format from exchange rate API');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error.message);
    }
  }

  convert(amountUsd, targetCurrency) {
    if (!amountUsd) return 0;
    
    const currency = targetCurrency || 'USD';
    const rate = this.rates[currency] || this.rates['USD'];
    
    const converted = amountUsd * rate;
    return Math.round(converted * 100) / 100;
  }
}

const currencyService = new CurrencyService();
module.exports = currencyService;
