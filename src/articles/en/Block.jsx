import { Link } from 'react-router-dom'
import { Blocks, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, bytes, compact, erg, num, utc } from '../../lib/format'
import { Async, Badge, Callout, Card, Erg, Field, Hash } from '../../components/ui'

/** Three chained headers: each one stores the id (hash) of the one before it. */
function ChainDiagram({ block }) {
  const cells = [
    { h: block.height - 1, id: block.parentId, parent: '…' },
    { h: block.height, id: block.id, parent: block.parentId, current: true },
    { h: block.height + 1, id: '?', parent: block.id, future: true },
  ]
  return (
    <div className="not-prose my-6 grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
      {cells.map((c, i) => (
        <div key={c.h} className="contents">
          {i > 0 && <div className="hidden items-center justify-center text-2xl text-ergo-500 sm:flex">←</div>}
          <div
            className={`rounded-xl border p-3 text-xs ${
              c.current
                ? 'border-ergo-400 bg-ergo-50 dark:border-ergo-700 dark:bg-ergo-950/40'
                : c.future
                  ? 'border-dashed border-stone-300 text-stone-400 dark:border-stone-700'
                  : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'
            }`}
          >
            <div className="font-semibold text-stone-900 dark:text-white">Block {num(c.h)}</div>
            <div className="mt-2 text-stone-500">parentId</div>
            <div className="truncate font-mono">{c.parent === '…' ? '…' : `${c.parent.slice(0, 12)}…`}</div>
            <div className="mt-2 text-stone-500">id</div>
            <div className="truncate font-mono">{c.id === '?' ? 'not mined yet' : `${c.id.slice(0, 12)}…`}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The four sections a full Ergo block is made of. */
function SectionsDiagram() {
  const parts = [
    { name: 'Header', desc: '~250 bytes. Holds the hashes of the other 3 sections + the PoW solution.', cls: 'border-ergo-400 bg-ergo-50 dark:border-ergo-700 dark:bg-ergo-950/40' },
    { name: 'Block transactions', desc: 'The list of transactions. Their Merkle root goes in transactionsRoot.', cls: 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900' },
    { name: 'AD proofs', desc: 'Proofs of the UTXO set changes, for light nodes. Their hash goes in adProofsRoot.', cls: 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900' },
    { name: 'Extension', desc: 'Key–value pairs: network parameters, interlinks (NiPoPoW). Merkle root in extensionHash.', cls: 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900' },
  ]
  return (
    <div className="not-prose my-6 grid gap-2 sm:grid-cols-4">
      {parts.map((p) => (
        <div key={p.name} className={`rounded-xl border p-3 ${p.cls}`}>
          <div className="text-sm font-semibold text-stone-900 dark:text-white">{p.name}</div>
          <div className="mt-1 text-xs leading-5 text-stone-500">{p.desc}</div>
        </div>
      ))}
    </div>
  )
}

function LiveHeader({ block }) {
  const votes = String(block.votes ?? '').split(',')
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Blocks className="size-5 text-ergo-500" />
          <Link to={`/block/${block.height}`} className="hover:text-ergo-600">
            Block {num(block.height)}
          </Link>
        </div>
        <Badge tone="green">
          <RefreshCw className="size-3" /> live data · {ago(block.timestamp)}
        </Badge>
      </div>

      <Field name="version" value={block.version}>
        The header version. It goes up each time the protocol is upgraded by a hard fork or soft fork (for example, Autolykos v2 starts at version 2).
      </Field>
      <Field name="parentId" value={<Hash value={block.parentId} to={`/block/${block.height - 1}`} full />}>
        The id of the block right before this one. This is the field that links blocks into a <em>chain</em>: to change an old block, you would have to re-mine every block after it.
      </Field>
      <Field name="height" value={num(block.height)}>
        The block's position in the chain, counting from the first block (height 1); each block is exactly one higher than its parent.
      </Field>
      <Field name="timestamp" value={`${block.timestamp} (${utc(block.timestamp)})`} mono>
        When the miner created the header, as a Unix time in <strong>milliseconds</strong> (Bitcoin uses seconds).
      </Field>
      <Field name="nBits" value={<code className="font-mono">{block.nBits}</code>}>
        The difficulty in “compact” encoding (like Bitcoin): 1 exponent byte + 3 mantissa bytes. See <Link to="/learn/difficulty">Difficulty &amp; nBits</Link>.
      </Field>
      <Field name="difficulty" value={`${num(block.difficulty)} (≈ ${compact(block.difficulty)})`}>
        The value decoded from nBits. Divide it by 120 seconds to estimate the hashrate: ≈ {(block.difficulty / 120 / 1e12).toFixed(2)} TH/s.
      </Field>
      <Field name="stateRoot" value={<Hash value={block.stateRoot} full copy={false} />}>
        A fingerprint of every unspent box in existence after this block. It is 33 bytes: the 32-byte root of the <strong>AVL+</strong> tree that holds the whole UTXO set, plus 1 byte for the tree's height. With this fingerprint and a small proof, a light node can check that a box exists without storing the set itself.
      </Field>
      <Field name="transactionsRoot" value={<Hash value={block.txRoot} full copy={false} />}>
        The Merkle root of the transactions in the block. Change any byte of any transaction and this root changes → so does the header (and the id).
      </Field>
      <Field name="adProofsRoot" value={<Hash value={block.adRoot} full copy={false} />}>
        Proof that the UTXO set changed correctly in this block. It is the hash of the <em>AD proofs</em> section (authenticated dictionary proofs), which shows step by step how the old stateRoot became the new one.
      </Field>
      <Field name="extensionHash" value={<Hash value={block.extHash} full copy={false} />}>
        The Merkle root of the <em>extension</em> section: network parameters (when miners vote to change them) and the interlinks used by NiPoPoWs.
      </Field>
      <Field name="votes" value={<code className="font-mono">{block.votes}</code>}>
        3 bytes of miner votes for parameter changes (block size, storage fee…). {votes.every((v) => v.trim() === '0') ? 'All zeros means this block votes for nothing.' : 'This block is voting for a parameter change.'}
      </Field>
      <Field name="pow.pk" value={<Hash value={block.pow?.pk} full />}>
        The miner's public key. The block reward is locked to exactly this key — whoever finds the solution can't have it “stolen”.
      </Field>
      <Field name="pow.w" value={<Hash value={block.pow?.w} full copy={false} />}>
        In Autolykos v1 this was a one-time key. From v2 on it's no longer used: its fixed value is simply the secp256k1 generator point <code>G</code> (<code>0279be66…</code>).
      </Field>
      <Field name="pow.n" value={<code className="font-mono">{block.pow?.n}</code>}>
        The 8-byte <strong>nonce</strong> — the thing miners change billions of times per second until the hash is small enough. See <Link to="/learn/autolykos">Autolykos v2</Link>.
      </Field>
      <Field name="pow.d" value={<code className="font-mono">{block.pow?.d}</code>}>
        Also a leftover from v1; always 0 in v2.
      </Field>
      <Field name="id" value={<Hash value={block.id} full />}>
        Not a field stored in the header: it's <code>blake2b256(header)</code>, used to refer to this block (and it becomes the parentId of the next block).
      </Field>

      <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-4 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500">Transactions</div>
          <div className="font-semibold">{num(block.txCount)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500">Size</div>
          <div className="font-semibold">{bytes(block.size)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500">Miner receives</div>
          <div className="font-semibold">
            <Erg nano={block.reward} />
          </div>
        </div>
        <div>
          <div className="text-xs text-stone-500">Transaction fees</div>
          <div className="font-semibold">
            <Erg nano={block.fees} />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Block() {
  const state = useApi(() => api.latestBlocks(1).then((b) => b?.[0] ?? null), [], 30000)
  return (
    <>
      <p>
        A <strong>block</strong> is a bundle of transactions stamped by a miner with Proof-of-Work. Roughly every <strong>2 minutes</strong> a new block is added to
        the end of the chain, and every node in the world updates the same copy of the ledger.
      </p>
      <p>
        This article dissects the most important part of a block — the <strong>header</strong> — using the latest block on the Ergo network, pulled live from the
        explorer. The page refreshes every 30 seconds, so you may well be looking at a block that was mined moments ago.
      </p>

      <h2 id="cau-truc">What is a block made of?</h2>
      <p>
        Unlike Bitcoin (header + list of transactions), an Ergo block is split into <strong>four</strong> separate sections. The header only contains the hashes of
        the other three, so a node can download headers first and fetch only the sections it actually needs.
      </p>
      <SectionsDiagram />
      <Callout type="tip" title="Why split it up?">
        A light node or a phone doesn&apos;t need to keep the full state or history: with the header, the new block&apos;s transactions and the AD proofs, it can check that the state was updated correctly.
      </Callout>

      <h2 id="chuoi-block">The chain of blocks</h2>
      <p>
        Every header contains a <code>parentId</code> — the id of the previous block. Since the id is a hash of the header, changing any old block changes its id,
        breaking the link to every block after it.
      </p>
      <Async state={state}>{(b) => <ChainDiagram block={b} />}</Async>

      <h2 id="header">The header, field by field</h2>
      <p>Below is the header of the latest block. Each row shows the field name, its real value, and what it means.</p>
      <Async state={state}>{(b) => <LiveHeader block={b} />}</Async>

      <h2 id="block-id">How is the block id calculated?</h2>
      <p>
        All the fields above are serialized into bytes in a fixed order, then run through the <strong>Blake2b-256</strong> hash function. The 32-byte result is the
        block id. You can try the hash function yourself with the <Link to="/tools/blake2b">Blake2b tool</Link>.
      </p>
      <pre>
        <code>{`block id = blake2b256( serialize(header) )`}</code>
      </pre>
      <p>
        Note: the Proof-of-Work condition is <em>not</em> “block id below target” as in Bitcoin. Autolykos computes a separate hash from the header (without the
        solution) and the nonce, then compares that to the target. Details in <Link to="/learn/autolykos">Autolykos v2</Link>.
      </p>

      <h2 id="phan-thuong">The block reward</h2>
      <p>
        The first transaction of every block is the reward transaction (the explorer labels it “Block reward”). Unlike Bitcoin&apos;s coinbase, it creates no new ERG. Instead it spends the emission contract&apos;s box and moves part of the ERG already inside it to the miner&apos;s reward box — see{' '}
        <Link to="/learn/transaction#coinbase">No “coinbase” like Bitcoin</Link>. Right now, EIP-27 also locks part of each block&apos;s emission into the re-emission
        contract, so the miner receives less than the nominal “emission” figure.
      </p>
      <Async state={state}>
        {(b) => (
          <table>
            <tbody>
              <tr>
                <td>ERG released from the emission contract</td>
                <td className="tabular-nums">{erg(b.emission)} ERG</td>
              </tr>
              <tr>
                <td>Locked into the re-emission contract (EIP-27)</td>
                <td className="tabular-nums">{erg(b.reemitted)} ERG</td>
              </tr>
              <tr>
                <td>Miner receives from emission</td>
                <td className="tabular-nums">{erg(b.reward)} ERG</td>
              </tr>
              <tr>
                <td>Plus transaction fees</td>
                <td className="tabular-nums">{erg(b.fees)} ERG</td>
              </tr>
            </tbody>
          </table>
        )}
      </Async>
      <p>
        The full schedule is explained in <Link to="/learn/emission">Emission schedule &amp; EIP-27</Link>; you can see the reward transaction and the block's other
        transactions by opening the <Link to="/explorer">explorer</Link>.
      </p>

      <Callout type="note" title="Confirmations">
        A transaction in the block at height <code>h</code> has <code>tip − h + 1</code> confirmations. Each new block piled on top makes rewriting history
        exponentially harder — which is why exchanges wait for dozens of confirmations before crediting a deposit.
      </Callout>
    </>
  )
}
