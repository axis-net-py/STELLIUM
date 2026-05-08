"use client";

import { useLocale, useTranslations } from "next-intl";
import { GeistMono } from "geist/font/mono";
import type { CurrencyCode } from "@axis/currency";

interface PriceTagProps {
  amount: number | string;
  currency: CurrencyCode;
  exchangeRate?: {
    PYGtoUSD: number | string;
    PYGtoBRL: number | string;
  };
  showConversions?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * PriceTag - Universal price display component
 *
 * Displays price in PYG (anchor) with USD/BRL conversions in subtext.
 * Uses Geist Mono for tabular alignment.
 * Shows real-time margin view for sellers.
 */
export function PriceTag({
  amount,
  currency,
  exchangeRate,
  showConversions = true,
  className = "",
  size = "md",
}: PriceTagProps) {
  const t = useTranslations("priceTag");
  const locale = useLocale();

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Convert to PYG if needed (simplified - in production use CurrencyEngine)
  const getPYGValue = (): number => {
    const val = typeof amount === "string" ? parseFloat(amount) : amount;
    if (currency === "PYG") return val;
    if (!exchangeRate) return val;
    if (currency === "USD") return val * (typeof exchangeRate.PYGtoUSD === "string" ? parseFloat(exchangeRate.PYGtoUSD) : exchangeRate.PYGtoUSD);
    if (currency === "BRL") return val * (typeof exchangeRate.PYGtoBRL === "string" ? parseFloat(exchangeRate.PYGtoBRL) : exchangeRate.PYGtoBRL);
    return val;
  };

  const getUSDValue = (pygValue: number): number => {
    if (!exchangeRate) return 0;
    const rate = typeof exchangeRate.PYGtoUSD === "string" ? parseFloat(exchangeRate.PYGtoUSD) : exchangeRate.PYGtoUSD;
    return pygValue / rate;
  };

  const getBRLValue = (pygValue: number): number => {
    if (!exchangeRate) return 0;
    const rate = typeof exchangeRate.PYGtoBRL === "string" ? parseFloat(exchangeRate.PYGtoBRL) : exchangeRate.PYGtoBRL;
    return pygValue / rate;
  };

  const formatCurrency = (value: number, curr: string): string => {
    const symbols: Record<string, string> = { PYG: "Gs", USD: "$", BRL: "R$" };
    const decimals: Record<string, number> = { PYG: 0, USD: 2, BRL: 2 };

    const formatted = value.toLocaleString(locale === "es-PY" ? "es-PY" : "pt-BR", {
      minimumFractionDigits: decimals[curr],
      maximumFractionDigits: decimals[curr],
    });

    return `${symbols[curr]} ${formatted}`;
  };

  const pygValue = getPYGValue();
  const usdValue = getUSDValue(pygValue);
  const brlValue = getBRLValue(pygValue);

  return (
    <div className={`price-tag ${className}`}>
      {/* Main price in PYG */}
      <div className={`price-pyg ${sizeClasses[size]} ${GeistMono.className} font-semibold tabular-nums`}>
        {formatCurrency(pygValue, "PYG")}
      </div>

      {/* Conversions in USD and BRL */}
      {showConversions && exchangeRate && (
        <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
          <span className="price-usd tabular-nums">
            {formatCurrency(usdValue, "USD")}
          </span>
          <span className="text-border">|</span>
          <span className="price-brl tabular-nums">
            {formatCurrency(brlValue, "BRL")}
          </span>
        </div>
      )}

      {/* Margin hint */}
      {showConversions && (
        <div className="mt-0.5 text-xs text-muted-foreground/60">
          {t("equivalent")}
        </div>
      )}
    </div>
  );
}

export default PriceTag;
