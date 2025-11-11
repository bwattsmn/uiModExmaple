const DEFAULT_LOCALE = "en-US"
const DEFAULT_TIMEZONE = "UTC"

const currencyFormatterCache = new Map<string, Intl.NumberFormat>()

export const formatCurrency = (value: number, currency: string) => {
  const key = `${DEFAULT_LOCALE}-${currency}`
  let formatter = currencyFormatterCache.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    currencyFormatterCache.set(key, formatter)
  }
  return formatter.format(value)
}

export const formatNumber = (value: number) =>
  new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 2,
  }).format(value)

export const formatPercent = (value: number) =>
  `${new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 0,
  }).format(value * 100)}%`

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: DEFAULT_TIMEZONE,
  }).format(new Date(value))

