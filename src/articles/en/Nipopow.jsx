import { Link } from 'react-router-dom'
import { Layers, Link2, Scale, Zap } from 'lucide-react'
import { useApi } from '../../lib/useApi'
import { bytes, num } from '../../lib/format'
import { Async, Callout, Card, Stat } from '../../components/ui'

const DOC = 'https://docs.ergoplatform.com/dev/protocol/nipopows/'
const PAPER = 'https://eprint.iacr.org/2017/963.pdf'
const NODES = ['https://sv1.erg.vn', 'https://sv2.erg.vn']
const M = 6
const K = 10

/** Fetch a real NiPoPoW proof from a public Ergo node (the node API allows CORS). */
async function fetchProof() {
  let lastErr
  for (const n of NODES) {
    try {
      const r = await fetch(`${n}/nipopow/proof/${M}/${K}`, { headers: { Accept: 'application/json' } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const p = await r.json()
      const hdr = (x) => x.header ?? x
      const headers = [...p.prefix, p.suffixHead, ...p.suffixTail].map(hdr)
      return {
        node: n,
        m: p.m,
        k: p.k,
        headers,
        tip: headers.at(-1).height,
        prefixHeights: p.prefix.map((x) => x.header.height),
        levels: p.suffixHead.interlinks.length,
        approxBytes: headers.reduce((s, h) => s + (h.size || 0), 0),
      }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

function ProofStrip({ heights, tip }) {
  // Every included prefix header as a tick on a 0..tip axis: the sampling gets denser towards the tip.
  return (
    <div className="mt-4">
      <div className="relative h-10 rounded-lg bg-stone-100 dark:bg-stone-800">
        {heights.map((h) => (
          <span key={h} className="absolute top-1 bottom-1 w-px bg-ergo-500" style={{ left: `${(h / tip) * 100}%` }} title={`block ${num(h)}`} />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-stone-500">
        <span>block 1</span>
        <span>block {num(tip)}</span>
      </div>
    </div>
  )
}

function LiveProof() {
  const state = useApi(fetchProof, [])
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">
        A real NiPoPoW proof — <code className="font-mono normal-case">GET /nipopow/proof/{M}/{K}</code>
      </div>
      <Async state={state}>
        {(p) => (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Layers} label="Actual chain" value={num(p.tip)} sub="block headers" />
              <Stat icon={Zap} label="In the proof" value={num(p.headers.length)} sub={`headers · ≈ ${bytes(p.approxBytes)}`} />
              <Stat icon={Scale} label="Compression" value={`${num(Math.round(p.tip / p.headers.length))}×`} sub={`m = ${p.m}, k = ${p.k}`} />
              <Stat icon={Link2} label="Superblock levels" value={p.levels} sub={`log₂(${num(p.tip)}) ≈ ${Math.log2(p.tip).toFixed(1)}`} />
            </div>
            <ProofStrip heights={p.prefixHeights} tip={p.tip} />
            <p className="mt-3 text-sm text-stone-500">
              Each orange tick is a header included in the proof. The early chain needs only a few scattered superblocks; towards the tip the sampling gets denser,
              and the last {p.k} blocks are included in full. Data from node <span className="font-mono">{p.node.replace('https://', '')}</span>.
            </p>
          </>
        )}
      </Async>
    </Card>
  )
}

export default function Nipopow() {
  return (
    <>
      <p>
        To check for yourself that a transaction is in the Ergo chain, the “proper” way is to download every block header — over 1.8 million of them, ~220 bytes
        each — and verify each one&apos;s proof-of-work. For a phone, or for a smart contract on <em>another</em> blockchain, that is far too much.{' '}
        <strong>NiPoPoWs</strong> (Non-Interactive Proofs of Proof-of-Work) shrink that header chain down to a few hundred headers while keeping equivalent
        confidence.
      </p>
      <LiveProof />

      <h2 id="superblock">Superblocks: some blocks are “luckier” than others</h2>
      <p>
        A miner has to find a PoW solution below the target <code>T</code> (see <Link to="/learn/difficulty">Difficulty &amp; nBits</Link>). But solutions are
        often <em>much</em> smaller than required: on average one block in 2 has a solution below <code>T/2</code>, one in 4 is below <code>T/4</code>, and one in
        2<sup>μ</sup> is below <code>T/2<sup>μ</sup></code>. Such a block is called a <strong>level-μ superblock</strong>.
      </p>
      <ul>
        <li>Level 0: every block.</li>
        <li>Level 1: about half of all blocks.</li>
        <li>Level μ: about 1/2<sup>μ</sup> of all blocks — the highest level in a chain of n blocks is roughly log<sub>2</sub>(n).</li>
      </ul>
      <p>
        The key idea: a level-μ superblock “contains” an expected 2<sup>μ</sup> ordinary blocks&apos; worth of work. So instead of presenting the whole chain, a
        prover can present just the <em>chain of superblocks</em> at a high level — far fewer blocks, representing an equivalent amount of proof-of-work. Nobody
        can fake superblocks: producing a level-20 block requires being a million times luckier than for an ordinary block.
      </p>

      <h2 id="interlink">Interlinks: back-pointers to every level</h2>
      <p>
        A normal header has a single back-pointer: <code>parentId</code>. To jump from one superblock to the previous one <em>at the same level</em> without walking
        every block in between, each Ergo block also carries an <strong>interlink</strong> vector: entry μ is the id of the most recent level-μ superblock before
        it. The vector lives in the block&apos;s <em>extension</em> section (the header commits to it through <code>extensionHash</code>), together with a Merkle
        proof so anyone can verify it without the whole extension. Today the vector has about 21 entries — exactly the number of superblock levels a ~1.9-million-block
        chain can have.
      </p>
      <Callout type="note" title="Why Ergo has had it since block 1">
        Bitcoin could add interlinks with a “velvet fork” (miners add extra data; old nodes ignore it), but hasn&apos;t. Ergo was designed by researchers closely
        connected to the NiPoPoW work, so interlinks have been in every block since genesis — no fork required.
      </Callout>

      <h2 id="bang-chung">What is in a proof?</h2>
      <p>A NiPoPoW proof has two security parameters and three parts:</p>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>m</code>
            </td>
            <td>The minimum number of superblocks required at each level used — larger means harder to cheat, and a longer proof.</td>
          </tr>
          <tr>
            <td>
              <code>k</code>
            </td>
            <td>How many blocks at the tip are always included in full (like a “confirmation count”), because the tail is not yet settled.</td>
          </tr>
          <tr>
            <td>
              <code>prefix</code> (π)
            </td>
            <td>The superblock chain from genesis to near the tip, taken at the highest level that still has m blocks, then descending to lower levels near the tip.</td>
          </tr>
          <tr>
            <td>
              <code>suffixHead</code> + <code>suffixTail</code> (χ)
            </td>
            <td>The last k headers, with the interlinks of the first of them to connect to the prefix.</td>
          </tr>
        </tbody>
      </table>
      <p>
        The proof at the top of this page uses <code>m = {M}, k = {K}</code>. An Ergo node serves it through the API{' '}
        <code>/nipopow/proof/&#123;m&#125;/&#123;k&#125;</code> — and you can ask for a proof up to a specific block with{' '}
        <code>/nipopow/proof/&#123;m&#125;/&#123;k&#125;/&#123;headerId&#125;</code>.
      </p>

      <h2 id="so-sanh">Whom does the verifier trust?</h2>
      <p>
        The verifier doesn&apos;t need to trust any node. It asks <strong>several</strong> nodes for proofs and keeps the best one. To compare two proofs:
      </p>
      <ol>
        <li>Find the last block both proofs have in common — everything before it is agreed on.</li>
        <li>After that point, look at the highest superblock level where both proofs still have at least m blocks.</li>
        <li>Count the blocks at that level on each side. A level-μ block stands for 2<sup>μ</sup> ordinary blocks of work, so the side with more of them
          represents more proof-of-work — and wins.</li>
      </ol>
      <p>
        As long as <em>at least one</em> of the nodes asked is honest, the result is correct — the same “honest majority of hash power” assumption the
        blockchain itself rests on.
      </p>
      <Callout type="warn" title="Not magic">
        A NiPoPoW proves “this chain has the most proof-of-work”, not that every transaction is valid — that still takes a full node. An application that accepts
        a single proof (say, a contract on another chain) must set a minimum-work threshold and wait for enough confirmations.
      </Callout>

      <h2 id="electrum">Compared with Bitcoin SPV (Electrum)</h2>
      <p>
        Bitcoin light wallets such as <strong>Electrum</strong> use the <em>SPV</em> model (Simplified Payment Verification) Satoshi described in the whitepaper:
        download <strong>every</strong> block header (80 bytes each), verify the proof-of-work of the whole chain, then ask Electrum servers for a Merkle proof of
        each transaction you care about. NiPoPoWs keep that idea but replace “every header” with “a few hundred superblocks”:
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Bitcoin SPV / Electrum</th>
            <th>Ergo NiPoPoW</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Headers to download</td>
            <td>All of them — roughly 950 thousand headers × 80 bytes ≈ 75 MB (2026), growing linearly forever</td>
            <td>A few hundred — the proof at the top of this page is ~40 KB, growing with the log of the chain length</td>
          </tr>
          <tr>
            <td>Proving a transaction is in the chain</td>
            <td>Merkle branch to the block header</td>
            <td>Merkle branch to the header, plus a NiPoPoW proof that the header is on the heaviest chain</td>
          </tr>
          <tr>
            <td>Checking a balance / UTXOs</td>
            <td>You must trust the server: it can hide some of your transactions</td>
            <td>Verifiable yourself with an AVL+ proof against the header&apos;s <code>stateRoot</code> — the server cannot hide anything</td>
          </tr>
          <tr>
            <td>Trust model</td>
            <td>Honest majority of hashrate; server honest about address history</td>
            <td>Honest majority of hashrate; at least one honest node among those asked</td>
          </tr>
          <tr>
            <td>Verification inside a contract on another chain</td>
            <td>Practically impossible — 75 MB of headers won&apos;t fit in a contract</td>
            <td>Feasible — tens of KB, enough for sidechains and bridges</td>
          </tr>
          <tr>
            <td>On a phone</td>
            <td>Electrum ships hard-coded “checkpoints” to skip old headers — i.e. you trust the developers</td>
            <td>No checkpoints needed: the proof stands on its own from genesis</td>
          </tr>
        </tbody>
      </table>
      <p>
        Neither model checks that individual transactions are <em>valid</em> — that is still a full node&apos;s job. The difference is that NiPoPoWs make “verify the
        chain” cheap enough for even a smart contract to do, and Ergo&apos;s <code>stateRoot</code> closes the biggest hole in SPV: the server cannot lie about the
        UTXO set. Bitcoin could get NiPoPoWs through a velvet fork, but hasn&apos;t deployed them so far.
      </p>

      <h2 id="ung-dung">What does Ergo use NiPoPoWs for?</h2>
      <ul>
        <li>
          <strong>Fast node bootstrapping</strong>: an Ergo node can start from a NiPoPoW proof (requested from several peers, keeping the best one) and then
          download a UTXO-set snapshot, instead of syncing from block 1. Enable it with <code>ergo.node.nipopow.nipopowBootstrap = true</code>. The Ergo docs
          estimate a proof for several years of chain at only 30–40 KB, versus a UTXO snapshot of a few hundred MB.
        </li>
        <li>
          <strong>Light clients</strong>: a phone wallet verifies the chain with a few hundred headers instead of nearly two million, combined with the{' '}
          <Link to="/learn/block">stateRoot</Link> to verify boxes.
        </li>
        <li>
          <strong>Logarithmic-space mining</strong>: miners keep only the important superblocks instead of the whole history.
        </li>
        <li>
          <strong>Sidechains and bridges</strong>: a contract on another chain can verify that “event X happened on Ergo” from a proof — the basis for two-way
          pegs and cross-chain atomic swaps without a trusted intermediary.
        </li>
      </ul>
      <p>
        Node 6.0.5 tightened three checks: the m/k parameters of a requested proof are validated, each header&apos;s proof-of-work is verified before it is used
        for bootstrapping, and invalid m/k parameters from peers are rejected.
      </p>

      <h2 id="doc-them">Further reading</h2>
      <ul>
        <li>
          <a href={DOC} target="_blank" rel="noreferrer">
            NiPoPoWs — Ergo docs
          </a>
          , with sub-pages on light clients, light miners and sidechains.
        </li>
        <li>
          <a href={PAPER} target="_blank" rel="noreferrer">
            Non-Interactive Proofs of Proof-of-Work
          </a>{' '}
          — Kiayias, Miller, Zindros (2017), the original paper.
        </li>
        <li>
          <a href="https://eprint.iacr.org/2019/1444.pdf" target="_blank" rel="noreferrer">
            Compact Storage of Superblocks for NIPoPoW Applications
          </a>{' '}
          — how Ergo stores interlinks compactly in the extension.
        </li>
      </ul>
    </>
  )
}
