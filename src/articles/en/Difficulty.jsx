import { Link } from 'react-router-dom'
import { Check, Gauge, Timer, Zap } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { compact, num } from '../../lib/format'
import { Async, Callout, Card, Field, Stat } from '../../components/ui'
import LineChart from '../../components/LineChart'

// Order of the secp256k1 group; Ergo's target is q / difficulty.
const Q = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/** Compact "nBits" → big integer (same format as Bitcoin, but it encodes the difficulty). */
function decodeNBits(hex) {
  const n = parseInt(hex, 16)
  const exponent = n >>> 24
  const mantissa = n & 0x007fffff
  const value = exponent <= 3 ? BigInt(mantissa >> (8 * (3 - exponent))) : BigInt(mantissa) << BigInt(8 * (exponent - 3))
  return { n, exponent, mantissa, value }
}

const shortDate = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

function LiveNBits() {
  const state = useApi(() => Promise.all([api.latestBlocks(1), api.networkState()]), [])
  return (
    <Async state={state}>
      {([blocks, net]) => {
        const b = blocks?.[0]
        if (!b?.nBits) return <p>Couldn&apos;t fetch the latest block.</p>
        const d = decodeNBits(b.nBits)
        const matches = d.value === BigInt(b.difficulty)
        const target = Q / d.value
        const hashrate = Number(d.value) / 120
        return (
          <>
            <Card className="not-prose my-6 p-2 sm:p-4">
              <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Block <Link to={`/block/${b.height}`} className="text-ergo-600 hover:underline">#{num(b.height)}</Link>
              </div>
              <Field name="nBits" value={<span className="font-mono">0x{b.nBits.padStart(8, '0')}</span>}>
                4 bytes in the header: a 1-byte exponent + a 3-byte mantissa.
              </Field>
              <Field name="Exponent" value={<span className="font-mono">0x{d.exponent.toString(16).padStart(2, '0')} = {d.exponent}</span>}>
                The total number of bytes in the full number.
              </Field>
              <Field name="Mantissa" value={<span className="font-mono">0x{d.mantissa.toString(16)} = {num(d.mantissa)}</span>}>
                The first 3 significant bytes of the number.
              </Field>
              <Field
                name="Decoded"
                value={
                  <span className="font-mono break-all">
                    {num(d.mantissa)} × 256<sup>{d.exponent - 3}</sup> = {d.value.toLocaleString('en-US')}
                  </span>
                }
              >
                {matches ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <Check className="size-3.5" /> Exactly equal to the block&apos;s difficulty field ({num(b.difficulty)}).
                  </span>
                ) : (
                  <>Compare with the difficulty returned by the API: {num(b.difficulty)}.</>
                )}
              </Field>
              <Field name="Target = q / difficulty" value={<span className="font-mono break-all">0x{target.toString(16).padStart(64, '0')}</span>}>
                The hash of the PoW solution must be smaller than this number. Notice the leading zeros.
              </Field>
            </Card>

            <h2 id="hashrate">From difficulty to hashrate</h2>
            <p>
              Each attempt succeeds with probability roughly <em>target / 2²⁵⁶ ≈ 1 / difficulty</em>. So on average the whole network needs about{' '}
              <em>difficulty</em> attempts per block, and if each block takes ~120 seconds:
            </p>
            <pre>
              <code>{`hashrate ≈ difficulty / 120 s
         ≈ ${num(b.difficulty)} / 120
         ≈ ${compact(hashrate)} H/s  ≈ ${(hashrate / 1e12).toFixed(2)} TH/s`}</code>
            </pre>
            {net && (
              <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
                <Stat icon={Zap} label="Hashrate (explorer)" value={`${net.hashrate} TH/s`} sub={`7 days: ${net.hashrateChange7d > 0 ? '+' : ''}${net.hashrateChange7d}%`} />
                <Stat icon={Gauge} label="Difficulty" value={compact(net.difficulty)} sub={num(net.difficulty)} />
                <Stat icon={Timer} label="Avg. block time" value={`${net.avgBlockTimeSec.toFixed(1)} s`} sub="Target: 120 s" />
              </div>
            )}
          </>
        )
      }}
    </Async>
  )
}

