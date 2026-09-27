import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { ScrollText } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { ago, erg, num, short, tokenAmount } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Badge, Callout, Card, Hash } from '../components/ui'
import { TxFlow, isFeeBox } from '../components/TxFlow'
import en from './locales/en/Transaction.json'
import vi from './locales/vi/Transaction.json'

const useT = articleNs('Transaction', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

/** The first transaction of the latest block: the emission box being spent. */
function EmissionTx() {
  const { t } = useT()
  const state = useApi(async () => {
    const [latest] = await api.latestBlocks(1)
    return api.block(latest.height)
  }, [])
  return (
    <Async state={state}>
      {(b) => {
        const tx = b.transactions?.[0]
        if (!tx?.coinbase) return null
        return (
          <Card className="not-prose my-6 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="ergo">{tx.kind}</Badge>
              <span className="text-stone-500">
                <Trans t={t} i18nKey="emissionTx.label" values={{ height: num(b.height) }} components={{ block: <Link to={`/block/${b.height}`} className="font-mono text-ergo-600 hover:underline dark:text-ergo-400" /> }} />
              </span>
              <Hash value={tx.id} to={`/tx/${tx.id}`} head={8} tail={6} className="ml-auto text-xs" />
            </div>
            <TxFlow tx={tx} limit={4} />
            <p className="mt-3 text-sm text-stone-500">
              <Trans t={t} i18nKey="emissionTx.main" values={{ emission: erg(b.emission) }} components={TAGS} />
              {b.reemitted > 0 && <Trans t={t} i18nKey="emissionTx.reemitted" values={{ reemitted: erg(b.reemitted), reward: erg(b.reward) }} components={TAGS} />}
              {t('emissionTx.end')}
            </p>
          </Card>
        )
      }}
    </Async>
  )
}

/** Pick a recent, ordinary transaction: not coinbase, pays a fee, small enough to draw. */
async function pickExample() {
  const txs = (await api.latestTransactions(30)) ?? []
  const normal = txs.filter((t) => !t.coinbase && t.outputs?.some(isFeeBox) && t.inputs.length <= 6 && t.outputs.length <= 6)
  return normal.find((t) => t.outputs.some((o) => o.assets?.length)) ?? normal[0] ?? txs[0] ?? null
}

const sum = (boxes) => boxes.reduce((s, b) => s + Number(b.value), 0)

/** Per-token totals for inputs vs outputs. */
function tokenBalance(tx) {
  const map = new Map()
  const add = (boxes, key) =>
    boxes.forEach((b) =>
      (b.assets ?? []).forEach((a) => {
        const row = map.get(a.tokenId) ?? { tokenId: a.tokenId, name: a.name, decimals: a.decimals, in: 0, out: 0 }
        row[key] += Number(a.amount)
        map.set(a.tokenId, row)
      }),
    )
  add(tx.inputs, 'in')
  add(tx.outputs, 'out')
  return [...map.values()]
}

function Balance({ tx }) {
  const { t } = useT()
  const inSum = sum(tx.inputs)
  const outs = tx.outputs.filter((o) => !isFeeBox(o))
  const fee = sum(tx.outputs.filter(isFeeBox))
  const tokens = tokenBalance(tx)
  const firstInput = tx.inputs[0]?.boxId
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>ERG</th>
            <th className="text-right">nanoERG</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t('balance.inputs')}</td>
            <td className="text-right font-mono tabular-nums">{num(inSum)}</td>
          </tr>
          <tr>
            <td>{t('balance.outputs')}</td>
            <td className="text-right font-mono tabular-nums">{num(sum(outs))}</td>
          </tr>
          <tr>
            <td>{t('balance.fee')}</td>
            <td className="text-right font-mono tabular-nums">{num(fee)}</td>
          </tr>
          <tr>
            <td>
              <strong>{t('balance.diff')}</strong>
            </td>
            <td className="text-right font-mono tabular-nums">
              <strong>{num(inSum - sum(tx.outputs))}</strong>
            </td>
          </tr>
        </tbody>
      </table>
      {tokens.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th className="text-right">{t('balance.in')}</th>
              <th className="text-right">{t('balance.out')}</th>
              <th>{t('balance.note')}</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((tk) => (
              <tr key={tk.tokenId}>
                <td>
                  <Link to={`/token/${tk.tokenId}`}>{tk.name || short(tk.tokenId, 6, 4)}</Link>
                </td>
                <td className="text-right tabular-nums">{tokenAmount(tk.in, tk.decimals)}</td>
                <td className="text-right tabular-nums">{tokenAmount(tk.out, tk.decimals)}</td>
                <td className="text-sm">
                  {tk.in === tk.out
                    ? t('balance.conserved')
                    : tk.out > tk.in
                      ? tk.tokenId === firstInput
                        ? t('balance.issued')
                        : t('balance.increased')
                      : t('balance.burned')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

function Example({ tx }) {
  const { t } = useT()
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 font-bold text-stone-900 dark:text-white">
          <ScrollText className="size-5 shrink-0 text-ergo-500" />
          <Hash value={tx.id} to={`/tx/${tx.id}`} head={10} tail={8} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tx.kind && <Badge tone="ergo">{tx.kind}</Badge>}
          <Badge>
            block <Link to={`/block/${tx.height}`}>{num(tx.height)}</Link>
          </Badge>
          <Badge>{ago(tx.timestamp)}</Badge>
          <Badge>{t('example.size', { size: num(tx.size) })}</Badge>
        </div>
      </div>
      <TxFlow tx={tx} showRegisters />
    </Card>
  )
}

export default function Transaction() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  const state = useApi(pickExample, [])
  return (
    <>
      <p>{T('intro', { box: <Link to="/learn/box" /> })}</p>

      <h2 id="vi-du">{t('real.title')}</h2>
      <p>{t('real.p1')}</p>
      <Async state={state} notFound={t('real.notFound')}>
        {(tx) => <Example tx={tx} />}
      </Async>

      <h2 id="thanh-phan">{t('parts.title')}</h2>
      <h3>Inputs</h3>
      <p>{T('parts.inputs', { sigma: <Link to="/learn/sigma" /> })}</p>
      <h3>Data inputs</h3>
      <p>{T('parts.dataInputs')}</p>
      <h3>Outputs</h3>
      <p>{t('parts.outputs')}</p>

      <h2 id="bao-toan">{t('rules.title')}</h2>
      <p>{t('rules.p1')}</p>
      <ul>
        <li>{T('rules.erg')}</li>
        <li>{T('rules.tokens', { tokens: <Link to="/learn/tokens" /> })}</li>
        <li>{T('rules.scripts')}</li>
        <li>{T('rules.minValue')}</li>
      </ul>
      <p>{t('rules.p2')}</p>
      <Async state={state}>{(tx) => <Balance tx={tx} />}</Async>

      <h2 id="phi">{t('fee.title')}</h2>
      <p>{T('fee.p1')}</p>
      <Callout type="tip" title={t('fee.tipTitle')}>
        {t('fee.tip')}
      </Callout>

      <h2 id="tx-id">Transaction id</h2>
      <p>{T('txId.p1')}</p>
      <pre>
        <code>{`txId = blake2b256( serialize(inputs(boxIds + extensions), dataInputs, outputs) )`}</code>
      </pre>
      <p>{t('txId.p2')}</p>
      <p>{T('txId.p3')}</p>

      <h2 id="coinbase">{t('coinbase.title')}</h2>
      <p>{T('coinbase.p1')}</p>
      <p>{T('coinbase.p2')}</p>
      <ol>
        <li>{T('coinbase.newBox')}</li>
        <li>{T('coinbase.rewardBox')}</li>
      </ol>
      <p>{T('coinbase.p3', { emission: <Link to="/learn/emission" /> })}</p>
      <EmissionTx />
      <Callout type="note" title={t('coinbase.noteTitle')}>
        {T('coinbase.note')}
      </Callout>
      <Async state={state}>
        {(tx) => <p className="text-sm text-stone-500">{t('fee.example', { fee: erg(sum(tx.outputs.filter(isFeeBox))), index: tx.index, height: num(tx.height) })}</p>}
      </Async>
    </>
  )
}
