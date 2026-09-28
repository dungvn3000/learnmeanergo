import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { ArrowDown, CheckCircle2, FileKey2, KeyRound, ListOrdered, MapPin, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { p2pkAddress } from '../lib/ergo'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Card, Figure, Hash } from '../components/ui'
import en from './locales/en/Wallets.json'
import vi from './locales/vi/Wallets.json'

const useT = articleNs('Wallets', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const CHAIN = [
  { key: 'seed', icon: ListOrdered, tone: 'text-red-600 dark:text-red-400', secret: true },
  { key: 'private', icon: FileKey2, tone: 'text-red-600 dark:text-red-400', secret: true },
  { key: 'public', icon: KeyRound, tone: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'address', icon: MapPin, tone: 'text-emerald-600 dark:text-emerald-400' },
]

function KeyChain() {
  const { t } = useT()
  return (
    <div className="not-prose my-6 grid gap-1">
      {CHAIN.map((c, i) => (
        <div key={c.key}>
          {i > 0 && <ArrowDown className="mx-auto my-1 size-4 text-stone-400" />}
          <Card className="flex items-start gap-3 p-4">
            <c.icon className={`mt-0.5 size-5 shrink-0 ${c.tone}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-stone-900 dark:text-white">
                {t(`chain.${c.key}.title`)}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.secret ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                  {c.secret ? t('chain.secret') : t('chain.shared')}
                </span>
              </div>
              <div className="mt-1 text-sm text-stone-500">{t(`chain.${c.key}.text`)}</div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

/** Rebuild the latest block's miner address from its public key, and check it matches. */
function LiveAddressDemo() {
  const { t } = useT()
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
                <Trans t={t} i18nKey="demo.minerPk" values={{ height: b.height }} components={{ block: <Link to={`/block/${b.height}`} className="text-ergo-600 dark:text-ergo-400" /> }} />
              </div>
              <Hash value={b.pow.pk} full />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('demo.computed')}</div>
              <Hash value={built} full to={`/address/${built}`} />
            </div>
            <div className={`flex items-center gap-2 font-medium ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
              {ok ? (b.miner ? t('demo.matchMiner', { miner: b.miner }) : t('demo.match')) : t('demo.noMatch')}
            </div>
          </Card>
        )
      }}
    </Async>
  )
}

export default function Wallets() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro', { boxes: <Link to="/learn/boxes" /> })}</p>

      <h2 id="tu-seed-den-dia-chi">{t('seed.title')}</h2>
      <p>{t('seed.p1')}</p>
      <Figure src="/img/keys.webp" alt={t('seed.figAlt')} width={1360} height={550} caption={t('seed.figCaption')} />
      <KeyChain />
      <p>{T('seed.p2')}</p>

      <Callout type="warn" title={t('golden.title')}>
        {t('golden.text')}
      </Callout>

      <h2 id="dia-chi-bat-dau-bang-9">{t('nine.title')}</h2>
      <p>{T('nine.p1')}</p>
      <p>{T('nine.p2')}</p>
      <p>{T('nine.p3')}</p>

      <h3>{t('check.title')}</h3>
      <p>{t('check.p1')}</p>
      <LiveAddressDemo />
      <p>{T('check.p2', { decoder: <Link to="/tools/address-decoder" />, pk: <Link to="/tools/pubkey-to-address" /> })}</p>

      <h2 id="nhieu-dia-chi">{t('many.title')}</h2>
      <p>{t('many.p1')}</p>

      <h2 id="dia-chi-hop-dong">{t('contract.title')}</h2>
      <p>{T('contract.p1', { address: <Link to="/learn/address" /> })}</p>

      <h2 id="chon-vi">{t('choose.title')}</h2>
      <ul>
        <li>{T('choose.nautilus')}</li>
        <li>{T('choose.mobile')}</li>
        <li>{T('choose.satergo')}</li>
      </ul>
      <p>{T('choose.p1', { list: <a href="https://ergoplatform.org/en/get-erg/#Wallets" target="_blank" rel="noreferrer" /> })}</p>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>{T('next.p1', { mining: <Link to="/learn/mining-basics" /> })}</p>
    </>
  )
}
