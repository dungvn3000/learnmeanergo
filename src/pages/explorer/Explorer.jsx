import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Clock, Cpu, Inbox, Layers, Search } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, bytes, num, shortDate } from '../../lib/format'
import { useTranslation } from 'react-i18next'
import { useSeo } from '../../lib/seo'
import { Async, Badge, Card, Erg, Hash, PageHeader, Pager, Stat } from '../../components/ui'
import LineChart from '../../components/LineChart'
import SearchBar from '../../components/SearchBar'
import { Learn, Section, Table, td } from './common'

const ROWS = 20

function HashrateChart() {
  const { t } = useTranslation()
  const s = useApi(() => api.chart('hashrate', 90), [])
  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-stone-900 dark:text-white">{t('explorer.networkHashrate90Days')}</div>
          <div className="text-xs text-stone-500">{t('explorer.estimatedFromDifficultyHashrateDifficulty120')}</div>
        </div>
        <Learn to="/learn/difficulty">{t('explorer.difficultyHashrate')}</Learn>
      </div>
      <Async state={s}>
        {(d) =>
          d?.points?.length ? (
            <LineChart
              label={t('explorer.ergoNetworkHashrate90Days')}
              points={d.points.map((p) => ({ x: p.t, y: p.v }))}
              height={220}
              xFormat={shortDate}
              yFormat={(v) => `${+v.toFixed(2)} ${d.unit}`}
            />
          ) : (
            <div className="py-8 text-center text-sm text-stone-500">{t('explorer.noDataYet')}</div>
          )
        }
      </Async>
    </Card>
  )
}

function LatestTxs() {
  const { t } = useTranslation()
  const s = useApi(() => api.latestTransactions(8), [], 20_000)
  return (
    <Card className="divide-y divide-stone-100 dark:divide-stone-800">
      <Async state={s}>
        {(txs) =>
          txs.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <Hash value={x.id} to={`/tx/${x.id}`} head={10} tail={6} copy={false} />
                <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                  <Badge tone={x.coinbase ? 'ergo' : 'stone'}>{x.kind}</Badge>
                  {x.inputs.length} → {x.outputs.length} box
                </div>
              </div>
              <div className="text-right text-xs text-stone-500">
                <div>{ago(x.timestamp)}</div>
                <div>{t('common.fee')} {x.fee / 1e9} ERG</div>
              </div>
            </div>
          ))
        }
      </Async>
    </Card>
  )
}

export default function Explorer() {
  const { t } = useTranslation()
  useSeo({
    path: '/explorer',
    image: '/og/explorer.png',
    title: { vi: 'Khám phá blockchain Ergo', en: 'Ergo blockchain explorer' },
    description: { vi: 'Block, giao dịch, địa chỉ, box và token trên Ergo mainnet — mỗi trường đều có giải thích.', en: 'Blocks, transactions, addresses, boxes and tokens on Ergo mainnet — every field explained.' },
  })
  const [page, setPage] = useState(1)
  const net = useApi(() => api.networkState(), [], 30_000)
  const blocks = useApi(() => api.blocks(page, ROWS), [page], page === 1 ? 20_000 : 0)
  const n = net.data

  return (
    <>
      <PageHeader icon={Search} kicker="Explorer" title={t('explorer.exploreTheErgoBlockchain')}>
        {t('explorer.everyBlockTransactionBoxAndAddress')}
      </PageHeader>
      <div className="max-w-2xl">
        <SearchBar big />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Layers} label={t('common.height')} value={n ? num(n.height) : '—'} sub={n ? `epoch ${n.epoch}` : ' '} />
        <Stat icon={Cpu} label="Hashrate" value={n ? `${n.hashrate} TH/s` : '—'} sub={n ? `${t('explorer.difficulty')} ${(n.difficulty / 1e12).toFixed(2)} T` : ' '} />
        <Stat icon={Inbox} label="Mempool" value={n ? `${n.mempoolCount} tx` : '—'} sub={n ? bytes(n.mempoolBytes) + t('explorer.pending') : ' '} />
        <Stat icon={Clock} label={t('explorer.avgBlockTime')} value={n ? `${Math.round(n.avgBlockTimeSec)} s` : '—'} sub={t('explorer.target120S')} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <HashrateChart />
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-white">
            <Activity className="size-4 text-ergo-500" /> {t('explorer.latestTransactions')}
          </div>
          <LatestTxs />
        </div>
      </div>

      <Section title={t('explorer.recentBlocks')} right={<Learn to="/learn/block">{t('explorer.whatIsABlock')}</Learn>}>
        <Async state={blocks}>
          {(d) => (
            <>
              <Table head={[t('common.height'), t('common.time'), t('common.miner'), { label: t('explorer.txs'), right: true }, { label: t('common.size'), right: true }, { label: t('explorer.reward'), right: true }]}>
                {d.items.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-100 dark:hover:bg-stone-800/40">
                    <td className={td}>
                      <Link to={`/block/${b.height}`} className="font-mono font-semibold text-ergo-600 hover:underline dark:text-ergo-400">
                        {num(b.height)}
                      </Link>
                    </td>
                    <td className={`${td} text-stone-500`}>{ago(b.timestamp)}</td>
                    <td className={td}>
                      <Link to={`/address/${b.minerAddress}`} className="hover:text-ergo-600">
                        {b.miner}
                      </Link>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{b.txCount}</td>
                    <td className={`${td} text-right tabular-nums text-stone-500`}>{bytes(b.size)}</td>
                    <td className={`${td} text-right`}>
                      <Erg nano={b.reward + b.fees} digits={3} />
                    </td>
                  </tr>
                ))}
              </Table>
              <Pager page={page} setPage={setPage} hasNext={page * ROWS < d.total} />
            </>
          )}
        </Async>
      </Section>
    </>
  )
}
