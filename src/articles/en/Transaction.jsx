import { Link } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, erg, num, short, tokenAmount } from '../../lib/format'
import { Async, Badge, Callout, Card, Hash } from '../../components/ui'
import { TxFlow, isFeeBox } from '../../components/TxFlow'

/** The first transaction of the latest block: the emission box being spent. */
function EmissionTx() {
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
                transaction #0 of block <Link to={`/block/${b.height}`} className="font-mono text-ergo-600 hover:underline dark:text-ergo-400">{num(b.height)}</Link>
              </span>
              <Hash value={tx.id} to={`/tx/${tx.id}`} head={8} tail={6} className="ml-auto text-xs" />
            </div>
            <TxFlow tx={tx} limit={4} />
            <p className="mt-3 text-sm text-stone-500">
              The input is the emission box. The first output is that same box recreated with <strong>{erg(b.emission)} ERG</strong> less; the second is the
              miner&apos;s reward box holding {erg(b.emission)} ERG
              {b.reemitted > 0 && (
                <>
                  , of which {erg(b.reemitted)} ERG is tagged with “Reemission Token” and must be paid into the re-emission contract when spent (EIP-27) — the
                  miner effectively keeps <strong>{erg(b.reward)} ERG</strong>
                </>
              )}
              . Total ERG in equals total ERG out.
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
            <td>Total inputs</td>
            <td className="text-right font-mono tabular-nums">{num(inSum)}</td>
          </tr>
          <tr>
            <td>Total outputs (excluding fee)</td>
            <td className="text-right font-mono tabular-nums">{num(sum(outs))}</td>
          </tr>
          <tr>
            <td>Miner fee box</td>
            <td className="text-right font-mono tabular-nums">{num(fee)}</td>
          </tr>
          <tr>
            <td>
              <strong>Difference</strong>
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
              <th className="text-right">In</th>
              <th className="text-right">Out</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.tokenId}>
                <td>
                  <Link to={`/token/${t.tokenId}`}>{t.name || short(t.tokenId, 6, 4)}</Link>
                </td>
                <td className="text-right tabular-nums">{tokenAmount(t.in, t.decimals)}</td>
                <td className="text-right tabular-nums">{tokenAmount(t.out, t.decimals)}</td>
                <td className="text-sm">
                  {t.in === t.out
                    ? 'conserved'
                    : t.out > t.in
                      ? t.tokenId === firstInput
                        ? 'newly issued (id = first input)'
                        : 'increased?'
                      : 'burned'}
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
          <Badge>{num(tx.size)} bytes</Badge>
        </div>
      </div>
      <TxFlow tx={tx} showRegisters />
    </Card>
  )
}

