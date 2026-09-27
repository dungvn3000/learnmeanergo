import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Lock, Sparkles } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { Async, Callout, Erg } from '../../components/ui'
import { TxFlow, isFeeBox } from '../../components/TxFlow'

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
  return (
    <div className="not-prose my-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900/50">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">
            <Flame className="size-3.5" /> Spent (destroyed)
          </div>
          <div className="flex gap-3">
            <Box amount="7 ERG" owner="Alice's key" />
            <Box amount="5 ERG" owner="Alice's key" />
          </div>
        </div>
        <ArrowRight className="size-8 text-ergo-500" />
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">
            <Sparkles className="size-3.5" /> Newly created
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Box amount="10 ERG" owner="Bob's key" tone="ergo" />
            <Box amount="1.999 ERG" owner="Alice's key (change)" />
            <Box amount="0.001 ERG" owner="miner fee" tone="amber" />
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-stone-500">Alice sends Bob 10 ERG: 7 + 5 = 10 + 1.999 + 0.001</p>
    </div>
  )
}

/** Pick a small, readable recent transaction to show as a real example. */
function RealTx() {
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
              Transaction <Link to={`/tx/${tx.id}`} className="font-mono text-ergo-600 hover:underline dark:text-ergo-400">{tx.id.slice(0, 12)}…</Link> in
              block {tx.height}: {tx.inputs.length} {tx.inputs.length === 1 ? 'box' : 'boxes'} spent, {tx.outputs.length} new{' '}
              {tx.outputs.length === 1 ? 'box' : 'boxes'} created
              {fee && (
                <>
                  , including a <Erg nano={fee.value} /> box that is the miner's fee
                </>
              )}
              .
            </p>
          </div>
        )
      }}
    </Async>
  )
}

export default function BeginnerBoxes() {
  return (
    <>
      <p>
        When you open your banking app, you see one number: your <em>balance</em>. The bank keeps a spreadsheet where each row is an
        account, and moving money means subtracting from one row and adding to another.
      </p>
      <p>
        Ergo <strong>doesn't work like that</strong>. There are no “accounts” on Ergo at all. Instead, money lives inside{' '}
        <strong>boxes</strong>.
      </p>

      <h2 id="box-la-gi">What is a box?</h2>
      <p>Imagine each box as a small glass case:</p>
      <ul>
        <li>Inside is some amount of <strong>ERG</strong> (and possibly other <Link to="/learn/tokens">tokens</Link> too).</li>
        <li>
          On the outside is a <strong>lock</strong>. The lock is a piece of logic (a script) that says who may open the box.
        </li>
        <li>Anyone can see what's inside, but only someone who satisfies the lock can take it.</li>
      </ul>
      <p>
        The “balance” your wallet shows you is really just <strong>the total value of all the boxes your keys can open</strong>. The
        wallet adds them up for your convenience.
      </p>

      <h2 id="tieu-tien">Spending = breaking old boxes, sealing new ones</h2>
      <p>
        Boxes have one important property: <strong>they can't be partially opened</strong>. You can't take 3 ERG out of a 7 ERG box and
        leave the other 4 ERG inside. Instead, a transaction:
      </p>
      <ol>
        <li>Opens (and destroys) one or more old boxes — the <strong>inputs</strong>.</li>
        <li>Creates new boxes with new locks — the <strong>outputs</strong>.</li>
      </ol>
      <p>
        The total going in must equal the total coming out. Whatever is left over is returned to you in a new box, called{' '}
        <em>change</em> — just like paying for a $3 coffee with a $20 bill and getting the difference back.
      </p>
      <SpendDiagram />
      <p>
        Look closely: the transaction fee is a box too! On Ergo, the fee is sent to a special box that only a miner can open. The block&apos;s miner
        collects every fee box in that block into a single reward box of their own — and that reward box stays locked for 720 blocks (about a day).
      </p>

      <h2 id="vi-du-that">A real transaction, right now</h2>
      <p>Here's a transaction mined recently on mainnet. On the left are the boxes being spent, on the right the new boxes:</p>
      <RealTx />
      <p>
        Every box has its own <strong>box id</strong> — a unique fingerprint. Click any box id to see what that box contains and whether
        it has been spent yet.
      </p>

      <h2 id="utxo">UTXO and eUTXO</h2>
      <p>
        Boxes that haven't been spent yet are called <strong>UTXOs</strong> (Unspent Transaction Outputs). Bitcoin uses this model too. The
        set of all UTXOs is the current “state” of the blockchain: who owns what.
      </p>
      <p>
        Ergo extends it, hence the name <strong>eUTXO</strong> (extended UTXO): an Ergo box can hold tokens, can store arbitrary data in
        “compartments” called <em>registers</em>, and its lock can be an entire smart contract rather than just a signature.
      </p>

      <h2 id="vi-sao-tot">Why is this design good?</h2>
      <ul>
        <li>
          <strong>Predictable:</strong> before you send, you know exactly which boxes are spent and which are created. No surprises.
        </li>
        <li>
          <strong>Parallel:</strong> transactions that touch different boxes don't affect each other.
        </li>
        <li>
          <strong>Safe:</strong> a box can be spent exactly once. Spending it twice (a double-spend) is rejected by the network immediately.
        </li>
      </ul>
      <p>
        Developer David Przybilla sums this view up neatly in{' '}
        <a href="https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e" target="_blank" rel="noreferrer">
          Learning Ergo 101: eUTXO explained for human beings
        </a>
        : to an app builder, Ergo is just a dataset of boxes, the only operation is a transaction, and you simply describe “what the world should look like
        afterwards” — the script in each box decides whether that is allowed.
      </p>

      <Callout type="note" title="Want to go deeper?">
        The technical article <Link to="/learn/box">Boxes &amp; registers</Link> explains every field from R0 to R9, and{' '}
        <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link> covers how the “locks” are written.
      </Callout>

      <h2 id="doc-them">Further reading</h2>
      <ul>
        <li>
          <a href="https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e" target="_blank" rel="noreferrer">
            Learning Ergo 101: eUTXO explained for human beings
          </a>{' '}
          — David Przybilla, December 2021. A programmer&apos;s view of the same idea: the blockchain as a dataset of boxes, the transaction as the only
          operation, and scripts as simple true/false validators — a great read right after this page.
        </li>
      </ul>

      <h2 id="tiep-theo">What's next</h2>
      <p>
        Where did the ERG in those boxes come from in the first place? Read on: <Link to="/learn/erg">ERG and its supply</Link>.
      </p>
    </>
  )
}
