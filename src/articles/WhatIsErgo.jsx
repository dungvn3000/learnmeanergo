import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Blocks, Clock, Cpu, ShieldCheck, Coins, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num, ago } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Callout, Card, Stat } from '../components/ui'
import en from './locales/en/WhatIsErgo.json'
import vi from './locales/vi/WhatIsErgo.json'

const useT = articleNs('WhatIsErgo', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

function LiveNow() {
  const { t } = useT()
  const state = useApi(() => api.networkState(), [], 30000)
  const d = state.data
  if (!d) return null
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
      <Stat icon={Blocks} label={t('live.height')} value={<Link to={`/block/${d.height}`} className="hover:text-ergo-600">{num(d.height)}</Link>} sub={ago(d.tipTimestamp)} />
      <Stat icon={Coins} label={t('live.circulating')} value={num(d.circulating)} sub={t('live.maxSupply', { max: num(d.maxSupply) })} />
      <Stat icon={Cpu} label={t('live.hashrate')} value={`${d.hashrate} TH/s`} sub={t('live.peers', { peers: d.peers })} />
    </div>
  )
}

const FEATURES = [
  { key: 'pow', icon: ShieldCheck },
  { key: 'box', icon: Blocks },
  { key: 'fair', icon: Users },
  { key: 'fast', icon: Clock },
]

export default function WhatIsErgo() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro.p1')}</p>
      <p>{T('intro.p2')}</p>

      <LiveNow />

      <h2 id="mot-cau-ngan-gon">{t('short.title')}</h2>
      <p>{T('short.p1')}</p>
      <p>{T('short.p2')}</p>

      <h2 id="dac-diem-chinh">{t('features.title')}</h2>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.key} className="flex gap-3 p-4">
            <f.icon className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div>
              <div className="font-semibold text-stone-900 dark:text-white">{t(`features.${f.key}.title`)}</div>
              <div className="mt-1 text-sm text-stone-500">{t(`features.${f.key}.text`)}</div>
            </div>
          </Card>
        ))}
      </div>

      <h2 id="lich-su">{t('history.title')}</h2>
      <p>{T('history.p1')}</p>
      <p>{t('history.p2')}</p>

      <h2 id="ten-goi">{t('name.title')}</h2>
      <p>{T('name.p1', { docs: <a href="https://docs.ergoplatform.com/faq/" target="_blank" rel="noreferrer" /> })}</p>
      <ul>
        <li>{T('name.latin')}</li>
        <li>{T('name.greek')}</li>
        <li>{T('name.ticker')}</li>
      </ul>

      <h2 id="danh-cho-ai">{t('who.title')}</h2>
      <ul>
        <li>{T('who.users')}</li>
        <li>{T('who.miners')}</li>
        <li>{T('who.devs')}</li>
      </ul>

      <Callout type="tip" title={t('trust.title')}>
        {T('trust.text', { explorer: <a href="https://explorer.erg.vn" target="_blank" rel="noreferrer" /> })}
      </Callout>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>{T('next.p1', { how: <Link to="/learn/how-it-works" />, explorer: <Link to="/explorer" /> })}</p>
    </>
  )
}
