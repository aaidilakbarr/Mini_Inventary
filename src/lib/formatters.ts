/**
 * Formats a date string (ISO or standard format) into Indonesian Locale (e.g. 26 Agu 2024)
 */
export function formatDateID(dateString?: string | null): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Formats a number to Indonesian Rupiah (e.g. Rp 1.500.000)
 */
export function formatCurrencyID(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a number with Indonesian thousand separators (e.g. 1.500.000)
 */
export function formatNumberID(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return ''
  return new Intl.NumberFormat('id-ID').format(amount)
}

/**
 * Formats a date-time string into Indonesian Locale (e.g. 26 Agu 2024, 14:30 WIB)
 */
export function formatDateTimeID(dateString?: string | null): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' WIB'
  } catch {
    return dateString
  }
}
