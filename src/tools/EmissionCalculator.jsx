import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import {
  BLOCK_TIME_SEC, EIP27_ACTIVATION, FIXED_RATE_PERIOD, MAX_SUPPLY, REEMISSION_START,
  emissionAt, emittedUpTo, minerRewardAt, reemissionLockAt, treasuryAt,
} from '../lib/ergo'
import { num } from '../lib/format'
import { Badge, Callout, Card, Field } from '../components/ui'
import { useTranslation } from 'react-i18next'
import { locale } from '../lib/i18n'

const MAX_H = 2_500_000

function phaseOf(h, t) {
  if (h < FIXED_RATE_PERIOD) return {
      tone: 'green',
      label: t('emissionCalculator.fixedRatePeriod'),
      desc: t('emissionCalculator.n75ErgPerBlockForThe'),
    }
  if (h >= REEMISSION_START) return {
      tone: 'violet',
      label: t('emissionCalculator.reEmission'),
      desc: t('emissionCalculator.mainEmissionIsOverMinersReceive'),
    }
  if (h >= EIP27_ACTIVATION) return {
      tone: 'sky',
      label: t('emissionCalculator.decliningEip27'),
      desc: t('emissionCalculator.dropsBy3ErgEvery64'),
    }
  return {
    tone: 'ergo',
    label: t('emissionCalculator.declining'),
    desc: t('emissionCalculator.theRewardDropsBy3Erg'),
  }
}

const fmtDate = (d) => d.toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' })

export default function EmissionCalculator() {
  const { t } = useTranslation()
  const info = useApi(() => api.latestBlocks(1), [])
  const tip = info.data?.[0]
  const [h, setH] = useState(null)
  const [draft, setText] = useState(null)

  // Until the user picks a height, follow the live tip.
  const height = h ?? tip?.height ?? 1_000_000
  const text = draft ?? String(height)
  const set = (v) => {
    const n = Math.max(1, Math.min(MAX_H, Math.trunc(Number(v)) || 1))
    setH(n)
    setText(String(n))
  }

  const r = useMemo(() => {
    const emitted = emittedUpTo(height)
    return {
      emission: emissionAt(height),
      treasury: treasuryAt(height),
      lock: reemissionLockAt(height),
      miner: minerRewardAt(height),
      emitted,
      pct: (emitted / MAX_SUPPLY) * 100,
    }
  }, [height])

  const past = tip && height <= tip.height
  // A mined block has a real timestamp; only future heights need extrapolating.
  const mined = useApi(() => (past ? api.block(height) : Promise.resolve(null)), [past ? height : 0])
  const realTime = past && mined.data?.height === height ? mined.data.timestamp : null
  const date = realTime
    ? new Date(realTime)
    : tip
      ? new Date(tip.timestamp + (height - tip.height) * BLOCK_TIME_SEC * 1000)
      : new Date(Date.UTC(2019, 6, 1) + (height - 1) * BLOCK_TIME_SEC * 1000)
  const phase = phaseOf(height, t)

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grow">
            <span className="text-sm font-semibold text-stone-900 dark:text-white">{t('emissionCalculator.blockHeight')}</span>
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                const n = Number(e.target.value.replace(/[,\s]/g, ''))
                if (Number.isFinite(n) && n >= 1) setH(Math.min(MAX_H, Math.trunc(n)))
              }}
              onBlur={() => set(height)}
              inputMode="numeric"
              className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-lg tabular-nums outline-none focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:border-stone-700 dark:bg-stone-950"
            />
          </label>
          {tip && (
            <button
              onClick={() => set(tip.height)}
              className="inline-flex items-center gap-1 rounded-full border border-ergo-200 bg-ergo-50 px-3 py-2 text-xs text-ergo-700 hover:border-ergo-400 dark:border-ergo-900 dark:bg-ergo-950/40 dark:text-ergo-300"
            >
              <Radio className="size-3" /> {t('emissionCalculator.current')}: {num(tip.height)}
            </button>
          )}
        </div>
        <input
          type="range"
          min={1}
          max={MAX_H}
          step={1}
          value={height}
          onChange={(e) => set(e.target.value)}
          className="mt-4 w-full accent-ergo-500"
          aria-label={t('emissionCalculator.blockHeight')}
        />
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {[
            [1, 'Genesis'],
            [FIXED_RATE_PERIOD, t('emissionCalculator.endOfFixedRate')],
            [EIP27_ACTIVATION, t('emissionCalculator.eip27Activation')],
            [REEMISSION_START, t('emissionCalculator.reEmissionStarts')],
          ].map(([v, l]) => (
            <button key={v} onClick={() => set(v)} className="rounded-full border border-stone-200 px-3 py-1 hover:border-ergo-300 hover:text-ergo-600 dark:border-stone-700">
              {l} · {num(v)}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{t('emissionCalculator.totalEmissionBlock')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-stone-900 dark:text-white">{num(r.emission, 2)} ERG</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{t('common.minerReceives')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-ergo-600 dark:text-ergo-400">{num(r.miner, 2)} ERG</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{t('emissionCalculator.emittedSoFar')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-stone-900 dark:text-white">{r.pct.toFixed(2)}%</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div className="h-full rounded-full bg-ergo-500" style={{ width: `${Math.min(100, r.pct)}%` }} />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <Field name={t('emissionCalculator.phase')} value={<Badge tone={phase.tone}>{phase.label}</Badge>}>
          {phase.desc}
        </Field>
        <Field name={realTime ? t('emissionCalculator.date') : t('emissionCalculator.dateEstimated')} value={fmtDate(date)}>
          {realTime
            ? t('emissionCalculator.minedOnThisDate')
            : past
            ? t('emissionCalculator.thisBlockHasAlreadyBeenMined')
            : t('emissionCalculator.extrapolatedFromTheLatestBlockAt')}
        </Field>
        <Field name={t('emissionCalculator.newEmission')} value={`${num(r.emission, 2)} ERG`}>
          {t('emissionCalculator.theAmountOfNewErgCreated')}
        </Field>
        <Field name={t('emissionCalculator.treasury')} value={`${num(r.treasury, 2)} ERG`}>
          {t('emissionCalculator.theShareForTheDevelopmentTreasury')}
        </Field>
        <Field name={t('emissionCalculator.eip27Lock')} value={`${num(r.lock, 2)} ERG`}>
          {t('emissionCalculator.fromBlockThisPartGoesInto', { v0: num(EIP27_ACTIVATION) })}
        </Field>
        <Field name={t('common.minerReceives')} value={`${num(r.miner, 2)} ERG + ${t('emissionCalculator.transactionFees')}`}>
          {height >= REEMISSION_START
            ? t('emissionCalculator.n3ErgPerBlockPaidFrom')
            : t('emissionCalculator.emissionTreasuryEip27Lock')}
        </Field>
        <Field name={t('emissionCalculator.totalEmitted')} value={`${num(r.emitted)} / ${num(MAX_SUPPLY)} ERG`}>
          {t('emissionCalculator.summedFromBlock1ToBlock', { v0: num(height), v1: num(MAX_SUPPLY) })}
        </Field>
      </Card>

      <Callout type="tip">
        {t('emissionCalculator.wantToKnowWhyTheEmission')}{' '}
        <Link to="/learn/emission">{t('emissionCalculator.emissionScheduleEip27')}</Link>.
      </Callout>
    </div>
  )
}
