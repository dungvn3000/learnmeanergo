// i18next setup. UI strings live in src/locales/{en,vi}.json (keys are grouped
// by the file that uses them, plus `common` for strings shared across files).
// Long-form articles are separate JSX files per language — see src/articles.
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import vi from './locales/vi.json'

export const LANGS = ['en', 'vi']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, vi: { translation: vi } },
    supportedLngs: LANGS,
    fallbackLng: 'en',
    load: 'languageOnly',
    // English by default; Vietnamese only via the switch or ?lang=vi. The
    // browser language is deliberately not consulted. Nothing is written to
    // localStorage here — only an explicit switch persists (see lib/i18n.js).
    detection: { order: ['querystring', 'localStorage'], lookupQuerystring: 'lang', lookupLocalStorage: 'lang', caches: [] },
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false },
  })

const syncHtmlLang = (l) => {
  if (typeof document !== 'undefined') document.documentElement.lang = l
}
syncHtmlLang(i18n.language)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
