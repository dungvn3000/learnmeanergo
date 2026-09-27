import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftRight, CheckCircle2, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, bytes, erg, num, utc } from '../../lib/format'
import { Async, Badge, Card, Erg, Field, Hash } from '../../components/ui'
import { TxFlow, isFeeBox } from '../../components/TxFlow'
import { Learn, Section } from './common'
import { Trans, useTranslation } from 'react-i18next'
import { useSeo } from '../../lib/seo'

function Balance({ tx }) {
  const { t } = useTranslation()
  const inSum = tx.inputs.reduce((s, b) => s + b.value, 0)
  const outSum = tx.outputs.reduce((s, b) => s + b.value, 0)
  const fee = tx.outputs.filter(isFeeBox).reduce((s, b) => s + b.value, 0)
  const ok = inSum === outSum
  return (
    <Card className="p-5">
      <div className="text-sm font-semibold text-stone-900 dark:text-white">{t('txPage.ergConservationCheck')}</div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm tabular-nums">
        <span className="text-stone-500">{t('txPage.totalInputs')}</span>
        <span className="text-right">{erg(inSum)} ERG</span>
        <span className="text-stone-500">{t('txPage.totalOutputs')}</span>
        <span className="text-right">{erg(outSum)} ERG</span>
        <span className="text-stone-500">{t('txPage.ofWhichFeeBox')}</span>
        <span className="text-right">{erg(fee)} ERG</span>
      </div>
      <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${ok ? 'text-emerald-600' : 'text-stone-500'}`}>
        <CheckCircle2 className="size-4" />
        {ok ? t('txPage.inputsOutputsNoErgWasCreated') : tx.coinbase ? t('txPage.blockRewardTransactionNewErgComes') : t('txPage.theDifferenceComesFromBoxesThat')}
      </div>
      {tx.coinbase && (
        <p className="mt-2 text-xs text-stone-500">
          {t('txPage.ergoHasNoBitcoinStyleCoinbase')}{' '}
          <Learn to="/learn/transaction#coinbase">{t('common.why')}</Learn>
        </p>
      )}
      <p className="mt-2 text-xs text-stone-500">
        {t('txPage.unlikeBitcoinAnErgoFeeIs')}
      </p>
    </Card>
  )
}

function Tx({ tx }) {
  const { t } = useTranslation()
  const [regs, setRegs] = useState(false)
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
          <ArrowLeftRight className="size-4" /> {t('common.transaction')}
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          <Hash value={tx.id} full />
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <Badge tone={tx.coinbase ? 'ergo' : 'stone'}>{tx.kind}</Badge>
          {tx.pending ? (
            <Badge tone="sky">
              <Clock className="size-3" /> {t('txPage.waitingInTheMempool')}
            </Badge>
          ) : (
            <Badge tone="green">
              <CheckCircle2 className="size-3" /> {num(tx.confirmations)} {t('common.confirmations')}
            </Badge>
          )}
          <span>{ago(tx.timestamp)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="px-5 py-2">
          <Field name="Transaction id" value={<Hash value={tx.id} full />}>
            <Trans i18nKey="txPage.idExplained" components={{ em: <em /> }} />
          </Field>
          <Field name="Block" value={tx.height ? <Link className="font-mono text-ergo-600 hover:underline dark:text-ergo-400" to={`/block/${tx.height}`}>{num(tx.height)}</Link> : t('txPage.notYet')}>
            {tx.index != null && t('txPage.positionInTheBlock', { index: tx.index })}
          </Field>
          <Field name={t('common.time')} value={utc(tx.timestamp)} />
          <Field name={t('common.size')} value={bytes(tx.size)} />
          <Field name={t('txPage.fee')} value={<Erg nano={tx.fee} />}>
            {t('txPage.n0001ErgIsTypicalThe')}
          </Field>
          <Field name="Inputs / Outputs" value={`${tx.inputs.length} / ${tx.outputs.length}${tx.dataInputs?.length ? ` (+${tx.dataInputs.length} data input)` : ''}`}>
            {t('txPage.inputsAreBoxesBeingDestroyedOutputs')}
          </Field>
        </Card>
        <Balance tx={tx} />
      </div>

      <Section
        title={t('txPage.boxesInBoxesOut')}
        right={
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
              <input type="checkbox" checked={regs} onChange={(e) => setRegs(e.target.checked)} className="accent-ergo-500" /> {t('txPage.showRegisters')}
            </label>
            <Learn to="/learn/box">{t('txPage.whatIsABox')}</Learn>
          </div>
        }
      >
        <TxFlow tx={tx} showRegisters={regs} limit={50} />
      </Section>
    </>
  )
}

export default function TxPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const s = useApi(() => api.transaction(id), [id])
  useSeo({ path: `/tx/${id}`, title: { vi: `Giao dịch ${id.slice(0, 12)}…`, en: `Transaction ${id.slice(0, 12)}…` }, noindex: true })
  return <Async state={s} notFound={t('txPage.transactionNotFound')}>{(tx) => <Tx tx={tx} />}</Async>
}
