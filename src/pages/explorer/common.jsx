import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Inline "read the guide" link shown next to explorer fields. */
export function Learn({ to, children }) {
  const { t } = useTranslation()
  return (
    <Link to={to} className="inline-flex items-center gap-1 font-medium text-ergo-600 hover:underline dark:text-ergo-400">
      <BookOpen className="size-3" /> {children ?? t('explorerCommon.learnMore')}
    </Link>
  )
}

export function Section({ title, right, children, className = '' }) {
  return (
    <section className={`mt-10 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs tracking-wide text-stone-500 uppercase dark:border-stone-800">
            {head.map((h, i) => (
              <th key={i} className={`px-4 py-3 font-semibold ${h.right ? 'text-right' : ''}`}>
                {h.label ?? h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{children}</tbody>
      </table>
    </div>
  )
}

export const td = 'px-4 py-2.5 whitespace-nowrap'
