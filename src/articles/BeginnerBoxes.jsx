import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { ArrowRight, Flame, Lock, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Erg } from '../components/ui'
import { TxFlow, isFeeBox } from '../components/TxFlow'
import en from './locales/en/BeginnerBoxes.json'
import vi from './locales/vi/BeginnerBoxes.json'

const useT = articleNs('BeginnerBoxes', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const EUTXO_ARTICLE = 'https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e'

/** A single illustrated box. */
function Box({ amount, owner, tone = 'stone', faded = false }) {
  const tones = {
    stone: 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900',
    ergo: 'border-ergo-300 bg-ergo-50 dark:border-ergo-800 dark:bg-ergo-950/40',
    amber: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  }
  return (
    <div className={`relative w-32 rounded-xl border-2 p-3 text-center ${tones[tone]} ${faded ? 'opacity-50 line-through' : ''}`}>
      <Lock className="absolute -top-3 left-1/2 size-6 -translate-x-1/2 rounded-full bg-white p-1 text-stone-600 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700" />
      <div className="mt-1 text-lg font-bold text-stone-900 dark:text-white">{amount}</div>
      <div className="text-xs text-stone-500">{owner}</div>
    </div>
  )
}

function SpendDiagram() {
  const { t } = useT()
  return (
    <div className="not-prose my-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900/50">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">
            <Flame className="size-3.5" /> {t('diagram.spent')}
          </div>
          <div className="flex gap-3">
            <Box amount="7 ERG" owner={t('diagram.aliceKey')} />
            <Box amount="5 ERG" owner={t('diagram.aliceKey')} />
          </div>
        </div>
        <ArrowRight className="size-8 text-ergo-500" />
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">
            <Sparkles className="size-3.5" /> {t('diagram.created')}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Box amount="10 ERG" owner={t('diagram.bobKey')} tone="ergo" />
            <Box amount="1.999 ERG" owner={t('diagram.change')} />
            <Box amount="0.001 ERG" owner={t('diagram.fee')} tone="amber" />
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-stone-500">{t('diagram.caption')}</p>
    </div>
  )
}

/** Pick a small, readable recent transaction to show as a real example. */
function RealTx() {
  const { t } = useT()
  const state = useApi(() => api.latestTransactions(30), [])
  return (
    <Async state={state}>
      {(txs) => {
        const simple = (t) => !t.coinbase && t.inputs.length <= 3 && t.outputs.length <= 4
        const tx = txs.find((t) => simple(t) && t.outputs.every((o) => !o.assets?.length)) ?? txs.find(simple) ?? txs[0]
        if (!tx) return null
        const fee = tx.outputs.find(isFeeBox)
        return (
          <div className="not-prose my-6">
            <TxFlow tx={tx} />
            <p className="mt-3 text-sm text-stone-500">
              <Trans
                t={t}
                i18nKey="realTx.summary"
                values={{
                  id: tx.id.slice(0, 12),
                  height: tx.height,
                  spent: tx.inputs.length === 1 ? t('realTx.spentOne', { n: 1 }) : t('realTx.spentMany', { n: tx.inputs.length }),
                  created: tx.outputs.length === 1 ? t('realTx.createdOne', { n: 1 }) : t('realTx.createdMany', { n: tx.outputs.length }),
                }}
                components={{ tx: <Link to={`/tx/${tx.id}`} className="font-mono text-ergo-600 hover:underline dark:text-ergo-400" /> }}
              />
              {fee && <Trans t={t} i18nKey="realTx.fee" components={{ fee: <Erg nano={fee.value} /> }} />}
              .
            </p>
          </div>
        )
      }}
    </Async>
  )
}

export default function BeginnerBoxes() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro.p1')}</p>
      <p>{T('intro.p2')}</p>

      <h2 id="box-la-gi">{t('what.title')}</h2>
      <p>{t('what.p1')}</p>
      <ul>
        <li>{T('what.inside', { tokens: <Link to="/learn/tokens" /> })}</li>
        <li>{T('what.lock')}</li>
        <li>{t('what.visible')}</li>
      </ul>
      <p>{T('what.p2')}</p>

      <h2 id="tieu-tien">{t('spend.title')}</h2>
      <p>{T('spend.p1')}</p>
      <ol>
        <li>{T('spend.inputs')}</li>
        <li>{T('spend.outputs')}</li>
      </ol>
      <p>{T('spend.p2')}</p>
      <SpendDiagram />
      <p>{t('spend.p3')}</p>

      <h2 id="vi-du-that">{t('real.title')}</h2>
      <p>{t('real.p1')}</p>
      <RealTx />
      <p>{T('real.p2')}</p>

      <h2 id="utxo">{t('utxo.title')}</h2>
      <p>{T('utxo.p1')}</p>
      <p>{T('utxo.p2')}</p>

      <h2 id="vi-sao-tot">{t('good.title')}</h2>
      <ul>
        <li>{T('good.predictable')}</li>
        <li>{T('good.parallel')}</li>
        <li>{T('good.safe')}</li>
      </ul>
      <p>{T('good.p1', { article: <a href={EUTXO_ARTICLE} target="_blank" rel="noreferrer" /> })}</p>

      <Callout type="note" title={t('deeper.title')}>
        {T('deeper.text', { box: <Link to="/learn/box" />, ergotree: <Link to="/learn/ergotree" /> })}
      </Callout>

      <h2 id="doc-them">{t('reading.title')}</h2>
      <ul>
        <li>
          <a href={EUTXO_ARTICLE} target="_blank" rel="noreferrer">
            Learning Ergo 101: eUTXO explained for human beings
          </a>{' '}
          {t('reading.meta')}
        </li>
      </ul>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>{T('next.p1', { erg: <Link to="/learn/erg" /> })}</p>
    </>
  )
}
