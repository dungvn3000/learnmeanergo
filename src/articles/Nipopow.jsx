import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Layers, Link2, Scale, Zap } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { bytes, num } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Card, Figure, Stat } from '../components/ui'
import en from './locales/en/Nipopow.json'
import vi from './locales/vi/Nipopow.json'

const useT = articleNs('Nipopow', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code />, sup: <sup />, sub: <sub /> }

const DOC = 'https://docs.ergoplatform.com/dev/protocol/nipopows/'
const PAPER = 'https://eprint.iacr.org/2017/963.pdf'
const NODES = ['https://sv1.erg.vn', 'https://sv2.erg.vn']
const M = 6
const K = 10

/** Fetch a real NiPoPoW proof from a public Ergo node (the node API allows CORS). */
async function fetchProof() {
  let lastErr
  for (const n of NODES) {
    try {
      const r = await fetch(`${n}/nipopow/proof/${M}/${K}`, { headers: { Accept: 'application/json' } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const p = await r.json()
      const hdr = (x) => x.header ?? x
      const headers = [...p.prefix, p.suffixHead, ...p.suffixTail].map(hdr)
      return {
        node: n,
        m: p.m,
        k: p.k,
        headers,
        tip: headers.at(-1).height,
        prefixHeights: p.prefix.map((x) => x.header.height),
        levels: p.suffixHead.interlinks.length - 1, // the first entry is the genesis id
        approxBytes: headers.reduce((s, h) => s + (h.size || 0), 0),
      }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

function ProofStrip({ heights, tip }) {
  // Every included prefix header as a tick on a 0..tip axis: the sampling gets denser towards the tip.
  return (
    <div className="mt-4">
      <div className="relative h-10 rounded-lg bg-stone-100 dark:bg-stone-800">
        {heights.map((h) => (
          <span key={h} className="absolute top-1 bottom-1 w-px bg-ergo-500" style={{ left: `${(h / tip) * 100}%` }} title={`block ${num(h)}`} />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-stone-500">
        <span>block 1</span>
        <span>block {num(tip)}</span>
      </div>
    </div>
  )
}

function LiveProof() {
  const { t } = useT()
  const state = useApi(fetchProof, [])
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">
        <Trans t={t} i18nKey="live.title" values={{ m: M, k: K }} components={{ code: <code className="font-mono normal-case" /> }} />
      </div>
      <Async state={state}>
        {(p) => (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Layers} label={t('live.chain')} value={num(p.tip)} sub={t('live.chainSub')} />
              <Stat icon={Zap} label={t('live.inProof')} value={num(p.headers.length)} sub={t('live.inProofSub', { size: bytes(p.approxBytes) })} />
              <Stat icon={Scale} label={t('live.compression')} value={`${num(Math.round(p.tip / p.headers.length))}×`} sub={`m = ${p.m}, k = ${p.k}`} />
              <Stat icon={Link2} label={t('live.levels')} value={p.levels} sub={`log₂(${num(p.tip)}) ≈ ${Math.log2(p.tip).toFixed(1)}`} />
            </div>
            <ProofStrip heights={p.prefixHeights} tip={p.tip} />
            <p className="mt-3 text-sm text-stone-500">
              <Trans t={t} i18nKey="live.caption" values={{ k: p.k, node: p.node.replace('https://', '') }} components={{ node: <span className="font-mono" /> }} />
            </p>
          </>
        )}
      </Async>
    </Card>
  )
}

const ROWS = ['headers', 'inclusion', 'balance', 'trust', 'contract', 'phone']

export default function Nipopow() {
  const { t } = useT()
  const T = (k, extra, values) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const ext = (href) => <a href={href} target="_blank" rel="noreferrer" />
  return (
    <>
      <p>{T('intro')}</p>
      <LiveProof />

      <h2 id="superblock">{t('superblock.title')}</h2>
      <p>{T('superblock.p1', { difficulty: <Link to="/learn/difficulty" /> })}</p>
      <ul>
        <li>{t('superblock.level0')}</li>
        <li>{t('superblock.level1')}</li>
        <li>{T('superblock.levelMu')}</li>
      </ul>
      <p>{T('superblock.p2')}</p>
      <Figure src="/img/nipopow.webp" alt={t('superblock.figAlt')} width={1360} height={468} caption={t('superblock.figCaption')} />

      <h2 id="interlink">{t('interlink.title')}</h2>
      <p>{T('interlink.p1')}</p>
      <Callout type="note" title={t('interlink.noteTitle')}>
        {t('interlink.note')}
      </Callout>

      <h2 id="bang-chung">{t('proof.title')}</h2>
      <p>{t('proof.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('proof.component')}</th>
            <th>{t('proof.meaning')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>m</code>
            </td>
            <td>{t('proof.m')}</td>
          </tr>
          <tr>
            <td>
              <code>k</code>
            </td>
            <td>{t('proof.k')}</td>
          </tr>
          <tr>
            <td>
              <code>prefix</code> (π)
            </td>
            <td>{t('proof.prefix')}</td>
          </tr>
          <tr>
            <td>
              <code>suffixHead</code> + <code>suffixTail</code> (χ)
            </td>
            <td>{t('proof.suffix')}</td>
          </tr>
        </tbody>
      </table>
      <p>{T('proof.p2', {}, { m: M, k: K })}</p>

      <h2 id="so-sanh">{t('verify.title')}</h2>
      <p>{T('verify.p1')}</p>
      <ol>
        <li>{t('verify.step1')}</li>
        <li>{t('verify.step2')}</li>
        <li>{T('verify.step3')}</li>
      </ol>
      <p>{T('verify.p2')}</p>
      <Callout type="warn" title={t('verify.warnTitle')}>
        {t('verify.warn')}
      </Callout>

      <h2 id="electrum">{t('spv.title')}</h2>
      <p>{T('spv.p1')}</p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Bitcoin SPV / Electrum</th>
            <th>Ergo NiPoPoW</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r}>
              <td>{t(`spv.rows.${r}.label`)}</td>
              <td>{t(`spv.rows.${r}.btc`)}</td>
              <td>{T(`spv.rows.${r}.ergo`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{T('spv.p2')}</p>

      <h2 id="ung-dung">{t('uses.title')}</h2>
      <ul>
        <li>{T('uses.bootstrap')}</li>
        <li>{T('uses.light', { block: <Link to="/learn/block" /> })}</li>
        <li>{T('uses.mining')}</li>
        <li>{T('uses.bridges')}</li>
      </ul>
      <p>{t('uses.p1')}</p>

      <h2 id="doc-them">{t('reading.title')}</h2>
      <ul>
        <li>{T('reading.docs', { doc: ext(DOC) })}</li>
        <li>{T('reading.paper', { paper: ext(PAPER) })}</li>
        <li>{T('reading.storage', { storage: ext('https://eprint.iacr.org/2019/1444.pdf') })}</li>
      </ul>
    </>
  )
}
