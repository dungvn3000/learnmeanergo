import { Link, useParams } from 'react-router-dom'
import { Lock, LockOpen, Package } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { num } from '../../lib/format'
import { Async, Badge, Card, CopyButton, Erg, Field, Hash, TokenChip } from '../../components/ui'
import { isFeeBox } from '../../components/TxFlow'
import { Learn, Section } from './common'
import { Trans, useTranslation } from 'react-i18next'
import { useSeo } from '../../lib/seo'

const regHelp = () => ({
  R4: t('boxPage.theFirstFreeRegisterForEip'),
  R5: t('boxPage.aFreeRegisterForEip4'),
  R6: t('boxPage.aFreeRegisterForEip42'),
  R7: t('boxPage.aFreeRegisterR4R9Contracts'),
  R8: t('boxPage.aFreeRegisterR4R9Contracts'),
  R9: t('boxPage.theLastFreeRegister'),
})

function Box({ b }) {
  const { t } = useTranslation()
  const spent = !!b.spentBy
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
          <Package className="size-4" /> Box
          {spent ? (
            <Badge>
              <LockOpen className="size-3" /> {t('common.spent')}
            </Badge>
          ) : (
            <Badge tone="green">
              <Lock className="size-3" /> {t('common.unspent')}
            </Badge>
          )}
          {isFeeBox(b) && <Badge tone="ergo">{t('boxPage.feeBox')}</Badge>}
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          <Hash value={b.boxId} full />
        </h1>
        <p className="mt-3 max-w-3xl text-stone-600 dark:text-stone-400">
          <Trans i18nKey="boxPage.boxExplained" components={{ em: <em /> }} /> <Learn to="/learn/box">{t('boxPage.readAboutBoxes')}</Learn>
        </p>
      </div>

      <Card className="px-5 py-2">
        <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">{t('boxPage.mandatoryRegistersR0R3')}</div>
        <Field name={t('boxPage.r0Value')} value={<Erg nano={b.value} />}>
          {t('boxPage.theAmountOfErgInThe', { v0: num(b.value) })}
        </Field>
        <Field
          name="R1 · Script"
          value={
            <span className="flex items-start gap-1">
              <span className="font-mono text-xs break-all">{b.ergoTree}</span>
              <CopyButton text={b.ergoTree} />
            </span>
          }
        >
          {t('boxPage.theErgotreeLockingTheBoxIt')}{' '}
          {b.address ? (
            <Link to={`/address/${b.address}`} className="text-ergo-600 hover:underline dark:text-ergo-400">
              {b.address.slice(0, 16)}…
            </Link>
          ) : (
            '—'
          )}
          . <Learn to="/learn/ergotree">ErgoTree</Learn>
        </Field>
        <Field
          name="R2 · Token"
          value={
            b.assets?.length ? (
              <div className="flex flex-wrap gap-1">
                {b.assets.map((a) => (
                  <TokenChip key={a.tokenId} asset={a} />
                ))}
              </div>
            ) : (
              <span className="text-stone-400">{t('boxPage.none')}</span>
            )
          }
        >
          {t('boxPage.aListOfTokenidAmount')} <Learn to="/learn/tokens">Token</Learn>
        </Field>
        <Field
          name={t('boxPage.r3Origin')}
          value={
            <span>
              {t('boxPage.creationHeight')} {num(b.creationHeight)}, tx <Hash value={b.transactionId} to={`/tx/${b.transactionId}`} />, output #{b.index}
            </span>
          }
        >
          {t('boxPage.boxIdBlake2b256OfTheBox')}
        </Field>
      </Card>

      <Section title={t('boxPage.customRegistersR4R9')} right={<Learn to="/learn/box">Registers</Learn>}>
        {b.registers?.length ? (
          <Card className="px-5 py-2">
            {b.registers.map((r) => (
              <Field
                key={r.key}
                name={
                  <span>
                    {r.key} <span className="font-mono text-xs font-normal text-violet-600 dark:text-violet-400">{r.type}</span>
                  </span>
                }
                value={<span className="font-mono text-xs break-all">{r.value}</span>}
              >
                <span className="font-mono break-all">raw: {r.raw}</span>
                <br />
                {regHelp()[r.key]}
              </Field>
            ))}
          </Card>
        ) : (
          <p className="text-sm text-stone-500">{t('boxPage.thisBoxUsesNoCustomRegisters')}</p>
        )}
      </Section>

      <Section title={t('boxPage.lifecycle')}>
        <Card className="px-5 py-2">
          <Field name={t('boxPage.createdBy')} value={<Hash value={b.transactionId} to={`/tx/${b.transactionId}`} full />} />
          <Field name={t('boxPage.spentBy')} value={spent ? <Hash value={b.spentBy} to={`/tx/${b.spentBy}`} full /> : <span className="text-emerald-600">{t('boxPage.notYetTheBoxIsStill')}</span>} />
        </Card>
      </Section>
    </>
  )
}

export default function BoxPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const s = useApi(() => api.box(id), [id])
  useSeo({ path: `/box/${id}`, title: { vi: `Box ${id.slice(0, 12)}…`, en: `Box ${id.slice(0, 12)}…` }, noindex: true })
  return <Async state={s} notFound={t('boxPage.boxNotFound')}>{(b) => <Box b={b} />}</Async>
}
