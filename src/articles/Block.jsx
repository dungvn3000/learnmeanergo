import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Blocks, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { ago, bytes, compact, erg, num, utc } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Badge, Callout, Card, Erg, Field, Hash } from '../components/ui'
import en from './locales/en/Block.json'
import vi from './locales/vi/Block.json'

const useT = articleNs('Block', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

/** Three chained headers: each one stores the id (hash) of the one before it. */
function ChainDiagram({ block }) {
  const { t } = useT()
  const cells = [
    { h: block.height - 1, id: block.parentId, parent: '…' },
    { h: block.height, id: block.id, parent: block.parentId, current: true },
    { h: block.height + 1, id: '?', parent: block.id, future: true },
  ]
  return (
    <div className="not-prose my-6 grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
      {cells.map((c, i) => (
        <div key={c.h} className="contents">
          {i > 0 && <div className="hidden items-center justify-center text-2xl text-ergo-500 sm:flex">←</div>}
          <div
            className={`rounded-xl border p-3 text-xs ${
              c.current
                ? 'border-ergo-400 bg-ergo-50 dark:border-ergo-700 dark:bg-ergo-950/40'
                : c.future
                  ? 'border-dashed border-stone-300 text-stone-400 dark:border-stone-700'
                  : 'border-stone-200 bg-surface dark:border-stone-700 dark:bg-stone-900'
            }`}
          >
            <div className="font-semibold text-stone-900 dark:text-white">Block {num(c.h)}</div>
            <div className="mt-2 text-stone-500">parentId</div>
            <div className="truncate font-mono">{c.parent === '…' ? '…' : `${c.parent.slice(0, 12)}…`}</div>
            <div className="mt-2 text-stone-500">id</div>
            <div className="truncate font-mono">{c.id === '?' ? t('chain.notMined') : `${c.id.slice(0, 12)}…`}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The four sections a full Ergo block is made of. */
const PARTS = [
  { key: 'header', name: 'Header', cls: 'border-ergo-400 bg-ergo-50 dark:border-ergo-700 dark:bg-ergo-950/40' },
  { key: 'txs', name: 'Block transactions', cls: 'border-stone-200 bg-surface dark:border-stone-700 dark:bg-stone-900' },
  { key: 'adProofs', name: 'AD proofs', cls: 'border-stone-200 bg-surface dark:border-stone-700 dark:bg-stone-900' },
  { key: 'extension', name: 'Extension', cls: 'border-stone-200 bg-surface dark:border-stone-700 dark:bg-stone-900' },
]

function SectionsDiagram() {
  const { t } = useT()
  return (
    <div className="not-prose my-6 grid gap-2 sm:grid-cols-4">
      {PARTS.map((p) => (
        <div key={p.name} className={`rounded-xl border p-3 ${p.cls}`}>
          <div className="text-sm font-semibold text-stone-900 dark:text-white">{p.name}</div>
          <div className="mt-1 text-xs leading-5 text-stone-500">{t(`sections.${p.key}`)}</div>
        </div>
      ))}
    </div>
  )
}

function LiveHeader({ block }) {
  const { t } = useT()
  const T = (k, extra, values) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const votes = String(block.votes ?? '').split(',')
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Blocks className="size-5 text-ergo-500" />
          <Link to={`/block/${block.height}`} className="hover:text-ergo-600">
            Block {num(block.height)}
          </Link>
        </div>
        <Badge tone="green">
          <RefreshCw className="size-3" /> {t('live.badge')} · {ago(block.timestamp)}
        </Badge>
      </div>

      <Field name="version" value={block.version}>
        {t('field.version')}
      </Field>
      <Field name="parentId" value={<Hash value={block.parentId} to={`/block/${block.height - 1}`} full />}>
        {T('field.parentId')}
      </Field>
      <Field name="height" value={num(block.height)}>
        {t('field.height')}
      </Field>
      <Field name="timestamp" value={`${block.timestamp} (${utc(block.timestamp)})`} mono>
        {T('field.timestamp')}
      </Field>
      <Field name="nBits" value={<code className="font-mono">{block.nBits}</code>}>
        {T('field.nBits', { difficulty: <Link to="/learn/difficulty" /> })}
      </Field>
      <Field name="difficulty" value={`${num(block.difficulty)} (≈ ${compact(block.difficulty)})`}>
        {t('field.difficulty', { hashrate: (block.difficulty / 120 / 1e12).toFixed(2) })}
      </Field>
      <Field name="stateRoot" value={<Hash value={block.stateRoot} full copy={false} />}>
        {T('field.stateRoot')}
      </Field>
      <Field name="transactionsRoot" value={<Hash value={block.txRoot} full copy={false} />}>
        {t('field.transactionsRoot')}
      </Field>
      <Field name="adProofsRoot" value={<Hash value={block.adRoot} full copy={false} />}>
        {T('field.adProofsRoot')}
      </Field>
      <Field name="extensionHash" value={<Hash value={block.extHash} full copy={false} />}>
        {T('field.extensionHash')}
      </Field>
      <Field name="votes" value={<code className="font-mono">{block.votes}</code>}>
        {t('field.votes')} {votes.every((v) => v.trim() === '0') ? t('field.votesNone') : t('field.votesSome')}
      </Field>
      <Field name="pow.pk" value={<Hash value={block.pow?.pk} full />}>
        {t('field.powPk')}
      </Field>
      <Field name="pow.w" value={<Hash value={block.pow?.w} full copy={false} />}>
        {T('field.powW')}
      </Field>
      <Field name="pow.n" value={<code className="font-mono">{block.pow?.n}</code>}>
        {T('field.powN', { autolykos: <Link to="/learn/autolykos" /> })}
      </Field>
      <Field name="pow.d" value={<code className="font-mono">{block.pow?.d}</code>}>
        {t('field.powD')}
      </Field>
      <Field name="id" value={<Hash value={block.id} full />}>
        {T('field.id')}
      </Field>

      <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-4 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500">{t('live.txCount')}</div>
          <div className="font-semibold">{num(block.txCount)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500">{t('live.size')}</div>
          <div className="font-semibold">{bytes(block.size)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500">{t('live.minerGets')}</div>
          <div className="font-semibold">
            <Erg nano={block.reward} />
          </div>
        </div>
        <div>
          <div className="text-xs text-stone-500">{t('live.fees')}</div>
          <div className="font-semibold">
            <Erg nano={block.fees} />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Block() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  const state = useApi(() => api.latestBlocks(1).then((b) => b?.[0] ?? null), [], 30000)
  return (
    <>
      <p>{T('intro.p1')}</p>
      <p>{T('intro.p2')}</p>

      <h2 id="cau-truc">{t('structure.title')}</h2>
      <p>{T('structure.p1')}</p>
      <SectionsDiagram />
      <Callout type="tip" title={t('structure.whyTitle')}>
        {t('structure.whyText')}
      </Callout>

      <h2 id="chuoi-block">{t('chainSec.title')}</h2>
      <p>{T('chainSec.p1')}</p>
      <Async state={state}>{(b) => <ChainDiagram block={b} />}</Async>

      <h2 id="header">{t('header.title')}</h2>
      <p>{t('header.p1')}</p>
      <Async state={state}>{(b) => <LiveHeader block={b} />}</Async>

      <h2 id="block-id">{t('blockId.title')}</h2>
      <p>{T('blockId.p1', { blake: <Link to="/tools/blake2b" /> })}</p>
      <pre>
        <code>{`block id = blake2b256( serialize(header) )`}</code>
      </pre>
      <p>{T('blockId.p2', { autolykos: <Link to="/learn/autolykos" /> })}</p>

      <h2 id="phan-thuong">{t('reward.title')}</h2>
      <p>{T('reward.p1', { coinbase: <Link to="/learn/transaction#coinbase" /> })}</p>
      <Async state={state}>
        {(b) => (
          <table>
            <tbody>
              <tr>
                <td>{t('reward.emission')}</td>
                <td className="tabular-nums">{erg(b.emission)} ERG</td>
              </tr>
              <tr>
                <td>{t('reward.reemitted')}</td>
                <td className="tabular-nums">{erg(b.reemitted)} ERG</td>
              </tr>
              <tr>
                <td>{t('reward.reward')}</td>
                <td className="tabular-nums">{erg(b.reward)} ERG</td>
              </tr>
              <tr>
                <td>{t('reward.fees')}</td>
                <td className="tabular-nums">{erg(b.fees)} ERG</td>
              </tr>
            </tbody>
          </table>
        )}
      </Async>
      <p>{T('reward.p2', { emission: <Link to="/learn/emission" />, explorer: <Link to="/explorer" /> })}</p>

      <Callout type="note" title={t('confirm.title')}>
        {T('confirm.text')}
      </Callout>
    </>
  )
}
