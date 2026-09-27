import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { bytesToHex, decodeAddress } from '../../lib/ergo'
import { Async, Callout, Card, Field, Hash } from '../../components/ui'

const SEG = {
  prefix: 'bg-ergo-100 text-ergo-800 dark:bg-ergo-900/50 dark:text-ergo-200',
  content: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  checksum: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
}

const TYPE_DESC = {
  1: 'The content is a 33-byte compressed public key (secp256k1).',
  2: 'The first 24 bytes of blake2b256(script).',
  3: 'The content is the full serialized ErgoTree.',
}

function Decoded({ address, label }) {
  let d
  try {
    d = decodeAddress(address)
  } catch (e) {
    return <p>Couldn’t decode the address: {e.message}</p>
  }
  const prefixHex = d.prefix.toString(16).padStart(2, '0')
  const contentHex = bytesToHex(d.content)
  const checksumHex = bytesToHex(d.checksum)
  const networkName = d.network === 0x00 ? 'Mainnet' : d.network === 0x10 ? 'Testnet' : 'Unknown'
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{label}</div>
      <div className="mb-4 text-sm">
        <Hash value={address} to={`/address/${address}`} full />
      </div>
      <div className="mb-1 text-xs text-stone-500">After Base58 decoding ({d.raw.length} bytes):</div>
      <div className="rounded-lg bg-stone-50 p-3 font-mono text-sm leading-7 break-all dark:bg-stone-950">
        <span className={`rounded px-1 ${SEG.prefix}`}>{prefixHex}</span>
        <span className={`rounded px-1 ${SEG.content}`}>{contentHex}</span>
        <span className={`rounded px-1 ${SEG.checksum}`}>{checksumHex}</span>
      </div>
      <div className="mt-4">
        <Field
          name={<span className={`rounded px-1.5 ${SEG.prefix}`}>Prefix</span>}
          value={
            <span className="font-mono">
              0x{prefixHex} = network 0x{d.network.toString(16).padStart(2, '0')} ({networkName}) + type {d.type} ({d.typeInfo?.code ?? '?'})
            </span>
          }
        >
          The high 4 bits are the network, the low 4 bits are the address type.
        </Field>
        <Field name={<span className={`rounded px-1.5 ${SEG.content}`}>Content</span>} value={`${d.content.length} bytes`}>
          {TYPE_DESC[d.type]}
        </Field>
        <Field
          name={<span className={`rounded px-1.5 ${SEG.checksum}`}>Checksum</span>}
          value={
            <span className="inline-flex flex-wrap items-center gap-2 font-mono">
              {checksumHex}
              {d.valid ? (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-emerald-600">
                  <Check className="size-3.5" /> matches blake2b256(prefix ‖ content)[0..4] = {bytesToHex(d.expectedChecksum)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-red-600">
                  <X className="size-3.5" /> mismatch ({bytesToHex(d.expectedChecksum)})
                </span>
              )}
            </span>
          }
        >
          Recomputed right here in your browser.
        </Field>
        {d.ergoTree && (
          <Field name="ErgoTree" value={<span className="font-mono break-all">{d.ergoTree}</span>}>
            {d.type === 1 ? 'P2PK: just prepend 0008cd to the public key.' : 'P2S: the content is the ErgoTree itself.'}
          </Field>
        )}
      </div>
    </Card>
  )
}

function LiveMiner() {
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) =>
        blocks?.[0]?.minerAddress ? (
          <Decoded address={blocks[0].minerAddress} label={`Address that mined block #${blocks[0].height.toLocaleString('en-US')} (${blocks[0].miner || 'miner'})`} />
        ) : (
          <p>Couldn’t fetch the latest block.</p>
        )
      }
    </Async>
  )
}

const FEE_ADDRESS =
  '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe'

