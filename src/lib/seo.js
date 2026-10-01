import { useEffect } from 'react'
import { getLang, pick } from './i18n'

export const SITE = {
  name: 'Learn Me An Ergo',
  // Absolute origin for canonical/OG URLs (override with VITE_SITE_URL, e.g. for a staging host).
  url: (import.meta.env.VITE_SITE_URL || 'https://learnmeanergo.com').replace(/\/$/, ''),
  description: {
    vi: 'Học Ergo blockchain từ con số 0: box, eUTXO, ErgoScript, Autolykos, token — minh hoạ bằng dữ liệu thật từ mạng chính.',
    en: 'Learn the Ergo blockchain from scratch: boxes, eUTXO, ErgoScript, Autolykos and tokens — illustrated with live mainnet data.',
  },
}

const LOCALE = { vi: 'vi_VN', en: 'en_US' }

function upsert(selector, create) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  return el
}
function meta(attr, key, content) {
  const sel = `meta[${attr}="${key}"]`
  if (!content) return document.head.querySelector(sel)?.remove()
  upsert(sel, () => {
    const m = document.createElement('meta')
    m.setAttribute(attr, key)
    return m
  }).setAttribute('content', content)
}
function link(rel, href, hreflang) {
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`
  const el = upsert(sel, () => {
    const l = document.createElement('link')
    l.rel = rel
    if (hreflang) l.hreflang = hreflang
    return l
  })
  el.href = href
}

/**
 * Per-route SEO: <title>, description, canonical, Open Graph/Twitter, hreflang for EN/VI and optional JSON-LD.
 * `title`/`description` may be plain strings or { vi, en }. Runs after the tree remounts on a language switch.
 */
export function useSeo({ title, description, path, type = 'website', noindex = false, jsonLd, skip = false, image = '/og.png' }) {
  const lang = getLang()
  const t = pick(title)
  const d = pick(description) || pick(SITE.description)
  const json = jsonLd ? JSON.stringify(jsonLd) : ''
  const imageUrl = SITE.url + image
  useEffect(() => {
    if (skip) return
    const url = SITE.url + path
    const fullTitle = t ? `${t} · ${SITE.name}` : `${SITE.name} — ${lang === 'vi' ? 'Ergo, giải thích cho mọi người' : 'Ergo, explained for everyone'}`
    document.title = fullTitle
    document.documentElement.lang = lang
    meta('name', 'description', d)
    meta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')
    meta('property', 'og:site_name', SITE.name)
    meta('property', 'og:type', type)
    meta('property', 'og:title', fullTitle)
    meta('property', 'og:description', d)
    meta('property', 'og:url', url)
    meta('property', 'og:locale', LOCALE[lang])
    meta('property', 'og:locale:alternate', LOCALE[lang === 'vi' ? 'en' : 'vi'])
    meta('property', 'og:image', imageUrl)
    meta('property', 'og:image:width', '1200')
    meta('property', 'og:image:height', '630')
    meta('property', 'og:image:alt', fullTitle)
    meta('name', 'twitter:card', 'summary_large_image')
    meta('name', 'twitter:image', imageUrl)
    meta('name', 'twitter:title', fullTitle)
    meta('name', 'twitter:description', d)
    link('canonical', lang === 'vi' ? `${url}?lang=vi` : url)
    link('alternate', `${url}?lang=en`, 'en')
    link('alternate', `${url}?lang=vi`, 'vi')
    link('alternate', url, 'x-default')
    let script = document.getElementById('seo-jsonld')
    if (json) {
      if (!script) {
        script = document.createElement('script')
        script.id = 'seo-jsonld'
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = json
    } else script?.remove()
  }, [skip, path, lang, t, d, type, noindex, json, imageUrl])
}

export const websiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url + '/',
  description: pick(SITE.description),
  inLanguage: ['en', 'vi'],
})

export const articleJsonLd = ({ title, description, path, section }) => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: pick(title),
  description: pick(description),
  url: SITE.url + path,
  inLanguage: getLang(),
  articleSection: pick(section),
  isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url + '/' },
  about: { '@type': 'Thing', name: 'Ergo blockchain' },
})
