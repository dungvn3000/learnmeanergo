import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { BLOCK_TIME_SEC, MIN_VALUE_PER_BYTE, STORAGE_FEE_FACTOR, STORAGE_PERIOD } from '../../lib/ergo'
import { erg, num } from '../../lib/format'
import { Callout, Card, Field } from '../../components/ui'

const years = (blocks) => (blocks * BLOCK_TIME_SEC) / (365.25 * 86400)

function RentCalculator() {
  const [size, setSize] = useState(100)
  const [value, setValue] = useState(1)
  const [created, setCreated] = useState('')
  const info = useApi(() => api.info(), [])
  const height = info.data?.height

  const fee = size * STORAGE_FEE_FACTOR // nanoERG per period
  const minValue = size * MIN_VALUE_PER_BYTE
  const valueNano = Math.round(value * 1e9)
  const periodsLeft = Math.floor(valueNano / fee)
  const createdH = Number(created || (height ? height - 1_200_000 : 0))
  const claimableAt = createdH + STORAGE_PERIOD

  const input = 'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono tabular-nums outline-none focus:border-ergo-400 dark:border-stone-700 dark:bg-stone-900'

  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">Storage rent calculator</div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Box size (bytes)</span>
          <input type="range" min="40" max="4096" value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-ergo-500" />
          <span className="font-mono text-xs text-stone-500">{num(size)} bytes</span>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Box value (ERG)</span>
          <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Created at height</span>
          <input
            type="number"
            min="0"
            placeholder={height ? String(height - 1_200_000) : ''}
            value={created}
            onChange={(e) => setCreated(e.target.value)}
            className={input}
          />
        </label>
      </div>
      <div className="mt-4">
        <Field name="Fee per period" value={<span className="font-mono">{num(size)} × {num(STORAGE_FEE_FACTOR)} = {erg(fee)} ERG</span>}>
          The most a miner can take each time the box becomes “overdue”.
        </Field>
        <Field name="Minimum value" value={<span className="font-mono">{num(size)} × {MIN_VALUE_PER_BYTE} = {erg(minValue)} ERG</span>}>
          A box below this value can&apos;t be created in the first place.
        </Field>
        <Field
          name="Box survives"
          value={
            valueNano < fee ? (
              <span className="font-semibold text-amber-600">Less than 1 period — a miner can take the whole box once it&apos;s overdue.</span>
            ) : (
              <span>
                {num(periodsLeft)} periods ≈ {num(periodsLeft * years(STORAGE_PERIOD), 0)} years if it&apos;s never touched
              </span>
            )
          }
        />
        {height && (
          <Field
            name="Overdue from block"
            value={
              <span className="font-mono">
                {num(claimableAt)}{' '}
                <span className="font-sans text-xs">
                  {claimableAt <= height ? (
                    <span className="font-semibold text-amber-600">— can already be charged (current height: {num(height)})</span>
                  ) : (
                    <span className="text-stone-500">— {num(claimableAt - height)} blocks to go (≈ {years(claimableAt - height).toFixed(1)} years)</span>
                  )}
                </span>
              </span>
            }
          />
        )}
      </div>
    </Card>
  )
}