export default function Transaction() {
  const state = useApi(pickExample, [])
  return (
    <>
      <p>
        A <strong>transaction</strong> on Ergo does exactly one thing: it <em>spends</em> some existing boxes and <em>creates</em> new ones. There is no “subtract from
        account A, add to account B” — only boxes being destroyed and boxes being born. If the idea of a box is new to you, read{' '}
        <Link to="/learn/box">Boxes &amp; registers</Link> first.
      </p>

      <h2 id="vi-du">A real transaction</h2>
      <p>
        Here is a transaction that was just confirmed on mainnet (reload the page for another example). On the left are the boxes being spent, on the right the
        boxes being created. Each box has a colored square as a “fingerprint”, so you can recognize it if it shows up on another page.
      </p>
      <Async state={state} notFound="Couldn't find an example transaction.">
        {(tx) => <Example tx={tx} />}
      </Async>

      <h2 id="thanh-phan">Three kinds of inputs and outputs</h2>
      <h3>Inputs</h3>
      <p>
        An input says “spend this box”. It names the box by its <code>boxId</code> and attaches a <strong>spending proof</strong> — the evidence that you are allowed to
        open the box's lock (its script). For a box in an ordinary wallet, that proof is simply a Schnorr signature; for more complex contracts, it is a more general{' '}
        <Link to="/learn/sigma">sigma protocol</Link>. An input can also carry a <em>context extension</em>: extra variables the script reads when it runs.
      </p>
      <h3>Data inputs</h3>
      <p>
        This is where Ergo differs from Bitcoin. A data input references a box <strong>for reading only</strong>: the transaction's scripts can look at its value
        and registers, but the box isn't spent and needs no proof. As a result, hundreds of transactions in the same block can all read the same oracle price box
        without competing for it.
      </p>
      <h3>Outputs</h3>
      <p>
        The new boxes, each with an ERG value, a locking script, and optionally tokens and registers R4–R9. An unspent output sits in the UTXO set until another
        transaction uses it as an input.
      </p>

      <h2 id="bao-toan">Conservation rules</h2>
      <p>Every node checks the following rules before accepting a transaction:</p>
      <ul>
        <li>
          <strong>ERG is conserved:</strong> the total value of the inputs must exactly equal the total value of the outputs. There's no “implicit” fee as in
          Bitcoin — the fee is an output too.
        </li>
        <li>
          <strong>Tokens don't appear out of nowhere:</strong> for each token id, the amount out ≤ the amount in. Anything missing is <em>burned</em>. The only
          exception: you may issue a new token whose id equals the <code>boxId</code> of the first input (see <Link to="/learn/tokens">Tokens (EIP-4)</Link>).
        </li>
        <li>
          <strong>Every input's script is satisfied</strong> by its corresponding spending proof.
        </li>
        <li>
          <strong>Every output holds enough value</strong> for its size (to prevent spamming the UTXO set).
        </li>
      </ul>
      <p>Checking it on the example transaction above:</p>
      <Async state={state}>{(tx) => <Balance tx={tx} />}</Async>

      <h2 id="phi">Transaction fees</h2>
      <p>
        You pay a fee by creating an output locked by a special script — the <strong>fee contract</strong>. Only a miner can open that lock. In practice the block's
        miner collects it right away: the last transaction of the block sweeps every fee box into one box locked to the miner's public key, and that box unlocks
        after 720 blocks. In the diagram above, the fee box has a yellow border. Wallets usually set a fee of around <code>0.001</code> ERG or more.
      </p>
      <Callout type="tip" title="Fee = a box">
        Because the fee is an ordinary output, you can see exactly how much fee was paid just by looking at the transaction — no need to subtract total outputs
        from total inputs.
      </Callout>

      <h2 id="tx-id">Transaction id</h2>
      <p>
        A transaction's id is the Blake2b-256 hash of the serialized transaction <strong>without the spending proofs</strong>:
      </p>
      <pre>
        <code>{`txId = blake2b256( serialize(inputs(boxIds + extensions), dataInputs, outputs) )`}</code>
      </pre>
      <p>
        Leaving the proofs out matters for two reasons. First, a signature has to sign exactly these bytes — and a signature can't sign itself. Second, nobody can
        change a transaction's id by tweaking a signature (the “transaction malleability” problem Bitcoin once had).
      </p>
      <p>
        Each output's <code>boxId</code> also depends on the txId and the output's position (R3 holds the <code>txId</code> + <code>index</code>), so box ids are
        unique across the whole network.
      </p>

      <h2 id="coinbase">No “coinbase” like Bitcoin</h2>
      <p>
        In Bitcoin, the first transaction of every block is the <em>coinbase</em>: a special transaction with <strong>no inputs</strong> that creates new coins out
        of thin air and pays them to the miner. Ergo has no such exception. Every ERG that will ever exist was created <strong>once</strong>, in the genesis
        block. The miners&apos; share (~93.4 million ERG) was placed in a box called the <strong>emission box</strong>, locked by the <em>emission contract</em>;
        the rest (~4.33 million ERG) sits in a separate treasury box.
      </p>
      <p>
        From then on, the block reward is just an ordinary transaction: the miner <strong>spends the emission box</strong> as an input and creates two outputs —
      </p>
      <ol>
        <li>
          A <strong>new emission box</strong>: same script, holding what is left (minus exactly this height&apos;s emission).
        </li>
        <li>
          A <strong>reward box</strong> for the miner, locked to the miner&apos;s public key and spendable only after 720 blocks.
        </li>
      </ol>
      <p>
        So the ERG conservation rule holds even for the reward transaction: inputs equal outputs. No signature is needed — the emission contract&apos;s own script
        checks that the first output is still an emission box and that the amount withdrawn matches the{' '}
        <Link to="/learn/emission">emission schedule</Link> for the current height. The explorer labels this transaction “Block reward” so it is easy to spot,
        but to the protocol there is nothing special about it.
      </p>
      <EmissionTx />
      <Callout type="note" title="What does EIP-27 do here?">
        Since block 777,217 the reward box also carries <em>Reemission Tokens</em>. When the miner spends the reward box, the ERG matching those tokens must be sent
        to the re-emission contract; it is paid back to miners at 3 ERG/block once the main emission schedule ends.
      </Callout>
      <Async state={state}>
        {(tx) => (
          <p className="text-sm text-stone-500">
            The example transaction pays {erg(sum(tx.outputs.filter(isFeeBox)))} ERG in fees and sits at position #{tx.index} in block {num(tx.height)}.
          </p>
        )}
      </Async>
    </>
  )
}
