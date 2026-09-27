import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Copy, Info, Lightbulb, Loader2, TriangleAlert } from 'lucide-react'
import { erg, short, tokenAmount, hueOf } from '../lib/format'
import { useTranslation } from 'react-i18next'

export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CopyButton({ text, className = '' }) {
  const { t } = useTranslation()
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      title={t('ui.copy')}
      onClick={(e) => {
        e.preventDefault()
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        })
      }}
      className={`inline-flex shrink-0 items-center rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 ${className}`}
    >
      {done ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  )
}

/** A hash/id/address. `to` makes it a link; `full` disables truncation. */
export function Hash({ value, to, full = false, head = 8, tail = 6, copy = true, className = '' }) {
  if (!value) return <span className="text-stone-400">—</span>
  const text = full ? value : short(value, head, tail)
  const inner = to ? (
    <Link to={to} className="text-ergo-600 hover:underline dark:text-ergo-400" title={value}>
      {text}
    </Link>
  ) : (
    <span title={value}>{text}</span>
  )
  return (
    <span className={`inline-flex min-w-0 items-center gap-0.5 font-mono text-[0.9em] ${full ? 'break-all' : ''} ${className}`}>
      <span className={full ? 'break-all' : 'truncate'}>{inner}</span>
      {copy && <CopyButton text={value} />}
    </span>
  )
}

/** Small colored square: the same id always gets the same color, like a fingerprint. */
export function Swatch({ id, className = 'size-2.5' }) {
  return <span className={`inline-block shrink-0 rounded-sm ${className}`} style={{ background: `hsl(${hueOf(id)} 55% 50%)` }} />
}

export function Erg({ nano, digits = 9, className = '' }) {
  return (
    <span className={`whitespace-nowrap tabular-nums ${className}`}>
      {erg(nano, digits)} <span className="text-xs font-semibold text-stone-500">ERG</span>
    </span>
  )
}

export function TokenChip({ asset, signed = false }) {
  const amt = tokenAmount(Math.abs(asset.amount), asset.decimals)
  const sign = signed ? (asset.amount < 0 ? '−' : '+') : ''
  return (
    <Link
      to={`/token/${asset.tokenId}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs hover:border-ergo-300 dark:border-stone-700 dark:bg-stone-800"
      title={asset.tokenId}
    >
      <Swatch id={asset.tokenId} className="size-2 rounded-full" />
      <span className="tabular-nums">
        {sign}
        {amt}
      </span>
      <span className="truncate font-medium">{asset.name || short(asset.tokenId, 6, 4)}</span>
    </Link>
  )
}

const CALLOUT = {
  note: { icon: Info, cls: 'border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40', ic: 'text-sky-600 dark:text-sky-400' },
  tip: { icon: Lightbulb, cls: 'border-ergo-200 bg-ergo-50 dark:border-ergo-900 dark:bg-ergo-950/30', ic: 'text-ergo-600 dark:text-ergo-400' },
  warn: { icon: TriangleAlert, cls: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30', ic: 'text-amber-600 dark:text-amber-400' },
}

export function Callout({ type = 'note', title, children }) {
  const c = CALLOUT[type]
  const Icon = c.icon
  return (
    <div className={`not-prose my-6 flex gap-3 rounded-xl border p-4 text-[15px] leading-7 ${c.cls}`}>
      <Icon className={`mt-1 size-5 shrink-0 ${c.ic}`} />
      <div className="min-w-0 [&_a]:font-medium [&_a]:text-ergo-600 [&_a]:underline [&_code]:font-mono [&_code]:text-[0.85em] dark:[&_a]:text-ergo-400">
        {title && <div className="mb-1 font-semibold text-stone-900 dark:text-white">{title}</div>}
        {children}
      </div>
    </div>
  )
}

export function Loading({ label, className = '' }) {
  const { t } = useTranslation()
  return (
    <div className={`flex items-center justify-center gap-2 py-10 text-sm text-stone-500 ${className}`}>
      <Loader2 className="size-4 animate-spin" /> {label ?? t('ui.loadingDataFromTheBlockchain')}
    </div>
  )
}

export function ErrorBox({ error, className = '' }) {
  const { t } = useTranslation()
  return (
    <div className={`flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 ${className}`}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        {t('ui.couldNotLoadDataFromExplorer')}
        <div className="mt-1 font-mono text-xs opacity-80">{String(error?.message || error)}</div>
      </div>
    </div>
  )
}

/** Renders loading / error / not-found states around an API result. */
export function Async({ state, notFound, children }) {
  const { t } = useTranslation()
  if (state.loading && state.data === undefined) return <Loading />
  if (state.error && state.data === undefined) return <ErrorBox error={state.error} />
  if (state.data === null) return <div className="py-10 text-center text-stone-500">{notFound ?? t('ui.notFound')}</div>
  return children(state.data)
}

export function Badge({ children, tone = 'stone', className = '' }) {
  const tones = {
    stone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    ergo: 'bg-ergo-100 text-ergo-800 dark:bg-ergo-900/50 dark:text-ergo-200',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>{children}</span>
}

/** Stat tile for headline numbers. */
export function Stat({ icon: Icon, label, value, sub }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-500">
        {Icon && <Icon className="size-4 text-ergo-500" />} {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums text-stone-900 dark:text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-500">{sub}</div>}
    </Card>
  )
}

/**
 * The learnmeabitcoin-style annotated row: field name, live value,
 * and a plain-language explanation of what the field means.
 */
export function Field({ name, value, children, mono = false }) {
  return (
    <div className="grid gap-1 border-b border-stone-100 py-3 last:border-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 dark:border-stone-800">
      <div className="text-sm font-semibold text-stone-900 dark:text-white">{name}</div>
      <div className="min-w-0">
        <div className={`min-w-0 text-sm ${mono ? 'font-mono break-all' : ''}`}>{value}</div>
        {children && <div className="mt-1 text-[13px] leading-6 text-stone-500 dark:text-stone-400">{children}</div>}
      </div>
    </div>
  )
}

export function PageHeader({ icon: Icon, kicker, title, children }) {
  return (
    <div className="mb-8">
      {kicker && (
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
          {Icon && <Icon className="size-4" />} {kicker}
        </div>
      )}
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl dark:text-white">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-lg text-stone-600 dark:text-stone-400">{children}</div>}
    </div>
  )
}

export function Pager({ page, setPage, hasNext }) {
  const { t } = useTranslation()
  const btn = 'rounded-lg border border-stone-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800'
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button className={btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
        ← {t('ui.prev')}
      </button>
      <span className="px-2 text-sm tabular-nums text-stone-500">{t('ui.page')} {page}</span>
      <button className={btn} disabled={!hasNext} onClick={() => setPage(page + 1)}>
        {t('ui.next')} →
      </button>
    </div>
  )
}
