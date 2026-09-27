import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { ArrowLeft, Inbox, Pickaxe, Server, Send } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { ago, num, short } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Card } from '../components/ui'
import en from './locales/en/HowItWorks.json'
import vi from './locales/vi/HowItWorks.json'

const useT = articleNs('HowItWorks', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

/** The last few blocks drawn as a chain, each pointing back to its parent. */
function LiveChain() {
  const { t } = useT()
  const state = useApi(() => api.latestBlocks(5), [], 30000)
  return (
    <div className="not-prose my-6">
      <Async state={state}>
        {(blocks) => {
          const list = [...blocks].reverse()
          return (
            <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
              {list.map((b, i) => (
                <div key={b.id} className="flex items-center gap-1">
                  {i > 0 && <ArrowLeft className="size-4 shrink-0 text-stone-400" />}
                  <Link
                    to={`/block/${b.height}`}
                    className="block w-40 shrink-0 rounded-xl border border-stone-200 bg-white p-3 text-xs transition hover:border-ergo-400 dark:border-stone-700 dark:bg-stone-900"
                  >
                    <div className="text-base font-bold tabular-nums text-stone-900 dark:text-white">#{num(b.height)}</div>
                    <div className="mt-1 font-mono text-stone-500" title={b.id}>id {short(b.id, 5, 4)}</div>
                    <div className="font-mono text-stone-400" title={b.parentId}>{t('chain.parent')} {short(b.parentId, 5, 4)}</div>
                    <div className="mt-2 text-stone-600 dark:text-stone-300">{b.txCount === 1 ? t('chain.txOne', { n: b.txCount }) : t('chain.txMany', { n: b.txCount })}</div>
                    <div className="text-stone-400">{ago(b.timestamp)}</div>
                  </Link>
                </div>
              ))}
            </div>
          )
        }}
      </Async>
      <p className="mt-1 text-xs text-stone-500">
        <Trans t={t} i18nKey="chain.caption" components={{ mono: <span className="font-mono" /> }} />
      </p>
    </div>
  )
}

const STEPS = [
  { key: 'create', icon: Send },
  { key: 'mempool', icon: Inbox },
  { key: 'mine', icon: Pickaxe },
  { key: 'update', icon: Server },
]

export default function HowItWorks() {
  const { t } = useT()
  const T = (k, extra, values) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const ns = useApi(() => api.networkState(), [], 30000)
  return (
    <>
      <p>{t('intro')}</p>

      <h2 id="node">{t('node.title')}</h2>
      <p>{T('node.p1')}</p>
      <p>{T('node.p2')}</p>
      {ns.data && (
        <Callout type="note">
          {T('node.live', null, { name: ns.data.nodeName, peers: ns.data.peers })}
        </Callout>
      )}

      <h2 id="hanh-trinh-giao-dich">{t('journey.title')}</h2>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s) => (
          <Card key={s.key} className="p-4">
            <s.icon className="size-5 text-ergo-500" />
            <div className="mt-2 font-semibold text-stone-900 dark:text-white">{t(`steps.${s.key}.title`)}</div>
            <div className="mt-1 text-sm text-stone-500">{t(`steps.${s.key}.text`)}</div>
          </Card>
        ))}
      </div>
      {ns.data && <p>{T('journey.mempool', null, { n: ns.data.mempoolCount })}</p>}

      <h2 id="block-va-chuoi">{t('blocks.title')}</h2>
      <p>{T('blocks.p1')}</p>
      <LiveChain />
      <p>{t('blocks.p2')}</p>

      <h2 id="tho-dao">{t('miners.title')}</h2>
      <p>{T('miners.p1')}</p>
      <p>{T('miners.p2', { mining: <Link to="/learn/mining-basics" /> })}</p>

      <h2 id="xac-nhan">{t('confirm.title')}</h2>
      <p>{T('confirm.p1')}</p>

      <Callout type="tip" title={t('try.title')}>
        {T('try.text', { explorer: <Link to="/explorer" /> })}
      </Callout>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>{T('next.p1', { boxes: <Link to="/learn/boxes" /> })}</p>
    </>
  )
}
