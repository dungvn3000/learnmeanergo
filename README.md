# Learn Me An Ergo

A bilingual (English / Vietnamese) site for learning the Ergo blockchain from the ground up, inspired by [learnmeabitcoin.com](https://learnmeabitcoin.com). Articles, interactive tools and a small explorer all use live data from the [explorer.erg.vn](https://explorer.erg.vn) API.

- **Website:** https://learnmeanergo.com
- **Source:** https://github.com/dungvn3000/learnmeanergo

**Stack:** Vite · React 19 · React Router · Tailwind CSS v4 · lucide-react · @noble/hashes (blake2b)

## What's inside

- **Beginner guides:** what Ergo is, the manifesto, how the chain works, boxes, ERG supply, wallets, mining.
- **Technical guides:** the whitepaper, blocks, boxes, transactions, tokens (EIP-4), storage rent, addresses, ErgoTree, Sigma protocols, Autolykos, difficulty adjustment (incl. EIP-37), emission & EIP-27, NiPoPoWs.
- **Tools** (all computed in the browser):
  - Address decoder: splits an address into prefix, content and checksum, and verifies it.
  - Public key → address: builds a P2PK address step by step.
  - Blake2b-256 hasher.
  - ERG ↔ nanoERG converter (exact BigInt math).
  - Emission calculator: block reward, treasury, EIP-27 lock and total supply at any height.
- **Explorer:** block, transaction, address, box and token pages.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview
npm run lint     # oxlint
```

## API

The app calls `https://explorer.erg.vn/api/v1` directly (CORS is enabled). Point it at another backend with the `VITE_API_BASE` environment variable.

For deployment, every path must be rewritten to `index.html` for React Router. `public/_redirects` (Netlify) and `vercel.json` (Vercel) already do this.

## SEO

- Every route sets its own `<title>`, description, canonical URL, Open Graph/Twitter tags, EN/VI `hreflang` links and JSON-LD (`src/lib/seo.js`, `useSeo` hook). Explorer detail pages (block/tx/address/box/token) are `noindex`.
- `npm run build` first runs `scripts/generate-seo.mjs`, which generates `public/sitemap.xml`, `public/robots.txt` and `public/llms.txt` from the article list (`src/articles/manifest.js`) and the tool list (`src/tools/manifest.js`).
- The canonical domain is `https://learnmeanergo.com` (default in `src/lib/seo.js` and `scripts/generate-seo.mjs`). To build for another host (e.g. staging), run `VITE_SITE_URL=https://other-host npm run build`.
- Share images (`og:image`): `public/og.png` plus `public/og/<slug>.png` for each article, tool and section, rendered from `scripts/og-template.html` with headless Chrome via `npm run og`. Only rerun it when article titles or the design change; the images are committed.

## Project structure

```
src/
  articles/     one JSX file per article (manifest.js = list + reading order, index.js attaches icons/components)
  articles/locales/{en,vi}/  article text, one JSON per article
  tools/        interactive tools (manifest.js = list, index.js attaches icons/components)
  pages/        home, section indexes, tools, explorer (block/tx/address/box/token)
  components/   shared UI, TxFlow (input → output diagram), LineChart
  lib/          API client, useApi hook, formatting, i18n, SEO, ergo.js (addresses, Base58, emission schedule)
```

## Bilingual (English / Vietnamese)

- The **VI | EN** switch is saved in `localStorage` and can be forced with `?lang=en` / `?lang=vi`. English is the default.
- UI strings use [react-i18next](https://react.i18next.com/). `src/i18n.js` initialises i18next; the strings live in `src/locales/en.json` and `src/locales/vi.json`, grouped by the file that uses them (`common` for shared ones). In a component: `const { t } = useTranslation()` then `t('blockPage.header')`; outside React (formatters, validators) use `i18n.t(...)` from `src/i18n.js`. Rich text with tags uses `<Trans i18nKey="…" components={{ em: <em /> }} />`.
- `src/lib/i18n.js`: `pick({ vi, en })` for registry data (article/tool manifests), `locale()` for date/number formatting, `useLang()` for the switch.
- Articles: one component per article in `src/articles/X.jsx`; its text lives in `src/articles/locales/en/X.json` and `src/articles/locales/vi/X.json`. The file registers its own namespace with `const useT = articleNs('X', { en, vi })`, so the strings load lazily with the article. Plain text uses `t('key')`; text with markup or links uses `<Trans t={t} i18nKey="key" components={{ b: <strong />, boxes: <Link to="/learn/boxes" /> }} />` with named tags in the JSON. `node scripts/check-article-i18n.mjs` verifies that both languages have the same keys, tags and variables.

**Adding an article:** create `src/articles/X.jsx` plus `src/articles/locales/{en,vi}/X.json` (see `Wallets.jsx` as a template), then add an entry to `src/articles/manifest.js` with `slug`, `section`, `icon`, `file: 'X'` and `title`/`summary` as `{ vi, en }`. If the icon is new, also import it in `src/articles/index.js`.

**Adding a tool:** create `src/tools/X.jsx` and add an entry to `src/tools/manifest.js` (and its icon to `src/tools/index.js`).

## Contributing

Issues and pull requests are welcome at [github.com/dungvn3000/learnmeanergo](https://github.com/dungvn3000/learnmeanergo), especially corrections to articles. Please update both the Vietnamese and English versions.

## License

[MIT](LICENSE)
