import { Link } from 'react-router-dom'
import { ArrowLeft, Inbox, Pickaxe, Server, Send } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, num, short } from '../../lib/format'
import { Async, Callout, Card } from '../../components/ui'

/** The last few blocks drawn as a chain, each pointing back to its parent. */
function LiveChain() {
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
                    <div className="font-mono text-stone-400" title={b.parentId}>parent {short(b.parentId, 5, 4)}</div>
                    <div className="mt-2 text-stone-600 dark:text-stone-300">{b.txCount} {b.txCount === 1 ? 'transaction' : 'transactions'}</div>
                    <div className="text-stone-400">{ago(b.timestamp)}</div>
                  </Link>
                </div>
              ))}
            </div>
          )
        }}
      </Async>
      <p className="mt-1 text-xs text-stone-500">
        The 5 latest blocks on mainnet (updates automatically). Notice: each block's <span className="font-mono">parent</span> is exactly
        the <span className="font-mono">id</span> of the block before it.
      </p>
    </div>
  )
}

const STEPS = [
  { icon: Send, title: '1. You create a transaction', text: 'Your wallet picks a few boxes to spend, signs with your secret key and sends it to a node.' },
  { icon: Inbox, title: '2. Into the mempool', text: 'The node checks the transaction is valid, then relays it to other nodes. It waits in a “waiting room” called the mempool.' },
  { icon: Pickaxe, title: '3. Miners pack it into a block', text: 'Miners pick transactions from the mempool, assemble a block and race to solve the Proof-of-Work puzzle.' },
  { icon: Server, title: '4. Every node updates', text: 'The winning block is broadcast. Every node re-checks all of it independently, then appends it to its own chain.' },
]

export default function HowItWorks() {
  const ns = useApi(() => api.networkState(), [], 30000)
  return (
    <>
      <p>
        Ergo is a network of many computers around the world, all keeping a copy of the same ledger. There is no central
        server. So how do they agree on who owns how much? This article answers that question.
      </p>

      <h2 id="node">Nodes: the record keepers</h2>
      <p>
        A <strong>node</strong> is a computer running the Ergo software. It downloads the entire blockchain history, checks every block
        and every transaction against the rules, and talks to other nodes (called <em>peers</em>).
      </p>
      <p>
        The key point: every node <strong>checks everything for itself</strong>. If someone sends a fraudulent block — say, one that
        prints extra ERG — every honest node rejects it. Nobody needs to be “trusted”.
      </p>
      {ns.data && (
        <Callout type="note">
          The node serving data for this page is <code>{ns.data.nodeName}</code>, currently connected to {ns.data.peers} peers.
        </Callout>
      )}

      <h2 id="hanh-trinh-giao-dich">The journey of a transaction</h2>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s) => (
          <Card key={s.title} className="p-4">
            <s.icon className="size-5 text-ergo-500" />
            <div className="mt-2 font-semibold text-stone-900 dark:text-white">{s.title}</div>
            <div className="mt-1 text-sm text-stone-500">{s.text}</div>
          </Card>
        ))}
      </div>
      {ns.data && (
        <p>
          Right now there are <strong>{ns.data.mempoolCount}</strong> transactions waiting in the node's mempool to be included in the next
          block.
        </p>
      )}

      <h2 id="block-va-chuoi">Blocks and the chain</h2>
      <p>
        Transactions aren't recorded one by one; they're grouped into <strong>blocks</strong>. On Ergo a new block appears roughly every{' '}
        <strong>2 minutes</strong> on average. Every block has a <strong>fingerprint</strong>: a short code (called a hash) that changes
        completely if even one character in the block changes. That fingerprint is the block's <em>id</em>, and each block also stores the
        id of the block before it — its <em>parent id</em>. That's how blocks link together into a <strong>chain</strong>:
      </p>
      <LiveChain />
      <p>
        If someone wanted to change an old transaction, the id of the block containing it would change, which makes the next block's
        parent id wrong, and the one after that… The attacker would have to re-mine every block from that point up to today, faster than
        the rest of the network combined. In practice, that's all but impossible.
      </p>

      <h2 id="tho-dao">Miners and Proof-of-Work</h2>
      <p>
        Who gets to write the next block? The answer is a <strong>Proof-of-Work</strong> contest — a lottery you win by guessing fast.
        Miners keep changing one spare number inside their block (the <em>nonce</em>) and recomputing the block's fingerprint, billions of
        times, until the fingerprint comes out small enough to count as a win (below a limit called the <em>target</em>). The first miner
        to get there broadcasts the block and collects a reward in newly created ERG.
      </p>
      <p>
        Finding a solution takes a lot of work, but checking one is extremely fast. That's why a laptop running a node can verify the
        effort of the entire mining network. See <Link to="/learn/mining-basics">Mining Ergo</Link> for details.
      </p>

      <h2 id="xac-nhan">Confirmations</h2>
      <p>
        When your transaction lands in a block, it has <strong>1 confirmation</strong>. Every new block mined on top adds one more. The
        more confirmations, the harder the transaction is to reverse. For everyday payments a few confirmations (a few minutes) is plenty;
        for large amounts, exchanges usually wait longer.
      </p>

      <Callout type="tip" title="Try it">
        Open the <Link to="/explorer">latest block</Link> in the explorer, then come back a few minutes later — you'll see its confirmation
        count go up.
      </Callout>

      <h2 id="tiep-theo">What's next</h2>
      <p>
        You now know where a transaction goes. But what's inside one? On Ergo, the answer is boxes — read{' '}
        <Link to="/learn/boxes">Boxes: where the money lives</Link>.
      </p>
    </>
  )
}
