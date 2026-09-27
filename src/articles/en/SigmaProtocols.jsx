import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Callout, Card } from '../../components/ui'

// Toy group for the demo: multiplicative group mod a small prime.
// Real Ergo uses the secp256k1 elliptic curve with 256-bit numbers.
const P = 2039n
const G = 7n
const ORDER = P - 1n

const modpow = (b, e, m) => {
  let r = 1n
  b %= m
  e = ((e % ORDER) + ORDER) % ORDER
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m
    b = (b * b) % m
    e >>= 1n
  }
  return r
}

function NumInput({ label, value, onChange, hint }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-stone-900 dark:text-white">{label}</span>
      <input
        type="number"
        min="1"
        max="2037"
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(2037, Number(e.target.value) || 1)))}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono tabular-nums outline-none focus:border-ergo-400 dark:border-stone-700 dark:bg-stone-900"
      />
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

function SchnorrDemo() {
  const [x, setX] = useState(1234)
  const [r, setR] = useState(777)
  const [e, setE] = useState(42)
  const [cheat, setCheat] = useState(false)

  const secret = BigInt(x)
  const h = modpow(G, secret, P) // public key
  const a = modpow(G, BigInt(r), P) // commitment
  // A cheater who does not know x uses a wrong secret when computing z.
  const used = cheat ? secret + 1n : secret
  const z = (((BigInt(r) + BigInt(e) * used) % ORDER) + ORDER) % ORDER
  const lhs = modpow(G, z, P)
  const rhs = (a * modpow(h, BigInt(e), P)) % P
  const ok = lhs === rhs

  const row = (step, who, text) => (
    <div className="grid grid-cols-[28px_1fr] gap-3 border-b border-stone-100 py-2.5 last:border-0 dark:border-stone-800">
      <span className="grid size-6 place-items-center rounded-full bg-ergo-500 text-xs font-bold text-white">{step}</span>
      <div className="min-w-0 text-sm">
        <span className="font-semibold text-stone-900 dark:text-white">{who}: </span>
        {text}
      </div>
    </div>
  )

  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">Try it: Schnorr with small numbers (mod {String(P)}, g = {String(G)})</div>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumInput label="Secret key x" value={x} onChange={setX} hint="Known only to the prover" />
        <NumInput label="Random nonce r" value={r} onChange={setR} hint="Used once, then thrown away" />
        <NumInput label="Challenge e" value={e} onChange={setE} hint="Chosen by the verifier" />
      </div>
      <div className="mt-5 font-mono text-[13px]">
        {row(0, 'Public', <>h = gˣ mod p = <b>{String(h)}</b></>)}
        {row(1, 'Prover', <>sends commitment a = gʳ mod p = <b>{String(a)}</b></>)}
        {row(2, 'Verifier', <>sends challenge e = <b>{e}</b></>)}
        {row(3, 'Prover', <>sends z = r + e·x mod (p−1) = <b>{String(z)}</b></>)}
        {row(4, 'Verifier', <>checks gᶻ = <b>{String(lhs)}</b> and a·hᵉ = <b>{String(rhs)}</b></>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cheat} onChange={(ev) => setCheat(ev.target.checked)} className="accent-ergo-500" />
          Pretend to be a cheater (doesn’t know x)
        </label>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          {ok ? <Check className="size-4" /> : <X className="size-4" />}
          {ok ? 'Valid proof' : 'Invalid proof'}
        </span>
      </div>
    </Card>
  )
}

