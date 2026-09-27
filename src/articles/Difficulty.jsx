import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Check, Gauge, Timer, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { compact, num } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Card, Field, Stat } from '../components/ui'
import LineChart from '../components/LineChart'
import en from './locales/en/Difficulty.json'
import vi from './locales/vi/Difficulty.json'

const useT = articleNs('Difficulty', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code />, sup: <sup /> }


// Order of the secp256k1 group; Ergo's target is q / difficulty.
const Q = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/** Compact "nBits" → big integer (same format as Bitcoin, but it encodes the difficulty). */
function decodeNBits(hex) {
  const n = parseInt(hex, 16)
  const exponent = n >>> 24
  const mantissa = n & 0x007fffff
  const value = exponent <= 3 ? BigInt(mantissa >> (8 * (3 - exponent))) : BigInt(mantissa) << BigInt(8 * (exponent - 3))
  return { n, exponent, mantissa, value }
}

const shortDate = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

function LiveNBits() {
  const { t } = useT()
  const state = useApi(() => Promise.all([api.latestBlocks(1), api.networkState()]), [])
  return (
    <Async state={state}>
      {([blocks, net]) => {
        const b = blocks?.[0]
        if (!b?.nBits) return <p>{t('live.error')}</p>
        const d = decodeNBits(b.nBits)
        const matches = d.value === BigInt(b.difficulty)
        const target = Q / d.value
        const hashrate = Number(d.value) / 120
        return (
          <>
            <Card className="not-prose my-6 p-2 sm:p-4">
              <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Block <Link to={`/block/${b.height}`} className="text-ergo-600 hover:underline dark:text-ergo-400">#{num(b.height)}</Link>
              </div>
              <Field name="nBits" value={<span className="font-mono">0x{b.nBits.padStart(8, '0')}</span>}>
                {t('live.nBits')}
              </Field>
              <Field name={t('live.exponent.name')} value={<span className="font-mono">0x{d.exponent.toString(16).padStart(2, '0')} = {d.exponent}</span>}>
                {t('live.exponent.desc')}
              </Field>
              <Field name={t('live.mantissa.name')} value={<span className="font-mono">0x{d.mantissa.toString(16)} = {num(d.mantissa)}</span>}>
                {t('live.mantissa.desc')}
              </Field>
              <Field
                name={t('live.decoded')}
                value={
                  <span className="font-mono break-all">
                    {num(d.mantissa)} × 256<sup>{d.exponent - 3}</sup> = {d.value.toLocaleString('en-US')}
                  </span>
                }
              >
                {matches ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <Check className="size-3.5" /> {t('live.matches', { difficulty: num(b.difficulty) })}
                  </span>
                ) : (
                  <>{t('live.compare', { difficulty: num(b.difficulty) })}</>
                )}
              </Field>
              <Field name="Target = q / difficulty" value={<span className="font-mono break-all">0x{target.toString(16).padStart(64, '0')}</span>}>
                {t('live.target')}
              </Field>
            </Card>

            <h2 id="hashrate">{t('hashrate.title')}</h2>
            <p>
              <Trans t={t} i18nKey="hashrate.p1" components={TAGS} />
            </p>
            <pre>
              <code>{`hashrate ≈ difficulty / 120 s
         ≈ ${num(b.difficulty)} / 120
         ≈ ${compact(hashrate)} H/s  ≈ ${(hashrate / 1e12).toFixed(2)} TH/s`}</code>
            </pre>
            {net && (
              <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
                <Stat
                  icon={Zap}
                  label="Hashrate (explorer)"
                  value={`${net.hashrate} TH/s`}
                  sub={t('hashrate.change7d', { change: `${net.hashrateChange7d > 0 ? '+' : ''}${net.hashrateChange7d}` })}
                />
                <Stat icon={Gauge} label={t('hashrate.difficulty')} value={compact(net.difficulty)} sub={num(net.difficulty)} />
                <Stat icon={Timer} label={t('hashrate.avgBlockTime')} value={`${net.avgBlockTimeSec.toFixed(1)} s`} sub={t('hashrate.target')} />
              </div>
            )}
          </>
        )
      }}
    </Async>
  )
}

function DifficultyChart() {
  const { t } = useT()
  const state = useApi(() => api.chart('difficulty', 180), [])
  return (
    <Async state={state}>
      {(c) =>
        c?.points?.length ? (
          <Card className="not-prose my-6 p-4">
            <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">{t('chart.title')}</div>
            <LineChart
              label={t('chart.label')}
              points={c.points.map((p) => ({ x: p.t, y: p.v }))}
              xFormat={shortDate}
              yFormat={compact}
              tooltip={(p) => (
                <>
                  <div className="text-stone-500">{new Date(p.x).toISOString().slice(0, 10)}</div>
                  <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{num(p.y)}</div>
                  <div className="text-stone-500">≈ {(p.y / 120 / 1e12).toFixed(2)} TH/s</div>
                </>
              )}
            />
          </Card>
        ) : (
          <p>{t('chart.empty')}</p>
        )
      }
    </Async>
  )
}

export default function Difficulty() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro')}</p>

      <h2 id="target">{t('target.title')}</h2>
      <p>{T('target.p1', { autolykos: <Link to="/learn/autolykos" /> })}</p>
      <pre>
        <code>{t('target.code')}</code>
      </pre>
      <p>{T('target.p2')}</p>
      <p>{T('target.p3')}</p>

      <h2 id="nbits">{t('nbits.title')}</h2>
      <p>{T('nbits.p1')}</p>
      <pre>
        <code>{`value = mantissa × 256^(exponent − 3)`}</code>
      </pre>
      <p>{t('nbits.p2')}</p>
      <LiveNBits />
      <Callout type="note" title={t('nbits.estimateTitle')}>
        {t('nbits.estimateText')}
      </Callout>

      <h2 id="dieu-chinh">{t('adjust.title')}</h2>
      <p>{T('adjust.p1')}</p>
      <p>{T('adjust.p2')}</p>
      <ul>
        <li>{T('adjust.epoch')}</li>
        <li>{t('adjust.average')}</li>
        <li>{t('adjust.cap')}</li>
      </ul>
      <p>{t('adjust.p3')}</p>
      <DifficultyChart />

      <h2 id="xem-them">{t('seeAlso.title')}</h2>
      <ul>
        <li>{T('seeAlso.autolykos', { link: <Link to="/learn/autolykos" /> })}</li>
        <li>{T('seeAlso.block', { link: <Link to="/learn/block" /> })}</li>
        <li>{T('seeAlso.emission', { link: <Link to="/learn/emission" /> })}</li>
      </ul>
    </>
  )
}
