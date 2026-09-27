import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, FileCode2, KeyRound } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { decodeAddress } from '../../lib/ergo'
import { ago, erg, num, short, utc } from '../../lib/format'
import { Async, Badge, Card, Erg, Field, Hash, Pager, TokenChip } from '../../components/ui'
import { BoxCard } from '../../components/TxFlow'
import { Learn, Section, Table, td } from './common'
import { Trans, useTranslation } from 'react-i18next'
import { useSeo } from '../../lib/seo'

const ROWS = 20

function useDecoded(addr) {
  return useMemo(() => {
    try {
      return decodeAddress(addr)
    } catch {
      return null
    }
  }, [addr])
}

function History({ addr }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const s = useApi(() => api.address(addr, page, ROWS), [addr, page])
  return (
    <Async state={s}>
      {(d) => (
        <>
          <Table head={[t('common.transaction'), t('common.height'), t('common.time'), { label: 'ERG', right: true }, 'Token']}>
            {d.txs.map((x) => (
              <tr key={x.id} className="hover:bg-stone-100 dark:hover:bg-stone-800/40">
                <td className={td}>
                  <div className="flex items-center gap-2">
                    {x.amount >= 0 ? <ArrowDownLeft className="size-4 text-emerald-500" /> : <ArrowUpRight className="size-4 text-stone-400" />}
                    <Hash value={x.id} to={`/tx/${x.id}`} copy={false} />
                  </div>
                </td>
                <td className={td}>
                  <Link to={`/block/${x.height}`} className="font-mono hover:text-ergo-600">
                    {num(x.height)}
                  </Link>
                </td>
                <td className={`${td} text-stone-500`} title={utc(x.timestamp)}>
                  {ago(x.timestamp)}
                </td>
                <td className={`${td} text-right font-medium tabular-nums ${x.amount >= 0 ? 'text-emerald-600' : ''}`}>
                  {x.amount >= 0 ? '+' : '−'}
                  {erg(Math.abs(x.amount))}
                </td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {x.tokens?.slice(0, 3).map((a) => (
                      <TokenChip key={a.tokenId} asset={a} signed />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} setPage={setPage} hasNext={page * ROWS < d.txCount} />
        </>
      )}
    </Async>
  )
}

function Unspent({ addr }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const s = useApi(() => api.addressBoxes(addr, page, 12), [addr, page])
  return (
    <Async state={s}>
      {(d) =>
        d.items.length === 0 ? (
          <p className="text-sm text-stone-500">{t('addressPage.thisAddressHasNoUnspentBoxes')}</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {d.items.map((b) => (
                <BoxCard key={b.boxId} box={b} />
              ))}
            </div>
            <Pager page={page} setPage={setPage} hasNext={page * 12 < d.total} />
          </>
        )
      }
    </Async>
  )
}

function Address({ a }) {
  const { t } = useTranslation()
  const dec = useDecoded(a.address)
  const [tab, setTab] = useState('txs')
  const Icon = a.contract ? FileCode2 : KeyRound
  const tabCls = (k) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? 'bg-ergo-600 text-white' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
          <Icon className="size-4" /> {a.contract ? t('addressPage.contractAddress') : t('common.address')}
          {a.label && <Badge tone="ergo">{a.label}</Badge>}
        </div>
        <h1 className="text-xl font-bold text-stone-900 sm:text-2xl dark:text-white">
          <Hash value={a.address} full />
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="p-6">
          <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('addressPage.balance')}</div>
          <div className="mt-1 text-3xl font-extrabold text-stone-900 dark:text-white">
            <Erg nano={a.balance} />
          </div>
          {a.unconfirmed !== 0 && <div className="mt-1 text-sm text-sky-600">{a.unconfirmed > 0 ? '+' : ''}{erg(a.unconfirmed)} ERG {t('addressPage.unconfirmed')}</div>}
          <p className="mt-3 text-sm text-stone-500">
            <Trans i18nKey="addressPage.balanceExplained" values={{ boxes: num(a.boxes) }} components={{ b: <strong /> }} />{' '}
            <Learn to="/learn/boxes">{t('common.why')}</Learn>
          </p>
          {a.tokens?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {a.tokens.slice(0, 30).map((x) => (
                <TokenChip key={x.tokenId} asset={x} />
              ))}
            </div>
          )}
        </Card>
        <Card className="px-5 py-2">
          {dec && (
            <Field name={t('addressPage.type')} value={`${dec.typeInfo?.code ?? '?'} · ${dec.networkName}`}>
              {dec.typeInfo?.desc} <Learn to={`/tools/address-decoder?a=${encodeURIComponent(a.address)}`}>{t('addressPage.decodeByteByByte')}</Learn>
            </Field>
          )}
          <Field name="ErgoTree" value={<span className="font-mono text-xs break-all">{short(a.ergoTree, 60, 20)}</span>}>
            {t('addressPage.theScriptThatActuallyLocksThe')} <Learn to="/learn/ergotree">ErgoTree</Learn>
          </Field>
          <Field name={t('addressPage.transactions')} value={num(a.txCount)} />
          {a.firstSeen && <Field name={t('addressPage.firstSeen')} value={utc(a.firstSeen)} />}
          {a.lastSeen && <Field name={t('addressPage.lastActive')} value={`${utc(a.lastSeen)} (${ago(a.lastSeen)})`} />}
        </Card>
      </div>

      <Section
        title={tab === 'txs' ? t('addressPage.transactionHistory') : t('addressPage.unspentBoxesUtxo')}
        right={
          <div className="flex gap-1">
            <button className={tabCls('txs')} onClick={() => setTab('txs')}>
              {t('common.transactions')}
            </button>
            <button className={tabCls('boxes')} onClick={() => setTab('boxes')}>
              {t('addressPage.unspentBoxes')}
            </button>
          </div>
        }
      >
        {tab === 'txs' ? <History addr={a.address} /> : <Unspent addr={a.address} />}
      </Section>
    </>
  )
}

export default function AddressPage() {
  const { t } = useTranslation()
  const { addr } = useParams()
  const s = useApi(() => api.address(addr, 1, 1), [addr])
  useSeo({ path: `/address/${addr}`, title: { vi: `Địa chỉ ${addr.slice(0, 12)}…`, en: `Address ${addr.slice(0, 12)}…` }, noindex: true })
  return <Async state={s} notFound={t('addressPage.thisAddressHasNeverAppearedOn')}>{(a) => <Address a={a} />}</Async>
}
