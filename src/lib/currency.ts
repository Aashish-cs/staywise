export const defaultCurrency = "USD";
export const defaultLocale = "en-US";

export type SupportedCurrency = typeof defaultCurrency;

export type CurrencyFormatOptions = {
  currency?: SupportedCurrency;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function formatCurrency(
  amount: number,
  {
    currency = defaultCurrency,
    locale = defaultLocale,
    maximumFractionDigits = 0,
    minimumFractionDigits = 0,
  }: CurrencyFormatOptions = {},
) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
    style: "currency",
  }).format(amount);
}

export function formatCurrencyFromCents(
  amountCents: number,
  options?: CurrencyFormatOptions,
) {
  return formatCurrency(centsToDollars(amountCents), options);
}

export function dollarsToCents(amount: number) {
  return Math.round(amount * 100);
}

export function centsToDollars(amountCents: number) {
  return amountCents / 100;
}
