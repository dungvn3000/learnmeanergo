import { Link } from 'react-router-dom'
import { Download, Gift, Landmark, Pickaxe } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { num } from '../../lib/format'
import { Callout, Card } from '../../components/ui'

const PDF = 'https://ergoplatform.org/uploads/whitepaper_668cb39ee5.pdf'
const WEB = 'https://docs.ergoplatform.com/doc/whitepaper/'

// The three genesis boxes (whitepaper §7.1). The whitepaper rounds the emission box to
// 93,409,132 ERG; on-chain it held 93,409,132.5 (block 1 spends it), which sums to MAX_SUPPLY.
const GENESIS = { noPremine: 1, treasury: 4_330_791.5, miners: 93_409_132.5 }

function Changed({ children }) {
  return (
    <Callout type="warn" title="Changed since 2019">
      {children}
    </Callout>
  )
}

function GenesisBoxes() {
  const net = useApi(() => api.networkState(), [])
  const total = GENESIS.noPremine + GENESIS.treasury + GENESIS.miners
  const boxes = [
    { icon: Gift, name: 'No-premine proof', value: GENESIS.noPremine, desc: 'An unspendable box holding Guardian, Vedomosti and Xinhua headlines plus the latest Bitcoin and Ethereum block ids at launch — proof that nobody mined early.' },
    { icon: Landmark, name: 'Treasury', value: GENESIS.treasury, desc: 'The development fund, locked by a 2-of-3 signature and released gradually: 7.5 → 4.5 → 1.5 ERG/block over the first ~2.5 years.' },
    { icon: Pickaxe, name: 'Miners reward', value: GENESIS.miners, desc: 'The emission contract: each block pays the miner’s reward (locked for 720 blocks) and keeps the rest inside itself.' },
  ]
  return (
    <div className="not-prose my-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {boxes.map((b) => (
          <Card key={b.name} className="p-4">
            <b.icon className="size-5 text-ergo-500" />
            <div className="mt-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{b.name}</div>
            <div className="text-lg font-bold tabular-nums text-stone-900 dark:text-white">{num(b.value, 1)} ERG</div>
            <p className="mt-1 text-sm text-stone-500">{b.desc}</p>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-sm text-stone-500">
        Total: <strong className="text-stone-800 dark:text-stone-200">{num(total, 1)} ERG</strong> — every ERG that will ever exist, already sitting in these
        three boxes since the genesis block.
        {net.data && (
          <>
            {' '}
            {num(net.data.issued)} ERG ({((net.data.issued / total) * 100).toFixed(2)}%) has been released so far.
          </>
        )}
      </p>
    </div>
  )
}

