import { Fragment, createContext, createElement as h, useContext, useEffect, useState } from 'react'

// Two languages. The active one lives in a module variable so plain helpers
// (t, formatters) can read it; switching remounts the tree so everything re-renders.
export const LANGS = ['en', 'vi']

function detect() {
  if (typeof window === 'undefined') return 'en'
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (LANGS.includes(q)) return q
    const saved = localStorage.getItem('lang')
    if (LANGS.includes(saved)) return saved
  } catch {
    /* storage blocked */
  }
  // English by default; Vietnamese only when chosen via the switch or ?lang=vi.
  return 'en'
}

let current = detect()

export const getLang = () => current
/** Inline translation: t('Xin chào', 'Hello'). */
export const t = (vi, en) => (current === 'vi' ? vi : en)
/** Pick from a { vi, en } object. */
export const pick = (o) => (o && typeof o === 'object' && 'en' in o ? o[current] ?? o.en : o)
/** BCP-47 locale for Intl/toLocale* calls. */
export const locale = () => (current === 'vi' ? 'vi-VN' : 'en-US')

const Ctx = createContext({ lang: current, setLang: () => {} })

export function LangProvider({ children }) {
  const [lang, setState] = useState(current)
  const setLang = (l) => {
    current = l
    try {
      localStorage.setItem('lang', l)
    } catch {
      /* storage blocked */
    }
    setState(l)
  }
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return h(Ctx.Provider, { value: { lang, setLang } }, h(Fragment, { key: lang }, children))
}

export const useLang = () => useContext(Ctx)
