import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Lock, Package, Target } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { num } from '../../lib/format'
import {
  BLOCK_TIME_SEC, EIP27_ACTIVATION, EPOCH_LENGTH, EPOCH_REDUCTION, FIXED_RATE, FIXED_RATE_PERIOD, MAX_SUPPLY, REEMISSION_PER_BLOCK, REEMISSION_START,
  emissionAt, emittedUpTo, heightToDate, minerRewardAt, reemissionLockAt, treasuryAt,
} from '../../lib/ergo'
import { Callout, Card, Stat } from '../../components/ui'
import LineChart from '../../components/LineChart'

const MAX_H = 2_200_000

// Total ERG that EIP-27 locks between activation and the end of emission.
const TOTAL_REEMISSION = (() => {
  let s = 0
  for (let h = EIP27_ACTIVATION; h < REEMISSION_START; h++) s += reemissionLockAt(h)
  return s
})()
const REEMISSION_END = REEMISSION_START + Math.ceil(TOTAL_REEMISSION / REEMISSION_PER_BLOCK)

/** Heights at which the per-block emission changes, plus the chart ends. */
function breakpoints() {
  const hs = [1, FIXED_RATE_PERIOD]
  for (let h = FIXED_RATE_PERIOD + EPOCH_LENGTH; h <= MAX_H; h += EPOCH_LENGTH) hs.push(h)
  hs.push(MAX_H)
  return hs
}

