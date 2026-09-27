import { Link } from 'react-router-dom'
import { Blocks, Clock, Cpu, ShieldCheck, Coins, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { num, ago } from '../../lib/format'
import { Callout, Card, Stat } from '../../components/ui'

function LiveNow() {
  const state = useApi(() => api.networkState(), [], 30000)
  const d = state.data
  if (!d) return null
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
      <Stat icon={Blocks} label="Current block" value={<Link to={`/block/${d.height}`} className="hover:text-ergo-600">{num(d.height)}</Link>} sub={ago(d.tipTimestamp)} />
      <Stat icon={Coins} label="ERG in circulation" value={num(d.circulating)} sub={`out of a maximum ${num(d.maxSupply)} ERG`} />
      <Stat icon={Cpu} label="Mining power (hashrate)" value={`${d.hashrate} TH/s`} sub={`${d.peers} other computers talking to this node`} />
    </div>
  )
}

const FEATURES = [
  { icon: ShieldCheck, title: 'Proof-of-Work', text: 'Secured by computing power like Bitcoin, not by how many coins you hold.' },
  { icon: Blocks, title: 'The box model (eUTXO)', text: 'Money lives in programmable, locked “boxes” instead of in accounts.' },
  { icon: Users, title: 'Fair from the start', text: 'No ICO, no pre-mine. Every ERG was created through mining.' },
  { icon: Clock, title: 'A block every ~2 minutes', text: '5× faster than Bitcoin, while still safe for a decentralized network.' },
]

export default function WhatIsErgo() {
  return (
    <>
      <p>
        <strong>Ergo</strong> is a blockchain — a public ledger that anyone can read, nobody can edit, and no company runs. Its
        currency is called <strong>ERG</strong>.
      </p>
      <p>
        If you've heard of Bitcoin, you already understand 70% of Ergo. Ergo keeps what Bitcoin does best — security through computing
        power (Proof-of-Work), money kept in locked boxes rather than accounts, and a fixed maximum number of coins — and adds something
        Bitcoin barely has: powerful yet safe <strong>smart contracts</strong> (rules attached to money that the network enforces by itself).
      </p>

      <LiveNow />

      <h2 id="mot-cau-ngan-gon">In one sentence</h2>
      <p>
        Ergo is <em>“programmable Bitcoin”</em>: every coin on Ergo is kept inside a box, and every box carries a small set of rules
        saying <em>who</em> can open it and <em>under what conditions</em>.
      </p>
      <p>
        With Bitcoin, that rule is almost always “whoever can sign with this key may open it”. With Ergo, the rule can be “whoever can
        sign, <em>and</em> only after block 2,000,000, <em>and</em> only if at least 100 ERG is paid back to that other address”.
        Rules like these are what make decentralized exchanges, stablecoins, time-locked savings and more possible — without anyone
        holding your money for you.
      </p>

      <h2 id="dac-diem-chinh">Key features</h2>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title} className="flex gap-3 p-4">
            <f.icon className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div>
              <div className="font-semibold text-stone-900 dark:text-white">{f.title}</div>
              <div className="mt-1 text-sm text-stone-500">{f.text}</div>
            </div>
          </Card>
        ))}
      </div>

      <h2 id="lich-su">A little history</h2>
      <p>
        Ergo's main network (mainnet) launched on <strong>1 July 2019</strong>. It was built by a team of cryptography and blockchain
        researchers, including Alexander Chepurnoy and Dmitry Meshkov.
      </p>
      <p>
        Ergo launched without an ICO or any pre-sale of coins to investors. From the very first block, ERG could only be created one
        way: a miner finds a new block and collects the reward. During the first two years a small share of each reward (7.5 ERG per
        block) went to a development fund (the treasury), then tapered off and ended after about 2.5 years — and that was written into
        the network's rules from day one, where anyone could check it.
      </p>

      <h2 id="ten-goi">Where does the name “Ergo” come from?</h2>
      <p>
        According to the{' '}
        <a href="https://docs.ergoplatform.com/faq/" target="_blank" rel="noreferrer">
          official documentation
        </a>
        , the name carries three layers of meaning:
      </p>
      <ul>
        <li>
          In Latin, <strong>ergo</strong> is a conjunction meaning <em>“therefore”</em> — as in “I think, <strong>therefore</strong> I am” — used to introduce a
          logical conclusion.
        </li>
        <li>
          In Greek, the related word <strong>ἔργον</strong> (<em>ergon</em>) means <em>“work”</em> — a subtle nod to the work of mining and maintaining the
          blockchain.
        </li>
        <li>
          The ticker <strong>ERG</strong> also echoes the <em>erg</em>, a small unit of energy in physics — tying back to work and energy once more.
        </li>
      </ul>

      <h2 id="danh-cho-ai">Who is Ergo for?</h2>
      <ul>
        <li>
          <strong>Everyday users</strong> who want to hold their own money and send and receive it quickly with very low fees (often just
          0.001 ERG).
        </li>
        <li>
          <strong>GPU miners</strong> — the Autolykos v2 algorithm is designed so that specialized mining machines (ASICs) have a hard time
          dominating.
        </li>
        <li>
          <strong>Developers</strong> who want to write smart contracts whose behavior can be predicted before a transaction is sent.
        </li>
      </ul>

      <Callout type="tip" title="You don't need to trust us">
        Every number on this page — block height, supply, hashrate — comes straight from the blockchain via{' '}
        <a href="https://explorer.erg.vn" target="_blank" rel="noreferrer">explorer.erg.vn</a>. That's the spirit of a blockchain:{' '}
        <em>don't trust, verify</em>.
      </Callout>

      <h2 id="tiep-theo">What's next</h2>
      <p>
        Read <Link to="/learn/how-it-works">how the Ergo blockchain works</Link> — how nodes, miners and blocks fit together. Or, if
        you're curious, jump straight into the <Link to="/explorer">explorer</Link> to see the blocks being mined right now.
      </p>
    </>
  )
}
