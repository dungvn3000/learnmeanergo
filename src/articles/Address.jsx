import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { bytesToHex, decodeAddress } from '../lib/ergo'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Card, Field, Hash } from '../components/ui'
import en from './locales/en/Address.json'
import vi from './locales/vi/Address.json'

const useT = articleNs('Address', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const SEG = {
  prefix: 'bg-ergo-100 text-ergo-800 dark:bg-ergo-900/50 dark:text-ergo-200',
  content: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  checksum: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
}

function Decoded({ address, label }) {
  const { t } = useT()
  let d
  try {
    d = decodeAddress(address)
  } catch (e) {
    return <p>{t('decoded.error', { message: e.message })}</p>
  }
  const prefixHex = d.prefix.toString(16).padStart(2, '0')
  const contentHex = bytesToHex(d.content)
  const checksumHex = bytesToHex(d.checksum)
  const networkName = d.network === 0x00 ? 'Mainnet' : d.network === 0x10 ? 'Testnet' : t('decoded.unknownNetwork')
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{label}</div>
      <div className="mb-4 text-sm">
        <Hash value={address} to={`/address/${address}`} full />
      </div>
      <div className="mb-1 text-xs text-stone-500">{t('decoded.afterBase58', { n: d.raw.length })}</div>
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
          {t('decoded.prefixDesc')}
        </Field>
        <Field name={<span className={`rounded px-1.5 ${SEG.content}`}>{t('decoded.content')}</span>} value={t('decoded.contentBytes', { n: d.content.length })}>
          {[1, 2, 3].includes(d.type) ? t(`typeDesc.${d.type}`) : undefined}
        </Field>
        <Field
          name={<span className={`rounded px-1.5 ${SEG.checksum}`}>Checksum</span>}
          value={
            <span className="inline-flex flex-wrap items-center gap-2 font-mono">
              {checksumHex}
              {d.valid ? (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-emerald-600">
                  <Check className="size-3.5" /> {t('decoded.match', { checksum: bytesToHex(d.expectedChecksum) })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-red-600">
                  <X className="size-3.5" /> {t('decoded.mismatch', { checksum: bytesToHex(d.expectedChecksum) })}
                </span>
              )}
            </span>
          }
        >
          {t('decoded.checksumDesc')}
        </Field>
        {d.ergoTree && (
          <Field name="ErgoTree" value={<span className="font-mono break-all">{d.ergoTree}</span>}>
            {d.type === 1 ? t('decoded.treeP2pk') : t('decoded.treeP2s')}
          </Field>
        )}
      </div>
    </Card>
  )
}

function LiveMiner() {
  const { t } = useT()
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) =>
        blocks?.[0]?.minerAddress ? (
          <Decoded
            address={blocks[0].minerAddress}
            label={t('live.label', { height: blocks[0].height.toLocaleString('en-US'), miner: blocks[0].miner || t('live.miner') })}
          />
        ) : (
          <p>{t('live.error')}</p>
        )
      }
    </Async>
  )
}

const FEE_ADDRESS =
  '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe'

export default function Address() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro', { ergotree: <Link to="/learn/ergotree" /> })}</p>
      <pre>
        <code>{`address = Base58( prefix ‖ content ‖ checksum )
checksum = blake2b256( prefix ‖ content )[0..4]`}</code>
      </pre>

      <h2 id="prefix">{t('prefix.title')}</h2>
      <p>{T('prefix.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('prefix.thType')}</th>
            <th>Mainnet (0x00)</th>
            <th>Testnet (0x10)</th>
            <th>{t('prefix.thContent')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>P2PK</strong> (1)
            </td>
            <td>{T('prefix.p2pkStart')}</td>
            <td>{T('prefix.p2pkTestStart')}</td>
            <td>{t('prefix.p2pkContent')}</td>
          </tr>
          <tr>
            <td>
              <strong>P2SH</strong> (2)
            </td>
            <td>{T('prefix.p2shStart')}</td>
            <td>
              <code>0x12</code>
            </td>
            <td>{t('prefix.p2shContent')}</td>
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
            <td>{t('prefix.p2sContent')}</td>
          </tr>
        </tbody>
      </table>
      <p>{T('prefix.p2')}</p>

      <h2 id="p2pk">{t('p2pk.title')}</h2>
      <p>{T('p2pk.p1')}</p>
      <LiveMiner />

      <h2 id="p2s">{t('p2s.title')}</h2>
      <p>{T('p2s.p1')}</p>
      <Decoded address={FEE_ADDRESS} label={t('p2s.feeLabel')} />

      <h2 id="p2sh">{t('p2sh.title')}</h2>
      <p>{T('p2sh.p1')}</p>

      <h2 id="checksum">{t('checksum.title')}</h2>
      <p>{T('checksum.p1')}</p>
      <Callout type="note" title={t('checksum.base58Title')}>
        {T('checksum.base58Text')}
      </Callout>

      <h2 id="mot-khoa-nhieu-dia-chi">{t('many.title')}</h2>
      <p>{T('many.p1')}</p>

      <h2 id="tu-thu">{t('try.title')}</h2>
      <ul>
        <li>{T('try.decoder', { link: <Link to="/tools/address-decoder" /> })}</li>
        <li>{T('try.pubkey', { link: <Link to="/tools/pubkey-to-address" /> })}</li>
        <li>{T('try.blake', { link: <Link to="/tools/blake2b" /> })}</li>
      </ul>
    </>
  )
}
