import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { TREASURY_ADDRESS } from '../lib/ergo'
import { articleNs } from '../lib/i18n'
import { Callout } from '../components/ui'
import en from './locales/en/ErgoFoundation.json'
import vi from './locales/vi/ErgoFoundation.json'

const useT = articleNs('ErgoFoundation', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em /> }

const REFS = [
  ['about', 'https://docs.ergoplatform.com/ef/ergo-foundation/'],
  ['scope', 'https://docs.ergoplatform.com/ef/ef-scope/'],
  ['treasury', 'https://docs.ergoplatform.com/ef/ef-treasury/'],
  ['votes', 'https://docs.ergoplatform.com/ef/ef-votes/'],
  ['future', 'https://docs.ergoplatform.com/ef/ef-future/'],
]

export default function ErgoFoundation() {
  const { t } = useT()
  const T = (k, extra) => <Trans t={t} i18nKey={k} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro')}</p>

      <h2 id="tien-tu-dau">{t('money.title')}</h2>
      <p>{T('money.p1', { treasury: <Link to={`/address/${TREASURY_ADDRESS}`} /> })}</p>
      <p>
        {T('money.p2', {
          efyt: <a href="https://docs.ergoplatform.com/efyt/" target="_blank" rel="noreferrer" />,
          emission: <Link to="/learn/emission" />,
        })}
      </p>

      <h2 id="da-lam-gi">{t('did.title')}</h2>
      <p>{t('did.p1')}</p>
      <ul>
        <li>{T('did.infra')}</li>
        <li>{T('did.edu')}</li>
        <li>{T('did.grants')}</li>
        <li>{T('did.exchanges')}</li>
      </ul>
      <p>{T('did.p2')}</p>

      <h2 id="khong-lam-gi">{t('didnt.title')}</h2>
      <p>{t('didnt.p1')}</p>

      <h2 id="ngay-nay">{t('today.title')}</h2>
      <p>{T('today.p1')}</p>
      <p>{T('today.p2')}</p>
      <p>{t('today.p3')}</p>

      <Callout type="note" title={t('note.title')}>
        {t('note.text')}
      </Callout>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>{T('next.p1', { erg: <Link to="/learn/erg" />, wallets: <Link to="/learn/wallets" /> })}</p>

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
