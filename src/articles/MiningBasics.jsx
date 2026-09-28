import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Clock, Cpu, Gauge, Pickaxe } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { compact, num } from '../lib/format'
import { minerRewardAt } from '../lib/ergo'
import { articleNs, getLang, locale } from '../lib/i18n'
import { Async, Callout, Card, Figure, Stat } from '../components/ui'
import LineChart from '../components/LineChart'
import en from './locales/en/MiningBasics.json'
import vi from './locales/vi/MiningBasics.json'

const useT = articleNs('MiningBasics', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

function HashrateChart() {
  const { t } = useT()
  const state = useApi(() => api.chart('hashrate', 90), [])
  return (
    <Card className="not-prose my-6 p-4">
      <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">{t('chart.title')}</div>
      <Async state={state}>
        {(c) =>
          c.points?.length > 1 ? (
            <LineChart
              points={c.points.map((p) => ({ x: p.t, y: p.v }))}
              label={t('chart.label')}
              xFormat={(x) => new Date(x).toLocaleDateString(locale(), { day: '2-digit', month: getLang() === 'vi' ? '2-digit' : 'short' })}
              yFormat={(y) => `${+y.toFixed(2)} ${c.unit}`}
            />
          ) : (
            <div className="py-6 text-center text-sm text-stone-500">{t('chart.empty')}</div>
          )
        }
      </Async>
    </Card>
  )
}

function PoolShare({ pools }) {
  const { t } = useT()
  const total = pools.reduce((s, p) => s + p.blocks, 0)
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-sm font-semibold text-stone-900 dark:text-white">{t('pools.title', { total })}</div>
      <div className="grid gap-2">
        {pools.map((p) => {
          const pct = (p.blocks / total) * 100
          return (
            <div key={p.address} className="grid grid-cols-[110px_1fr_70px] items-center gap-3 text-sm">
              <Link to={`/address/${p.address}`} className="truncate font-medium hover:text-ergo-600" title={p.address}>
                {p.name}
              </Link>
              <div className="h-3 rounded-full bg-stone-100 dark:bg-stone-800">
                <div className="h-full rounded-full bg-ergo-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right tabular-nums text-stone-500">
                {p.blocks} · {pct.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function MiningBasics() {
  const { t } = useT()
  const T = (k, extra, values) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const ns = useApi(() => api.networkState(), [], 60000)
  const d = ns.data
  return (
    <>
      <p>{T('intro')}</p>

      {d && (
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
          <Stat icon={Cpu} label={t('stats.hashrate')} value={`${d.hashrate} TH/s`} sub={t('stats.change', { pct: `${d.hashrateChange7d > 0 ? '+' : ''}${d.hashrateChange7d}` })} />
          <Stat icon={Clock} label={t('stats.blockTime')} value={t('stats.seconds', { n: Math.round(d.avgBlockTimeSec) })} sub={t('stats.target')} />
          <Stat icon={Gauge} label={t('stats.difficulty')} value={compact(d.difficulty)} sub={`block #${num(d.height)}`} />
        </div>
      )}

      <h2 id="tho-dao-lam-gi">{t('what.title')}</h2>
      <p>{t('what.p1')}</p>
      <ol>
        <li>{t('what.s1')}</li>
        <li>{t('what.s2')}</li>
        <li>{T('what.s3')}</li>
      </ol>
      <p>{T('what.p2')}</p>
      <Figure src="/img/mining.webp" alt={t('what.figAlt')} width={1360} height={470} caption={t('what.figCaption')} />
      <HashrateChart />

      <h2 id="phan-thuong">{t('reward.title')}</h2>
      <p>{t('reward.p1')}</p>
      <ul>
        <li>
          {T('reward.block', { erg: <Link to="/learn/erg" /> })}
          {d && (
            <>
              {' '}
              {T('reward.current', null, { reward: minerRewardAt(d.height) })}
            </>
          )}
        </li>
        <li>{T('reward.fees')}</li>
      </ul>
      <p>{t('reward.p2')}</p>

      <h2 id="do-kho">{t('difficulty.title')}</h2>
      <p>{T('difficulty.p1')}</p>
      <p>{T('difficulty.p2', { difficulty: <Link to="/learn/difficulty" /> })}</p>

      <h2 id="gpu">{t('gpu.title')}</h2>
      <p>{T('gpu.p1')}</p>
      <p>{t('gpu.p2')}</p>
      <Callout type="note">
        {T('gpu.note', { autolykos: <Link to="/learn/autolykos" /> })}
      </Callout>

      <h2 id="pool">{t('pool.title')}</h2>
      <p>{T('pool.p1')}</p>
      {d?.poolShare24h?.length > 0 && <PoolShare pools={d.poolShare24h} />}
      <p>{t('pool.p2')}</p>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>
        <Pickaxe className="mr-1 inline size-4 text-ergo-500" />
        {T('next.p1', { block: <Link to="/learn/block" />, technical: <Link to="/technical" />, explorer: <Link to="/explorer" /> })}
      </p>
    </>
  )
}
