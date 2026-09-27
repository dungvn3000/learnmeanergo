import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Download, Gift, Landmark, Pickaxe } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Callout, Card } from '../components/ui'
import en from './locales/en/Whitepaper.json'
import vi from './locales/vi/Whitepaper.json'

const useT = articleNs('Whitepaper', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code />, sup: <sup /> }

const PDF = 'https://ergoplatform.org/uploads/whitepaper_668cb39ee5.pdf'
const WEB = 'https://docs.ergoplatform.com/doc/whitepaper/'

// The three genesis boxes (whitepaper §7.1). The whitepaper rounds the emission box to
// 93,409,132 ERG; on-chain it held 93,409,132.5 (block 1 spends it), which sums to MAX_SUPPLY.
const GENESIS = { noPremine: 1, treasury: 4_330_791.5, miners: 93_409_132.5 }

function Changed({ children }) {
  const { t } = useT()
  return (
    <Callout type="warn" title={t('changed')}>
      {children}
    </Callout>
  )
}

function GenesisBoxes() {
  const { t } = useT()
  const net = useApi(() => api.networkState(), [])
  const total = GENESIS.noPremine + GENESIS.treasury + GENESIS.miners
  const boxes = [
    { key: 'noPremine', icon: Gift, name: 'No-premine proof', value: GENESIS.noPremine },
    { key: 'treasury', icon: Landmark, name: 'Treasury', value: GENESIS.treasury },
    { key: 'miners', icon: Pickaxe, name: 'Miners reward', value: GENESIS.miners },
  ]
  return (
    <div className="not-prose my-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {boxes.map((b) => (
          <Card key={b.name} className="p-4">
            <b.icon className="size-5 text-ergo-500" />
            <div className="mt-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{b.name}</div>
            <div className="text-lg font-bold tabular-nums text-stone-900 dark:text-white">{num(b.value, 1)} ERG</div>
            <p className="mt-1 text-sm text-stone-500">{t(`genesis.${b.key}`)}</p>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-sm text-stone-500">
        <Trans t={t} i18nKey="genesis.total" values={{ total: num(total, 1) }} components={{ b: <strong className="text-stone-800 dark:text-stone-200" /> }} />
        {net.data && (
          <>
            {' '}
            {t('genesis.issued', { issued: num(net.data.issued), pct: ((net.data.issued / total) * 100).toFixed(2) })}
          </>
        )}
      </p>
    </div>
  )
}

