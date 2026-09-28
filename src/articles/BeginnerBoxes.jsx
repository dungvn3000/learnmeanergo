import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Erg, Figure } from '../components/ui'
import { TxFlow, isFeeBox } from '../components/TxFlow'
import en from './locales/en/BeginnerBoxes.json'
import vi from './locales/vi/BeginnerBoxes.json'

const useT = articleNs('BeginnerBoxes', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const EUTXO_ARTICLE = 'https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e'

/** A single illustrated box. */
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
      <Figure src="/img/boxes.webp" alt={t('what.figAlt')} width={1360} height={580} caption={t('what.figCaption')} />

      <h2 id="tieu-tien">{t('spend.title')}</h2>
      <p>{T('spend.p1')}</p>
      <ol>
        <li>{T('spend.inputs')}</li>
        <li>{T('spend.outputs')}</li>
      </ol>
      <p>{T('spend.p2')}</p>
      <Figure src="/img/spend.webp" alt={t('diagram.alt')} width={1360} height={590} caption={t('diagram.caption')} />
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
