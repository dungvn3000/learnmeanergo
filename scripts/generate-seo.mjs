// Generates public/sitemap.xml, public/robots.txt and public/llms.txt from the article/tool manifests.
// Runs automatically before `vite build` (see package.json "prebuild"). Set VITE_SITE_URL to your real origin.
import { writeFileSync } from 'node:fs'
import { ARTICLES } from '../src/articles/manifest.js'
import { TOOLS } from '../src/tools/manifest.js'

const ORIGIN = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://learnmeanergo.com').replace(/\/$/, '')
const NAME = 'Learn Me An Ergo'
const today = new Date().toISOString().slice(0, 10)

const STATIC = [
  { path: '/', priority: 1.0, title: NAME, desc: 'Home: live chain, network stats and the two learning paths.' },
  { path: '/beginners', priority: 0.8, title: 'Beginners', desc: 'Ergo explained simply, in reading order.' },
  { path: '/technical', priority: 0.8, title: 'Technical', desc: 'Inside Ergo byte by byte: data structures, scripts, mining and economics.' },
  { path: '/tools', priority: 0.7, title: 'Tools', desc: 'Interactive calculators and decoders that run in the browser.' },
  { path: '/explorer', priority: 0.6, title: 'Explorer', desc: 'Annotated block explorer for Ergo mainnet (live data from explorer.erg.vn).' },
  { path: '/privacy', priority: 0.3, title: 'Privacy', desc: 'No cookies, no analytics, no accounts, no third-party scripts; only requests to this domain and *.erg.vn.' },
]
const pages = [
  ...STATIC,
  ...ARTICLES.map((a) => ({ path: `/learn/${a.slug}`, priority: 0.9, title: a.title.en, desc: a.summary.en, section: a.section, group: a.group?.en })),
  ...TOOLS.map((t) => ({ path: `/tools/${t.slug}`, priority: 0.7, title: t.title.en, desc: t.summary.en })),
]

// ---- sitemap.xml (with hreflang alternates) ----
const esc = (s) => s.replace(/&/g, '&amp;')
const urlEntry = (p) => `  <url>
    <loc>${esc(ORIGIN + p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.path === '/' || p.path === '/explorer' ? 'daily' : 'monthly'}</changefreq>
    <priority>${p.priority.toFixed(1)}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${esc(ORIGIN + p.path)}?lang=en" />
    <xhtml:link rel="alternate" hreflang="vi" href="${esc(ORIGIN + p.path)}?lang=vi" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(ORIGIN + p.path)}" />
  </url>`
writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(urlEntry).join('\n')}
</urlset>
`,
)

// ---- robots.txt ----
writeFileSync(
  'public/robots.txt',
  `# ${NAME}
User-agent: *
Allow: /
# Explorer detail pages are unbounded (every block / tx / address / box / token) — keep crawlers on the guides.
Disallow: /block/
Disallow: /tx/
Disallow: /address/
Disallow: /box/
Disallow: /token/

Sitemap: ${ORIGIN}/sitemap.xml
`,
)

// ---- llms.txt (https://llmstxt.org) ----
const line = (p) => `- [${p.title}](${ORIGIN}${p.path}): ${p.desc}`
const bySection = (s) => pages.filter((p) => p.section === s)
const technicalGroups = [...new Set(bySection('technical').map((p) => p.group))]
writeFileSync(
  'public/llms.txt',
  `# ${NAME}

> A bilingual (English / Vietnamese) guide to how the Ergo blockchain works — boxes and the eUTXO model, transactions, ErgoTree/ErgoScript, sigma protocols, addresses, Autolykos mining, difficulty, the emission schedule with EIP-27, and storage rent — inspired by learnmeabitcoin.com and illustrated with live Ergo mainnet data.

Every page exists in English (default) and Vietnamese: append \`?lang=vi\` to any URL for the Vietnamese version, \`?lang=en\` for English. Live numbers on the pages come from the public API of https://explorer.erg.vn (Ergo Vietnam). Guides are the site's own summaries and explanations; primary sources are linked from each page (Ergo whitepaper v1.0 2019, the Ergo Manifesto 2021, docs.ergoplatform.com).

## Beginners

${bySection('beginners').map(line).join('\n')}

## Technical

${technicalGroups.map((g) => `### ${g}\n\n${bySection('technical').filter((p) => p.group === g).map(line).join('\n')}`).join('\n\n')}

## Tools

${pages.filter((p) => p.path.startsWith('/tools/')).map(line).join('\n')}

## Site

${STATIC.map(line).join('\n')}

## Optional

- [Ergo whitepaper (PDF)](https://ergoplatform.org/uploads/whitepaper_668cb39ee5.pdf): "Ergo: A Resilient Platform For Contractual Money", v1.0, 14 May 2019.
- [The Ergo Manifesto](https://ergoplatform.org/en/blog/2021-04-26-the-ergo-manifesto/): Ergo Platform blog, 26 April 2021.
- [Ergo documentation](https://docs.ergoplatform.com): official protocol documentation.
- [DECO Education: Registers, Guard Scripts, ErgoScript](https://deco-education.github.io/deco-docs/docs/into-the-woods/trail1-eutxo-n-nfts/registers-guardscripts-ergoscript): lesson on registers, box limits and guard scripts from the “Into the Woods” course.
- [Learning Ergo 101: eUTXO explained for human beings](https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e): David Przybilla's programmer-friendly introduction to the eUTXO model (2021).
- [explorer.erg.vn](https://explorer.erg.vn): the block explorer and API this site reads from.
`,
)
console.log(`[seo] wrote sitemap.xml (${pages.length} URLs), robots.txt, llms.txt for ${ORIGIN}`)
