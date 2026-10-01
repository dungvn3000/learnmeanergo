import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { CheckCircle2, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { decodeAddress, P2PK_TREE_PREFIX } from '../lib/ergo'
import { short } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Badge, Callout, Card, Field, Hash } from '../components/ui'
import { isFeeBox } from '../components/TxFlow'
import en from './locales/en/ErgoTree.json'
import vi from './locales/vi/ErgoTree.json'

const useT = articleNs('ErgoTree', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const FEE_TREE =
  '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304'

const TONES = {
  header: 'bg-ergo-100 text-ergo-800 dark:bg-ergo-900/50 dark:text-ergo-200',
  type: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  op: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  data: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rest: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
}

/** Colored hex segments with a legend underneath. */
function Bytes({ parts }) {
  return (
    <div className="not-prose my-6">
      <div className="rounded-xl border border-stone-200 bg-surface p-4 font-mono text-sm leading-7 break-all dark:border-stone-800 dark:bg-stone-900">
        {parts.map((p, i) => (
          <span key={i} className={`mr-0.5 rounded px-1 py-0.5 ${TONES[p.tone]}`} title={p.label}>
            {p.hex}
          </span>
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {parts.map((p, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`shrink-0 rounded px-1.5 font-mono text-xs leading-6 ${TONES[p.tone]}`}>
              {p.hex.length > 10 ? p.hex.slice(0, 6) + '…' : p.hex}
            </span>
            <span className="text-stone-600 dark:text-stone-400">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveP2PK() {
  const { t } = useT()
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) => {
        const b = blocks?.[0]
        let tree = null
        try {
          tree = b?.minerAddress ? decodeAddress(b.minerAddress).ergoTree : null
        } catch {
          tree = null
        }
        if (!tree) return <p>{t('p2pk.error')}</p>
        return (
          <>
            <p>
              <Trans
                t={t}
                i18nKey="p2pk.live"
                values={{ height: b.height.toLocaleString('en-US'), miner: b.miner || t('p2pk.miner') }}
                components={{ block: <Link to={`/block/${b.height}`} /> }}
              />{' '}
              <Hash value={b.minerAddress} to={`/address/${b.minerAddress}`} />
            </p>
            <Bytes
              parts={[
                { hex: '00', tone: 'header', label: t('p2pk.bytes.header') },
                { hex: '08', tone: 'type', label: t('p2pk.bytes.type') },
                { hex: 'cd', tone: 'op', label: t('p2pk.bytes.op') },
                { hex: tree.slice(6), tone: 'data', label: t('p2pk.bytes.data') },
              ]}
            />
          </>
        )
      }}
    </Async>
  )
}

const DECO = 'https://deco-education.github.io/deco-docs/docs/into-the-woods/trail1-eutxo-n-nfts/registers-guardscripts-ergoscript'

/** Guard script “kind” of a box, judged from its address type and a few well-known trees. */
function kindOf(box) {
  if (isFeeBox(box)) return { key: 'fee', tone: 'ergo' }
  try {
    const d = decodeAddress(box.address)
    if (d.type === 1) return { key: 'p2pk', tone: 'green' }
    if (d.type === 2) return { key: 'p2sh', tone: 'violet' }
    return { key: 'p2s', tone: 'sky' }
  } catch {
    return { key: null, tone: 'stone' }
  }
}

/** Outputs of the newest transactions, labeled by the kind of guard script that locks them. */
function LiveGuards() {
  const { t } = useT()
  const state = useApi(() => api.latestTransactions(6), [])
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('guards.title')}</div>
      <Async state={state}>
        {(txs) => {
          const outs = txs.flatMap((tx) => tx.outputs.map((o) => ({ ...o, txId: tx.id }))).slice(0, 10)
          return (
            <div className="divide-y divide-stone-100 text-sm dark:divide-stone-800">
              {outs.map((o) => {
                const k = kindOf(o)
                return (
                  <div key={o.boxId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <Hash value={o.boxId} to={`/box/${o.boxId}`} head={6} tail={4} copy={false} className="w-28" />
                    <Badge tone={k.tone}>{k.key ? t(`kinds.${k.key}.label`) : '?'}</Badge>
                    <span className="min-w-0 flex-1 truncate text-stone-500">{k.key ? t(`kinds.${k.key}.note`) : ''}</span>
                    <span className="font-mono text-[11px] text-stone-400">R1 = {short(o.ergoTree, 10, 6)}</span>
                  </div>
                )
              })}
            </div>
          )
        }}
      </Async>
      <p className="mt-3 text-xs text-stone-500">{t('guards.caption')}</p>
    </Card>
  )
}

export default function ErgoTree() {
  const { t } = useT()
  const T = (k, extra, values) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const sigma = <Link to="/learn/sigma" />
  const address = <Link to="/learn/address" />
  const decoder = <Link to="/tools/address-decoder" />
  return (
    <>
      <p>{T('intro.p1', { box: <Link to="/learn/box" /> })}</p>
      <p>{t('intro.p2')}</p>

      <h2 id="ergoscript">{t('script.title')}</h2>
      <p>{T('script.p1')}</p>
      <pre>
        <code>{t('script.code')}</code>
      </pre>
      <p>{t('script.p2')}</p>
      <ul>
        <li>{T('script.cond')}</li>
        <li>{T('script.pk', { sigma })}</li>
      </ul>
      <p>{T('script.p3')}</p>
      <Callout type="tip" title={t('loops.title')}>
        {t('loops.text')}
      </Callout>

      <h2 id="guard-script">{t('guard.title')}</h2>
      <p>{T('guard.p1')}</p>
      <LiveGuards />

      <h2 id="guard-validator">{t('validator.title')}</h2>
      <p>{T('validator.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('validator.var')}</th>
            <th>{t('validator.meaning')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>SELF</code></td>
            <td>{t('validator.self')}</td>
          </tr>
          <tr>
            <td><code>INPUTS</code>, <code>OUTPUTS</code></td>
            <td>{t('validator.io')}</td>
          </tr>
          <tr>
            <td><code>CONTEXT.dataInputs</code></td>
            <td>{T('validator.data', { tx: <Link to="/learn/transaction" /> })}</td>
          </tr>
          <tr>
            <td><code>HEIGHT</code></td>
            <td>{t('validator.height')}</td>
          </tr>
          <tr>
            <td><code>CONTEXT.minerPubKey</code></td>
            <td>{t('validator.miner')}</td>
          </tr>
        </tbody>
      </table>
      <p>{T('validator.p2')}</p>

      <h2 id="guard-sigma">{t('sigma.title')}</h2>
      <p>{T('sigma.p1', { sigma })}</p>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" /> {t('sigma.ok.title')}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>{t('sigma.ok.c1')}</li>
            <li>{t('sigma.ok.c2')}</li>
            <li>{t('sigma.ok.c3')}</li>
          </ul>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
            <XCircle className="size-4" /> {t('sigma.bad.title')}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>{t('sigma.bad.c1')}</li>
            <li>{t('sigma.bad.c2')}</li>
            <li>{T('sigma.bad.c3')}</li>
          </ul>
        </Card>
      </div>

      <h2 id="guard-kinds">{t('kinds.title')}</h2>
      <p>{T('kinds.p1', { ergotree: <a href="#ergotree-layout" /> })}</p>
      <h3>{t('kinds.pk.title')}</h3>
      <pre>
        <code>{t('kinds.pk.code')}</code>
      </pre>
      <p>{T('kinds.pk.p', { address })}</p>
      <h3>{t('kinds.time.title')}</h3>
      <pre>
        <code>{`sigmaProp(HEIGHT > 1200000) && pk`}</code>
      </pre>
      <p>{t('kinds.time.p')}</p>
      <h3>{t('kinds.multi.title')}</h3>
      <pre>
        <code>{t('kinds.multi.code')}</code>
      </pre>
      <h3>{t('kinds.outputs.title')}</h3>
      <pre>
        <code>{`sigmaProp(
  OUTPUTS(0).value >= SELF.value &&
  OUTPUTS(0).propositionBytes == SELF.propositionBytes
)`}</code>
      </pre>
      <p>{T('kinds.outputs.p', { tx: <Link to="/learn/transaction#coinbase" /> })}</p>
      <h3>{t('kinds.hash.title')}</h3>
      <pre>
        <code>{`sigmaProp(blake2b256(getVar[Coll[Byte]](0).get) == expectedHash) && pk`}</code>
      </pre>
      <p>{T('kinds.hash.p')}</p>

      <h2 id="guard-address">{t('address.title')}</h2>
      <p>{T('address.p1', { decoder })}</p>

      <h2 id="ergotree-layout">{t('layout.title')}</h2>
      <p>{T('layout.p1')}</p>
      <ol>
        <li>{T('layout.header')}</li>
        <li>{T('layout.size')}</li>
        <li>{T('layout.consts')}</li>
        <li>{T('layout.body')}</li>
      </ol>
      <Card className="not-prose my-6 p-2 sm:p-4">
        <Field name="0x00" value={t('layout.h00.value')}>
          {t('layout.h00.text')}
        </Field>
        <Field name="0x10" value={t('layout.h10.value')}>
          {T('layout.h10.text')}
        </Field>
        <Field name="0x18 / 0x19…" value={t('layout.h18.value')}>
          {T('layout.h18.text')}
        </Field>
      </Card>

      <h2 id="p2pk">{t('p2pk.title')}</h2>
      <p>{T('p2pk.p1', null, { prefix: P2PK_TREE_PREFIX })}</p>
      <LiveP2PK />
      <p>{T('p2pk.p2', { address })}</p>

      <h2 id="constant-segregation">{t('seg.title')}</h2>
      <p>{T('seg.p1')}</p>
      <ul>
        <li>{T('seg.template')}</li>
        <li>{T('seg.cache')}</li>
        <li>{T('seg.subst')}</li>
      </ul>

      <h2 id="fee-contract">{t('fee.title')}</h2>
      <p>{T('fee.p1')}</p>
      <Bytes
        parts={[
          { hex: '10', tone: 'header', label: t('fee.bytes.header') },
          { hex: '05', tone: 'type', label: t('fee.bytes.count') },
          { hex: '0400', tone: 'data', label: t('fee.bytes.c0') },
          { hex: '0400', tone: 'data', label: t('fee.bytes.c1') },
          { hex: FEE_TREE.slice(12, 124), tone: 'data', label: t('fee.bytes.c2') },
          { hex: FEE_TREE.slice(124, 134), tone: 'data', label: t('fee.bytes.c3') },
          { hex: FEE_TREE.slice(134), tone: 'op', label: t('fee.bytes.body') },
        ]}
      />
      <p>{t('fee.p2')}</p>
      <pre>
        <code>{t('fee.code')}</code>
      </pre>
      <p>{T('fee.p3')}</p>
      <Callout type="note" title={t('fee.g.title')}>
        {T('fee.g.text', { autolykos: <Link to="/learn/autolykos" /> })}
      </Callout>

      <h2 id="costing">{t('cost.title')}</h2>
      <p>{t('cost.p1')}</p>

      <h2 id="xem-them">{t('seeAlso.title')}</h2>
      <ul>
        <li>{T('seeAlso.sigma', { sigma })}</li>
        <li>{T('seeAlso.address', { address })}</li>
        <li>{T('seeAlso.decoder', { decoder })}</li>
        <li>{T('seeAlso.deco', { deco: <a href={DECO} target="_blank" rel="noreferrer" /> })}</li>
      </ul>
    </>
  )
}
