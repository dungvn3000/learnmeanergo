// Usage: node scripts/check-article-i18n.mjs [File ...]   (default: every converted article)
// Checks that an article's en/vi JSON have identical key sets and use the same tag names
// and {{vars}} per string, and that every key referenced in the JSX exists.
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const dir = 'src/articles'
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(`${dir}/locales/en`).map((f) => f.replace(/\.json$/, ''))
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, p + k + '.') : [[p + k, String(v)]]))
// Same set of tag names and {{vars}} in both languages. Counts may differ: one
// language can legitimately bold two phrases where the other bolds three.
const sig = (s) => [...new Set([...s.matchAll(/<\/?([a-zA-Z][\w-]*)\s*\/?>|\{\{\s*(\w+)\s*\}\}/g)].map((m) => (m[1] ? `<${m[1]}>` : `{{${m[2]}}}`)))].sort().join(' ')
let bad = 0
const fail = (f, msg) => { bad++; console.log(`✗ ${f}: ${msg}`) }
for (const f of files) {
  const pEn = `${dir}/locales/en/${f}.json`, pVi = `${dir}/locales/vi/${f}.json`, pJsx = `${dir}/${f}.jsx`
  if (!existsSync(pEn) || !existsSync(pVi)) { fail(f, 'missing locale JSON'); continue }
  if (existsSync(`${dir}/en/${f}.jsx`)) fail(f, `src/articles/en/${f}.jsx still exists`)
  const en = Object.fromEntries(flat(JSON.parse(readFileSync(pEn, 'utf8'))))
  const vi = Object.fromEntries(flat(JSON.parse(readFileSync(pVi, 'utf8'))))
  for (const k in en) if (!(k in vi)) fail(f, `key only in en: ${k}`)
  for (const k in vi) if (!(k in en)) fail(f, `key only in vi: ${k}`)
  for (const k in en) if (k in vi && sig(en[k]) !== sig(vi[k])) fail(f, `tags/vars differ in ${k}: en[${sig(en[k])}] vi[${sig(vi[k])}]`)
  for (const k in en) if (!en[k].trim() || !(vi[k] ?? 'x').trim()) fail(f, `empty string: ${k}`)
  const src = readFileSync(pJsx, 'utf8')
  if (!src.includes(`articleNs('${f}'`)) fail(f, `JSX does not call articleNs('${f}', …)`)
  const used = new Set()
  for (const m of src.matchAll(/(?:\bt|\bT)\(\s*'([^'`$]+)'/g)) used.add(m[1])
  for (const m of src.matchAll(/i18nKey="([^"]+)"/g)) used.add(m[1])
  const prefixes = [...src.matchAll(/(?:\bt|\bT)\(\s*`([^`$]*)\$\{/g)].map((m) => m[1])
  for (const k of used) if (!(k in en)) fail(f, `JSX uses unknown key: ${k}`)
  for (const k in en) if (!used.has(k) && !prefixes.some((p) => k.startsWith(p))) fail(f, `key never used in JSX: ${k}`)
  if (!bad) console.log(`✓ ${f}: ${Object.keys(en).length} keys`)
}
process.exit(bad ? 1 : 0)