export default function SigmaProtocols() {
  return (
    <>
      <p>
        A sigma protocol is a way to prove “I know a secret” — such as a private key — without showing the secret. Every signature on Ergo is one, and, unlike
        an ordinary signature, several of them can be glued together into a single proof. This page explains how that works and why it matters.
      </p>
      <p>
        In Bitcoin, a “signature” is the only cryptographic thing a script can ask for, and combining several signatures (multisig) is done with rather
        clumsy opcodes. Ergo takes a different route: every cryptographic requirement is a <strong>Σ-protocol</strong> (sigma protocol), and Σ-protocols can
        be combined with <code>&amp;&amp;</code>, <code>||</code> and <code>atLeast</code> right inside <Link to="/learn/ergotree">ErgoScript</Link>. That is
        why the return type of every contract is <code>SigmaProp</code>.
      </p>

      <h2 id="sigma-protocol-la-gi">What is a Σ-protocol?</h2>
      <p>
        A Σ-protocol is a three-move <strong>zero-knowledge proof</strong> between a prover and a verifier. The prover wants to show “I know a secret” without
        revealing the secret:
      </p>
      <ol>
        <li>
          <strong>Commitment</strong>: the prover picks a random number and sends a “commitment”.
        </li>
        <li>
          <strong>Challenge</strong>: the verifier replies with a random challenge.
        </li>
        <li>
          <strong>Response</strong>: the prover answers with a number that can only be computed by someone who knows the secret.
        </li>
      </ol>
      <p>
        The “there – back – there” shape of these three moves looks like the letter Σ, hence the name. On a blockchain there is nobody to talk back and forth
        with, so the challenge is replaced by a hash of the message (the transaction) and the commitment — the <strong>Fiat–Shamir</strong> technique. The
        result is a non-interactive proof, which is exactly what sits in the <code>spendingProof</code> field of every input.
      </p>

      <h2 id="prove-dlog">proveDlog: Schnorr signatures</h2>
      <p>
        The most basic Σ-protocol is <code>proveDlog(h)</code>: “I know <em>x</em> such that <em>h = gˣ</em>”. Here <em>g</em> is the generator of the
        secp256k1 curve, <em>x</em> is the secret key and <em>h</em> is the public key. After applying Fiat–Shamir, this is exactly a{' '}
        <strong>Schnorr signature</strong>. Every ordinary wallet address (P2PK) is a <code>proveDlog</code> — the <code>0008cd…</code> tree you’ve already
        met.
      </p>
      <p>Play with the toy version below. Change any number — the check still passes, as long as the prover really knows x:</p>
      <SchnorrDemo />
      <p>
        Why does it work? gᶻ = g<sup>r + e·x</sup> = gʳ · (gˣ)ᵉ = a · hᵉ. Someone who doesn’t know <em>x</em> would have to predict <em>e</em> in advance to
        cheat — but <em>e</em> is chosen <em>after</em> the commitment has been sent.
      </p>
      <Callout type="warn" title="Never reuse r">
        If the same <em>r</em> is used for two different challenges, anyone can solve for <em>x</em> from the two responses. Real wallets generate a fresh{' '}
        <em>r</em> (randomly, or deterministically from the key and message) for every signature.
      </Callout>

      <h2 id="prove-dh-tuple">proveDHTuple</h2>
      <p>
        The second basic Σ-protocol is <code>proveDHTuple(g, h, u, v)</code>: “I know <em>x</em> such that <em>u = gˣ</em> <strong>and</strong>{' '}
        <em>v = hˣ</em>” — i.e. the quadruple (g, h, u, v) is a Diffie–Hellman tuple. It is the building block for privacy protocols such as ZeroJoin
        (decentralized mixers) and advanced anonymous signatures, where you need to prove that two values relate to the same secret without revealing it.
      </p>

      <h2 id="ket-hop">Combining Σ-protocols: AND, OR, atLeast</h2>
      <p>The magic is that Σ-protocols can be composed and the result is still a Σ-protocol — still producing a single proof:</p>
      <table>
        <thead>
          <tr>
            <th>ErgoScript</th>
            <th>Meaning</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>alice &amp;&amp; bob</code>
            </td>
            <td>Both sign</td>
            <td>2-of-2 multisig</td>
          </tr>
          <tr>
            <td>
              <code>alice || bob</code>
            </td>
            <td>One of them signs — the verifier can’t tell which</td>
            <td>Ring signature</td>
          </tr>
          <tr>
            <td>
              <code>atLeast(2, Coll(a, b, c))</code>
            </td>
            <td>At least 2 of 3 sign</td>
            <td>Threshold signatures, company wallets, DAO treasuries</td>
          </tr>
          <tr>
            <td>
              <code>(alice &amp;&amp; bob) || carol</code>
            </td>
            <td>Arbitrary nesting</td>
            <td>Complex signing policies</td>
          </tr>
        </tbody>
      </table>

      <h3 id="ring">Ring signatures: signing on behalf of a group</h3>
      <p>
        A ring signature says “one of these people signed” without saying who. With <code>alice || bob || carol</code>, the prover only needs to know{' '}
        <em>one</em> secret key.
      </p>
      <p>
        The trick is in how the other branches are handled. For the branches where the prover does <em>not</em> know the secret, they <em>simulate</em> a
        proof: pick the challenge and the response first, then compute the commitment backwards so the equation still balances. The real branch is proven
        normally. Finally, the challenges are tied together so that their XOR equals the overall challenge — that is what stops someone from simulating{' '}
        <em>every</em> branch. Looking at the finished proof, nobody can tell the real branch from the simulated ones, so nobody knows which member of the
        group signed.
      </p>

      <h3 id="threshold">Threshold: k of n</h3>
      <p>
        A threshold signature says “at least k of these n people signed”. <code>atLeast(k, …)</code> uses the same simulation trick: k parties sign for real,
        the remaining n − k branches are simulated, and the challenges are tied together by a polynomial instead of an XOR (the same idea as Shamir secret
        sharing). The result is still <strong>one</strong> proof, and outsiders can’t tell which k parties signed.
      </p>
      <Callout type="tip" title="No special opcodes needed">
        In Bitcoin, multisig needs <code>OP_CHECKMULTISIG</code> and reveals the keys of whoever signed. On Ergo, multisig, ring and threshold signatures are
        just ways of writing an expression — and “who signed” stays private naturally.
      </Callout>

      <h2 id="trong-giao-dich">In a real transaction</h2>
      <p>When a node validates an input, it does two things:</p>
      <ol>
        <li>
          <strong>Reduces</strong> the ErgoTree against the current context: every boolean part (such as <code>HEIGHT &gt; 1000000</code>) is evaluated to
          true/false. What remains is a pure Σ-protocol tree (or a constant true/false).
        </li>
        <li>
          <strong>Verifies the proof</strong> in <code>spendingProof</code> against that Σ-tree, using the transaction bytes as the message.
        </li>
      </ol>
      <p>
        For example, a miner fee box reduces to <code>true</code> when the transaction has the right shape, so its proof is empty — nobody needs to sign. Read
        more in <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link> and <Link to="/learn/transaction">Transactions</Link>.
      </p>
    </>
  )
}