export default function StorageRent() {
  return (
    <>
      <p>
        Every Ergo node has to keep the entire set of unspent boxes (the UTXO set) to validate new transactions. That set can only grow: people create new boxes
        all the time, while forgotten boxes — wallets with lost seeds, token dust, developer experiments — sit there forever. In Bitcoin, users pay a fee{' '}
        <em>once</em> when creating an output, and then get stored for free, forever, on every node&apos;s machine. Ergo answers the question “who pays for
        storage forever?” with <strong>storage rent</strong> (also called demurrage).
      </p>

      <h2 id="quy-tac">The rule</h2>
      <p>
        If a box sits untouched — not spent, not “refreshed” — for <strong>{num(STORAGE_PERIOD)} blocks</strong> (≈ {years(STORAGE_PERIOD).toFixed(0)} years), a
        miner is allowed to touch it even without the key:
      </p>
      <ul>
        <li>
          If the box&apos;s value is <strong>greater</strong> than the fee: the miner takes exactly the fee, and must recreate an identical box (same script,
          tokens and registers) holding the value minus the fee, with a new creation height. The 4-year clock starts again.
        </li>
        <li>
          If the box&apos;s value is <strong>less</strong> than the fee: the miner takes <strong>everything</strong> in it — the ERG and any tokens or
          NFTs — and the box disappears from the UTXO set.
        </li>
      </ul>
      <Callout type="warn" title="Tokens and NFTs are not exempt">
        Rent is paid in ERG, but when a box can no longer cover it the miner claims the whole box, tokens included. A box that holds a valuable NFT next to the
        bare-minimum ERG is exactly the kind that gets emptied first if it is left untouched for years.
      </Callout>
      <p>The fee is based on the box&apos;s size:</p>
      <pre>
        <code>{`fee = boxSizeInBytes × storageFeeFactor
storageFeeFactor = ${num(STORAGE_FEE_FACTOR)} nanoERG / byte  (= ${erg(STORAGE_FEE_FACTOR)} ERG / byte, default value)`}</code>
      </pre>
      <Callout type="note" title="Votable parameters">
        <code>storageFeeFactor</code> and <code>minValuePerByte</code> are network parameters. Miners vote to change them through the <code>votes</code> field in
        the header, so the actual values may differ from the defaults above. The 4-year period itself is different: changing it would take a hard fork, which
        the community generally avoids.
      </Callout>

      <h2 id="vi-du">A worked example</h2>
      <p>
        A typical wallet box (P2PK, no tokens) is around 100 bytes. The fee per period is 100 × {num(STORAGE_FEE_FACTOR)} = {num(100 * STORAGE_FEE_FACTOR)}{' '}
        nanoERG = <strong>{erg(100 * STORAGE_FEE_FACTOR)} ERG every 4 years</strong>. For a box holding 10 ERG, that&apos;s 1.25% every 4 years — and it only
        applies if you don&apos;t touch your wallet for the full 4 years. Sending your funds to yourself once resets the clock.
      </p>
      <p>
        Ergo&apos;s own explainer puts the typical charge at <strong>about 0.14 ERG plus a transaction fee</strong> per box — slightly more than our 100-byte
        figure, because real wallet boxes are often a little bigger. The same explainer notes that a box holding <strong>1 ERG</strong> would take about{' '}
        <strong>32 years</strong> of total inactivity before a miner could empty it — for a 100-byte box that is exactly 8 periods × 0.125 ERG. The calculator
        below starts from exactly that case.
      </p>
      <RentCalculator />

      <h2 id="gia-tri-toi-thieu">Minimum box value</h2>
      <p>
        The flip side of storage rent is the <strong>minimum value</strong> rule: every box must hold at least{' '}
        <code>{MIN_VALUE_PER_BYTE} nanoERG × size</code> (by default). This stops anyone from creating millions of “dust” boxes almost for free to bloat the UTXO
        set. It&apos;s why the minimum output in a wallet is usually around 0.001 ERG — comfortably above the minimum even for larger boxes carrying tokens.
      </p>

      <h2 id="vi-sao-tot">Why this is a good thing</h2>
      <ul>
        <li>
          <strong>Prevents state bloat</strong>: abandoned data is gradually cleared out of the UTXO set, so the cost of running a node doesn&apos;t grow forever.
        </li>
        <li>
          <strong>Garbage collection for dust</strong>: tiny amounts scattered across thousands of forgotten boxes are the first to be swept up, because they
          can&apos;t cover even one period of rent.
        </li>
        <li>
          <strong>Steady income for miners</strong>: once emission ends, storage rent is a revenue stream that doesn&apos;t depend on how busy the network is —
          on top of transaction fees and <Link to="/learn/emission">EIP-27 re-emission</Link>.
        </li>
        <li>
          <strong>Lost coins return to circulation</strong>: ERG in a wallet with a lost seed isn&apos;t locked away forever as it would be with Bitcoin; it slowly
          flows back to miners. That keeps coins in circulation and softens the slow deflation every capped-supply coin suffers from lost keys.
        </li>
        <li>
          <strong>Fairness</strong>: those who take up more storage (bigger boxes) pay more than those who take up less.
        </li>
      </ul>
      <Callout type="tip" title="It has already happened">
        Ergo mainnet launched in July 2019, so the very first boxes reached the {num(STORAGE_PERIOD)}-block mark around mid-2023 — since then, storage rent has
        been a real part of mainnet economics rather than a theory.
      </Callout>

      <h2 id="lam-sao-tranh">How do I avoid paying it?</h2>
      <p>
        Simple: every so often (less than once every 4 years), spend your boxes — for example, send your whole balance to yourself. New boxes are created with a
        new height, and the clock starts over.
      </p>
      <p>
        Rent is charged <em>per box</em>, so it also helps to <strong>consolidate</strong>: sending everything to one of your addresses in a single transaction
        merges many small boxes into a few larger ones — fewer boxes that could ever be charged, and each one far from the danger zone.
      </p>
      <p>
        Want to understand where a box&apos;s size comes from? See <Link to="/learn/box">Boxes &amp; registers</Link>.
      </p>

      <h2 id="doc-them">Further reading</h2>
      <ul>
        <li>
          <a href="https://ergoplatform.org/en/blog/2022-02-18-ergo-explainer-storage-rent/" target="_blank" rel="noreferrer">
            Ergo Explainer: Storage Rent
          </a>{' '}
          — Ergo Platform blog, 18 February 2022.
        </li>
      </ul>
    </>
  )
}
