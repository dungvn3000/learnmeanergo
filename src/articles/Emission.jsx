import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Coins, Lock, Package, Target } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num } from '../lib/format'
import {
  BLOCK_TIME_SEC, EIP27_ACTIVATION, EPOCH_LENGTH, EPOCH_REDUCTION, FIXED_RATE, FIXED_RATE_PERIOD, GENESIS_TIME, MAX_SUPPLY, REEMISSION_PER_BLOCK, REEMISSION_START, TREASURY_ADDRESS,
  emissionAt, emittedUpTo, heightToDate, minerRewardAt, reemissionLockAt, treasuryAt,
} from '../lib/ergo'
import { articleNs, getLang } from '../lib/i18n'
import { Callout, Card, Stat } from '../components/ui'
import LineChart from '../components/LineChart'
import en from './locales/en/Emission.json'
import vi from './locales/vi/Emission.json'

const useT = articleNs('Emission', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const MAX_H = 2_200_000

const FOUNDATION_SCRIPT_URL =
  'https://github.com/ergoplatform/sigmastate-interpreter/blob/develop/interpreter/shared/src/main/scala/org/ergoplatform/ErgoTreePredef.scala'

const REFS = [
  ['curve', 'https://ergoplatform.org/en/blog/2019_05_20-curve/'],
  ['eip27', 'https://github.com/ergoplatform/eips/blob/master/eip-0027.md'],
  ['docsEmission', 'https://docs.ergoplatform.com/mining/emission/'],
  ['docsFaq', 'https://docs.ergoplatform.com/faq/'],
  ['docsTreasury', 'https://docs.ergoplatform.com/ef/ef-treasury/'],
  ['docsEfyt', 'https://docs.ergoplatform.com/efyt/'],
  ['foundationScript', FOUNDATION_SCRIPT_URL],
]

// Total ERG that EIP-27 locks between activation and the end of emission.
const TOTAL_REEMISSION = (() => {
  let s = 0
  for (let h = EIP27_ACTIVATION; h < REEMISSION_START; h++) s += reemissionLockAt(h)
  return s
})()
const REEMISSION_END = REEMISSION_START + Math.ceil(TOTAL_REEMISSION / REEMISSION_PER_BLOCK)

/** Heights at which the per-block emission changes, plus the chart ends. */
function breakpoints() {
  const hs = [1, FIXED_RATE_PERIOD]
  for (let h = FIXED_RATE_PERIOD + EPOCH_LENGTH; h <= MAX_H; h += EPOCH_LENGTH) hs.push(h)
  hs.push(MAX_H)
  return hs
}

const mil = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(0)}k` : String(v))

export default function Emission() {
  const { t } = useT()
  const T = (k, values, extra) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const state = useApi(() => Promise.all([api.info(), api.networkState()]), [])
  const [info, net] = state.data ?? []
  const height = info?.height

  // Estimated calendar date of a height: anchored to the live tip when we have it.
  const tipTime = net?.tipTimestamp
  // Average block time since launch, so dates years away don't drift with short-term hashrate swings.
  const blockMs = height > 1 && tipTime ? (tipTime - GENESIS_TIME) / (height - 1) : BLOCK_TIME_SEC * 1000
  const dateOf = (h) => (height && tipTime ? new Date(tipTime + (h - height) * blockMs) : heightToDate(h))
  const fmtDate = (h) => {
    const d = dateOf(h)
    // VI keeps its compact MM/YYYY form; EN shows e.g. "Sep 2026".
    if (getLang() === 'vi') return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  const emissionPoints = useMemo(() => breakpoints().map((h) => ({ x: h, y: emissionAt(h) })), [])
  const supplyPoints = useMemo(() => {
    const pts = []
    for (let h = 0; h <= MAX_H; h += 20_000) pts.push({ x: h, y: emittedUpTo(h) })
    return pts
  }, [])
  const markers = height ? [{ x: height, label: t('now') }] : []

  const tip = (p) => (
    <>
      <div className="text-stone-500">
        Block {num(p.x)} · ≈ {fmtDate(p.x)}
      </div>
      <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{emissionAt(p.x)} ERG / block</div>
      <div className="text-stone-500">{t('tip.miner', { v: minerRewardAt(p.x) })}</div>
      {treasuryAt(p.x) > 0 && <div className="text-stone-500">{t('tip.treasury', { v: treasuryAt(p.x) })}</div>}
      {reemissionLockAt(p.x) > 0 && <div className="text-stone-500">{t('tip.lock', { v: reemissionLockAt(p.x) })}</div>}
    </>
  )

  const exH = height ?? 1_881_901

  return (
    <>
      <p>{T('intro', { max: num(MAX_SUPPLY) })}</p>

      {net && (
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Coins} label={t('stats.issued')} value={num(net.issued)} sub={t('pctOfMax', { pct: ((net.issued / MAX_SUPPLY) * 100).toFixed(2) })} />
          <Stat icon={Package} label={t('stats.circulating')} value={num(net.circulating)} sub={t('stats.circulatingSub')} />
          <Stat icon={Lock} label={t('stats.locked')} value={num(net.reemissionLocked)} sub={t('stats.lockedSub')} />
          <Stat icon={Target} label={t('stats.max')} value={num(MAX_SUPPLY)} sub="ERG" />
        </div>
      )}

      <h2 id="lich-trinh">{t('schedule.title')}</h2>
      <p>{t('schedule.p1')}</p>
      <ol>
        <li>{T('schedule.rule1', { rate: FIXED_RATE, period: num(FIXED_RATE_PERIOD) })}</li>
        <li>{T('schedule.rule2', { epoch: num(EPOCH_LENGTH), drop: EPOCH_REDUCTION })}</li>
        <li>{T('schedule.rule3', { end: num(REEMISSION_START) })}</li>
      </ol>
      <Card className="not-prose my-6 p-4">
        <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">{t('schedule.chartTitle')}</div>
        <LineChart
          label={t('schedule.chartLabel')}
          points={emissionPoints}
          step
          xFormat={mil}
          yFormat={(v) => `${v}`}
          markers={markers}
          tooltip={tip}
        />
      </Card>
      <p>{t('schedule.p2')}</p>

      <h2 id="quy-phat-trien">{t('treasury.title')}</h2>
      <p>
        {T(
          'treasury.p1',
          {
            t1: treasuryAt(1),
            period: num(FIXED_RATE_PERIOD),
            t2: treasuryAt(FIXED_RATE_PERIOD),
            t3: treasuryAt(FIXED_RATE_PERIOD + EPOCH_LENGTH),
            miner: FIXED_RATE - treasuryAt(1),
            from: num(FIXED_RATE_PERIOD + 2 * EPOCH_LENGTH),
          },
          { treasury: <Link to={`/address/${TREASURY_ADDRESS}`} /> },
        )}
      </p>

      <p>
        {T('treasury.announcement', undefined, {
          curve: <a href="https://ergoplatform.org/en/blog/2019_05_20-curve/" target="_blank" rel="noreferrer" />,
          efyt: <a href="https://docs.ergoplatform.com/efyt/" target="_blank" rel="noreferrer" />,
        })}
      </p>
      <p>
        {T('treasury.p2', undefined, {
          faq: <a href="https://docs.ergoplatform.com/faq/" target="_blank" rel="noreferrer" />,
          efTreasury: <a href="https://docs.ergoplatform.com/ef/ef-treasury/" target="_blank" rel="noreferrer" />,
          code_: <a href={FOUNDATION_SCRIPT_URL} target="_blank" rel="noreferrer" />,
        })}
      </p>

      <h2 id="eip-27">{t('eip27.title')}</h2>
      <p>{T('eip27.p1', { height: num(EIP27_ACTIVATION) })}</p>
      <ul>
        <li>{T('eip27.li1')}</li>
        <li>{T('eip27.li2')}</li>
        <li>{T('eip27.li3', { start: num(REEMISSION_START), per: REEMISSION_PER_BLOCK })}</li>
      </ul>
      <p>
        {T('eip27.p2', {
          total: num(TOTAL_REEMISSION),
          per: REEMISSION_PER_BLOCK,
          blocks: num(Math.ceil(TOTAL_REEMISSION / REEMISSION_PER_BLOCK)),
          end: num(REEMISSION_END),
          year: dateOf(REEMISSION_END).getUTCFullYear(),
        })}
      </p>
      <Callout type="note" title={t('miner.title')}>
        {T(
          'miner.text',
          { h: num(exH), e: emissionAt(exH), l: reemissionLockAt(exH), m: minerRewardAt(exH) },
          { explorer: <Link to="/explorer" /> },
        )}
      </Callout>

      <h2 id="bang">{t('table.title')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('table.from')}</th>
            <th>{t('table.date')}</th>
            <th>{t('table.emission')}</th>
            <th>{t('table.miner')}</th>
            <th>{t('table.note')}</th>
          </tr>
        </thead>
        <tbody>
          {[
            [1, 'launch'],
            [FIXED_RATE_PERIOD, 'decline'],
            [FIXED_RATE_PERIOD + 2 * EPOCH_LENGTH, 'treasuryEnds'],
            [EIP27_ACTIVATION, 'eip27'],
            [1_821_600, 'below15'],
            [REEMISSION_START - 1, 'lastEmission'],
            [REEMISSION_START, 'reemissionOnly'],
            [REEMISSION_END, 'dry'],
          ].map(([h, key]) => (
            <tr key={h}>
              <td className="tabular-nums">{num(h)}</td>
              <td className="tabular-nums">{fmtDate(h)}</td>
              <td className="tabular-nums">{emissionAt(h)} ERG</td>
              <td className="tabular-nums">{h >= REEMISSION_END ? 0 : minerRewardAt(h)} ERG</td>
              <td>{t(`table.notes.${key}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="tong-cung">{t('supply.title')}</h2>
      <Card className="not-prose my-6 p-4">
        <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">{t('supply.chartTitle')}</div>
        <LineChart
          label={t('supply.chartLabel')}
          points={supplyPoints}
          xFormat={mil}
          yFormat={mil}
          markers={markers}
          tooltip={(p) => (
            <>
              <div className="text-stone-500">
                Block {num(p.x)} · ≈ {fmtDate(p.x)}
              </div>
              <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{num(p.y)} ERG</div>
              <div className="text-stone-500">{t('pctOfMax', { pct: ((p.y / MAX_SUPPLY) * 100).toFixed(1) })}</div>
            </>
          )}
        />
      </Card>
      <p>{T('outro', undefined, { calc: <Link to="/tools/emission-calculator" /> })}</p>

      <h2 id="tham-khao">{t('refs.title')}</h2>
      <ul>
        {REFS.map(([key, href]) => (
          <li key={key}>
            <a href={href} target="_blank" rel="noreferrer">
              {t(`refs.${key}`)}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