export default function Whitepaper() {
  return (
    <>
      <p>
        <strong>Ergo: A Resilient Platform For Contractual Money</strong> is Ergo’s official whitepaper (version 1.0, 14 May 2019, by “Ergo Developers”),
        published just before mainnet launched. This page walks through each part of it in our own words, points out what has <strong>changed</strong> since
        2019, and links to the detailed explanation elsewhere on this site.
      </p>
      <div className="not-prose my-6 flex flex-wrap gap-3">
        <a href={PDF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ergo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ergo-600">
          <Download className="size-4" /> Whitepaper (PDF)
        </a>
        <a href={WEB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold hover:border-stone-400 dark:border-stone-700">
          Web version on docs.ergoplatform.com
        </a>
      </div>

      <h2 id="tom-tat">Abstract</h2>
      <p>
        Ergo is a flexible blockchain for secure financial contracts. Every coin is protected by an ErgoScript program built on{' '}
        <Link to="/learn/sigma">sigma protocols</Link>, letting developers state exactly when it may be spent. The platform supports light nodes on commodity
        hardware, relies only on proven cryptography, and can amend its own protocol to adapt over time.
      </p>

      <h2 id="gioi-thieu">The problem</h2>
      <p>
        The whitepaper points to two weaknesses of the blockchains of the day. The first is <strong>resources</strong>: every user has to download and check
        every transaction, and fees stay high even while block rewards subsidize them. The second is the <strong>data model</strong>: Ethereum’s account model is
        flexible but makes contracts easy to get wrong — the whitepaper mentions roughly $150 million lost to contract bugs in 2017. Ergo’s argument: most
        financial applications don’t need Turing-completeness, so a UTXO model extended with contract capabilities is the safer choice.
      </p>

      <h2 id="tam-nhin">Vision</h2>
      <p>Five guiding principles — the same ones later restated in the Ergo Manifesto:</p>
      <ul>
        <li>
          <strong>Decentralization first</strong> — minimize dependence on any single party: developers, miners, hardware manufacturers.
        </li>
        <li>
          <strong>Created for regular people</strong> — anyone can mine and run a node; mining centralization is actively resisted.
        </li>
        <li>
          <strong>A platform for contractual money</strong> — focus on efficient, secure financial contracts.
        </li>
        <li>
          <strong>Long-term focus</strong> — designed to last for centuries, without relying on hard forks or specific hardware.
        </li>
        <li>
          <strong>Permissionless and open</strong> — no discrimination, blacklists or bailouts at the protocol level.
        </li>
      </ul>
      <p>
        See also: <Link to="/learn/manifesto">The Ergo Manifesto</Link>.
      </p>

      <h2 id="autolykos">Autolykos consensus</h2>
      <p>
        Ergo uses the <strong>Autolykos</strong> Proof-of-Work, presented as the first protocol that is both <em>memory-hard</em> and <em>pool-resistant</em>. Instead
        of hashing one nonce at a time, a miner has to pick 32 numbers out of a huge table so that they add up “just right”. Formally, miners solve a “one-list
        k-sum” problem: find <strong>k = 32</strong> elements of a fixed list of <strong>N = 2<sup>26</sup></strong> elements (about 2 GB)
        whose sum satisfies a condition against the target <code>b</code>. The list has to live in memory, because recomputing elements on every attempt is far too
        slow.
      </p>
      <p>
        To resist pools, the original version required the miner’s <strong>private key</strong> during mining — you couldn’t hand the work to a pool without also
        handing over the right to spend the reward. Difficulty was adjusted by linear least-squares regression over the last{' '}
        <strong>8 epochs × 1024 blocks</strong>, targeting ~2-minute blocks.
      </p>
      <Changed>
        From block <strong>417,792</strong> (February 2021), Ergo switched to <strong>Autolykos v2</strong>: pool resistance was dropped so mining pools work normally, and
        the list size is no longer fixed but grows with height. The difficulty adjustment was later revised by EIP-37 as well. See{' '}
        <Link to="/learn/autolykos">Autolykos v2</Link> and <Link to="/learn/difficulty">Difficulty &amp; nBits</Link>.
      </Changed>

      <h2 id="trang-thai">Ergo state</h2>
      <p>
        Instead of accounts, Ergo uses an <strong>extended UTXO</strong> model built around immutable <em>boxes</em>. Each box has 10 registers: R0 the ERG value, R1
        the guard script, R2 tokens, R3 creation info (height, transaction id, output index), and R4–R9 for arbitrary data.
      </p>
      <p>The whitepaper lists the advantages over the account model:</p>
      <ul>
        <li>Simpler protection against replay and reordering attacks.</li>
        <li>Parallel transaction processing, since transactions don’t modify shared state.</li>
        <li>Atomic transactions: all or nothing — no “out of gas” halfway through.</li>
        <li>A foundation for stateless clients.</li>
      </ul>
      <p>
        Think of the state as a fingerprint that can also prove what is inside it. The set of unspent boxes is kept in an <strong>authenticated AVL+ tree</strong>, summarized by a <strong>33-byte</strong> digest — the{' '}
        <code>stateRoot</code> field in the header. The tree can prove that a box is (or isn’t) in the set, and prove every change to it. That lets light nodes
        check blocks using the attached proofs alone, with the same security as a full node. According to the whitepaper, AVL+ proofs are about 3× smaller than
        Ethereum’s Merkle Patricia trie. See <Link to="/learn/box">Boxes &amp; registers</Link> and <Link to="/learn/block">Blocks &amp; headers</Link>.
      </p>

      <h2 id="ben-vung">Resiliency and survivability</h2>
      <p>To last, the whitepaper sets out four directions:</p>
      <ol>
        <li>
          <strong>No ad-hoc solutions</strong>: only peer-reviewed, well-tested cryptography. The cautionary example given is IOTA, whose home-made hash function led to
          serious vulnerabilities and a hard fork.
        </li>
        <li>
          <strong>Light client support</strong>: thanks to the authenticated AVL+ state, mobile devices and slow connections can still verify the chain.
        </li>
        <li>
          <strong>Storage rent</strong>: boxes left untouched for 4 years are charged per byte — preventing dust and state bloat, reducing DoS risk like the 2016
          Ethereum attacks, giving miners stable income after emission ends, and returning lost coins to circulation. See{' '}
          <Link to="/learn/storage-rent">Storage rent</Link>.
        </li>
        <li>
          <strong>Self-amending protocol</strong>: “soft” parameters such as block size or storage fee are voted on by miners every 1024-block epoch (at most two
          parameters per epoch). Bigger changes — such as new ErgoScript instructions — need <strong>90%</strong> approval over <strong>32,768</strong> blocks,
          then another 32,768 blocks before activation. Old nodes skip the new rules but keep checking every rule they know.
        </li>
      </ol>

      <h2 id="dong-erg">The Erg token</h2>
      <p>
        The native currency is the <strong>Erg</strong>, divisible down to 10<sup>9</sup> nanoErgs. It rewards miners (securing the network against 51% attacks),
        pays for computation and storage, and pays storage rent. The entire supply was created up front in <strong>three genesis boxes</strong>:
      </p>
      <GenesisBoxes />
      <p>The emission schedule in the whitepaper:</p>
      <table>
        <thead>
          <tr>
            <th>Blocks</th>
            <th>Miners</th>
            <th>Treasury</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1 – 525,599 (~2 years)</td>
            <td>67.5 ERG</td>
            <td>7.5 ERG</td>
          </tr>
          <tr>
            <td>525,600 – 590,399 (~3 months)</td>
            <td>67.5 ERG</td>
            <td>4.5 ERG</td>
          </tr>
          <tr>
            <td>590,400 – 655,199 (~3 months)</td>
            <td>67.5 ERG</td>
            <td>1.5 ERG</td>
          </tr>
          <tr>
            <td>655,200 – 719,999</td>
            <td>66 ERG</td>
            <td>—</td>
          </tr>
          <tr>
            <td>from 720,000</td>
            <td>down 3 ERG every 64,800 blocks</td>
            <td>—</td>
          </tr>
          <tr>
            <td>2,080,800</td>
            <td>0 — emission ends</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <Changed>
        <strong>EIP-27</strong> (activated at block 777,217) keeps the total supply the same but locks part of each block reward into a re-emission contract, then
        pays it back to miners at 3 ERG/block <em>after</em> block 2,080,800 — stretching miner income over many more years. See{' '}
        <Link to="/learn/emission">Emission schedule &amp; EIP-27</Link>.
      </Changed>

      <h2 id="tien-hop-dong">Contractual money</h2>
      <p>
        Each box is protected by a logical formula that combines ordinary conditions with cryptographic statements provable via sigma protocols, joined by AND, OR
        and <em>k-out-of-n</em>. The whitepaper distinguishes two kinds of ERG (and tokens):
      </p>
      <ul>
        <li>
          <strong>Free</strong> — the owner can send them anywhere, like a normal wallet.
        </li>
        <li>
          <strong>Bounded</strong> — the contract requires the spending transaction to create outputs with specific properties (script, amount…). This is how
          multi-step contracts are built.
        </li>
      </ul>
      <p>The building blocks for contracts:</p>
      <ul>
        <li>
          <strong>ErgoScript</strong> — a typed high-level language; for example “prove knowledge of key pk1 <em>or</em> pk2” is written <code>pk1 || pk2</code>.
          See <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link>.
        </li>
        <li>
          <strong>Data inputs</strong> — read a box without destroying it; ideal for oracles. See <Link to="/learn/transaction">Transactions</Link>.
        </li>
        <li>
          <strong>Custom tokens</strong> — each transaction can issue one new token, whose id is the id of the first input box, in an amount from 1 to
          9,223,372,036,854,775,807. Tokens may be burned (outputs ≤ inputs), while ERG is strictly preserved (inputs = outputs). See{' '}
          <Link to="/learn/tokens">Tokens (EIP-4)</Link>.
        </li>
      </ul>
      <h3>Two examples from the whitepaper</h3>
      <ul>
        <li>
          <strong>A temperature bet with an oracle</strong>: the oracle issues a single token and puts it in a box holding the temperature (R4) and a timestamp (R5).
          Alice and Bob’s bet contract only checks that its first data input carries that token — the token’s presence is the oracle’s signature.
        </li>
        <li>
          <strong>Non-interactive mixing</strong>: Bob spends Alice’s box together with one of his own to create two outputs with identical scripts; each of them can
          spend only one, but outsiders can’t tell which belongs to whom.
        </li>
      </ul>
      <p>The whitepaper also mentions atomic swaps, crowdfunding, local exchange trading systems and ICOs as further applications.</p>

      <h2 id="thay-doi">2019 vs today</h2>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Whitepaper (2019)</th>
            <th>Today</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Block time</td>
            <td>~2 minutes</td>
            <td>Unchanged</td>
          </tr>
          <tr>
            <td>PoW</td>
            <td>Autolykos v1, pool-resistant, fixed N = 2^26</td>
            <td>Autolykos v2 since block 417,792; pools allowed, N grows</td>
          </tr>
          <tr>
            <td>Difficulty adjustment</td>
            <td>Regression over 8 × 1024 blocks</td>
            <td>Revised by EIP-37</td>
          </tr>
          <tr>
            <td>Emission</td>
            <td>Ends at block 2,080,800</td>
            <td>Same, plus EIP-27 re-emission afterwards</td>
          </tr>
          <tr>
            <td>Storage rent</td>
            <td>4 years, charged per byte</td>
            <td>Unchanged; collected for real since 2023</td>
          </tr>
        </tbody>
      </table>

      <h2 id="doc-them">Further reading</h2>
      <ul>
        <li>
          <a href={PDF} target="_blank" rel="noreferrer">
            Ergo: A Resilient Platform For Contractual Money
          </a>{' '}
          — whitepaper v1.0, 14 May 2019 (PDF).
        </li>
        <li>
          <a href={WEB} target="_blank" rel="noreferrer">
            Web version of the whitepaper
          </a>{' '}
          on docs.ergoplatform.com.
        </li>
      </ul>
    </>
  )
}
