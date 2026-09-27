import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, bytes, erg, num, short, utc } from '../../lib/format'
import { Async, Badge, Card, Erg, Field, Hash } from '../../components/ui'
import { TxFlow } from '../../components/TxFlow'
import { Learn, Section } from './common'
import { useTranslation } from 'react-i18next'
import { useSeo } from '../../lib/seo'

function TxRow({ tx, open: initial }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(initial)
  const total = tx.outputs.reduce((s, o) => s + o.value, 0)
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-100 dark:hover:bg-stone-800/40">
        <span className="w-6 text-xs font-bold text-stone-400 tabular-nums">#{tx.index}</span>
        <div className="min-w-0 flex-1">
          <Hash value={tx.id} to={`/tx/${tx.id}`} head={12} tail={8} copy={false} />
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <Badge tone={tx.coinbase ? 'ergo' : 'stone'}>{tx.kind}</Badge>
            {tx.inputs.length} input → {tx.outputs.length} output · {bytes(tx.size)}
          </div>
        </div>
        <div className="hidden text-right text-sm sm:block">
          <Erg nano={total} digits={4} />
          <div className="text-xs text-stone-500">{t('common.fee')} {erg(tx.fee)} ERG</div>
        </div>
        <ChevronDown className={`size-4 shrink-0 text-stone-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-stone-100 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
          <TxFlow tx={tx} limit={8} />
        </div>
      )}
    </Card>
  )
}

function Block({ b }) {
  const { t } = useTranslation()
  const hashrate = b.difficulty / 120 / 1e12
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
            <Layers className="size-4" /> Block
          </div>
          <h1 className="font-mono text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">{num(b.height)}</h1>
          <div className="mt-2 text-sm text-stone-500">
            {utc(b.timestamp)} · {ago(b.timestamp)} · {num(b.confirmations)} {t('common.confirmations')}
          </div>
        </div>
        <div className="flex gap-2">
          {b.height > 1 && (
            <Link to={`/block/${b.height - 1}`} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">
              <ChevronLeft className="size-4" /> {num(b.height - 1)}
            </Link>
          )}
          {b.confirmations > 1 && (
            <Link to={`/block/${b.height + 1}`} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">
              {num(b.height + 1)} <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="px-5 py-2">
          <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">
            Header <span className="font-normal normal-case">— <Learn to="/learn/block">{t('blockPage.everyFieldExplained')}</Learn></span>
          </div>
          <Field name="Block id" value={<Hash value={b.id} full />}>
            {t('blockPage.blake2b256OfTheSerializedHeaderChange')}
          </Field>
          <Field name="Parent id" value={<Hash value={b.parentId} to={b.height > 1 ? `/block/${b.height - 1}` : undefined} full />}>
            {t('blockPage.theIdOfThePreviousBlock')}
          </Field>
          <Field name="Version" value={b.version}>
            {t('blockPage.theHeaderSProtocolVersionIt')}
          </Field>
          <Field name="Timestamp" value={`${b.timestamp} (${utc(b.timestamp)})`}>
            {t('blockPage.whenTheMinerCreatedTheBlock')}
          </Field>
          <Field name="nBits" value={<span className="font-mono">{b.nBits}</span>}>
            {t('blockPage.theTargetDifficultyInCompactForm')} <Learn to="/learn/difficulty">{t('blockPage.decodingNbits')}</Learn>
          </Field>
          <Field name="Difficulty" value={num(b.difficulty)}>
            {t('blockPage.equivalentToThSOfNetwork', { v0: hashrate.toFixed(2) })}
          </Field>
          <Field name="State root" value={<Hash value={b.stateRoot} full />} mono>
            {t('blockPage.the33ByteDigestOfThe')}
          </Field>
          <Field name="Transactions root" value={<Hash value={b.txRoot} full />}>
            {t('blockPage.merkleRootOfTheBlockS')}
          </Field>
          <Field name="AD proofs root" value={<Hash value={b.adRoot} full />}>
            {t('blockPage.rootOfTheStateChangeProofs')}
          </Field>
          <Field name="Extension hash" value={<Hash value={b.extHash} full />}>
            {t('blockPage.merkleRootOfTheExtensionSection')}
          </Field>
          <Field name="Votes" value={<span className="font-mono">{b.votes}</span>}>
            {t('blockPage.n3BytesMinersUseToVote')}
          </Field>
        </Card>

        <div className="space-y-6">
          <Card className="px-5 py-2">
            <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">
              Proof of Work <span className="font-normal normal-case">— <Learn to="/learn/autolykos">Autolykos v2</Learn></span>
            </div>
            <Field name="Nonce (n)" value={<span className="font-mono">{b.pow.n}</span>}>
              {t('blockPage.the8BytesAMinerKeeps')}
            </Field>
            <Field name="Miner pk" value={<Hash value={b.pow.pk} full />}>
              {t('blockPage.theMinerSPublicKeyThe')}
            </Field>
            <Field name="w" value={<Hash value={b.pow.w} full />}>
              {b.version >= 2
                ? t('blockPage.unusedInAutolykosV2ItHolds')
                : t('blockPage.autolykosV1AOneTimePublic')}
            </Field>
            <Field name="d" value={<span className="font-mono break-all">{String(b.pow.d)}</span>}>
              {b.version >= 2
                ? t('blockPage.unusedInV2Always0')
                : t('blockPage.autolykosV1TheKSumSolution')}
            </Field>
          </Card>

          <Card className="px-5 py-2">
            <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">
              {t('blockPage.rewardContents')} <span className="font-normal normal-case">— <Learn to="/learn/emission">{t('blockPage.emissionSchedule')}</Learn></span>
            </div>
            <Field name={t('common.miner')} value={<Link className="text-ergo-600 hover:underline dark:text-ergo-400" to={`/address/${b.minerAddress}`}>{b.miner || short(b.minerAddress, 10, 6)}</Link>} />
            <Field name={t('blockPage.newlyEmitted')} value={<Erg nano={b.emission} />}>
              {t('blockPage.newErgCreatedAtThisHeight')}
            </Field>
            {b.reemitted > 0 && (
              <Field name={t('blockPage.reEmissionLock')} value={<Erg nano={b.reemitted} />}>
                {t('blockPage.eip27ThisPartIsLocked')}
              </Field>
            )}
            <Field name={t('common.minerReceives')} value={<Erg nano={b.reward} />} />
            <Field name={t('blockPage.transactionFees')} value={<Erg nano={b.fees} />} />
            <Field name={t('common.transactions')} value={b.txCount} />
            <Field name={t('common.size')} value={`${num(b.size)} byte`} />
          </Card>
        </div>
      </div>

      <Section title={`${t('common.transactions')} (${b.txCount})`} right={<Learn to="/learn/transaction">{t('blockPage.howDoTransactionsWork')}</Learn>}>
        <div className="grid gap-3">
          {(b.transactions ?? []).map((t, i) => (
            <TxRow key={t.id} tx={t} open={i === 0 && b.txCount <= 3} />
          ))}
        </div>
      </Section>
    </>
  )
}

export default function BlockPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const s = useApi(() => api.block(id), [id])
  useSeo({ path: `/block/${id}`, title: { vi: `Block ${id}`, en: `Block ${id}` }, noindex: true })
  return <Async state={s} notFound={t('blockPage.blockNotFound')}>{(b) => <Block b={b} />}</Async>
}
