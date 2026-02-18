/**
 * Format a number for display in an amount input (with commas).
 * Pass the raw number or the current display string to avoid breaking cursor.
 */
export function formatAmountForDisplay(value: string | number): string {
  if (value === '' || value === null || value === undefined) return ''
  const s = typeof value === 'number' ? String(value) : value
  const stripped = s.replace(/[^0-9.]/g, '')
  const parts = stripped.split('.')
  const intPart = parts[0] ?? '0'
  const decPart = parts[1] ?? ''
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (decPart === '') return withCommas
  return withCommas + '.' + decPart.slice(0, 2)
}

/**
 * Parse display string (with commas) back to number for submission.
 */
export function parseAmountFromDisplay(display: string): number {
  if (!display || !display.trim()) return 0
  const cleaned = display.replace(/,/g, '').trim()
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

/**
 * On input change: restrict to digits and one decimal, then optionally format with commas.
 * Returns the new display value.
 */
export function handleAmountInputChange(
  nextValue: string,
): string {
  const next = nextValue.replace(/[^0-9.]/g, '')
  const dotCount = (next.match(/\./g) ?? []).length
  let allowed = next
  if (dotCount > 1) {
    const firstDot = next.indexOf('.')
    allowed = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '')
  }
  const [intPart, decPart] = allowed.split('.')
  const limitedDec = decPart != null ? decPart.slice(0, 2) : ''
  const combined = decPart != null ? (intPart ?? '') + '.' + limitedDec : (intPart ?? '')
  return formatAmountForDisplay(combined === '.' ? '0' : combined)
}
