import { Link } from 'react-router-dom'
import { ArrowDown, Check, Shapes } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { num, short, tokenAmount } from '../../lib/format'
import { Async, Badge, Callout, Card, Field, Hash, Swatch } from '../../components/ui'

const SIGUSD = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04'

/** Load SigUSD plus its issuing transaction, so we can show id == first input. */
async function loadSigUsd() {
  const token = await api.token(SIGUSD)
  if (!token) return null
  const tx = token.issueTx ? await api.transaction(token.issueTx) : null
  return { token, tx }
}

function IssueProof({ token, tx }) {
  const first = tx?.inputs?.[0]?.boxId
  const issueBox = tx?.outputs?.find((o) => o.boxId === token.issueBox) ?? tx?.outputs?.find((o) => o.assets?.some((a) => a.tokenId === token.id))
  const match = first === token.id
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Shapes className="size-5 text-ergo-500" />
          <Link to={`/token/${token.id}`} className="hover:text-ergo-600">
            {token.name}
          </Link>
        </div>
        <Badge tone="ergo">issued in block {num(token.issueHeight)}</Badge>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
          <div className="text-xs text-stone-500">First input of the issuing transaction</div>
          <Hash value={first} to={`/box/${first}`} full />
        </div>
        <div className="flex justify-center text-ergo-500">
          <ArrowDown className="size-5" />
        </div>
        <div className="rounded-xl border border-ergo-300 bg-ergo-50 p-3 dark:border-ergo-800 dark:bg-ergo-950/40">
          <div className="text-xs text-stone-500">Token id</div>
          <Hash value={token.id} full />
          <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${match ? 'text-emerald-600' : 'text-red-600'}`}>
            {match && <Check className="size-3.5" />}
            {match ? 'Matches byte for byte.' : 'No match (?)'}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Field name="Issuing transaction" value={<Hash value={token.issueTx} to={`/tx/${token.issueTx}`} />} />
        <Field name="Total supply" value={`${tokenAmount(token.supply, token.decimals)} (raw: ${num(token.supply)})`}>
          The blockchain only stores integers. The displayed figure comes from dividing by 10^{token.decimals}.
        </Field>
        {issueBox?.registers?.map((r) => (
          <Field key={r.key} name={`${r.key} · ${r.type}`} value={<code className="font-mono text-xs">{r.value}</code>}>
            {r.key === 'R4' && 'Token name (UTF-8 string).'}
            {r.key === 'R5' && 'Description.'}
            {r.key === 'R6' && 'Number of decimal places — also stored as a string.'}
          </Field>
        ))}
        {token.holderCount != null && <Field name="Holder addresses" value={num(token.holderCount)} />}
      </div>
    </Card>
  )
}

function TokenTable({ tokens }) {
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs text-stone-500 uppercase dark:bg-stone-900">
          <tr>
            <th className="px-3 py-2">Token</th>
            <th className="px-3 py-2">Id</th>
            <th className="px-3 py-2 text-right">Decimals</th>
            <th className="px-3 py-2 text-right">Issue block</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.id} className="border-t border-stone-100 dark:border-stone-800">
              <td className="px-3 py-2">
                <Link to={`/token/${t.id}`} className="flex items-center gap-2 font-medium hover:text-ergo-600">
                  <Swatch id={t.id} className="size-2.5 rounded-full" />
                  {t.name || short(t.id, 6, 4)}
                </Link>
                {t.desc && <div className="max-w-xs truncate text-xs text-stone-500">{t.desc}</div>}
              </td>
              <td className="px-3 py-2 font-mono text-xs">{short(t.id, 8, 6)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{t.decimals}</td>
              <td className="px-3 py-2 text-right tabular-nums">{t.issueHeight ? num(t.issueHeight) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Tokens() {
  const sig = useApi(loadSigUsd, [])
  const list = useApi(() => api.tokens(), [])
  return (
    <>
      <p>
        On Ethereum, a token is a smart contract that keeps a table of balances. On Ergo it's far simpler: tokens are <strong>first-class citizens</strong> of the protocol — the node itself understands them, no contract in between. Every box has an <code>R2</code> register holding a list of <code>(token id, amount)</code> pairs, and nodes check directly that no tokens are
        created out of thin air. No contract needed, and no <code>transfer()</code> function that could be buggy.
      </p>

      <h2 id="phat-hanh">Issuing a token</h2>
      <p>The protocol has just one rule:</p>
      <Callout type="tip" title="The issuance rule">
        A transaction may create <strong>one</strong> new token, and the token id <strong>must equal the boxId of the transaction's first input</strong>.
      </Callout>
      <p>
        Since each box can only be spent once, that id can never repeat — token ids are unique without anyone having to hand them out. The amount issued is up to
        you (even 1 — that's an NFT), and once issued, no more can ever be minted.
      </p>
      <p>Let's verify it on SigUSD — the stablecoin of the SigmaUSD protocol:</p>
      <Async state={sig} notFound="Couldn't load SigUSD.">
        {({ token, tx }) => <IssueProof token={token} tx={tx} />}
      </Async>

      <h2 id="eip-4">Metadata: the EIP-4 standard</h2>
      <p>
        The protocol has no idea what a token is called — it only sees a 32-byte id. The name, description and decimals are an <strong>EIP-4</strong> convention:
        they're written into the registers of the first box holding the token (the issuing transaction's output), as UTF-8 strings of type <code>Coll[Byte]</code>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Register</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>R4</code>
            </td>
            <td>Name, e.g. “SigUSD”</td>
          </tr>
          <tr>
            <td>
              <code>R5</code>
            </td>
            <td>Description</td>
          </tr>
          <tr>
            <td>
              <code>R6</code>
            </td>
            <td>Number of decimals, e.g. “2”</td>
          </tr>
          <tr>
            <td>
              <code>R7</code>–<code>R9</code>
            </td>
            <td>NFT extensions: asset type, content hash, link (URL)</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn" title="A name is not an identity">
        Anyone can issue a token called “SigUSD”. Wallets and explorers must identify tokens by <strong>id</strong>, not by name. The very SigUSD issuing
        transaction above even contains another token named “SigUSD” with a different id — the only thing you can trust is the id.
      </Callout>

      <h2 id="chuyen-va-dot">Transferring and burning tokens</h2>
      <p>For each token id, nodes check: total amount in outputs ≤ total amount in inputs (except for a token being issued).</p>
      <ul>
        <li>
          <strong>Transfer:</strong> spend the box holding the token and create a new box, locked to the recipient, with the same token. Tokens always have to
          live in a box, so that box also needs the minimum amount of ERG.
        </li>
        <li>
          <strong>Burn:</strong> simply don't put the token in any output. The part that “disappears” is destroyed forever — no burn address needed.
        </li>
      </ul>
      <p>
        A box can hold many kinds of tokens (up to 255), and its total size cannot exceed 4 KB. More on registers in <Link to="/learn/box">Boxes &amp;
        registers</Link>.
      </p>

      <h2 id="token-noi-bat">Some tokens on mainnet</h2>
      <p>The list tracked by explorer.erg.vn, pulled live from its API:</p>
      <Async state={list} notFound="No token data.">
        {(tokens) => <TokenTable tokens={tokens} />}
      </Async>

      <h2 id="nft-va-hop-dong">NFTs as “ID cards” for contracts</h2>
      <p>
        A token with an amount of 1 is an NFT. Beyond artwork, NFTs play an important role in Ergo DeFi: a stateful contract (an oracle pool, the SigmaUSD bank, a
        DEX pool) holds a unique NFT, and every time its state changes, the NFT moves to the new box. To find a contract's “current state”, you just look for the
        unspent box holding that NFT.
      </p>
    </>
  )
}
