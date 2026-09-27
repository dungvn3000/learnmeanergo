import { Link } from 'react-router-dom'
import { Ban, Coins, FileCode2, Hourglass, Network, Scale, ShieldCheck, Users } from 'lucide-react'
import { MAX_SUPPLY } from '../../lib/ergo'
import { num } from '../../lib/format'
import { Callout, Card } from '../../components/ui'

const SOURCE = 'https://ergoplatform.org/en/blog/2021-04-26-the-ergo-manifesto/'

// The genesis treasury box, as stated in the whitepaper (§7.1).
const TREASURY = 4_330_791.5

const PRINCIPLES = [
  {
    icon: Network,
    title: 'Decentralization first',
    text: 'No central points of failure in development, mining or governance. Decentralization grows through education, open documentation and community participation — not through enforcement.',
    how: <>Autolykos v2 is a memory-hard, GPU-friendly PoW, so mining doesn’t end up in the hands of a few ASIC farms.</>,
    to: '/learn/autolykos',
  },
  {
    icon: ShieldCheck,
    title: 'Open, permissionless and secure',
    text: 'The protocol does not restrict what it can be used for. The code is open source and auditable. Anyone can join; no bailouts, no blacklists, no discrimination at the protocol level. Privacy is optional.',
    how: <>Sigma protocols build privacy tools right into the language — for example signing as “one of a group” without revealing who (a ring signature) — there if you want them.</>,
    to: '/learn/sigma',
  },
  {
    icon: Users,
    title: 'Created for regular people',
    text: 'Ordinary users must be able to run a full node and mine. Peer-to-peer exchange is preferred over intermediaries, backed by education and accessible tools.',
    how: <>Consumer GPUs can still mine Ergo, and nodes can verify the chain without keeping its full history.</>,
    to: '/learn/mining-basics',
  },
  {
    icon: FileCode2,
    title: 'A platform for contractual money',
    text: 'Ergo is a base layer for financial contracts, with low fees and an efficient implementation so everyday transactions never become a burden.',
    how: <>The eUTXO box model and ErgoScript: a contract always behaves the same way, and you know the fee before you send.</>,
    to: '/learn/ergotree',
  },
  {
    icon: Hourglass,
    title: 'Long-term focus',
    text: 'Principles over market cycles. Ergo was born in the middle of a “crypto winter” and must keep adapting and surviving as genuinely valuable infrastructure.',
    how: <>Storage rent keeps the chain lean and pays miners long after emission ends.</>,
    to: '/learn/storage-rent',
  },
]