export default function Whitepaper() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro')}</p>
      <div className="not-prose my-6 flex flex-wrap gap-3">
        <a href={PDF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ergo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ergo-700">
          <Download className="size-4" /> Whitepaper (PDF)
        </a>
        <a href={WEB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold hover:border-stone-400 dark:border-stone-700">
          {t('webVersion')}
        </a>
      </div>

      <h2 id="tom-tat">{t('abstract.title')}</h2>
      <p>{T('abstract.p1', { sigma: <Link to="/learn/sigma" /> })}</p>

      <h2 id="gioi-thieu">{t('problem.title')}</h2>
      <p>{T('problem.p1')}</p>

      <h2 id="tam-nhin">{t('vision.title')}</h2>
      <p>{t('vision.p1')}</p>
      <ul>
        <li>{T('vision.decentralization')}</li>
        <li>{T('vision.regular')}</li>
        <li>{T('vision.contractual')}</li>
        <li>{T('vision.longTerm')}</li>
        <li>{T('vision.open')}</li>
      </ul>
      <p>{T('vision.seeAlso', { manifesto: <Link to="/learn/manifesto" /> })}</p>

      <h2 id="autolykos">{t('autolykos.title')}</h2>
      <p>{T('autolykos.p1')}</p>
      <p>{T('autolykos.p2')}</p>
      <Changed>{T('autolykos.changed', { autolykos: <Link to="/learn/autolykos" />, difficulty: <Link to="/learn/difficulty" /> })}</Changed>

      <h2 id="trang-thai">{t('state.title')}</h2>
      <p>{T('state.p1')}</p>
      <p>{t('state.p2')}</p>
      <ul>
        <li>{t('state.replay')}</li>
        <li>{t('state.parallel')}</li>
        <li>{t('state.atomic')}</li>
        <li>{t('state.stateless')}</li>
      </ul>
      <p>{T('state.p3', { box: <Link to="/learn/box" />, block: <Link to="/learn/block" /> })}</p>

      <h2 id="ben-vung">{t('resilience.title')}</h2>
      <p>{t('resilience.p1')}</p>
      <ol>
        <li>{T('resilience.adHoc')}</li>
        <li>{T('resilience.light')}</li>
        <li>{T('resilience.rent', { rent: <Link to="/learn/storage-rent" /> })}</li>
        <li>{T('resilience.amend')}</li>
      </ol>

      <h2 id="dong-erg">{t('erg.title')}</h2>
      <p>{T('erg.p1')}</p>
      <GenesisBoxes />
      <p>{t('erg.p2')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('erg.thBlocks')}</th>
            <th>{t('erg.thMiners')}</th>
            <th>Treasury</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t('erg.row1')}</td>
            <td>67.5 ERG</td>
            <td>7.5 ERG</td>
          </tr>
          <tr>
            <td>{t('erg.row2')}</td>
            <td>67.5 ERG</td>
            <td>4.5 ERG</td>
          </tr>
          <tr>
            <td>{t('erg.row3')}</td>
            <td>67.5 ERG</td>
            <td>1.5 ERG</td>
          </tr>
          <tr>
            <td>655,200 – 719,999</td>
            <td>66 ERG</td>
            <td>—</td>
          </tr>
          <tr>
            <td>{t('erg.row5')}</td>
            <td>{t('erg.row5Miners')}</td>
            <td>—</td>
          </tr>
          <tr>
            <td>2,080,800</td>
            <td>{t('erg.row6Miners')}</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <Changed>{T('erg.changed', { emission: <Link to="/learn/emission" /> })}</Changed>

      <h2 id="tien-hop-dong">{t('contracts.title')}</h2>
      <p>{T('contracts.p1')}</p>
      <ul>
        <li>{T('contracts.free')}</li>
        <li>{T('contracts.bounded')}</li>
      </ul>
      <p>{t('contracts.p2')}</p>
      <ul>
        <li>{T('contracts.ergoscript', { ergotree: <Link to="/learn/ergotree" /> })}</li>
        <li>{T('contracts.dataInputs', { tx: <Link to="/learn/transaction" /> })}</li>
        <li>{T('contracts.tokens', { tokens: <Link to="/learn/tokens" /> })}</li>
      </ul>
      <h3>{t('examples.title')}</h3>
      <ul>
        <li>{T('examples.oracle')}</li>
        <li>{T('examples.mixing')}</li>
      </ul>
      <p>{t('examples.p1')}</p>

      <h2 id="thay-doi">{t('today.title')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('today.thTopic')}</th>
            <th>Whitepaper (2019)</th>
            <th>{t('today.thNow')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t('today.blockTime.topic')}</td>
            <td>{t('today.blockTime.then')}</td>
            <td>{t('today.blockTime.now')}</td>
          </tr>
          <tr>
            <td>PoW</td>
            <td>{t('today.pow.then')}</td>
            <td>{t('today.pow.now')}</td>
          </tr>
          <tr>
            <td>{t('today.difficulty.topic')}</td>
            <td>{t('today.difficulty.then')}</td>
            <td>{t('today.difficulty.now')}</td>
          </tr>
          <tr>
            <td>{t('today.emission.topic')}</td>
            <td>{t('today.emission.then')}</td>
            <td>{t('today.emission.now')}</td>
          </tr>
          <tr>
            <td>Storage rent</td>
            <td>{t('today.rent.then')}</td>
            <td>{t('today.rent.now')}</td>
          </tr>
        </tbody>
      </table>

      <h2 id="doc-them">{t('reading.title')}</h2>
      <ul>
        <li>{T('reading.pdf', { link: <a href={PDF} target="_blank" rel="noreferrer" /> })}</li>
        <li>{T('reading.web', { link: <a href={WEB} target="_blank" rel="noreferrer" /> })}</li>
      </ul>
    </>
  )
}
