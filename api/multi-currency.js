#!/usr/bin/env node
/**
 * Soulfra Multi-Currency Support
 *
 * Real-time currency conversion for international payments
 *
 * Features:
 * - Real-time exchange rates (free API)
 * - Support for 160+ currencies
 * - Rate caching (1 hour)
 * - Automatic conversion
 * - Historical rates
 */

const https = require('https');
const path = require('path');
const DataStore = require('./data-store.js');

class MultiCurrency {
  constructor(options = {}) {
    // Configuration
    this.config = {
      baseCurrency: options.baseCurrency || 'USD',
      apiProvider: options.apiProvider || 'exchangerate.host', // Free API
      cacheTimeout: options.cacheTimeout || 3600000, // 1 hour in ms
      ...options
    };

    // Data store for rates cache
    this.ratesStore = new DataStore(path.join(__dirname, '../data/exchange-rates.json'));

    // In-memory cache
    this.ratesCache = {
      rates: {},
      timestamp: null,
      baseCurrency: null
    };

    // Supported currencies (major ones)
    this.supportedCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
      'INR', 'MXN', 'BRL', 'ZAR', 'KRW', 'SGD', 'HKD', 'NOK',
      'SEK', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS',
      'CLP', 'PHP', 'AED', 'COP', 'SAR', 'MYR', 'RON'
    ];
  }

  /**
   * Initialize (load cached rates)
   */
  async initialize() {
    try {
      const cached = await this.ratesStore.read();
      if (cached && cached.timestamp && cached.rates) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        if (age < this.config.cacheTimeout) {
          this.ratesCache = cached;
          console.log(`✅ Multi-currency initialized with cached rates (${Math.round(age / 60000)} minutes old)`);
          return true;
        }
      }
    } catch (error) {
      // No cached rates, will fetch fresh ones
    }

    // Fetch fresh rates
    try {
      await this.refreshRates();
      console.log('✅ Multi-currency initialized with fresh rates');
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch exchange rates: ${error.message}`);
      console.warn('⚠️ Multi-currency running with MOCK rates');
      this.initializeMockRates();
      return false;
    }
  }

  /**
   * Initialize with mock rates (fallback)
   */
  initializeMockRates() {
    this.ratesCache = {
      rates: {
        USD: 1.00,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CAD: 1.36,
        AUD: 1.53,
        CHF: 0.88,
        CNY: 7.24,
        INR: 83.12,
        MXN: 17.15,
        BRL: 4.98
      },
      timestamp: new Date().toISOString(),
      baseCurrency: 'USD',
      mock: true
    };
  }

  /**
   * Fetch latest exchange rates
   */
  async refreshRates() {
    const apiUrl = `https://api.exchangerate.host/latest?base=${this.config.baseCurrency}`;

    return new Promise((resolve, reject) => {
      https.get(apiUrl, (res) => {
        let data = '';

        res.on('data', chunk => data += chunk);

        res.on('end', async () => {
          try {
            const json = JSON.parse(data);

            if (!json.success) {
              throw new Error(json.error || 'API request failed');
            }

            this.ratesCache = {
              rates: json.rates,
              timestamp: json.date ? new Date(json.date).toISOString() : new Date().toISOString(),
              baseCurrency: json.base
            };

            // Save to cache
            await this.ratesStore.write(this.ratesCache);

            console.log(`✅ Exchange rates updated (${Object.keys(json.rates).length} currencies)`);
            resolve(this.ratesCache);
          } catch (error) {
            reject(new Error(`Failed to parse exchange rate data: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Failed to fetch exchange rates: ${error.message}`));
      });
    });
  }

  /**
   * Convert amount between currencies
   *
   * @param {number} amount - Amount in cents
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {number} Converted amount in cents
   */
  convert(amount, fromCurrency, toCurrency) {
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    // Same currency - no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Get rates
    const fromRate = this.getRate(fromCurrency);
    const toRate = this.getRate(toCurrency);

    if (!fromRate || !toRate) {
      throw new Error(`Currency conversion failed: ${fromCurrency} → ${toCurrency}`);
    }

    // Convert: amount (in fromCurrency) → USD → toCurrency
    const amountInBase = amount / fromRate;
    const convertedAmount = Math.round(amountInBase * toRate);

    return convertedAmount;
  }

  /**
   * Get exchange rate for a currency
   */
  getRate(currency) {
    currency = currency.toUpperCase();

    if (!this.ratesCache || !this.ratesCache.rates) {
      throw new Error('Exchange rates not loaded');
    }

    return this.ratesCache.rates[currency];
  }

  /**
   * Format amount in currency
   */
  format(amountInCents, currency, locale = 'en-US') {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies() {
    return this.supportedCurrencies.map(code => ({
      code,
      name: this.getCurrencyName(code),
      symbol: this.getCurrencySymbol(code),
      rate: this.getRate(code)
    }));
  }

  /**
   * Get currency name
   */
  getCurrencyName(code) {
    const names = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CHF: 'Swiss Franc',
      CNY: 'Chinese Yuan',
      INR: 'Indian Rupee',
      MXN: 'Mexican Peso',
      BRL: 'Brazilian Real',
      ZAR: 'South African Rand',
      KRW: 'South Korean Won',
      SGD: 'Singapore Dollar',
      HKD: 'Hong Kong Dollar',
      NOK: 'Norwegian Krone',
      SEK: 'Swedish Krona',
      DKK: 'Danish Krone',
      PLN: 'Polish Zloty',
      THB: 'Thai Baht'
    };

    return names[code] || code;
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(code) {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'Fr',
      CNY: '¥',
      INR: '₹',
      MXN: '$',
      BRL: 'R$',
      ZAR: 'R',
      KRW: '₩',
      SGD: 'S$',
      HKD: 'HK$',
      NOK: 'kr',
      SEK: 'kr',
      DKK: 'kr',
      PLN: 'zł',
      THB: '฿'
    };

    return symbols[code] || code;
  }

  /**
   * Check if currency is supported
   */
  isSupported(currency) {
    return this.ratesCache.rates && this.ratesCache.rates[currency.toUpperCase()] !== undefined;
  }

  /**
   * Get cache info
   */
  getCacheInfo() {
    if (!this.ratesCache.timestamp) {
      return {
        cached: false,
        age: null,
        baseCurrency: null
      };
    }

    const age = Date.now() - new Date(this.ratesCache.timestamp).getTime();

    return {
      cached: true,
      age: Math.round(age / 1000), // seconds
      ageMinutes: Math.round(age / 60000), // minutes
      timestamp: this.ratesCache.timestamp,
      baseCurrency: this.ratesCache.baseCurrency,
      currencyCount: Object.keys(this.ratesCache.rates).length,
      mock: this.ratesCache.mock || false
    };
  }

  /**
   * Get module info
   */
  getInfo() {
    const cacheInfo = this.getCacheInfo();

    return {
      baseCurrency: this.config.baseCurrency,
      supportedCurrencies: this.supportedCurrencies.length,
      cache: cacheInfo,
      apiProvider: this.config.apiProvider
    };
  }
}

module.exports = MultiCurrency;