export default function Manifesto() {
  return (
    <>
      <p>
        In April 2021 the Ergo Platform blog published <strong>The Ergo Manifesto</strong> — a statement of <em>why</em> Ergo exists, not just how it works. The
        other pages on this site are about boxes, scripts and algorithms; this one is about the values behind those design choices.
      </p>
      <Callout type="note" title="About this page">
        This is our own summary and interpretation, not a copy. We recommend reading{' '}
        <a href={SOURCE} target="_blank" rel="noreferrer">
          the original
        </a>
        .
      </Callout>

      <h2 id="nguon-goc">Back to the cypherpunk roots</h2>
      <p>
        The manifesto starts with Bitcoin: born right after the financial crisis and the bank bailouts of 2009, it showed that people could hold and exchange value
        directly with each other, with no intermediary. A whole industry grew out of that idea.
      </p>
      <p>
        But after the 2017 boom, the manifesto argues, the original spirit was watered down: hype and price speculation crowded out building useful tools, and many
        projects survived by feeding on newcomers. Corporations, meanwhile, mostly used blockchain to cut costs. Ergo wants to go the other way: blockchain as a
        tool for <strong>horizontal cooperation and mutual aid</strong>, serving ordinary people, cooperatives and small businesses.
      </p>

      <h2 id="vi-sao-quan-trong">Why is this important?</h2>
      <p>
        When an economy collapses, the wealthy, big companies — and criminals — all have ways to protect their assets; ordinary people don’t. The manifesto points
        to the currency devaluation in Turkey: when a centralized financial system fails, those with no way out suffer the most. Blockchain can be that way out —{' '}
        <em>if</em> it is truly decentralized, non-custodial (you hold your own keys) and open to everyone.
      </p>

      <h3>The weaponization of money</h3>
      <p>The manifesto warns that central bank digital currencies (CBDCs) could be used to control citizens in at least three ways:</p>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Hourglass, t: 'Money that expires', d: 'Balances can be forced to expire or be burned — a form of confiscation.' },
          { icon: Scale, t: 'Conditional spending', d: 'The right to spend is tied to “compliance”, becoming a tool to silence dissent.' },
          { icon: Ban, t: 'Censored markets', d: 'Access to markets can be blocked, destroying individual monetary sovereignty.' },
        ].map((x) => (
          <Card key={x.t} className="p-4">
            <x.icon className="size-5 text-ergo-500" />
            <div className="mt-2 font-semibold text-stone-900 dark:text-white">{x.t}</div>
            <p className="mt-1 text-sm text-stone-500">{x.d}</p>
          </Card>
        ))}
      </div>

      <h3>Privacy</h3>
      <p>
        For the manifesto, privacy is the foundation of a free society: it lets people make their own decisions without surveillance or coercion, and protects
        their assets from authoritarian regimes. But Ergo doesn’t <em>force</em> privacy — it provides the tools, and using them is each person’s choice.
      </p>

      <h2 id="ergonomic-money">“Ergo.nomic money”</h2>
      <p>
        A play on the name: <strong>ergonomic</strong> money — designed around people — serves its users’ well-being instead of being used to extract from them.
        The goal is private, resilient, censorship-resistant tools that ordinary people can actually use, especially those most vulnerable when a crisis hits.
      </p>

      <h2 id="nguyen-tac">The five basic principles</h2>
      <p>
        The core of the manifesto is five principles. Under each one we’ve added <em>where you can see it in the protocol</em> — that part is our own connection,
        not part of the original.
      </p>
      <div className="not-prose my-6 grid gap-4">
        {PRINCIPLES.map((p, i) => (
          <Card key={p.title} className="flex gap-4 p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ergo-50 text-ergo-600 dark:bg-ergo-950/50 dark:text-ergo-400">
              <p.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-stone-400 tabular-nums">{i + 1}</span>
                <h3 className="font-bold text-stone-900 dark:text-white">{p.title}</h3>
              </div>
              <p className="mt-1 text-[15px] leading-7 text-stone-600 dark:text-stone-400">{p.text}</p>
              <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800/60 dark:text-stone-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200">In the protocol: </span>
                {p.how}{' '}
                <Link to={p.to} className="font-medium text-ergo-600 hover:underline dark:text-ergo-400">
                  Learn more →
                </Link>
              </p>
            </div>
          </Card>
        ))}
      </div>

      <h2 id="ra-mat-cong-bang">A fair launch</h2>
      <p>
        The manifesto stresses that Ergo had a fair launch: <strong>no ICO and no pre-mine</strong> for the founders. Every ERG is mined according to a fixed
        emission schedule, hard-coded into the consensus rules from the very first block.
      </p>
      <Card className="not-prose my-6 flex items-start gap-4 p-5">
        <Coins className="mt-0.5 size-6 shrink-0 text-ergo-500" />
        <div className="text-[15px] leading-7">
          The only part that doesn’t go to miners is the development treasury during roughly the first 2.5 years: 7.5 ERG/block, then 4.5 and 1.5 ERG/block. The
          genesis treasury box held <strong>{num(TREASURY, 1)} ERG</strong> — about <strong>{((TREASURY / MAX_SUPPLY) * 100).toFixed(2)}%</strong> of the{' '}
          {num(MAX_SUPPLY)} ERG total supply, and although it sat in a box from the genesis block, that box&apos;s contract only let it be released block by block.{' '}
          <Link to="/learn/emission" className="font-medium text-ergo-600 hover:underline dark:text-ergo-400">
            See the emission schedule →
          </Link>
        </div>
      </Card>

      <h2 id="ergo-khong-phai">What Ergo wants to be — and what it doesn’t</h2>
      <table>
        <thead>
          <tr>
            <th>Should be</th>
            <th>Should not be</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tools for ordinary people, cooperatives and small businesses</td>
            <td>A cost-cutting tool for corporations</td>
          </tr>
          <tr>
            <td>Grassroots, peer-to-peer, self-custodial finance</td>
            <td>A custodial system that depends on intermediaries</td>
          </tr>
          <tr>
            <td>Private (optionally), censorship-resistant infrastructure</td>
            <td>A tool for surveillance and control</td>
          </tr>
          <tr>
            <td>Affordable smart contracts</td>
            <td>A platform with bailouts, blacklists or discrimination</td>
          </tr>
          <tr>
            <td>Widely distributed mining and development</td>
            <td>Mining or development power concentrated in a few hands</td>
          </tr>
        </tbody>
      </table>

      <Callout type="tip" title="From philosophy to engineering">
        The rest of this site shows how these principles turn into code. Start with <Link to="/learn/boxes">Boxes: where the money lives</Link>.
      </Callout>

      <h2 id="doc-them">Further reading</h2>
      <ul>
        <li>
          <a href={SOURCE} target="_blank" rel="noreferrer">
            The Ergo Manifesto
          </a>{' '}
          — Ergo Platform blog, 26 April 2021.
        </li>
      </ul>
    </>
  )
}
