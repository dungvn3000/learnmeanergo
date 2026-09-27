import { locale } from './i18n'
import i18n from '../i18n'

export const NANO = 1e9

export const num = (n, digits = 0) =>
  Number(n).toLocaleString('en-US', { maximumFractionDigits: digits })

/** nanoERG -> "1,234.5" (no unit). */
export const erg = (nano, maxDigits = 9) =>
  (Number(nano) / NANO).toLocaleString('en-US', { maximumFractionDigits: maxDigits })

/** Raw token amount with EIP-4 decimals applied. */
export const tokenAmount = (raw, decimals = 0) => {
  const d = Math.min(20, Math.max(0, Math.trunc(Number(decimals) || 0)))
  return (Number(raw) / 10 ** d).toLocaleString('en-US', { maximumFractionDigits: d })
}

export const short = (s, head = 8, tail = 6) => {
  s = String(s ?? '')
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`
}

export const bytes = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : b < 1073741824 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1073741824).toFixed(2)} GB`

export const ago = (ts) => {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return i18n.t('format.sAgo', { s })
  const m = (s / 60) | 0
  if (m < 60) return i18n.t('format.minAgo', { m })
  const h = (m / 60) | 0
  if (h < 48) return i18n.t('format.hMAgo', { h, m: m % 60 })
  return i18n.t('format.daysAgo', { d: (h / 24) | 0 })
}

const pad = (n) => String(n).padStart(2, '0')
export const utc = (ts) => {
  const d = new Date(ts)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}

export const compact = (n) => {
  const a = Math.abs(n)
  if (a >= 1e12) return +(n / 1e12).toFixed(2) + 'T'
  if (a >= 1e9) return +(n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return +(n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return +(n / 1e3).toFixed(1) + 'k'
  return String(+Number(n).toFixed(2))
}

/** Hash-like strings get a stable accent hue so the same box/address is recognisable across a page. */
export const hueOf = (s) => {
  let h = 0
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 360
}

/** Short localized date, e.g. for chart axes. */
export const shortDate = (ts) => new Date(ts).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' })
