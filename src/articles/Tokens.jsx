import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { ArrowDown, Check, Shapes } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num, short, tokenAmount } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Badge, Callout, Card, Field, Hash, Swatch } from '../components/ui'
import en from './locales/en/Tokens.json'
import vi from './locales/vi/Tokens.json'

const useT = articleNs('Tokens', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const SIGUSD = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04'

/** Load SigUSD plus its issuing transaction, so we can show id == first input. */
async function loadSigUsd() {
  const token = await api.token(SIGUSD)
  if (!token) return null
  const tx = token.issueTx ? await api.transaction(token.issueTx) : null
  return { token, tx }
}

function IssueProof({ token, tx }) {
  const { t } = useT()
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
        <Badge tone="ergo">{t('proof.issuedIn', { height: num(token.issueHeight) })}</Badge>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
          <div className="text-xs text-stone-500">{t('proof.firstInput')}</div>
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
            {match ? t('proof.match') : t('proof.noMatch')}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Field name={t('proof.issueTx')} value={<Hash value={token.issueTx} to={`/tx/${token.issueTx}`} />} />
        <Field name={t('proof.supply')} value={t('proof.supplyValue', { amount: tokenAmount(token.supply, token.decimals), raw: num(token.supply) })}>
          {t('proof.supplyNote', { decimals: token.decimals })}
        </Field>
        {issueBox?.registers?.map((r) => (
          <Field key={r.key} name={`${r.key} · ${r.type}`} value={<code className="font-mono text-xs">{r.value}</code>}>
            {r.key === 'R4' && t('proof.R4')}
            {r.key === 'R5' && t('proof.R5')}
            {r.key === 'R6' && t('proof.R6')}
          </Field>
        ))}
        {token.holderCount != null && <Field name={t('proof.holders')} value={num(token.holderCount)} />}
      </div>
    </Card>
  )
}

function TokenTable({ tokens }) {
  const { t } = useT()
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs text-stone-500 uppercase dark:bg-stone-900">
          <tr>
            <th className="px-3 py-2">Token</th>
            <th className="px-3 py-2">Id</th>
            <th className="px-3 py-2 text-right">Decimals</th>
            <th className="px-3 py-2 text-right">{t('table.issueBlock')}</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tk) => (
            <tr key={tk.id} className="border-t border-stone-100 dark:border-stone-800">
              <td className="px-3 py-2">
                <Link to={`/token/${tk.id}`} className="flex items-center gap-2 font-medium hover:text-ergo-600">
                  <Swatch id={tk.id} className="size-2.5 rounded-full" />
                  {tk.name || short(tk.id, 6, 4)}
                </Link>
                {tk.desc && <div className="max-w-xs truncate text-xs text-stone-500">{tk.desc}</div>}
              </td>
              <td className="px-3 py-2 font-mono text-xs">{short(tk.id, 8, 6)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{tk.decimals}</td>
              <td className="px-3 py-2 text-right tabular-nums">{tk.issueHeight ? num(tk.issueHeight) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Tokens() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  const sig = useApi(loadSigUsd, [])
  const list = useApi(() => api.tokens(), [])
  return (
    <>
      <p>{T('intro')}</p>

      <h2 id="phat-hanh">{t('issue.title')}</h2>
      <p>{t('issue.p1')}</p>
      <Callout type="tip" title={t('issue.ruleTitle')}>
        {T('issue.rule')}
      </Callout>
      <p>{t('issue.p2')}</p>
      <p>{t('issue.p3')}</p>
      <Async state={sig} notFound={t('issue.notFound')}>
        {({ token, tx }) => <IssueProof token={token} tx={tx} />}
      </Async>

      <h2 id="eip-4">{t('eip4.title')}</h2>
      <p>{T('eip4.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>Register</th>
            <th>{t('eip4.meaning')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>R4</code>
            </td>
            <td>{t('eip4.R4')}</td>
          </tr>
          <tr>
            <td>
              <code>R5</code>
            </td>
            <td>{t('eip4.R5')}</td>
          </tr>
          <tr>
            <td>
              <code>R6</code>
            </td>
            <td>{t('eip4.R6')}</td>
          </tr>
          <tr>
            <td>
              <code>R7</code>–<code>R9</code>
            </td>
            <td>{t('eip4.R7')}</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn" title={t('eip4.warnTitle')}>
        {T('eip4.warn')}
      </Callout>

      <h2 id="chuyen-va-dot">{t('transfer.title')}</h2>
      <p>{t('transfer.p1')}</p>
      <ul>
        <li>{T('transfer.move')}</li>
        <li>{T('transfer.burn')}</li>
      </ul>
      <p>{T('transfer.p2', { box: <Link to="/learn/box" /> })}</p>

      <h2 id="token-noi-bat">{t('list.title')}</h2>
      <p>{t('list.p1')}</p>
      <Async state={list} notFound={t('list.notFound')}>
        {(tokens) => <TokenTable tokens={tokens} />}
      </Async>

      <h2 id="nft-va-hop-dong">{t('nft.title')}</h2>
      <p>{t('nft.p1')}</p>
    </>
  )
}
