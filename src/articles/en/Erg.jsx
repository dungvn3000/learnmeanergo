import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { num } from '../../lib/format'
import { emissionAt, minerRewardAt, FIXED_RATE_PERIOD, EPOCH_LENGTH, REEMISSION_START, BLOCK_TIME_SEC } from '../../lib/ergo'
import { Callout, Card } from '../../components/ui'
import LineChart from '../../components/LineChart'

function SupplyBar({ d }) {
  const pct = (v) => `${((v / d.maxSupply) * 100).toFixed(2)}%`
  const rest = d.maxSupply - d.issued
  return (
    <Card className="not-prose my-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-semibold text-stone-900 dark:text-white">{pct(d.issued)} of the total supply has been issued</div>
        <div className="text-xs text-stone-500">as of block {num(d.height)}</div>
      </div>
      <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div className="h-full bg-ergo-500" style={{ width: pct(d.circulating) }} title="In circulation" />
        <div className="h-full bg-ergo-200 dark:bg-ergo-800" style={{ width: pct(d.reemissionLocked) }} title="Locked for re-emission" />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-ergo-500" /> In circulation
          </div>
          <div className="font-bold tabular-nums">{num(d.circulating)} ERG</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-ergo-200 dark:bg-ergo-800" /> Locked for re-emission
          </div>
          <div className="font-bold tabular-nums">{num(d.reemissionLocked)} ERG</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-stone-200 dark:bg-stone-700" /> Not yet mined
          </div>
          <div className="font-bold tabular-nums">{num(rest)} ERG</div>
        </div>
      </div>
    </Card>
  )
}

function RewardChart({ height }) {
  const points = useMemo(() => {
    const hs = [1, FIXED_RATE_PERIOD - 1]
    for (let h = FIXED_RATE_PERIOD; h <= REEMISSION_START + EPOCH_LENGTH; h += EPOCH_LENGTH) hs.push(h, h + EPOCH_LENGTH - 1)
    return hs.map((h) => ({ x: h, y: emissionAt(h) }))
  }, [])
  const markers = height ? [{ x: height, label: 'Now' }] : []
  return (
    <Card className="not-prose my-6 p-4">
      <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">New ERG created per block</div>
      <LineChart
        points={points}
        step
        markers={markers}
        label="ERG issued per block by height"
        xFormat={(x) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : `${Math.round(x / 1e3)}k`)}
        yFormat={(y) => `${y}`}
        tooltip={(p) => (
          <>
            <div className="text-stone-500">Block {num(p.x)}</div>
            <div className="font-semibold text-stone-900 dark:text-white">{emissionAt(p.x)} ERG / block</div>
          </>
        )}
      />
      <p className="mt-2 text-xs text-stone-500">Horizontal axis: block height. Each step drops by 3 ERG and lasts 64,800 blocks (~3 months).</p>
    </Card>
  )
}

export default function Erg() {
  const ns = useApi(() => api.networkState(), [], 60000)
  const d = ns.data
  const endDate = d ? new Date(d.tipTimestamp + (REEMISSION_START - d.height) * BLOCK_TIME_SEC * 1000) : null

  return (
    <>
      <p>
        <strong>ERG</strong> is Ergo's native currency. You use it to pay other people and to pay transaction fees, and miners receive it
        as their reward for securing the network.
      </p>

      <h2 id="tong-cung">A capped supply</h2>
      <p>
        At most <strong>97,739,925 ERG</strong> will ever be created — not a single coin more. That number isn't anyone's promise; it's
        written into the rules that every node enforces. If a block tries to create more ERG than the schedule allows, every node simply
        throws it away.
      </p>
      {d && <SupplyBar d={d} />}

      <h2 id="erg-tu-dau-ra">Where does ERG come from?</h2>
      <p>
        Every newly mined block creates some new ERG. This is the <strong>only</strong> way ERG comes into existence — no ICO, no pre-mine.
        All future ERG is already sitting in a special box called the <em>emission box</em>, locked by a contract that only allows exactly
        the scheduled amount to be withdrawn at each block.
      </p>
      <p>The emission schedule has two phases:</p>
      <ul>
        <li>
          <strong>The first 2 years</strong> (525,600 blocks): each block creates <strong>75 ERG</strong>, of which 7.5 ERG goes to the
          development fund (treasury).
        </li>
        <li>
          <strong>After that</strong>: every 64,800 blocks (~3 months), the amount per block drops by <strong>3 ERG</strong>, until it reaches
          zero.
        </li>
      </ul>
      <RewardChart height={d?.height} />
      {d && (
        <p>
          Right now (block {num(d.height)}) each block creates <strong>{emissionAt(d.height)} ERG</strong>. Emission from the emission box
          ends around block <strong>{num(REEMISSION_START)}</strong> — estimated to be around{' '}
          <strong>{endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>.
        </p>
      )}

      <h2 id="tai-phat-hanh">Re-emission (EIP-27)</h2>
      <p>
        As the reward shrinks towards zero, what will pay miners? In 2022 the community adopted a rule change called{' '}
        <strong>EIP-27</strong> (an “Ergo Improvement Proposal” — the way changes to Ergo's rules are proposed and agreed on). Starting at
        block 777,217, part of each block's reward (up to 12 ERG) is <strong>locked</strong> away in a “savings” contract — the re-emission
        contract — instead of being paid to the miner straight away.
      </p>
      <p>
        Once the emission box runs dry, this contract keeps releasing <strong>3 ERG per block</strong> to miners, extending the period in
        which they get paid by many years. The total supply doesn't change — the ERG is just “saved up” for the future.
      </p>
      {d && (
        <Callout type="note">
          At the current block, of the {emissionAt(d.height)} ERG created, the miner receives{' '}
          <strong>{minerRewardAt(d.height)} ERG</strong> immediately; the rest is locked for the re-emission period.
        </Callout>
      )}

      <h2 id="nanoerg">The smallest unit: nanoERG</h2>
      <p>
        The blockchain doesn't store decimals. Every value is stored as a whole number of <strong>nanoERG</strong>:
      </p>
      <table>
        <thead>
          <tr>
            <th>ERG</th>
            <th>nanoERG</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td className="tabular-nums">1,000,000,000</td>
          </tr>
          <tr>
            <td>0.001 (a common transaction fee)</td>
            <td className="tabular-nums">1,000,000</td>
          </tr>
          <tr>
            <td>0.000000001</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
      <p>
        Convert back and forth with the <Link to="/tools/units">ERG unit converter</Link>, or work out the reward at any height with the{' '}
        <Link to="/tools/emission-calculator">emission calculator</Link>.
      </p>

      <Callout type="tip" title="Want more detail?">
        The technical article <Link to="/learn/emission">Emission schedule &amp; EIP-27</Link> goes into the exact formulas and how the
        reward is split between the miner, the treasury and the re-emission contract.
      </Callout>

      <h2 id="tiep-theo">What's next</h2>
      <p>
        Now you know where ERG comes from. Next, learn how to keep it safe: <Link to="/learn/wallets">wallets, keys and addresses</Link>.
      </p>
    </>
  )
}
