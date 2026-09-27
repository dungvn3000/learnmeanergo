import { Fragment, createElement as h } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { LANGS } from '../i18n'

// Small helpers around the i18next instance for code that is not a component
// (formatters, manifests, SEO). Components use useTranslation() directly.
export { LANGS }

export const getLang = () => (i18n.language === 'vi' ? 'vi' : 'en')
/** Pick from a { vi, en } object (article/tool manifests). */
export const pick = (o) => (o && typeof o === 'object' && 'en' in o ? o[getLang()] ?? o.en : o)
/** BCP-47 locale for Intl/toLocale* calls. */
export const locale = () => (getLang() === 'vi' ? 'vi-VN' : 'en-US')

/** Current language + a setter that also persists the choice. */
export function useLang() {
  const { i18n: inst } = useTranslation()
  const setLang = (l) => {
    if (!LANGS.includes(l)) return
    try {
      localStorage.setItem('lang', l)
    } catch {
      /* storage blocked */
    }
    inst.changeLanguage(l)
  }
  return { lang: getLang(), setLang }
}

/** Remounts the tree on a language switch so non-hook readers (pick, locale,
 *  lazily chosen article bodies) all pick up the new language. */
export function LangProvider({ children }) {
  const { i18n: inst } = useTranslation()
  return h(Fragment, { key: inst.language }, children)
}
