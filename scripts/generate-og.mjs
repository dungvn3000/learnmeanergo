// Renders public/og.png (site card) and public/og/<slug>.png for every article, tool and section
// from scripts/og-template.html using a local headless Chrome. Dev-time only: `npm run og`, then commit the PNGs.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ARTICLES } from '../src/articles/manifest.js'
import { TOOLS } from '../src/tools/manifest.js'

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME} — set CHROME=/path/to/chrome`)
const port = 9377
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=/tmp/og-chrome-profile', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200)
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page') } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })

await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: pathToFileURL('scripts/og-template.html').href })
await sleep(2500) // fonts

const SECTION_KICKER = { beginners: 'Beginners', technical: 'Technical' }
const cards = [
  { file: 'og', kicker: 'Ergo, explained for everyone', title: 'How the Ergo blockchain actually works', sub: 'Boxes, transactions, ErgoScript, Autolykos — explained with live mainnet data. English & Vietnamese.' },
  { file: 'og/beginners', kicker: 'Beginners', title: 'Ergo, explained simply', sub: 'No programming or cryptography required. Read in order — each guide takes a few minutes.' },
  { file: 'og/technical', kicker: 'Technical', title: 'Inside Ergo, byte by byte', sub: 'Blocks, boxes, transactions, scripts and the economics of the network — on real mainnet data.' },
  { file: 'og/tools', kicker: 'Tools', title: 'Take Ergo apart yourself', sub: 'Address decoder, public key → address, Blake2b-256, unit converter, emission calculator.' },
  { file: 'og/privacy', kicker: 'Privacy', title: 'We don’t track anything', sub: 'No cookies, no analytics, no accounts, no third-party scripts.' },
  { file: 'og/explorer', kicker: 'Explorer', title: 'An explorer that explains itself', sub: 'Every block, transaction, box and address page comes with plain-language notes.' },
  ...ARTICLES.map((a) => ({ file: `og/${a.slug}`, kicker: a.group?.en ? `${SECTION_KICKER[a.section]} · ${a.group.en}` : SECTION_KICKER[a.section], title: a.title.en, sub: a.summary.en })),
  ...TOOLS.map((t) => ({ file: `og/${t.slug}`, kicker: 'Tools', title: t.title.en, sub: t.summary.en })),
]
mkdirSync('public/og', { recursive: true })
for (const c of cards) {
  const r = await send('Runtime.evaluate', { expression: `{
    document.getElementById('kicker').textContent = ${JSON.stringify(c.kicker)};
    const t = document.getElementById('title'); t.textContent = ${JSON.stringify(c.title)}; t.classList.toggle('small', ${JSON.stringify(c.title)}.length > 32);
    document.getElementById('sub').textContent = ${JSON.stringify(c.sub)}; }`, returnByValue: true })
  if (r.error || r.result?.exceptionDetails) throw new Error('evaluate failed for ' + c.file + ': ' + JSON.stringify(r.error || r.result.exceptionDetails.exception?.description))
  await sleep(120)
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } })
  writeFileSync(`public/${c.file}.png`, Buffer.from(shot.result.data, 'base64'))
}
console.log(`[og] wrote ${cards.length} images to public/`)
ws.close(); proc.kill()
