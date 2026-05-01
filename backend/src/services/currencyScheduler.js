const currencyService = require('./CurrencyService');

const STARTUP_DELAY_MS = 2000; 
const INTERVAL_MS = 60 * 60 * 1000; 

class CurrencyScheduler {
  constructor() {
    this.intervalId = null;
  }

  start() {
    console.log('Initializing currency scheduler...');
    
    setTimeout(() => {
      currencyService.fetchRates();
      
      this.intervalId = setInterval(() => {
        currencyService.fetchRates();
      }, INTERVAL_MS);
      
    }, STARTUP_DELAY_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Currency scheduler stopped.');
    }
  }
}

module.exports = new CurrencyScheduler();
