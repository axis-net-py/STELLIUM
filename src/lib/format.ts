export function formatCurrency(amount: number, currency: string = "PYG"): string {
  const map: Record<string, { currency: string; digits: number }> = {
    PYG: { currency: "PYG", digits: 0 },
    USD: { currency: "USD", digits: 2 },
    BRL: { currency: "BRL", digits: 2 },
  };
  const config = map[currency] || map.PYG;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: config.digits,
    maximumFractionDigits: config.digits,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency: string = "PYG"): string {
  const formatted = formatCurrency(amount, currency);
  const num = Number(amount);
  if (num >= 1000000000) return formatted; // Just use full format
  return formatted;
}

export function formatPYG(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
