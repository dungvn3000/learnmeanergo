import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { articleNs } from '../lib/i18n'
import { Callout, Card } from '../components/ui'
import en from './locales/en/SigmaProtocols.json'
import vi from './locales/vi/SigmaProtocols.json'

const useT = articleNs('SigmaProtocols', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code />, sup: <sup /> }

// Toy group for the demo: multiplicative group mod a small prime.
// Real Ergo uses the secp256k1 elliptic curve with 256-bit numbers.
const P = 2039n
const G = 7n
const ORDER = P - 1n

const modpow = (b, e, m) => {
  let r = 1n
  b %= m
  e = ((e % ORDER) + ORDER) % ORDER
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m
    b = (b * b) % m
    e >>= 1n
  }
  return r
}

function NumInput({ label, value, onChange, hint }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-stone-900 dark:text-white">{label}</span>
      <input
        type="number"
        min="1"
        max="2037"
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(2037, Number(e.target.value) || 1)))}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono tabular-nums outline-none focus:border-ergo-400 dark:border-stone-700 dark:bg-stone-900"
      />
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

function SchnorrDemo() {
  const { t } = useT()
  const [x, setX] = useState(1234)
  const [r, setR] = useState(777)
  const [e, setE] = useState(42)
  const [cheat, setCheat] = useState(false)

  const secret = BigInt(x)
  const h = modpow(G, secret, P) // public key
  const a = modpow(G, BigInt(r), P) // commitment
  // A cheater who does not know x uses a wrong secret when computing z.
  const used = cheat ? secret + 1n : secret
  const z = (((BigInt(r) + BigInt(e) * used) % ORDER) + ORDER) % ORDER
  const lhs = modpow(G, z, P)
  const rhs = (a * modpow(h, BigInt(e), P)) % P
  const ok = lhs === rhs

  const row = (step, who, text) => (
    <div className="grid grid-cols-[28px_1fr] gap-3 border-b border-stone-100 py-2.5 last:border-0 dark:border-stone-800">
      <span className="grid size-6 place-items-center rounded-full bg-ergo-500 text-xs font-bold text-white">{step}</span>
      <div className="min-w-0 text-sm">
        <span className="font-semibold text-stone-900 dark:text-white">{who}: </span>
        {text}
      </div>
    </div>
  )
  // Demo step text: <b> stays a plain <b> (not <strong>) as in the original markup.
  const T = (k, values) => <Trans t={t} i18nKey={k} values={values} components={{ b: <b /> }} />

  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('demo.title', { p: String(P), g: String(G) })}</div>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumInput label={t('demo.x.label')} value={x} onChange={setX} hint={t('demo.x.hint')} />
        <NumInput label={t('demo.r.label')} value={r} onChange={setR} hint={t('demo.r.hint')} />
        <NumInput label={t('demo.e.label')} value={e} onChange={setE} hint={t('demo.e.hint')} />
      </div>
      <div className="mt-5 font-mono text-[13px]">
        {row(0, t('demo.who.public'), <>h = gˣ mod p = <b>{String(h)}</b></>)}
        {row(1, t('demo.who.prover'), T('demo.step1', { a: String(a) }))}
        {row(2, t('demo.who.verifier'), T('demo.step2', { e }))}
        {row(3, t('demo.who.prover'), T('demo.step3', { z: String(z) }))}
        {row(4, t('demo.who.verifier'), T('demo.step4', { lhs: String(lhs), rhs: String(rhs) }))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cheat} onChange={(ev) => setCheat(ev.target.checked)} className="accent-ergo-500" />
          {t('demo.cheat')}
        </label>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          {ok ? <Check className="size-4" /> : <X className="size-4" />}
          {ok ? t('demo.valid') : t('demo.invalid')}
        </span>
      </div>
    </Card>
  )
}

export default function SigmaProtocols() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{t('intro.p1')}</p>
      <p>{T('intro.p2', { ergotree: <Link to="/learn/ergotree" /> })}</p>

      <h2 id="sigma-protocol-la-gi">{t('what.title')}</h2>
      <p>{T('what.p1')}</p>
      <ol>
        <li>{T('what.commitment')}</li>
        <li>{T('what.challenge')}</li>
        <li>{T('what.response')}</li>
      </ol>
      <p>{T('what.p2')}</p>

      <h2 id="prove-dlog">{t('dlog.title')}</h2>
      <p>{T('dlog.p1')}</p>
      <p>{t('dlog.p2')}</p>
      <SchnorrDemo />
      <p>{T('dlog.p3')}</p>
      <Callout type="warn" title={t('dlog.reuseTitle')}>
        {T('dlog.reuseText')}
      </Callout>

      <h2 id="prove-dh-tuple">{t('dh.title')}</h2>
      <p>{T('dh.p1')}</p>

      <h2 id="ket-hop">{t('combine.title')}</h2>
      <p>{t('combine.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>ErgoScript</th>
            <th>{t('combine.thMeaning')}</th>
            <th>{t('combine.thUse')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>alice &amp;&amp; bob</code>
            </td>
            <td>{t('combine.and.meaning')}</td>
            <td>{t('combine.and.use')}</td>
          </tr>
          <tr>
            <td>
              <code>alice || bob</code>
            </td>
            <td>{t('combine.or.meaning')}</td>
            <td>{t('combine.or.use')}</td>
          </tr>
          <tr>
            <td>
              <code>atLeast(2, Coll(a, b, c))</code>
            </td>
            <td>{t('combine.atLeast.meaning')}</td>
            <td>{t('combine.atLeast.use')}</td>
          </tr>
          <tr>
            <td>
              <code>(alice &amp;&amp; bob) || carol</code>
            </td>
            <td>{t('combine.nested.meaning')}</td>
            <td>{t('combine.nested.use')}</td>
          </tr>
        </tbody>
      </table>

      <h3 id="ring">{t('ring.title')}</h3>
      <p>{T('ring.p1')}</p>
      <p>{T('ring.p2')}</p>

      <h3 id="threshold">{t('threshold.title')}</h3>
      <p>{T('threshold.p1')}</p>
      <Callout type="tip" title={t('threshold.noOpTitle')}>
        {T('threshold.noOpText')}
      </Callout>

      <h2 id="trong-giao-dich">{t('tx.title')}</h2>
      <p>{t('tx.p1')}</p>
      <ol>
        <li>{T('tx.reduce')}</li>
        <li>{T('tx.verify')}</li>
      </ol>
      <p>{T('tx.p2', { ergotree: <Link to="/learn/ergotree" />, transaction: <Link to="/learn/transaction" /> })}</p>
    </>
  )
}