function DifficultyChart() {
  const state = useApi(() => api.chart('difficulty', 180), [])
  return (
    <Async state={state}>
      {(c) =>
        c?.points?.length ? (
          <Card className="not-prose my-6 p-4">
            <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">Daily difficulty, last 180 days</div>
            <LineChart
              label="Ergo network difficulty, 180 days"
              points={c.points.map((p) => ({ x: p.t, y: p.v }))}
              xFormat={shortDate}
              yFormat={compact}
              tooltip={(p) => (
                <>
                  <div className="text-stone-500">{new Date(p.x).toISOString().slice(0, 10)}</div>
                  <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{num(p.y)}</div>
                  <div className="text-stone-500">≈ {(p.y / 120 / 1e12).toFixed(2)} TH/s</div>
                </>
              )}
            />
          </Card>
        ) : (
          <p>No chart data yet.</p>
        )
      }
    </Async>
  )
}

export default function Difficulty() {
  return (
    <>
      <p>
        If twice as many GPUs suddenly joined the network, blocks would come twice as fast — unless the puzzle became twice as hard. <strong>Difficulty</strong>{' '}
        is the dial that keeps Ergo ticking at an average of <strong>one block every 2 minutes</strong>, no matter how many miners there are.
      </p>

      <h2 id="target">Target and difficulty</h2>
      <p>
        In <Link to="/learn/autolykos">Autolykos</Link>, a solution is valid when the final hash — read as a 256-bit integer — is below a threshold called the{' '}
        <strong>target</strong>. The smaller the target, the harder it is. Ergo defines:
      </p>
      <pre>
        <code>{`target = q / difficulty
q = order of the secp256k1 group
  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141`}</code>
      </pre>
      <p>
        Here <code>q</code> is just a fixed, enormous constant — about 1.16 × 10<sup>77</sup>, close to 2<sup>256</sup>. Dividing it by the difficulty gives
        the target: at today&apos;s difficulty of roughly 6 × 10<sup>13</sup>, only about one hash in 60 trillion falls below it.
      </p>
      <p>
        That makes difficulty the more intuitive number: doubling the difficulty means twice as many attempts are needed on average. And unlike Bitcoin (whose
        header stores the target), an Ergo header stores the <em>difficulty</em> itself, in compressed form.
      </p>

      <h2 id="nbits">nBits: squeezing a huge number into 4 bytes</h2>
      <p>
        Difficulty can be a very large number, but the header only reserves 4 bytes for it. Ergo reuses Bitcoin&apos;s “compact” format: the first byte is the{' '}
        <strong>exponent</strong> (the length of the number in bytes), and the next 3 bytes are the <strong>mantissa</strong> (its first 3 significant bytes). To
        decode:
      </p>
      <pre>
        <code>{`value = mantissa × 256^(exponent − 3)`}</code>
      </pre>
      <p>Let&apos;s decode the nBits of the latest block and compare it with the difficulty reported by the explorer:</p>
      <LiveNBits />
      <Callout type="note" title="Only an estimate">
        Nobody can count the real hashrate. The explorer infers it from the difficulty and the time between blocks, so the figure fluctuates with miners&apos;
        short-term luck.
      </Callout>

      <h2 id="dieu-chinh">Difficulty adjustment</h2>
      <p>
        Originally, Ergo recalculated the difficulty every <strong>1024-block epoch</strong> using linear regression (linear least squares) over the last 8
        epochs — predicting the hashrate trend rather than just looking at the previous epoch like Bitcoin does.
      </p>
      <p>
        Long epochs make the network slow to react when hashrate swings sharply (for example, when miners flock to another coin). So <strong>EIP-37</strong> —
        activated in October 2022 at block 844,673 — changed the algorithm:
      </p>
      <ul>
        <li>
          Epochs were shortened to <strong>128 blocks</strong> (~4 hours 16 minutes), so difficulty is updated far more often.
        </li>
        <li>The new difficulty is the average of the linear-regression prediction and a “Bitcoin-style” calculation based on the previous epoch.</li>
        <li>The change per adjustment is capped (roughly ±50%) to avoid overly large jumps.</li>
      </ul>
      <p>
        The exact details (coefficients, rounding) are in the EIP-37 specification and the reference node&apos;s source code. The key takeaway: the average block
        time is always pulled back to around 120 seconds.
      </p>
      <DifficultyChart />

      <h2 id="xem-them">See also</h2>
      <ul>
        <li>
          <Link to="/learn/autolykos">Autolykos v2</Link> — the hash that gets compared with the target.
        </li>
        <li>
          <Link to="/learn/block">Blocks &amp; headers</Link> — where nBits lives in the header.
        </li>
        <li>
          <Link to="/learn/emission">Emission schedule</Link> — the reward a miner earns for winning.
        </li>
      </ul>
    </>
  )
}
