import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { erg, num, short } from '../../lib/format'
import { Async, Badge, Callout, Card, Erg, Field, Hash, TokenChip } from '../../components/ui'

/** Find a fresh output that carries at least two typed registers. */
async function pickBox() {
  const txs = (await api.latestTransactions(30)) ?? []
  for (const t of txs) {
    const o = t.outputs?.find((b) => b.registers?.length >= 2)
    if (o) return o
  }
  return txs[0]?.outputs?.[0] ?? null
}

/**
 * Decode a serialized Int/Long register (type byte + ZigZag-encoded VLQ).
 * Returns the intermediate steps so the article can show them.
 */
function decodeNumeric(raw) {
  const bytes = raw.match(/../g).map((h) => parseInt(h, 16))
  const [type, ...rest] = bytes
  let n = 0n
  let shift = 0n
  for (const b of rest) {
    n |= BigInt(b & 0x7f) << shift
    shift += 7n
    if (!(b & 0x80)) break
  }
  const value = n & 1n ? -((n + 1n) >> 1n) : n >> 1n
  return { type, vlq: rest, zigzag: n, value }
}

const TYPE_CODES = [
  ['0x01', 'Boolean'],
  ['0x02', 'Byte'],
  ['0x03', 'Short'],
  ['0x04', 'Int (32 bit)'],
  ['0x05', 'Long (64 bit)'],
  ['0x06', 'BigInt'],
  ['0x07', 'GroupElement (a point on secp256k1)'],
  ['0x08', 'SigmaProp'],
  ['0x0e', 'Coll[Byte] (byte array)'],
]

const linkCls = 'text-ergo-600 hover:underline dark:text-ergo-400'

function Registers({ box }) {
  const r3 = `(${box.creationHeight}, ${short(box.transactionId, 8, 6)}, ${box.index})`
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Package className="size-5 shrink-0 text-ergo-500" />
          <Hash value={box.boxId} to={`/box/${box.boxId}`} head={10} tail={8} />
        </div>
        <Badge tone={box.spent || box.spentBy ? 'stone' : 'green'}>{box.spent || box.spentBy ? 'spent' : 'unspent (UTXO)'}</Badge>
      </div>
      <Field name="R0 · value" value={<Erg nano={box.value} />}>
        The amount of ERG in the box, stored in nanoERG ({num(box.value)}). Mandatory.
      </Field>
      <Field name="R1 · script" value={<code className="font-mono text-xs break-all">{short(box.ergoTree, 40, 20)}</code>}>
        The ErgoTree — the condition for spending the box. The address{' '}
        <Link to={`/address/${box.address}`} className={linkCls}>
          {short(box.address, 8, 6)}
        </Link>{' '}
        is just a compact way of writing this script. See <Link to="/learn/ergotree" className={linkCls}>ErgoTree</Link>.
      </Field>
      <Field
        name="R2 · tokens"
        value={
          box.assets?.length ? (
            <div className="flex flex-wrap gap-1">
              {box.assets.map((a) => (
                <TokenChip key={a.tokenId} asset={a} />
              ))}
            </div>
          ) : (
            <span className="text-stone-400">(empty)</span>
          )
        }
      >
        A list of (token id, amount) pairs. May be empty.
      </Field>
      <Field name="R3 · creation info" value={<code className="font-mono text-xs">{r3}</code>}>
        (creationHeight, id of the transaction that created the box, output position). The height declared when the box was created — used for{' '}
        <Link to="/learn/storage-rent" className={linkCls}>storage rent</Link>.
      </Field>
      {box.registers.map((r) => {
        const numeric = /^0[45]/.test(r.raw) ? decodeNumeric(r.raw) : null
        return (
          <Field key={r.key} name={`${r.key} · ${r.type}`} value={<code className="font-mono text-xs break-all">{r.value}</code>}>
            Raw bytes: <code className="font-mono break-all">{r.raw}</code>
            {numeric && (
              <>
                {' '}— the first byte <code>0x{numeric.type.toString(16).padStart(2, '0')}</code> is the type code, the rest is a VLQ ={' '}
                <code>{numeric.zigzag.toString()}</code>, ZigZag-decoded → <code>{numeric.value.toString()}</code>.
              </>
            )}
          </Field>
        )
      })}
    </Card>
  )
}

