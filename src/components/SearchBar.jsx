import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search } from 'lucide-react'
import { resolveSearch } from '../lib/api'
import { useTranslation } from 'react-i18next'

export default function SearchBar({ big = false, onDone }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [miss, setMiss] = useState(false)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (!q.trim()) return
    setBusy(true)
    setMiss(false)
    try {
      const to = await resolveSearch(q)
      if (to) {
        nav(to)
        setQ('')
        onDone?.()
      } else setMiss(true)
    } catch {
      setMiss(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="relative w-full">
      <Search className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400 ${big ? 'size-5' : 'size-4'}`} />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setMiss(false)
        }}
        placeholder={big ? t('searchBar.searchBlocksTransactionsAddressesTokensBoxes') : t('searchBar.searchBlockTxAddress')}
        className={`w-full rounded-xl border bg-surface pr-10 text-stone-900 outline-none placeholder:text-stone-400 focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:bg-stone-900 dark:text-white ${
          miss ? 'border-red-300 dark:border-red-800' : 'border-stone-200 dark:border-stone-700'
        } ${big ? 'py-3.5 pl-11 text-base' : 'py-2 pl-9 text-sm'}`}
      />
      {busy && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-stone-400" />}
      {miss && <div className="absolute top-full left-0 mt-1 text-xs text-red-600 dark:text-red-400">{t('searchBar.noResultsFound')}</div>}
    </form>
  )
}
