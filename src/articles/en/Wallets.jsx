import { Link } from 'react-router-dom'
import { ArrowDown, CheckCircle2, FileKey2, KeyRound, ListOrdered, MapPin, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { p2pkAddress } from '../../lib/ergo'
import { Async, Callout, Card, Hash } from '../../components/ui'

const CHAIN = [
  { icon: ListOrdered, title: 'Seed phrase', text: 'A list of English words, e.g. “olive tiger …”. You write it down on paper.', tone: 'text-red-600 dark:text-red-400', secret: true },
  { icon: FileKey2, title: 'Private key', text: 'A huge number (256 bits long) calculated from the seed phrase. This is what signs your transactions.', tone: 'text-red-600 dark:text-red-400', secret: true },
  { icon: KeyRound, title: 'Public key', text: 'Calculated from the private key with one-way maths (the same elliptic-curve method Bitcoin uses). Nobody can work backwards from it to the private key.', tone: 'text-emerald-600 dark:text-emerald-400' },
  { icon: MapPin, title: 'Address', text: 'The public key with a small label and a typo-check added, written out as letters and digits so it is easy to copy.', tone: 'text-emerald-600 dark:text-emerald-400' },
]

function KeyChain() {
  return (
    <div className="not-prose my-6 grid gap-1">
      {CHAIN.map((c, i) => (
        <div key={c.title}>
          {i > 0 && <ArrowDown className="mx-auto my-1 size-4 text-stone-400" />}
          <Card className="flex items-start gap-3 p-4">
            <c.icon className={`mt-0.5 size-5 shrink-0 ${c.tone}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-stone-900 dark:text-white">
                {c.title}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.secret ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                  {c.secret ? 'secret — never share' : 'public — share freely'}
                </span>
              </div>
              <div className="mt-1 text-sm text-stone-500">{c.text}</div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

/** Rebuild the latest block's miner address from its public key, and check it matches. */
function LiveAddressDemo() {
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) => {
        const b = blocks[0]
        if (!b?.pow?.pk) return null
        let built = ''
        try {
          built = p2pkAddress(b.pow.pk)
        } catch {
          return null
        }
        const ok = built === b.minerAddress
        return (
          <Card className="not-prose my-6 space-y-3 p-5 text-sm">
            <div>
              <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Public key of the miner of block <Link to={`/block/${b.height}`} className="text-ergo-600">#{b.height}</Link>
              </div>
              <Hash value={b.pow.pk} full />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Address computed right here in your browser</div>
              <Hash value={built} full to={`/address/${built}`} />
            </div>
            <div className={`flex items-center gap-2 font-medium ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
              {ok ? `Matches the reward address recorded by the explorer${b.miner ? ` (${b.miner})` : ''}.` : 'This miner receives rewards at a different address.'}
            </div>
          </Card>
        )
      }}
    </Async>
  )
}

export default function Wallets() {
  return (
    <>
      <p>
        An Ergo wallet doesn't actually “hold” ERG. Your ERG lives in <Link to="/learn/boxes">boxes</Link> on the blockchain. What the
        wallet holds are the <strong>keys</strong> that open those boxes.
      </p>

      <h2 id="tu-seed-den-dia-chi">From seed phrase to address</h2>
      <p>When you create a new wallet, everything is generated in a one-way chain:</p>
      <KeyChain />
      <p>
        Every arrow is a <strong>one-way</strong> calculation: easy going forwards, impossible going backwards. Someone who knows your
        address can't work out your private key. But someone who has your seed phrase has <em>everything</em>.
      </p>

      <Callout type="warn" title="The golden rule">
        Your seed phrase is your money. Don't photograph it, don't store it in the cloud, don't send it to anyone — including people
        claiming to be “tech support”. Lose your seed phrase and your wallet together, and the money is gone forever; there's no bank to
        recover it for you.
      </Callout>

      <h2 id="dia-chi-bat-dau-bang-9">Why do Ergo addresses start with a 9?</h2>
      <p>
        A regular wallet address on Ergo mainnet looks like this: <code>9fQYeMEX…KSACVmgx</code>. They almost always start with the digit{' '}
        <strong>9</strong>.
      </p>
      <p>
        Here's why. An address is really a short list of bytes turned into letters and digits (an encoding called Base58). The very first
        byte is a label (the <em>prefix</em>) that says which <em>network</em> the address is for (mainnet or testnet) and what{' '}
        <em>type of address</em> it is. The most common type — a normal wallet, called <strong>P2PK</strong> (Pay-to-Public-Key) — on
        mainnet has the prefix <code>0x01</code>. When that byte, followed by the public key, is written out in Base58, the first character
        always comes out as “9”.
      </p>
      <p>
        At the end of the address there are 4 more bytes: a <strong>checksum</strong>. If you mistype a single character, the checksum won't
        match and your wallet will refuse to send — protecting you from typos.
      </p>

      <h3>Check it yourself</h3>
      <p>
        Every Ergo block contains the public key of the miner who found it. Below, this page takes that key from the latest block and
        computes the address itself — you can compare it with the address the miner uses to collect rewards:
      </p>
      <LiveAddressDemo />
      <p>
        Want to dissect any address byte by byte? Use the <Link to="/tools/address-decoder">address decoder</Link> or{' '}
        <Link to="/tools/pubkey-to-address">public key → address</Link> tools.
      </p>

      <h2 id="nhieu-dia-chi">One wallet, many addresses</h2>
      <p>
        From a single seed phrase, a wallet can derive many key pairs (using a standard called HD — “hierarchical deterministic” — the same one most Bitcoin wallets use), each with
        its own address. You can use different addresses for different purposes; your wallet balance is the sum of all of them. And all of
        them can be recovered from that one seed phrase.
      </p>

      <h2 id="dia-chi-hop-dong">Not every address is a person</h2>
      <p>
        Because a box's lock on Ergo can be a smart contract, some addresses represent a <strong>contract</strong> rather than a key. They
        are usually very long (the P2S type contains the entire script) and nobody “owns” them — only someone who satisfies the contract's
        rules can spend from them. See the <Link to="/learn/address">Addresses</Link> article for details.
      </p>

      <h2 id="chon-vi">Which wallet should I use?</h2>
      <ul>
        <li>
          <strong>Nautilus</strong> — a browser extension, used to connect to DeFi apps on Ergo.
        </li>
        <li>
          <strong>Ergo Mobile Wallet</strong> — an open-source mobile wallet for Android and iOS.
        </li>
        <li>
          <strong>Satergo</strong> — a desktop wallet that can run alongside a full node.
        </li>
      </ul>
      <p>
        Whichever wallet you use, the principle is the same: you hold the seed phrase, you hold the money. Always download wallets from
        their official sources — the full list is at{' '}
        <a href="https://ergoplatform.org/en/get-erg/#Wallets" target="_blank" rel="noreferrer">
          ergoplatform.org/get-erg
        </a>
        .
      </p>

      <h2 id="tiep-theo">What's next</h2>
      <p>
        We've talked a lot about miners. Who are they and what do they do? Read on: <Link to="/learn/mining-basics">Mining Ergo</Link>.
      </p>
    </>
  )
}
