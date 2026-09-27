import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { decodeAddress, P2PK_TREE_PREFIX } from '../../lib/ergo'
import { short } from '../../lib/format'
import { Async, Badge, Callout, Card, Field, Hash } from '../../components/ui'
import { isFeeBox } from '../../components/TxFlow'

const FEE_TREE =
  '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304'

const TONES = {
  header: 'bg-ergo-100 text-ergo-800 dark:bg-ergo-900/50 dark:text-ergo-200',
  type: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  op: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  data: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rest: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
}

/** Colored hex segments with a legend underneath. */
function Bytes({ parts }) {
  return (
    <div className="not-prose my-6">
      <div className="rounded-xl border border-stone-200 bg-white p-4 font-mono text-sm leading-7 break-all dark:border-stone-800 dark:bg-stone-900">
        {parts.map((p, i) => (
          <span key={i} className={`mr-0.5 rounded px-1 py-0.5 ${TONES[p.tone]}`} title={p.label}>
            {p.hex}
          </span>
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {parts.map((p, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`shrink-0 rounded px-1.5 font-mono text-xs leading-6 ${TONES[p.tone]}`}>
              {p.hex.length > 10 ? p.hex.slice(0, 6) + '…' : p.hex}
            </span>
            <span className="text-stone-600 dark:text-stone-400">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveP2PK() {
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) => {
        const b = blocks?.[0]
        let tree = null
        try {
          tree = b?.minerAddress ? decodeAddress(b.minerAddress).ergoTree : null
        } catch {
          tree = null
        }
        if (!tree) return <p>Couldn’t fetch the miner address of the latest block.</p>
        return (
          <>
            <p>
              Here is the ErgoTree of the address that mined block <Link to={`/block/${b.height}`}>#{b.height.toLocaleString('en-US')}</Link> (
              {b.miner || 'miner'}): <Hash value={b.minerAddress} to={`/address/${b.minerAddress}`} />
            </p>
            <Bytes
              parts={[
                { hex: '00', tone: 'header', label: 'Header: version 0, no constant segregation, no size field' },
                { hex: '08', tone: 'type', label: 'SigmaProp type code — the body is a single constant of type SigmaProp' },
                { hex: 'cd', tone: 'op', label: 'ProveDlog: “prove you know the secret key of the following pubkey”' },
                { hex: tree.slice(6), tone: 'data', label: '33-byte compressed public key (a GroupElement on secp256k1)' },
              ]}
            />
          </>
        )
      }}
    </Async>
  )
}

const DECO = 'https://deco-education.github.io/deco-docs/docs/into-the-woods/trail1-eutxo-n-nfts/registers-guardscripts-ergoscript'

/** Guard script “kind” of a box, judged from its address type and a few well-known trees. */
function kindOf(box) {
  if (isFeeBox(box)) return { label: 'Fee contract', tone: 'ergo', note: 'P2S — collected by the block’s miner; the reward box it goes into is locked for 720 blocks' }
  try {
    const d = decodeAddress(box.address)
    if (d.type === 1) return { label: 'P2PK', tone: 'green', note: 'sigmaProp(pk) — needs the key holder’s signature' }
    if (d.type === 2) return { label: 'P2SH', tone: 'violet', note: 'hash of a script — revealed when spent' }
    return { label: 'P2S', tone: 'sky', note: 'custom script — a real contract' }
  } catch {
    return { label: '?', tone: 'stone', note: '' }
  }
}

/** Outputs of the newest transactions, labeled by the kind of guard script that locks them. */
function LiveGuards() {
  const state = useApi(() => api.latestTransactions(6), [])
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">Locks on boxes just created on mainnet</div>
      <Async state={state}>
        {(txs) => {
          const outs = txs.flatMap((t) => t.outputs.map((o) => ({ ...o, txId: t.id }))).slice(0, 10)
          return (
            <div className="divide-y divide-stone-100 text-sm dark:divide-stone-800">
              {outs.map((o) => {
                const k = kindOf(o)
                return (
                  <div key={o.boxId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <Hash value={o.boxId} to={`/box/${o.boxId}`} head={6} tail={4} copy={false} className="w-28" />
                    <Badge tone={k.tone}>{k.label}</Badge>
                    <span className="min-w-0 flex-1 truncate text-stone-500">{k.note}</span>
                    <span className="font-mono text-[11px] text-stone-400">R1 = {short(o.ergoTree, 10, 6)}</span>
                  </div>
                )
              })}
            </div>
          )
        }}
      </Async>
      <p className="mt-3 text-xs text-stone-500">
        Most boxes are P2PK — ordinary wallets. Every transaction also creates a fee box (P2S). Now and then you&apos;ll see a long P2S box: those are DeFi
        contracts, oracles or token mints.
      </p>
    </Card>
  )
}

export default function ErgoTree() {
  return (
    <>
      <p>
        Every <Link to="/learn/box">box</Link> on Ergo carries a piece of code that decides <em>who</em> (or <em>under what conditions</em>) may spend it.
        That code is stored on the blockchain as an <strong>ErgoTree</strong> — a syntax tree serialized into bytes. What developers actually write is{' '}
        <strong>ErgoScript</strong>, a Scala-like language that compiles down to ErgoTree.
      </p>
      <p>
        In other words: ErgoScript is for humans, ErgoTree is for nodes. A node never sees ErgoScript — it only reads bytes and evaluates the tree.
      </p>

      <h2 id="ergoscript">ErgoScript: what does a contract look like?</h2>
      <p>An ErgoScript contract is an expression that returns a <code>SigmaProp</code> — a “statement that must be proven”. A simple example:</p>
      <pre>
        <code>{`{
  // Only Alice can spend this box, and only after block 1,000,000
  sigmaProp(HEIGHT > 1000000) && alicePk
}`}</code>
      </pre>
      <p>This expression has two parts:</p>
      <ul>
        <li>
          <code>sigmaProp(HEIGHT &gt; 1000000)</code> — an ordinary boolean condition that the node checks by itself from the context (the current block
          height).
        </li>
        <li>
          <code>alicePk</code> — a <Link to="/learn/sigma">sigma proposition</Link>: the spender must produce a cryptographic proof that they know Alice’s
          secret key.
        </li>
      </ul>
      <p>
        A script can read a lot from the transaction context: <code>SELF</code> (the box being spent), <code>INPUTS</code>, <code>OUTPUTS</code>,{' '}
        <code>CONTEXT.dataInputs</code>, <code>HEIGHT</code>, the registers <code>R4</code>–<code>R9</code> of any box… This lets a box set rules for the
        transaction that spends it — for example “the first output must pay at least 100 ERG back to this address”. That is exactly the “extended” in{' '}
        <strong>eUTXO</strong>.
      </p>
      <Callout type="tip" title="No infinite loops">
        ErgoScript has no unbounded loops or recursion. The execution cost of every script is estimated and capped, so a contract can never make a node
        “hang”. For multi-step logic, you chain several transactions together.
      </Callout>

      <h2 id="guard-script">Guard scripts: what an ErgoScript contract actually does</h2>
      <p>
        An ErgoScript program placed in a box&apos;s register R1 is called a <strong>guard script</strong>: it decides <em>who</em> may spend the box and{' '}
        <em>under what conditions</em>. On Ergo there is nothing but boxes and guard scripts, so before looking at bytes, here is what a guard script is for.
      </p>
      <LiveGuards />

      <h2 id="guard-validator">A guard script is a validator, not a program</h2>
      <p>
        On Ethereum a contract is a program with its own state, and you “call its functions”. On Ergo a guard script <strong>does not run when you send money to
        a box</strong> — it runs exactly once, when someone tries to <em>spend</em> the box. At that moment the node executes the script against the full context
        of the transaction being checked:
      </p>
      <table>
        <thead>
          <tr>
            <th>ErgoScript variable</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>SELF</code></td>
            <td>The box being spent — its value, tokens and registers.</td>
          </tr>
          <tr>
            <td><code>INPUTS</code>, <code>OUTPUTS</code></td>
            <td>Every box going into and out of the transaction. A script can demand that outputs have a particular shape.</td>
          </tr>
          <tr>
            <td><code>CONTEXT.dataInputs</code></td>
            <td>Read-only boxes (oracles, parameters) — see <Link to="/learn/transaction">Transactions</Link>.</td>
          </tr>
          <tr>
            <td><code>HEIGHT</code></td>
            <td>The current block height — used for time locks.</td>
          </tr>
          <tr>
            <td><code>CONTEXT.minerPubKey</code></td>
            <td>The key of the miner of this block — the fee contract uses it.</td>
          </tr>
        </tbody>
      </table>
      <p>
        The script must return <strong>true</strong> for the box to be spent; if it returns false, the <em>whole transaction</em> is rejected and nothing changes.
        That is why the Ergo and Cardano communities call guard scripts <em>validators</em>: they only approve or reject a transaction you have already built —
        they never do anything on their own.
      </p>

      <h2 id="guard-sigma">True/false … plus a signature</h2>
      <p>
        More precisely, a guard script doesn&apos;t return a bare true/false bit but a <strong>sigma proposition</strong> (<code>SigmaProp</code>). The node reduces
        the script against the context: ordinary conditions (height, output values…) are evaluated to true/false right away, while the “prove you know the secret
        key” parts are kept as a tree of cryptographic conditions. Whoever spends the box must supply a signature satisfying that tree — that signature is the{' '}
        <em>spending proof</em> attached to the input. The whole mechanism is explained in <Link to="/learn/sigma">sigma protocols</Link>.
      </p>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-600">
            <CheckCircle2 className="size-4" /> The box is spent when
          </div>
          <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>every ordinary condition in the script holds, and</li>
            <li>the signature (proof) satisfies the remaining cryptographic part, and</li>
            <li>the script&apos;s execution cost is within the limit.</li>
          </ul>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 font-semibold text-red-600">
            <XCircle className="size-4" /> The transaction is rejected when
          </div>
          <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>any input&apos;s script evaluates to false,</li>
            <li>a signature for an input is missing or wrong,</li>
            <li>or the script reduces to an absolute <code>false</code> (the box is “burned” forever — nobody can spend it).</li>
          </ul>
        </Card>
      </div>

      <h2 id="guard-kinds">Common kinds of guard script</h2>
      <p>Written in ErgoScript, compiled to an <Link to="/learn/ergotree">ErgoTree</Link> and placed in R1:</p>
      <h3>1. Public key — an ordinary wallet (P2PK)</h3>
      <pre>
        <code>{`sigmaProp(pk)   // pk is your public key`}</code>
      </pre>
      <p>
        Only the holder of the matching private key can sign. Every address starting with <code>9</code> is this script with a different key — see{' '}
        <Link to="/learn/address">Addresses</Link>.
      </p>
      <h3>2. Time lock</h3>
      <pre>
        <code>{`sigmaProp(HEIGHT > 1200000) && pk`}</code>
      </pre>
      <p>The key holder still has to sign, but the transaction is only valid once the chain has passed block 1,200,000. Used for vesting and time-limited escrow.</p>
      <h3>3. Multiple signatures / threshold</h3>
      <pre>
        <code>{`atLeast(2, Coll(pk1, pk2, pk3))   // any 2 of 3
pk1 && pk2                          // both must sign
pk1 || pk2                          // either one — a ring signature`}</code>
      </pre>
      <h3>4. Conditions on the outputs — multi-step contracts</h3>
      <pre>
        <code>{`sigmaProp(
  OUTPUTS(0).value >= SELF.value &&
  OUTPUTS(0).propositionBytes == SELF.propositionBytes
)`}</code>
      </pre>
      <p>
        Anyone can spend this box, as long as the first output keeps at least the old ERG <em>and</em> carries this same script. Such “self-replicating” boxes are
        how Ergo builds stateful contracts: the emission contract, oracle pools and DEXes are all variations of this pattern. See the block reward transaction in{' '}
        <Link to="/learn/transaction#coinbase">Transactions</Link>.
      </p>
      <h3>5. Hash lock (HTLC)</h3>
      <pre>
        <code>{`sigmaProp(blake2b256(getVar[Coll[Byte]](0).get) == expectedHash) && pk`}</code>
      </pre>
      <p>
        The spender must reveal a secret with a given hash (passed in through the context variable <code>getVar</code>). Combined with a time lock, this is the basis
        of cross-chain atomic swaps.
      </p>

      <h2 id="guard-address">The script determines the address</h2>
      <p>
        An Ergo address is just a readable encoding of the ErgoTree, so <strong>two boxes with identical guard scripts have the same address</strong>. That is why
        every fee box on the network sits at a single P2S address (starting with <code>2iHkR7…</code>), and why a “contract&apos;s balance” is simply the sum of the
        boxes carrying that script. You can split any address back into its script with the <Link to="/tools/address-decoder">address decoder</Link>.
      </p>

      <h2 id="ergotree-layout">The byte layout of an ErgoTree</h2>
      <p>
        This section is for readers who want to read a tree byte by byte, as the address decoder does. If you only care about what contracts do, skip to the
        fee-contract example below. A serialized ErgoTree consists of four parts, in this order:
      </p>
      <ol>
        <li>
          <strong>Header</strong> (1 byte): the low 3 bits are the version; bit <code>0x08</code> signals that a size field follows; bit <code>0x10</code>{' '}
          signals that the tree uses <em>constant segregation</em>.
        </li>
        <li>
          <strong>Size</strong> (optional) — the length of the rest of the tree, written as a VLQ (a compact variable-length integer). Mandatory from
          ErgoTree version 1 onwards, so a node can skip a tree without fully understanding it.
        </li>
        <li>
          <strong>Constants list</strong> (with constant segregation): a count, then each constant as <code>type ‖ value</code>.
        </li>
        <li>
          <strong>Tree body</strong>: the expression itself, written as opcodes followed by their operands — each operation comes first, then the things it
          operates on (pre-order traversal).
        </li>
      </ol>
      <Card className="not-prose my-6 p-2 sm:p-4">
        <Field name="0x00" value="Version 0, no constant segregation">
          The most compact form. Constants sit inline in the tree body. Most P2PK wallet addresses use this header.
        </Field>
        <Field name="0x10" value="Version 0 + constant segregation">
          Constants are pulled out to the front of the tree; the body only holds “placeholders” (<code>ConstantPlaceholder</code>, opcode <code>0x73</code>).
        </Field>
        <Field name="0x18 / 0x19…" value="With size field, version ≥ 0/1">
          Adds bit <code>0x08</code> (the size flag). Version 1 and above always include the size.
        </Field>
      </Card>

      <h2 id="p2pk">Anatomy of a P2PK tree: 0008cd…</h2>
      <p>
        The most common contract on Ergo is “only the owner of this public key can spend” — the ErgoScript equivalent of <code>{'{ pk }'}</code>. Every
        ordinary wallet address (starting with <code>9</code>) represents this tree. It always has the form <code>{P2PK_TREE_PREFIX}</code> + a 33-byte
        public key:
      </p>
      <LiveP2PK />
      <p>
        Just 36 bytes. That is why a <Link to="/learn/address">P2PK address</Link> doesn’t store the whole tree, only the 33-byte public key — wallets and
        nodes always know how to rebuild the tree by prepending <code>0008cd</code>.
      </p>

      <h2 id="constant-segregation">Constant segregation: separating constants from logic</h2>
      <p>
        Imagine a thousand people using the same time-lock contract, differing only in their public key and unlock height. If constants were mixed into the
        tree, every box would be a completely different byte string. With <strong>constant segregation</strong>, all constants are lifted to the front of the
        tree, and the body only contains references <code>7300</code>, <code>7301</code>… (placeholder 0, placeholder 1…). The benefits:
      </p>
      <ul>
        <li>
          <strong>Template recognition</strong>: two boxes using the same contract share the same body even if their constants differ. Explorers and dApps can
          recognize the contract type just by comparing tree bodies.
        </li>
        <li>
          <strong>Caching</strong>: a node can parse and cost-estimate the body once and reuse it.
        </li>
        <li>
          <strong>Constant substitution</strong>: a script can use <code>substConstants</code> to build a new tree from a template by swapping a constant —
          the fee contract below uses exactly this trick.
        </li>
      </ul>

      <h2 id="fee-contract">A real example: the miner fee contract</h2>
      <p>
        On Ergo, the transaction fee is not “the leftover difference” as in Bitcoin. The sender creates an explicit <strong>fee output</strong>, locked by a
        fixed ErgoTree that every wallet uses. Here is that tree (105 bytes):
      </p>
      <Bytes
        parts={[
          { hex: '10', tone: 'header', label: 'Header 0x10: version 0, with constant segregation' },
          { hex: '05', tone: 'type', label: '5 constants follow' },
          { hex: '0400', tone: 'data', label: 'Constant #0: Int 0' },
          { hex: '0400', tone: 'data', label: 'Constant #1: Int 0' },
          { hex: FEE_TREE.slice(12, 124), tone: 'data', label: 'Constant #2: a 54-byte Coll[Byte] — itself an ErgoTree (the “miner reward” template)' },
          { hex: FEE_TREE.slice(124, 134), tone: 'data', label: 'Constant #3: Coll[Int](1) — the index substConstants replaces; constant #4: Int 1 — for the OUTPUTS.size == 1 check' },
          { hex: FEE_TREE.slice(134), tone: 'op', label: 'Tree body: opcodes referring to constants via 73xx' },
        ]}
      />
      <p>Rewritten in ErgoScript, its meaning is roughly:</p>
      <pre>
        <code>{`{
  val out = OUTPUTS(0)
  // 54-byte template: sigmaProp(HEIGHT >= creationHeight + 720) && <placeholder pk>
  // Replace the placeholder pk with the public key of the miner mining this block
  val rewardScript = substConstants(template, Coll(1), Coll(proveDlog(decodePoint(minerPubKey))))
  sigmaProp(
    HEIGHT == out.creationInfo._1 &&        // the output is created in this very block
    out.propositionBytes == rewardScript && // ...and locked to the miner, with a 720-block wait
    OUTPUTS.size == 1                       // ...and there are no other outputs
  )
}`}</code>
      </pre>
      <p>
        Nobody needs to sign to spend a fee box. Anyone can “spend” it — but the contract forces the coins into a box locked to <code>minerPubKey</code> (the
        key of the current block’s miner, taken from the header), and that box only unlocks after 720 blocks (~1 day). In practice, miners add the
        fee-collecting transaction to their own block.
      </p>
      <Callout type="note" title="Why the key of point G?">
        Inside the 54-byte template there is a public key starting with <code>0279be667e…</code> — that is the generator point <em>G</em> of the secp256k1
        curve, used as a “placeholder” value that <code>substConstants</code> replaces with the miner’s key. You’ll meet point G again in the <code>w</code>{' '}
        field of an <Link to="/learn/autolykos">Autolykos v2 solution</Link>.
      </Callout>

      <h2 id="costing">Execution cost</h2>
      <p>
        Every operation in an ErgoTree has a cost. When validating a transaction, a node adds up the cost of all input scripts; if it exceeds the block limit
        (a parameter miners can vote to change), the transaction is rejected. This is how Ergo allows powerful contracts without Ethereum-style “gas”: the
        there are no unbounded loops, so cost is always bounded, and the node stops a script as soon as its accumulated cost exceeds the limit (since v5.0,
        cost is counted during execution rather than estimated up front).
      </p>

      <h2 id="xem-them">See also</h2>
      <ul>
        <li>
          <Link to="/learn/sigma">Sigma protocols</Link> — what actually sits at the “leaves” of every tree.
        </li>
        <li>
          <Link to="/learn/address">Addresses</Link> — how an ErgoTree gets packaged into an address.
        </li>
        <li>
          <Link to="/tools/address-decoder">Address decoder tool</Link> — paste any address to see its ErgoTree.
        </li>
              <li>
          <a href={DECO} target="_blank" rel="noreferrer">
            DECO Education — Registers, Guard Scripts, ErgoScript
          </a>
          .
        </li>
      </ul>
    </>
  )
}