const mil = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(0)}k` : String(v))

export default function Emission() {
  const state = useApi(() => Promise.all([api.info(), api.networkState()]), [])
  const [info, net] = state.data ?? []
  const height = info?.height

  // Estimated calendar date of a height: anchored to the live tip when we have it.
  const tipTime = net?.tipTimestamp
  const dateOf = (h) => (height && tipTime ? new Date(tipTime + (h - height) * BLOCK_TIME_SEC * 1000) : heightToDate(h))
  const fmtDate = (h) => {
    const d = dateOf(h)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  const emissionPoints = useMemo(() => breakpoints().map((h) => ({ x: h, y: emissionAt(h) })), [])
  const supplyPoints = useMemo(() => {
    const pts = []
    for (let h = 0; h <= MAX_H; h += 20_000) pts.push({ x: h, y: emittedUpTo(h) })
    return pts
  }, [])
  const markers = height ? [{ x: height, label: 'Now' }] : []

  const tip = (p) => (
    <>
      <div className="text-stone-500">
        Block {num(p.x)} · ≈ {fmtDate(p.x)}
      </div>
      <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{emissionAt(p.x)} ERG / block</div>
      <div className="text-stone-500">Miner receives: {minerRewardAt(p.x)} ERG</div>
      {treasuryAt(p.x) > 0 && <div className="text-stone-500">Treasury: {treasuryAt(p.x)} ERG</div>}
      {reemissionLockAt(p.x) > 0 && <div className="text-stone-500">EIP-27 lock: {reemissionLockAt(p.x)} ERG</div>}
    </>
  )

  return (
    <>
      <p>
        There was no ICO for ERG. Every ERG is created according to a fixed schedule, written into the protocol from day one: each new block “prints” a set
        amount of ERG, and that amount shrinks over time until it reaches zero. In total there will only ever be <strong>{num(MAX_SUPPLY)} ERG</strong>.
      </p>

      {net && (
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Coins} label="Issued" value={num(net.issued)} sub={`${((net.issued / MAX_SUPPLY) * 100).toFixed(2)}% of max supply`} />
          <Stat icon={Package} label="Circulating" value={num(net.circulating)} sub="Issued − EIP-27 locked" />
          <Stat icon={Lock} label="Re-emission locked" value={num(net.reemissionLocked)} sub="Paid out to miners over time" />
          <Stat icon={Target} label="Max supply" value={num(MAX_SUPPLY)} sub="ERG" />
        </div>
      )}

      <h2 id="lich-trinh">The emission schedule</h2>
      <p>The rules are simple:</p>
      <ol>
        <li>
          <strong>{FIXED_RATE} ERG per block</strong> for the first {num(FIXED_RATE_PERIOD)} blocks (~2 years at 2-minute blocks).
        </li>
        <li>
          After that, every <strong>{num(EPOCH_LENGTH)} blocks</strong> (~3 months) the emission drops by <strong>{EPOCH_REDUCTION} ERG</strong>.
        </li>
        <li>
          Once it hits 0 — at block <strong>{num(REEMISSION_START)}</strong> — new emission stops.
        </li>
      </ol>
      <Card className="not-prose my-6 p-4">
        <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">ERG created per block, by height</div>
        <LineChart
          label="ERG emitted per block by height"
          points={emissionPoints}
          step
          xFormat={mil}
          yFormat={(v) => `${v}`}
          markers={markers}
          tooltip={tip}
        />
      </Card>
      <p>
        Unlike Bitcoin, which abruptly “halves” every 4 years, Ergo&apos;s curve steps down in small, even stairs. And instead of stretching over more than a
        century, all ERG is emitted in about 8 years — after which network security relies on transaction fees (and re-emission, see below).
      </p>

      <h2 id="quy-phat-trien">The treasury share</h2>
      <p>
        In the early years, a small part of every block went to a treasury to fund development: {treasuryAt(1)} ERG/block for the first{' '}
        {num(FIXED_RATE_PERIOD)} blocks, then {treasuryAt(FIXED_RATE_PERIOD)} and {treasuryAt(FIXED_RATE_PERIOD + EPOCH_LENGTH)} ERG over the next two epochs.
        Miners received the rest ({FIXED_RATE - treasuryAt(1)} ERG/block). From block {num(FIXED_RATE_PERIOD + 2 * EPOCH_LENGTH)} onwards, the entire emission
        goes to miners.
      </p>

      <h2 id="eip-27">EIP-27: re-emission</h2>
      <p>
        The original schedule had a problem: emission ends fairly early, while transaction fees might not be enough to keep miners around.{' '}
        <strong>EIP-27</strong>, activated by a soft fork at block <strong>{num(EIP27_ACTIVATION)}</strong> (in 2022), “saves” part of today&apos;s reward to pay
        it out gradually in the future:
      </p>
      <ul>
        <li>
          If the block&apos;s emission is ≥ 15 ERG: <strong>12 ERG</strong> is locked into the re-emission contract.
        </li>
        <li>
          If it is below 15 ERG: <em>(emission − 3)</em> ERG is locked, so the miner always gets at least 3 ERG.
        </li>
        <li>
          After emission ends (block {num(REEMISSION_START)}), the contract pays <strong>{REEMISSION_PER_BLOCK} ERG per block</strong> back to miners until it
          runs dry.
        </li>
      </ul>
      <p>
        In total, EIP-27 locks about <strong>{num(TOTAL_REEMISSION)} ERG</strong>. Paid out at {REEMISSION_PER_BLOCK} ERG per block, that lasts roughly another{' '}
        {num(Math.ceil(TOTAL_REEMISSION / REEMISSION_PER_BLOCK))} blocks — until around block {num(REEMISSION_END)} (≈ {dateOf(REEMISSION_END).getUTCFullYear()}).
        The total supply doesn&apos;t change; only the timing of when ERG reaches miners is stretched out.
      </p>
      <Callout type="note" title="How much does a miner actually get?">
        Take block {num(height ?? 1_881_901)}: {emissionAt(height ?? 1_881_901)} ERG emitted, {reemissionLockAt(height ?? 1_881_901)} ERG locked, and the miner
        receives {minerRewardAt(height ?? 1_881_901)} ERG + transaction fees. Open <Link to="/explorer">any block</Link> to see the <code>emission</code>,{' '}
        <code>reemitted</code> and <code>reward</code> fields.
      </Callout>

      <h2 id="bang">Summary table</h2>
      <table>
        <thead>
          <tr>
            <th>From block</th>
            <th>≈ Date</th>
            <th>Emission</th>
            <th>Miner gets</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {[
            [1, 'Mainnet launch, 75 ERG/block'],
            [FIXED_RATE_PERIOD, 'Starts dropping 3 ERG every 64,800 blocks'],
            [FIXED_RATE_PERIOD + 2 * EPOCH_LENGTH, 'Treasury share ends'],
            [EIP27_ACTIVATION, 'EIP-27 activates'],
            [1_821_600, 'Emission falls below 15 ERG'],
            [REEMISSION_START - 1, 'Last emission block'],
            [REEMISSION_START, 'Only 3 ERG/block re-emission remains'],
            [REEMISSION_END, 'Re-emission contract runs dry (estimate)'],
          ].map(([h, note]) => (
            <tr key={h}>
              <td className="tabular-nums">{num(h)}</td>
              <td className="tabular-nums">{fmtDate(h)}</td>
              <td className="tabular-nums">{emissionAt(h)} ERG</td>
              <td className="tabular-nums">{h >= REEMISSION_END ? 0 : minerRewardAt(h)} ERG</td>
              <td>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="tong-cung">Total supply over time</h2>
      <Card className="not-prose my-6 p-4">
        <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">Total ERG issued by height</div>
        <LineChart
          label="Total ERG issued by height"
          points={supplyPoints}
          xFormat={mil}
          yFormat={mil}
          markers={markers}
          tooltip={(p) => (
            <>
              <div className="text-stone-500">
                Block {num(p.x)} · ≈ {fmtDate(p.x)}
              </div>
              <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{num(p.y)} ERG</div>
              <div className="text-stone-500">{((p.y / MAX_SUPPLY) * 100).toFixed(1)}% of max supply</div>
            </>
          )}
        />
      </Card>
      <p>
        Want the numbers at a specific height? Use the <Link to="/tools/emission-calculator">emission calculator</Link>. The dates above are estimates assuming
        2-minute blocks — real timing can drift by a few weeks.
      </p>
    </>
  )
}
