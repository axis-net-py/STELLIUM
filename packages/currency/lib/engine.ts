import { Decimal } from "decimal.js";

/**
 * AXIS Currency Engine
 * High-precision currency conversion with PYG (Paraguay Guarani) as anchor currency.
 * Uses decimal.js to avoid floating-point errors.
 */

export type CurrencyCode = "PYG" | "USD" | "BRL";

export interface ConversionResult {
  amount: string;       // Decimal string for precision
  formatted: string;    // Human-readable with currency symbol
  timestamp: number;    // Unix timestamp of conversion
  from: CurrencyCode;
  to: CurrencyCode;
  rate: string;          // Exchange rate used
}

export interface ExchangeRates {
  PYGtoUSD: Decimal;
  PYGtoBRL: Decimal;
  timestamp?: number;
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PYG: "Gs",
  USD: "$",
  BRL: "R$",
};

const DECIMAL_PLACES: Record<CurrencyCode, number> = {
  PYG: 0,   // Guarani has no decimal places
  USD: 2,
  BRL: 2,
};

export class CurrencyEngine {
  private rates: ExchangeRates;

  constructor(rates: ExchangeRates) {
    this.rates = {
      PYGtoUSD: new Decimal(rates.PYGtoUSD),
      PYGtoBRL: new Decimal(rates.PYGtoBRL),
      timestamp: rates.timestamp,
    };
  }

  /**
   * Convert amount from one currency to another via PYG anchor.
   * All conversions go through PYG to maintain precision.
   */
  convert(
    amount: number | string | Decimal,
    from: CurrencyCode,
    to: CurrencyCode
  ): ConversionResult {
    const value = new Decimal(amount);
    const timestamp = Date.now();

    // If same currency, return as-is
    if (from === to) {
      const formatted = this.format(value, from);
      return {
        amount: value.toFixed(DECIMAL_PLACES[from]),
        formatted,
        timestamp,
        from,
        to,
        rate: "1",
      };
    }

    // Convert to PYG first (PYG is the anchor)
    let amountInPYG: Decimal;

    if (from === "PYG") {
      amountInPYG = value;
    } else if (from === "USD") {
      // USD to PYG: amount * ratePYGtoUSD
      amountInPYG = value.times(this.rates.PYGtoUSD);
    } else if (from === "BRL") {
      // BRL to PYG: amount * ratePYGtoBRL
      amountInPYG = value.times(this.rates.PYGtoBRL);
    } else {
      throw new Error(`Unsupported source currency: ${from}`);
    }

    // Convert from PYG to target
    let result: Decimal;
    let rate: Decimal;

    if (to === "PYG") {
      result = amountInPYG;
      rate = new Decimal(1);
    } else if (to === "USD") {
      // PYG to USD: amount / ratePYGtoUSD
      result = amountInPYG.dividedBy(this.rates.PYGtoUSD);
      rate = new Decimal(1).dividedBy(this.rates.PYGtoUSD);
    } else if (to === "BRL") {
      // PYG to BRL: amount / ratePYGtoBRL
      result = amountInPYG.dividedBy(this.rates.PYGtoBRL);
      rate = new Decimal(1).dividedBy(this.rates.PYGtoBRL);
    } else {
      throw new Error(`Unsupported target currency: ${to}`);
    }

    // Round to appropriate decimal places
    const rounded = result.toDecimalPlaces(DECIMAL_PLACES[to], Decimal.ROUND_HALF_UP);

    return {
      amount: rounded.toFixed(DECIMAL_PLACES[to]),
      formatted: this.format(rounded, to),
      timestamp,
      from,
      to,
      rate: rate.toFixed(DECIMAL_PLACES[to] + 2),
    };
  }

  /**
   * Convert and return multiple currencies at once.
   * Useful for displaying price in PYG, USD, and BRL simultaneously.
   */
  convertAll(
    amount: number | string | Decimal,
    from: CurrencyCode
  ): Record<CurrencyCode, ConversionResult> {
    const result: Partial<Record<CurrencyCode, ConversionResult>> = {};
    const currencies: CurrencyCode[] = ["PYG", "USD", "BRL"];

    for (const currency of currencies) {
      result[currency] = this.convert(amount, from, currency);
    }

    return result as Record<CurrencyCode, ConversionResult>;
  }

  /**
   * Format a Decimal value for display with appropriate currency symbol.
   */
  format(value: Decimal, currency: CurrencyCode): string {
    const places = DECIMAL_PLACES[currency];
    const rounded = value.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
    const symbol = CURRENCY_SYMBOLS[currency];

    // Format with thousands separator
    const parts = rounded.toFixed(places).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${symbol} ${parts.join(",")}`;
  }

  /**
   * Get the current exchange rate from one currency to another.
   */
  getRate(from: CurrencyCode, to: CurrencyCode): string {
    if (from === to) return "1";

    if (from === "PYG") {
      if (to === "USD") return this.rates.PYGtoUSD.toFixed(4);
      if (to === "BRL") return this.rates.PYGtoBRL.toFixed(4);
    }

    if (to === "PYG") {
      if (from === "USD") return this.rates.PYGtoUSD.toFixed(4);
      if (from === "BRL") return this.rates.PYGtoBRL.toFixed(4);
    }

    // Cross-rate via PYG
    const fromRate = from === "USD" ? this.rates.PYGtoUSD : this.rates.PYGtoBRL;
    const toRate = to === "USD" ? this.rates.PYGtoUSD : this.rates.PYGtoBRL;
    return toRate.dividedBy(fromRate).toFixed(4);
  }

  /**
   * Create a new engine with updated rates.
   */
  static fromPrisma(exchangeRate: {
    ratePYGtoUSD: { toString(): string };
    ratePYGtoBRL: { toString(): string };
  }): CurrencyEngine {
    return new CurrencyEngine({
      PYGtoUSD: new Decimal(exchangeRate.ratePYGtoUSD.toString()),
      PYGtoBRL: new Decimal(exchangeRate.ratePYGtoBRL.toString()),
    });
  }
}

export default CurrencyEngine;