export default function Address() {
  return (
    <>
      <p>
        On the blockchain, a box doesn’t store an “address” — it stores an <Link to="/learn/ergotree">ErgoTree</Link>. An address is just a way of writing an
        ErgoTree (or part of one) so that humans can copy it, paste it and read it over the phone without fear of typos. An Ergo address has three parts,
        encoded in Base58:
      </p>
      <pre>
        <code>{`address = Base58( prefix ‖ content ‖ checksum )
checksum = blake2b256( prefix ‖ content )[0..4]`}</code>
      </pre>

      <h2 id="prefix">The prefix byte: network + type</h2>
      <p>
        The first byte packs two pieces of information: the <strong>network</strong> (high 4 bits) and the <strong>address type</strong> (low 4 bits). Add
        them together and you get the prefix:
      </p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Mainnet (0x00)</th>
            <th>Testnet (0x10)</th>
            <th>Content</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>P2PK</strong> (1)
            </td>
            <td>
              <code>0x01</code> → starts with <code>9</code>
            </td>
            <td>
              <code>0x11</code> → starts with <code>3</code>
            </td>
            <td>Compressed public key, 33 bytes</td>
          </tr>
          <tr>
            <td>
              <strong>P2SH</strong> (2)
            </td>
            <td>
              <code>0x02</code> → starts with <code>6</code>, <code>7</code> or <code>8</code>
            </td>
            <td>
              <code>0x12</code>
            </td>
            <td>First 24 bytes of blake2b256(script)</td>
          </tr>
          <tr>
            <td>
              <strong>P2S</strong> (3)
            </td>
            <td>
              <code>0x03</code>
            </td>
            <td>
              <code>0x13</code>
            </td>
            <td>The entire ErgoTree</td>
          </tr>
        </tbody>
      </table>
      <p>
        Because Base58 represents the whole byte string as one big number, the first byte largely determines the first character. That’s why every mainnet
        Ergo wallet address starts with a <code>9</code>.
      </p>

      <h2 id="p2pk">P2PK: the everyday wallet address</h2>
      <p>
        Pay-to-Public-Key is the kind you use every day. The content is just the 33-byte public key; the full ErgoTree is always <code>0008cd</code> + the
        public key, so it doesn’t need to be stored. Below is the address of the miner who just found the latest block, split into bytes right in your
        browser:
      </p>
      <LiveMiner />

      <h2 id="p2s">P2S: the address of a contract</h2>
      <p>
        Pay-to-Script contains the <em>entire</em> ErgoTree. The result is a long address — sometimes hundreds of characters — but anyone can read the
        contract from the address alone. Example: the address of the miner fee contract, which appears in almost every transaction:
      </p>
      <Decoded address={FEE_ADDRESS} label="Miner fee contract (P2S)" />

      <h2 id="p2sh">P2SH: storing only a hash</h2>
      <p>
        Pay-to-Script-Hash stores only the first 24 bytes (192 bits) of the script’s <code>blake2b256</code>. The address is short, but the spender must
        supply the original script when spending the box, and the script is only revealed at that moment. In practice P2SH is rarely used; most dApps use P2S
        so the contract is transparent from the start.
      </p>

      <h2 id="checksum">Checksum: catching typos</h2>
      <p>
        The last 4 bytes are the checksum: take the <code>blake2b256</code> of (prefix ‖ content) and keep the first 4 bytes. Wallets verify the checksum
        before sending; if you mistype a character, the chance that the checksum still matches is only about 1 in 4 billion.
      </p>
      <Callout type="note" title="Why Base58?">
        Base58 is Base64 without the easily confused characters: the digit <code>0</code> and the letter <code>O</code>, uppercase <code>I</code> and
        lowercase <code>l</code>, plus the <code>+</code> and <code>/</code> symbols. Ergo uses the same alphabet as Bitcoin.
      </Callout>

      <h2 id="mot-khoa-nhieu-dia-chi">One wallet, many addresses</h2>
      <p>
        Modern wallets (following BIP-32/BIP-44, with the path <code>m/44&apos;/429&apos;/0&apos;/0/i</code>) derive a whole sequence of keys from one seed
        phrase — each key is a P2PK address. And since an address is just a way of writing an ErgoTree, the “address” of a complex contract is just as valid
        as a wallet address: you can send funds to it as usual.
      </p>

      <h2 id="tu-thu">Try it yourself</h2>
      <ul>
        <li>
          <Link to="/tools/address-decoder">Address decoder</Link> — paste any address to split it byte by byte.
        </li>
        <li>
          <Link to="/tools/pubkey-to-address">Public key → Address</Link> — build a P2PK address yourself.
        </li>
        <li>
          <Link to="/tools/blake2b">Blake2b-256</Link> — compute the checksum yourself.
        </li>
      </ul>
    </>
  )
}
