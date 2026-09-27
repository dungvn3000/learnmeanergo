import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { BLOCK_TIME_SEC, MIN_VALUE_PER_BYTE, STORAGE_FEE_FACTOR, STORAGE_PERIOD } from '../lib/ergo'
import { erg, num } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Callout, Card, Field } from '../components/ui'
import en from './locales/en/StorageRent.json'
import vi from './locales/vi/StorageRent.json'

const useT = articleNs('StorageRent', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code /> }

const years = (blocks) => (blocks * BLOCK_TIME_SEC) / (365.25 * 86400)

function RentCalculator() {
  const { t } = useT()
  const [size, setSize] = useState(100)
  const [value, setValue] = useState(1)
  const [created, setCreated] = useState('')
  const info = useApi(() => api.info(), [])
  const height = info.data?.height

  const fee = size * STORAGE_FEE_FACTOR // nanoERG per period
  const minValue = size * MIN_VALUE_PER_BYTE
  const valueNano = Math.round(value * 1e9)
  const periodsLeft = Math.floor(valueNano / fee)
  const createdH = Number(created || (height ? height - 1_200_000 : 0))
  const claimableAt = createdH + STORAGE_PERIOD

  const input = 'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono tabular-nums outline-none focus:border-ergo-400 dark:border-stone-700 dark:bg-stone-900'

  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('calc.title')}</div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">{t('calc.size')}</span>
          <input type="range" min="40" max="4096" value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-ergo-500" />
          <span className="font-mono text-xs text-stone-500">{t('calc.bytes', { n: num(size) })}</span>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">{t('calc.value')}</span>
          <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">{t('calc.created')}</span>
          <input
            type="number"
            min="0"
            placeholder={height ? String(height - 1_200_000) : ''}
            value={created}
            onChange={(e) => setCreated(e.target.value)}
            className={input}
          />
        </label>
      </div>
      <div className="mt-4">
        <Field name={t('calc.fee')} value={<span className="font-mono">{num(size)} × {num(STORAGE_FEE_FACTOR)} = {erg(fee)} ERG</span>}>
          {t('calc.feeHint')}
        </Field>
        <Field name={t('calc.min')} value={<span className="font-mono">{num(size)} × {MIN_VALUE_PER_BYTE} = {erg(minValue)} ERG</span>}>
          {t('calc.minHint')}
        </Field>
        <Field
          name={t('calc.survives')}
          value={
            valueNano < fee ? (
              <span className="font-semibold text-amber-600">{t('calc.tooShort')}</span>
            ) : (
              <span>{t('calc.lives', { periods: num(periodsLeft), years: num(periodsLeft * years(STORAGE_PERIOD), 0) })}</span>
            )
          }
        />
        {height && (
          <Field
            name={t('calc.overdue')}
            value={
              <span className="font-mono">
                {num(claimableAt)}{' '}
                <span className="font-sans text-xs">
                  {claimableAt <= height ? (
                    <span className="font-semibold text-amber-600">{t('calc.already', { height: num(height) })}</span>
                  ) : (
                    <span className="text-stone-500">{t('calc.toGo', { blocks: num(claimableAt - height), years: years(claimableAt - height).toFixed(1) })}</span>
                  )}
                </span>
              </span>
            }
          />
        )}
      </div>
    </Card>
  )
}

export default function StorageRent() {
  const { t } = useT()
  const T = (k, values, extra) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro')}</p>

      <h2 id="quy-tac">{t('rule.title')}</h2>
      <p>{T('rule.p1', { period: num(STORAGE_PERIOD), years: years(STORAGE_PERIOD).toFixed(0) })}</p>
      <ul>
        <li>{T('rule.li1')}</li>
        <li>{T('rule.li2')}</li>
      </ul>
      <Callout type="warn" title={t('warn.title')}>
        {t('warn.text')}
      </Callout>
      <p>{t('rule.p2')}</p>
      <pre>
        <code>{t('rule.code', { factor: num(STORAGE_FEE_FACTOR), factorErg: erg(STORAGE_FEE_FACTOR) })}</code>
      </pre>
      <Callout type="note" title={t('params.title')}>
        {T('params.text')}
      </Callout>

      <h2 id="vi-du">{t('example.title')}</h2>
      <p>{T('example.p1', { factor: num(STORAGE_FEE_FACTOR), fee: num(100 * STORAGE_FEE_FACTOR), feeErg: erg(100 * STORAGE_FEE_FACTOR) })}</p>
      <p>{T('example.p2')}</p>
      <RentCalculator />

      <h2 id="gia-tri-toi-thieu">{t('min.title')}</h2>
      <p>{T('min.p1', { min: MIN_VALUE_PER_BYTE })}</p>

      <h2 id="vi-sao-tot">{t('good.title')}</h2>
      <ul>
        <li>{T('good.bloat')}</li>
        <li>{T('good.dust')}</li>
        <li>{T('good.income', undefined, { emission: <Link to="/learn/emission" /> })}</li>
        <li>{T('good.lost')}</li>
        <li>{T('good.fair')}</li>
      </ul>
      <Callout type="tip" title={t('real.title')}>
        {t('real.text', { period: num(STORAGE_PERIOD) })}
      </Callout>

      <h2 id="lam-sao-tranh">{t('avoid.title')}</h2>
      <p>{t('avoid.p1')}</p>
      <p>{T('avoid.p2')}</p>
      <p>{T('avoid.p3', undefined, { box: <Link to="/learn/box" /> })}</p>

      <h2 id="doc-them">{t('reading.title')}</h2>
      <ul>
        <li>
          <a href="https://ergoplatform.org/en/blog/2022-02-18-ergo-explainer-storage-rent/" target="_blank" rel="noreferrer">
            Ergo Explainer: Storage Rent
          </a>{' '}
          {t('reading.meta')}
        </li>
      </ul>
    </>
  )
}
