import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Ban, Coins, FileCode2, Hourglass, Network, Scale, ShieldCheck, Users } from 'lucide-react'
import { MAX_SUPPLY } from '../lib/ergo'
import { num } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Callout, Card } from '../components/ui'
import en from './locales/en/Manifesto.json'
import vi from './locales/vi/Manifesto.json'

const useT = articleNs('Manifesto', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const SOURCE = 'https://ergoplatform.org/en/blog/2021-04-26-the-ergo-manifesto/'

// The genesis treasury box, as stated in the whitepaper (§7.1).
const TREASURY = 4_330_791.5

const PRINCIPLES = [
  { key: 'decentralization', icon: Network, to: '/learn/autolykos' },
  { key: 'open', icon: ShieldCheck, to: '/learn/sigma' },
  { key: 'people', icon: Users, to: '/learn/mining-basics' },
  { key: 'contractual', icon: FileCode2, to: '/learn/ergotree' },
  { key: 'longTerm', icon: Hourglass, to: '/learn/storage-rent' },
]

const WEAPONS = [
  { key: 'expiring', icon: Hourglass },
  { key: 'conditional', icon: Scale },
  { key: 'censored', icon: Ban },
]

const ROWS = ['r1', 'r2', 'r3', 'r4', 'r5']

export default function Manifesto() {
  const { t } = useT()
  const T = (k, values, extra) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro')}</p>
      <Callout type="note" title={t('about.title')}>
        {T('about.text', undefined, { source: <a href={SOURCE} target="_blank" rel="noreferrer" /> })}
      </Callout>

      <h2 id="nguon-goc">{t('roots.title')}</h2>
      <p>{t('roots.p1')}</p>
      <p>{T('roots.p2')}</p>

      <h2 id="vi-sao-quan-trong">{t('why.title')}</h2>
      <p>{T('why.p1')}</p>

      <h3>{t('weapon.title')}</h3>
      <p>{t('weapon.p1')}</p>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
        {WEAPONS.map((x) => (
          <Card key={x.key} className="p-4">
            <x.icon className="size-5 text-ergo-500" />
            <div className="mt-2 font-semibold text-stone-900 dark:text-white">{t(`weapon.${x.key}.title`)}</div>
            <p className="mt-1 text-sm text-stone-500">{t(`weapon.${x.key}.text`)}</p>
          </Card>
        ))}
      </div>

      <h3>{t('privacy.title')}</h3>
      <p>{T('privacy.p1')}</p>

      <h2 id="ergonomic-money">“Ergo.nomic money”</h2>
      <p>{T('ergonomic.p1')}</p>

      <h2 id="nguyen-tac">{t('principles.title')}</h2>
      <p>{T('principles.p1')}</p>
      <div className="not-prose my-6 grid gap-4">
        {PRINCIPLES.map((p, i) => (
          <Card key={p.key} className="flex gap-4 p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ergo-50 text-ergo-600 dark:bg-ergo-950/50 dark:text-ergo-400">
              <p.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-stone-400 tabular-nums">{i + 1}</span>
                <h3 className="font-bold text-stone-900 dark:text-white">{t(`principles.${p.key}.title`)}</h3>
              </div>
              <p className="mt-1 text-[15px] leading-7 text-stone-600 dark:text-stone-400">{t(`principles.${p.key}.text`)}</p>
              <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800/60 dark:text-stone-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200">{t('principles.inProtocol')}</span>
                {t(`principles.${p.key}.how`)}{' '}
                <Link to={p.to} className="font-medium text-ergo-600 hover:underline dark:text-ergo-400">
                  {t('principles.learnMore')}
                </Link>
              </p>
            </div>
          </Card>
        ))}
      </div>

      <h2 id="ra-mat-cong-bang">{t('fair.title')}</h2>
      <p>{T('fair.p1')}</p>
      <Card className="not-prose my-6 flex items-start gap-4 p-5">
        <Coins className="mt-0.5 size-6 shrink-0 text-ergo-500" />
        <div className="text-[15px] leading-7">
          {T('fair.treasury', { treasury: num(TREASURY, 1), pct: ((TREASURY / MAX_SUPPLY) * 100).toFixed(2), max: num(MAX_SUPPLY) })}{' '}
          <Link to="/learn/emission" className="font-medium text-ergo-600 hover:underline dark:text-ergo-400">
            {t('fair.link')}
          </Link>
        </div>
      </Card>

      <h2 id="ergo-khong-phai">{t('table.title')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('table.yes')}</th>
            <th>{t('table.no')}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r}>
              <td>{t(`table.${r}.yes`)}</td>
              <td>{t(`table.${r}.no`)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Callout type="tip" title={t('next.title')}>
        {T('next.text', undefined, { boxes: <Link to="/learn/boxes" /> })}
      </Callout>

      <h2 id="doc-them">{t('reading.title')}</h2>
      <ul>
        <li>
          <a href={SOURCE} target="_blank" rel="noreferrer">
            The Ergo Manifesto
          </a>{' '}
          {t('reading.meta')}
        </li>
      </ul>
    </>
  )
}
