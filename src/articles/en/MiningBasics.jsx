import { Link } from 'react-router-dom'
import { Clock, Cpu, Gauge, Pickaxe } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { compact, num } from '../../lib/format'
import { minerRewardAt } from '../../lib/ergo'
import { Async, Callout, Card, Stat } from '../../components/ui'
import LineChart from '../../components/LineChart'

function HashrateChart() {
  const state = useApi(() => api.chart('hashrate', 90), [])
  return (
    <Card className="not-prose my-6 p-4">
      <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">Network hashrate, last 90 days</div>
      <Async state={state}>
        {(c) =>
          c.points?.length > 1 ? (
            <LineChart
              points={c.points.map((p) => ({ x: p.t, y: p.v }))}
              label="Ergo network hashrate by day"
              xFormat={(x) => new Date(x).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
              yFormat={(y) => `${+y.toFixed(2)} ${c.unit}`}
            />
          ) : (
            <div className="py-6 text-center text-sm text-stone-500">No data yet.</div>
          )
        }
      </Async>
    </Card>
  )
}

function PoolShare({ pools }) {
  const total = pools.reduce((s, p) => s + p.blocks, 0)
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-sm font-semibold text-stone-900 dark:text-white">Who mined the {total} blocks of the last 24 hours?</div>
      <div className="grid gap-2">
        {pools.map((p) => {
          const pct = (p.blocks / total) * 100
          return (
            <div key={p.address} className="grid grid-cols-[110px_1fr_70px] items-center gap-3 text-sm">
              <Link to={`/address/${p.address}`} className="truncate font-medium hover:text-ergo-600" title={p.address}>
                {p.name}
              </Link>
              <div className="h-3 rounded-full bg-stone-100 dark:bg-stone-800">
                <div className="h-full rounded-full bg-ergo-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right tabular-nums text-stone-500">
                {p.blocks} · {pct.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function MiningBasics() {
  const ns = useApi(() => api.networkState(), [], 60000)
  const d = ns.data
  return (
    <>
      <p>
        No central bank decides which transactions are valid on Ergo. That job belongs to <strong>miners</strong> — people who use their
        computers to secure the network, and get paid in ERG for it.
      </p>

      {d && (
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
          <Stat icon={Cpu} label="Hashrate" value={`${d.hashrate} TH/s`} sub={`${d.hashrateChange7d > 0 ? '+' : ''}${d.hashrateChange7d}% vs 7 days ago`} />
          <Stat icon={Clock} label="Avg block time" value={`${Math.round(d.avgBlockTimeSec)} seconds`} sub="target: 120 seconds" />
          <Stat icon={Gauge} label="Difficulty" value={compact(d.difficulty)} sub={`block #${num(d.height)}`} />
        </div>
      )}

      <h2 id="tho-dao-lam-gi">What do miners do?</h2>
      <p>Every miner does three things, over and over:</p>
      <ol>
        <li>Take the transactions waiting in the mempool and check they're valid.</li>
        <li>Assemble them into a candidate block that points to the latest block in the chain.</li>
        <li>
          Change one spare number in the block (the <strong>nonce</strong>), recompute the block's fingerprint (its hash), and check whether
          it's small enough. Repeat billions of times.
        </li>
      </ol>
      <p>
        Step 3 is like rolling dice billions of times hoping for an extremely rare number. There's no shortcut — you just try lots of times,
        very fast. The combined guessing speed of the whole network is called the <strong>hashrate</strong>.
      </p>
      <HashrateChart />

      <h2 id="phan-thuong">The reward</h2>
      <p>The miner who finds a block receives two things:</p>
      <ul>
        <li>
          <strong>The block reward</strong>: newly created ERG according to the <Link to="/learn/erg">emission schedule</Link>.
          {d && (
            <>
              {' '}
              At the current height, the miner receives <strong>{minerRewardAt(d.height)} ERG</strong> per block straight away.
            </>
          )}
        </li>
        <li>
          <strong>Transaction fees</strong>: the total fees of every transaction in the block.
        </li>
      </ul>
      <p>
        As the block reward shrinks, transaction fees and the re-emission mechanism (EIP-27) become more and more important for keeping
        miners securing the network.
      </p>

      <h2 id="do-kho">Self-adjusting difficulty</h2>
      <p>
        If more miners join, blocks get found faster. To keep the pace at roughly <strong>one block every 2 minutes</strong>, the network
        automatically raises the <strong>difficulty</strong> — meaning the hash has to be even smaller. When miners leave, the difficulty
        comes back down.
      </p>
      <p>
        There's a simple relationship: <em>hashrate ≈ difficulty ÷ 120 seconds</em>. That's how the explorer estimates the whole
        network's hashrate without asking any miner. Details in <Link to="/learn/difficulty">Difficulty &amp; nBits</Link>.
      </p>

      <h2 id="gpu">Why can GPUs still mine Ergo?</h2>
      <p>
        Today Bitcoin can only be mined with expensive, specialized ASIC machines, concentrated in the hands of a few companies. Ergo took a
        different path: its <strong>Autolykos v2</strong> algorithm is <em>memory-hard</em> — every attempt needs to read data from a large
        table in memory. Ordinary graphics cards (GPUs) have fast memory and do this very well, while building an ASIC that dramatically
        outperforms them is much harder and less worthwhile.
      </p>
      <p>The result: anyone with a GPU rig can help secure the network.</p>
      <Callout type="note">
        Learn how Autolykos works and what the <code>pk</code>, <code>w</code>, <code>n</code> and <code>d</code> fields in every block
        mean in <Link to="/learn/autolykos">Autolykos v2</Link>.
      </Callout>

      <h2 id="pool">Solo mining or a pool?</h2>
      <p>
        With thousands of miners, the chance of a small rig finding a block on its own is very low — you might wait months. So most miners
        join a <strong>pool</strong>: they combine their power and split the rewards according to their contribution. Smaller payouts, but
        far more regular.
      </p>
      {d?.poolShare24h?.length > 0 && <PoolShare pools={d.poolShare24h} />}
      <p>
        The spread across pools is worth watching: if one pool controlled more than half the hashrate, it could in theory disrupt the
        network. Miners can switch pools at any time — a way of “voting with their feet” that keeps the network decentralized.
      </p>

      <h2 id="tiep-theo">What's next</h2>
      <p>
        <Pickaxe className="mr-1 inline size-4 text-ergo-500" />
        You've finished the beginner section! Ready to go deeper? Start with <Link to="/learn/block">Blocks &amp; headers</Link> in the{' '}
        <Link to="/technical">Technical</Link> section, or watch freshly mined blocks in the <Link to="/explorer">explorer</Link>.
      </p>
    </>
  )
}
