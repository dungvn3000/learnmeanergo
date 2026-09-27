import { Link } from 'react-router-dom'
import { ArrowRight, ArrowDown, Eye, Lock, LockOpen } from 'lucide-react'
import { Erg, Hash, Swatch, TokenChip } from './ui'
import { useTranslation } from 'react-i18next'

// Miner fee contract: every fee output is locked by this well-known ErgoTree.
export const FEE_TREE_PREFIX = '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

export const isFeeBox = (b) => typeof b?.ergoTree === 'string' && b.ergoTree.startsWith(FEE_TREE_PREFIX)

/** One box, drawn as a card. `role` = input | output | data. */
export function BoxCard({ box, role = 'output', showRegisters = false }) {
  const { t } = useTranslation()
  const fee = isFeeBox(box)
  const border =
    role === 'data'
      ? 'border-dashed border-sky-300 dark:border-sky-800'
      : fee
        ? 'border-amber-300 dark:border-amber-800'
        : 'border-stone-200 dark:border-stone-700'
  return (
    <div className={`rounded-xl border bg-surface p-3 text-sm dark:bg-stone-900 ${border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Swatch id={box.boxId} />
          <Hash value={box.boxId} to={`/box/${box.boxId}`} head={6} tail={4} className="text-xs" />
        </div>
        {role === 'output' &&
          (box.spent || box.spentBy ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-400" title={t('txFlow.spent')}>
              <LockOpen className="size-3" /> {t('common.spent')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600" title={t('txFlow.unspentUtxo')}>
              <Lock className="size-3" /> {t('common.unspent')}
            </span>
          ))}
        {role === 'data' && (
          <span className="inline-flex items-center gap-1 text-[11px] text-sky-600">
            <Eye className="size-3" /> {t('txFlow.readOnly')}
          </span>
        )}
      </div>
      <div className="mt-2 text-base font-semibold text-stone-900 dark:text-white">
        <Erg nano={box.value} />
      </div>
      <div className="mt-1 min-w-0 text-xs text-stone-500">
        {fee ? (
          <span className="font-medium text-amber-800 dark:text-amber-400">{t('txFlow.minerFee')}</span>
        ) : box.address ? (
          <Hash value={box.address} to={`/address/${box.address}`} head={8} tail={6} />
        ) : (
          '—'
        )}
      </div>
      {box.assets?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {box.assets.map((a) => (
            <TokenChip key={a.tokenId} asset={a} />
          ))}
        </div>
      )}
      {showRegisters && box.registers?.length > 0 && (
        <div className="mt-2 space-y-0.5 border-t border-stone-100 pt-2 font-mono text-[11px] dark:border-stone-800">
          {box.registers.map((r) => (
            <div key={r.key} className="truncate" title={r.value}>
              <span className="font-semibold text-violet-600 dark:text-violet-400">{r.key}</span>{' '}
              <span className="text-stone-400">{r.type}</span> {r.value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Inputs → outputs diagram of a transaction. */
export function TxFlow({ tx, showRegisters = false, limit = 20 }) {
  const { t } = useTranslation()
  const ins = tx.inputs ?? []
  const outs = tx.outputs ?? []
  const data = tx.dataInputs ?? []
  const col = (title, n, children) => (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wide text-stone-500 uppercase">
        {title} <span className="tabular-nums">{n}</span>
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  )
  const more = (n) => n > limit && <div className="text-center text-xs text-stone-500">{t('txFlow.andMoreBoxes', { limit: n - limit })}</div>
  return (
    <div>
      {data.length > 0 && (
        <div className="mb-4">
          {col(
            'Data inputs',
            data.length,
            <div className="grid gap-2 sm:grid-cols-2">
              {data.slice(0, limit).map((b) => (
                <BoxCard key={b.boxId} box={b} role="data" showRegisters={showRegisters} />
              ))}
            </div>,
          )}
        </div>
      )}
      <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {col(
          'Inputs',
          ins.length,
          <>
            {ins.slice(0, limit).map((b) => (
              <BoxCard key={b.boxId} box={b} role="input" showRegisters={showRegisters} />
            ))}
            {more(ins.length)}
          </>,
        )}
        <div className="flex justify-center self-center text-ergo-500">
          <ArrowRight className="hidden size-7 md:block" />
          <ArrowDown className="size-7 md:hidden" />
        </div>
        {col(
          'Outputs',
          outs.length,
          <>
            {outs.slice(0, limit).map((b) => (
              <BoxCard key={b.boxId} box={b} role="output" showRegisters={showRegisters} />
            ))}
            {more(outs.length)}
          </>,
        )}
      </div>
    </div>
  )
}

export function TxLink({ id, children }) {
  return (
    <Link to={`/tx/${id}`} className="text-ergo-600 hover:underline dark:text-ergo-400">
      {children}
    </Link>
  )
}
