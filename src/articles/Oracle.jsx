import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Card, Field, Hash } from '../components/ui'
import en from './locales/en/Oracle.json'
import vi from './locales/vi/Oracle.json'

const useT = articleNs('Oracle', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

// ERGUSD-NFT: the token that identifies the ERG/USD oracle pool box (SigmaUSD reads this box).
const POOL_NFT = '011d3364de07e5a26f0c4eef0852cddb387039a921b7154ef3cab22c6eda887f'

// NFTs of the v2 pools (EIP-23) running on mainnet.
const V2_USD_NFT = '6a2b821b5727e85beb5e78b4efb9f0250d59cd48481d2ded2c23e91ba1d07c66'
const V2_GOLD_NFT = '3c45f29a5165b030fdb5eaf5d81f8108f9d8f507b31487dd51f4ae08fe07cf4a'

const URLS = {
  docsPools: 'https://docs.ergoplatform.com/eco/oracles-v2/',
  docsBootstrap: 'https://docs.ergoplatform.com/tutorials/oracle-bootstrap/',
  joinPool: 'https://github.com/ergoplatform/oracle-core/blob/develop/README.md#joining-a-running-pool',
  easyOracle: 'https://github.com/reqlez/ergo-easy-oracle',
  oracleStats: 'https://error1100.github.io/oracle-stats/',
}

const REFS = [
  ['docsPools', URLS.docsPools],
  ['docsBootstrap', URLS.docsBootstrap],
  ['easyOracle', URLS.easyOracle],
  ['oracleStats', URLS.oracleStats],
  ['eip23', 'https://github.com/ergoplatform/eips/pull/41'],
  ['eip16', 'https://github.com/ergoplatform/eips/pull/29'],
  ['oracleCore', 'https://github.com/ergoplatform/oracle-core'],
  ['ageusdSpec', 'https://github.com/Emurgo/age-usd/blob/main/ageusd-specs/v0.3/stablecoin-spec.md'],
  ['ageusdContract', 'https://github.com/Emurgo/age-usd/blob/main/ageusd-smart-contracts/v0.4/AgeUSD.scala'],
]

/** Find the box currently holding the pool NFT: token → holder address → that address's box with the NFT. */
async function loadPoolBox() {
  const token = await api.token(POOL_NFT)
  const addr = token?.holders?.[0]?.address
  if (!addr) return null
  const page = await api.addressBoxes(addr, 1, 20)
  const hit = page?.items?.find((b) => b.assets?.some((a) => a.tokenId === POOL_NFT))
  return hit ? api.box(hit.boxId) : null
}

function LivePool() {
  const { t } = useT()
  const state = useApi(loadPoolBox, [], 60000)
  return (
    <Async state={state}>
      {(box) => {
        const reg = (k) => box.registers?.find((r) => r.key === k)?.value
        const nano = Number(reg('R4'))
        const r5 = reg('R5')
        return (
          <Card className="not-prose my-6 px-5 py-2">
            <Field name={t('live.box')} value={<Hash value={box.boxId} to={`/box/${box.boxId}`} />}>
              {t('live.height', { height: num(box.creationHeight) })}
            </Field>
            <Field name={t('live.nft')} value={<Hash value={POOL_NFT} to={`/token/${POOL_NFT}`} />}>
              ERGUSD-NFT
            </Field>
            {nano > 0 && (
              <Field name={t('live.r4')} value={<span className="font-semibold tabular-nums">{num(nano)}</span>}>
                {t('live.r4Text', { nano: num(nano), erg: (nano / 1e9).toFixed(2), usd: (1e9 / nano).toFixed(4) })}
              </Field>
            )}
            {r5 && (
              <Field name={t('live.r5')} value={<span className="tabular-nums">{num(r5)}</span>}>
                {t('live.r5Text')}
              </Field>
            )}
            <Field name={t('live.tx')} value={<Hash value={box.transactionId} to={`/tx/${box.transactionId}`} />}>
              {t('live.txText')}
            </Field>
          </Card>
        )
      }}
    </Async>
  )
}

export default function Oracle() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro')}</p>

      <h2 id="vi-sao-can-oracle">{t('why.title')}</h2>
      <p>{T('why.p1')}</p>
      <p>{t('why.p2')}</p>

      <h2 id="oracle-la-mot-box">{t('box.title')}</h2>
      <p>{T('box.p1', { registers: <Link to="/learn/box" />, tokens: <Link to="/learn/tokens" /> })}</p>
      <p>{T('box.p2', { tx: <Link to="/learn/transaction" /> })}</p>
      <pre>
        <code>{t('box.code')}</code>
      </pre>
      <Callout type="note" title={t('box.nftTitle')}>
        {t('box.nft')}
      </Callout>
      <Callout type="tip" title={t('box.readTitle')}>
        {t('box.read')}
      </Callout>

      <h2 id="oracle-pool">{t('pool.title')}</h2>
      <p>{T('pool.p1')}</p>
      <ol>
        <li>{T('pool.s1')}</li>
        <li>{T('pool.s2')}</li>
        <li>{T('pool.s3')}</li>
      </ol>
      <figure className="not-prose my-6">
        <img
          src="/img/oracle-pool.webp"
          alt={t('pool.figAlt')}
          width={1360}
          height={768}
          loading="lazy"
          className="w-full rounded-xl border border-stone-200 dark:border-stone-800"
        />
        <figcaption className="mt-2 text-center text-sm text-stone-500">{t('pool.figCaption')}</figcaption>
      </figure>
      <p>{t('pool.p2')}</p>
      <p>{T('pool.v2', { usd: <Link to={`/token/${V2_USD_NFT}`} />, gold: <Link to={`/token/${V2_GOLD_NFT}`} /> })}</p>

      <h2 id="pool-erg-usd">{t('live.title')}</h2>
      <p>{t('live.p1')}</p>
      <LivePool />

      <h2 id="sigmausd">{t('sigusd.title')}</h2>
      <p>{T('sigusd.p1')}</p>
      <p>{t('sigusd.p2')}</p>

      <h2 id="nha-van-hanh">{t('operators.title')}</h2>
      <p>{T('operators.p1')}</p>
      <p>{T('operators.p2')}</p>
      <h3>{t('operators.costTitle')}</h3>
      <ul>
        <li>{T('operators.cost1')}</li>
        <li>{T('operators.cost2')}</li>
        <li>{T('operators.cost3')}</li>
        <li>{T('operators.cost4')}</li>
      </ul>
      <p className="text-sm text-stone-500">{t('operators.note')}</p>
      <h3>{t('operators.joinTitle')}</h3>
      <p>{T('operators.join')}</p>
      <p>
        {T('operators.guide', {
          bootstrap: <a href={URLS.docsBootstrap} target="_blank" rel="noreferrer" />,
          join: <a href={URLS.joinPool} target="_blank" rel="noreferrer" />,
          easy: <a href={URLS.easyOracle} target="_blank" rel="noreferrer" />,
          stats: <a href={URLS.oracleStats} target="_blank" rel="noreferrer" />,
        })}
      </p>

      <Callout type="warn" title={t('trust.title')}>
        {t('trust.text')}
      </Callout>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>{T('next.p1', { tx: <Link to="/learn/transaction" />, box: <Link to="/learn/box" /> })}</p>

      <h2 id="tham-khao">{t('refs.title')}</h2>
      <ul>
        {REFS.map(([key, href]) => (
          <li key={key}>
            <a href={href} target="_blank" rel="noreferrer">
              {t(`refs.${key}`)}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
