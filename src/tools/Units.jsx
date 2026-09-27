import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { Callout, Card, CopyButton } from '../components/ui'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const DECIMALS = 9n
const SCALE = 10n ** DECIMALS
const MAX_NANO = 2n ** 63n - 1n // box values are signed 64-bit integers

function checkRange(n) {
  if (n > MAX_NANO) throw new Error(
      i18n.t('units.exceedsThe64BitIntegerLimit'),
    )
  return n
}

/** "1.5" ERG -> 1500000000n nanoERG, exact (string math, no floats). */
function ergToNano(s) {
  s = s.trim().replace(/[,_\s]/g, '')
  if (!s) return null
  if (!/^\d*\.?\d*$/.test(s) || s === '.') throw new Error(i18n.t('units.numbersOnlyWithADotFor'))
  const [int = '', frac = ''] = s.split('.')
  if (frac.length > 9) throw new Error(
      i18n.t('units.ergHasAtMost9Decimal'),
    )
  return checkRange(BigInt(int || '0') * SCALE + BigInt((frac + '000000000').slice(0, 9)))
}

/** 1500000000n -> "1.5" */
function nanoToErg(n) {
  const neg = n < 0n
  if (neg) n = -n
  const int = n / SCALE
  const frac = (n % SCALE).toString().padStart(9, '0').replace(/0+$/, '')
  return (neg ? '-' : '') + int.toLocaleString('en-US') + (frac ? '.' + frac : '')
}

function parseNano(s) {
  s = s.trim().replace(/[,_\s]/g, '')
  if (!s) return null
  if (!/^\d+$/.test(s)) throw new Error(i18n.t('units.nanoergIsAnIntegerNoDecimal'))
  return checkRange(BigInt(s))
}

const refs = (t) => [
  { label: '1 ERG', nano: 1_000_000_000n },
  { label: t('units.typicalTransactionFee'), nano: 1_000_000n },
  { label: t('units.commonlyUsedMinimumBoxValue'), nano: 1_000_000n },
  { label: t('units.currentBlockRewardForTheMiner'), nano: 3_000_000_000n },
  { label: '1 nanoERG', nano: 1n },
]

export default function Units() {
  const { t } = useTranslation()
  const [ergIn, setErgIn] = useState('1')
  const [nanoIn, setNanoIn] = useState('1000000000')
  const [err, setErr] = useState(null)

  const fromErg = (v) => {
    setErgIn(v)
    try {
      const n = ergToNano(v)
      setNanoIn(n === null ? '' : n.toString())
      setErr(null)
    } catch (e) {
      setNanoIn('')
      setErr(e.message)
    }
  }
  const fromNano = (v) => {
    setNanoIn(v)
    try {
      const n = parseNano(v)
      setErgIn(n === null ? '' : nanoToErg(n).replace(/,/g, ''))
      setErr(null)
    } catch (e) {
      setErgIn('')
      setErr(e.message)
    }
  }

  const input =
    'w-full rounded-xl border border-stone-200 bg-stone-50 p-3 pr-20 font-mono text-lg tabular-nums outline-none focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:border-stone-700 dark:bg-stone-950'

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="relative">
            <input value={ergIn} onChange={(e) => fromErg(e.target.value)} inputMode="decimal" className={input} aria-label="ERG" />
            <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-sm font-semibold text-stone-500">
              ERG <CopyButton text={ergIn} />
            </span>
          </div>
          <ArrowLeftRight className="mx-auto size-5 rotate-90 text-ergo-500 md:rotate-0" />
          <div className="relative">
            <input value={nanoIn} onChange={(e) => fromNano(e.target.value)} inputMode="numeric" className={input} aria-label="nanoERG" />
            <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-sm font-semibold text-stone-500">
              nanoERG <CopyButton text={nanoIn} />
            </span>
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{err}</div>}
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs tracking-wide text-stone-500 uppercase dark:bg-stone-950">
            <tr>
              <th className="px-4 py-2">{t('units.referenceValue')}</th>
              <th className="px-4 py-2 text-right">ERG</th>
              <th className="px-4 py-2 text-right">nanoERG</th>
            </tr>
          </thead>
          <tbody>
            {refs(t).map((r) => (
              <tr
                key={r.label}
                onClick={() => fromNano(r.nano.toString())}
                className="cursor-pointer border-t border-stone-100 hover:bg-ergo-50/50 dark:border-stone-800 dark:hover:bg-ergo-950/30"
              >
                <td className="px-4 py-2">{r.label}</td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">{nanoToErg(r.nano)}</td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">{r.nano.toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Callout type="note" title={t('units.whyNanoerg')}>
        {t('units.theBlockchainDoesnTStoreDecimals')}{' '}
        <b>nanoERG</b>: 1 ERG = 1,000,000,000 nanoERG.{' '}
        {t('units.walletsAndExplorersOnlyDivideBy')}
      </Callout>
    </div>
  )
}