export default function Box() {
  const state = useApi(pickBox, [])
  return (
    <>
      <p>
        On Ergo, money doesn't live in “accounts”. It lives in <strong>boxes</strong> — each one is like a locked container with some ERG inside, which can also
        hold tokens and carry up to six extra data “labels”. The entire state of the blockchain is simply the set of all unspent boxes (the UTXO set).
      </p>

      <h2 id="eutxo">The eUTXO model</h2>
      <p>
        Bitcoin uses UTXOs: each output has just a value and a locking script. Ergo <em>extends</em> this (extended UTXO) in two directions:
      </p>
      <ul>
        <li>
          Boxes carry <strong>arbitrary data</strong> in registers and native protocol-level <strong>tokens</strong>.
        </li>
        <li>
          The locking script can see <strong>the whole transaction</strong> spending it: the other outputs, data inputs, the current height… So a contract can say
          “this box may only be spent if output #0 pays me back at least 10 ERG”.
        </li>
      </ul>
      <p>
        Boxes are <strong>immutable</strong>: there's no “edit box” operation. To change state, a transaction spends the old box and creates a new one. A contract that needs to remember something between uses (an oracle, a DEX pool) is simply a chain of successive boxes, usually identified by an NFT that
        travels along with them.
      </p>

      <h2 id="registers">Ten registers: R0 – R9</h2>
      <p>Each box has up to 10 registers. The first four are mandatory and have fixed meanings:</p>
      <table>
        <thead>
          <tr>
            <th>Register</th>
            <th>Contents</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>R0</code>
            </td>
            <td>ERG value (nanoERG, type Long)</td>
          </tr>
          <tr>
            <td>
              <code>R1</code>
            </td>
            <td>The locking script, as a serialized ErgoTree</td>
          </tr>
          <tr>
            <td>
              <code>R2</code>
            </td>
            <td>Tokens: a list of (token id, amount)</td>
          </tr>
          <tr>
            <td>
              <code>R3</code>
            </td>
            <td>(creationHeight, txId, output index)</td>
          </tr>
          <tr>
            <td>
              <code>R4</code>–<code>R9</code>
            </td>
            <td>Optional, set by the box creator. Each register has an explicit type. They must be used contiguously (if R6 is set, R4 and R5 must be too).</td>
          </tr>
        </tbody>
      </table>

      <h2 id="vi-du">A real box</h2>
      <p>
        Here is an output just created on mainnet that uses optional registers. Boxes like this usually belong to contracts — price oracles, DEXes, NFT markets… —
        that store their state in R4–R9.
      </p>
      <Async state={state} notFound="Couldn't find an example box.">
        {(box) => <Registers box={box} />}
      </Async>

      <h3>How are registers encoded?</h3>
      <p>
        Each register is stored as a <em>typed constant</em>: the first byte gives the data type, followed by the value. Integers use ZigZag + VLQ encoding: VLQ stores a number in as few bytes as it needs, and ZigZag maps negative numbers onto small positive ones so they stay
        short too.
      </p>
      <table>
        <thead>
          <tr>
            <th>Type code</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {TYPE_CODES.map(([c, t]) => (
            <tr key={c}>
              <td>
                <code>{c}</code>
              </td>
              <td>{t}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Example: <code>04e8d403</code> → type <code>0x04</code> (Int), VLQ <code>e8 d4 03</code> = 60008, which ZigZag-decodes to <code>30004</code>.
      </p>

      <h2 id="box-id">Box id</h2>
      <p>
        <code>boxId = blake2b256(box bytes)</code>, where the bytes include all registers R0–R9. Since R3 contains the transaction id and output position, two boxes
        never share an id — even if they hold the same amount and have the same owner.
      </p>
      <Callout type="tip" title="See for yourself">
        Each input of a transaction is just a 32-byte <code>boxId</code>. The node looks that id up in the UTXO set; if it isn't there (already spent or never
        existed), the transaction is rejected — that's how double spending is prevented.
      </Callout>

      <h2 id="gia-tri-toi-thieu">Minimum value</h2>
      <p>
        Every box takes up space in the UTXO set that every node must store. So that nobody can fill it with millions of empty boxes, each box must hold at least{' '}
        <strong>360 nanoERG per byte</strong> of its size (the default value; miners can vote to change it). A typical wallet box is a few dozen to a few hundred
        bytes, so the minimum is only around {erg(360 * 100)}–{erg(360 * 300)} ERG. In practice, wallets usually use <code>0.001</code> ERG for each box holding
        tokens.
      </p>
      <p>
        A box that sits untouched for more than 4 years must also pay <Link to="/learn/storage-rent">storage rent</Link> — another unique Ergo mechanism.
      </p>

      <h2 id="gioi-han">Limits of boxes and registers</h2>
      <p>A few hard numbers every transaction must respect — knowing them up front saves a lot of debugging when you build boxes yourself:</p>
      <table>
        <thead>
          <tr>
            <th>Limit</th>
            <th>Value</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Box size</td>
            <td><strong>4,096 bytes</strong> (4 KB)</td>
            <td>The whole box — value, script, tokens and registers — must fit in 4 KB once serialized.</td>
          </tr>
          <tr>
            <td>Token types</td>
            <td><strong>255</strong></td>
            <td>A box can carry at most 255 distinct token ids (each with an amount up to 2<sup>63</sup> − 1).</td>
          </tr>
          <tr>
            <td>Registers</td>
            <td><strong>10</strong> (R0–R9)</td>
            <td>R0–R3 are always present. R4–R9 are optional but must be used <em>consecutively</em>: to use R5 you must also set R4 — no gaps.</td>
          </tr>
          <tr>
            <td>Minimum value</td>
            <td>360 nanoERG × size</td>
            <td>The largest possible box (4,096 bytes) needs {num(4096 * 360)} nanoERG ≈ {erg(4096 * 360)} ERG — still tiny.</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip" title="0.001 ERG is just a wallet habit">
        The 1,000,000 nanoERG (0.001 ERG) that many wallets use as the “minimum value” is a default of the wallet software, not a consensus rule. The real rule is
        360 nanoERG per byte, so a small box needs only a few tens of thousands of nanoERG — but using 0.001 ERG is never wrong.
      </Callout>

      <h2 id="guard-script">Guard scripts: the box&apos;s lock</h2>
      <p>
        The script in register R1 is called the <strong>guard script</strong>. It doesn&apos;t “run a program” in the usual sense. It runs only when a transaction tries
        to spend the box: the node hands the script the full context — the transaction being checked, its inputs, outputs, data inputs and the current height — and
        the script must answer <strong>true</strong>. If it answers false, or the proof (signature) is invalid, the whole transaction is rejected. That is why the
        Cardano and Ergo communities often call these scripts <em>validators</em> rather than “smart contracts”.
      </p>
      <p>
        Guard scripts are stored as compiled bytes (<Link to="/learn/ergotree">ErgoTree</Link>); the language you write them in is ErgoScript. The guard-script section of{' '}
        <Link to="/learn/ergotree#guard-script">ErgoScript, guard scripts &amp; ErgoTree</Link> goes deeper. Because the address
        is derived from the script, two boxes with identical scripts share the same address. Some common locks:
      </p>
      <table>
        <thead>
          <tr>
            <th>Kind</th>
            <th>ErgoScript</th>
            <th>Who can open it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Public key (P2PK)</td>
            <td><code>sigmaProp(pk)</code></td>
            <td>Whoever holds the private key for <code>pk</code> — an ordinary wallet.</td>
          </tr>
          <tr>
            <td>Time lock</td>
            <td><code>sigmaProp(HEIGHT &gt; 1200000) &amp;&amp; pk</code></td>
            <td>The key holder, but only once the chain passes block 1,200,000.</td>
          </tr>
          <tr>
            <td>Multisig / threshold</td>
            <td><code>atLeast(2, Coll(pk1, pk2, pk3))</code></td>
            <td>Any 2 of the 3 signers together.</td>
          </tr>
          <tr>
            <td>Condition on the transaction</td>
            <td><code>sigmaProp(OUTPUTS(0).value &gt;= SELF.value)</code></td>
            <td>Anyone, as long as the first output keeps at least this box&apos;s ERG — the basis of multi-step contracts.</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn" title="ErgoScript is deliberately not Turing-complete">
        Some tutorials call ErgoScript a Turing-complete language; it is the opposite by design: no unbounded loops or recursion, which is why a node can compute
        a script&apos;s cost <em>before</em> running it and why fees stay predictable. Ergo reaches “Turing completeness” at the blockchain level — by chaining
        transactions that spend one box to create the next — not inside a single script. See <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link>.
      </Callout>

      <h2 id="xem-them">What's next</h2>
      <ul>
        <li>
          <Link to="/learn/transaction">Transactions</Link> — how boxes are spent and created.
        </li>
        <li>
          <Link to="/learn/tokens">Tokens (EIP-4)</Link> — R2 and the metadata registers.
        </li>
        <li>
          <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link> — what's inside R1.
        </li>
        <li>
          <a href="https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e" target="_blank" rel="noreferrer">
            Learning Ergo 101: eUTXO explained for human beings
          </a>{' '}
          — an external article explaining the eUTXO model from an app builder&apos;s point of view.
        </li>
        <li>
          <a href="https://deco-education.github.io/deco-docs/docs/into-the-woods/trail1-eutxo-n-nfts/registers-guardscripts-ergoscript" target="_blank" rel="noreferrer">
            DECO Education — Registers, Guard Scripts, ErgoScript
          </a>{' '}
          — a lesson from the “Into the Woods” course on registers, box limits and common guard scripts.
        </li>
      </ul>
    </>
  )
}
