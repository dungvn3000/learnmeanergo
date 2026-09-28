import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num } from '../lib/format'
import { emissionAt, minerRewardAt, FIXED_RATE_PERIOD, EPOCH_LENGTH, REEMISSION_START, GENESIS_TIME } from '../lib/ergo'
import { articleNs, locale } from '../lib/i18n'
import { Callout, Card } from '../components/ui'
import LineChart from '../components/LineChart'
import en from './locales/en/Erg.json'
import vi from './locales/vi/Erg.json'

const useT = articleNs('Erg', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em /> }

// Mainnet contracts: the emission box and the EIP-27 re-emission box (holds the Reemission Contract NFT).
const EMISSION_ADDRESS =
  '2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU'
// Genesis treasury box of the Ergo Foundation (4,330,791.5 ERG, vesting contract).
const TREASURY_ADDRESS =
  '4L1ktFSzm3SH1UioDuUf5hyaraHird4D2dEACwQ1qHGjSKtA6KaNvSzRCZXZGf9jkfNAEC1SrYaZmCuvb2BKiXk5zW9xuvrXFT7FdNe2KqbymiZvo5UQLAm5jQY8ZBRhTZ4AFtZa1UF5nd4aofwPiL7YkJuyiL5hDHMZL1ZnyL746tHmRYMjAhCgE7d698dRhkdSeVy'
const REEMISSION_ADDRESS =
  '22WkKcVUvboYCZJe1urbmvBL3j67LKb5KEAvFhJXqA6ubYvHpSCvbvwvEY3xzUr7QvxpEtqjzMAPMsVdZh1VGWmZphvKoJdVzL1ayhsMftTtEFoA3YYdq3zKeeYXavVrrPUmK3fRXJ2HWEbZexewtBWcgAnHBw5tKvYFy9dEUi645gE2fYMUvVBtbvMExE9mjZ2W9goWkqu1VtThAsMZWZWjHxDjX116HpeQKu9b9neEUBj4kE5sX8QXaV6ZeReXxYHFJFg2rmaTknSPMxHXA8NpQKgzryBwLssp5EJ1QTqn5R6xuvGgFCEUZicCEo8qk8UNbE7e2d4WqW5qzpQPzJkKoPa5UtJEPYDWNhaCKmCpzdSc77'

function SupplyBar({ d }) {
  const { t } = useT()
  const pct = (v) => `${((v / d.maxSupply) * 100).toFixed(2)}%`
  const rest = d.maxSupply - d.issued
  return (
    <Card className="not-prose my-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-semibold text-stone-900 dark:text-white">{t('supply.issued', { pct: pct(d.issued) })}</div>
        <div className="text-xs text-stone-500">{t('supply.asOf', { height: num(d.height) })}</div>
      </div>
      <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div className="h-full bg-ergo-500" style={{ width: pct(d.circulating) }} title={t('supply.circulating')} />
        <div className="h-full bg-ergo-200 dark:bg-ergo-800" style={{ width: pct(d.reemissionLocked) }} title={t('supply.locked')} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-ergo-500" /> {t('supply.circulating')}
          </div>
          <div className="font-bold tabular-nums">{num(d.circulating)} ERG</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-ergo-200 dark:bg-ergo-800" /> {t('supply.locked')}
          </div>
          <div className="font-bold tabular-nums">{num(d.reemissionLocked)} ERG</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-stone-200 dark:bg-stone-700" /> {t('supply.unmined')}
          </div>
          <div className="font-bold tabular-nums">{num(rest)} ERG</div>
        </div>
      </div>
    </Card>
  )
}

function RewardChart({ height }) {
  const { t } = useT()
  const points = useMemo(() => {
    const hs = [1, FIXED_RATE_PERIOD - 1]
    for (let h = FIXED_RATE_PERIOD; h <= REEMISSION_START + EPOCH_LENGTH; h += EPOCH_LENGTH) hs.push(h, h + EPOCH_LENGTH - 1)
    return hs.map((h) => ({ x: h, y: emissionAt(h) }))
  }, [])
  const markers = height ? [{ x: height, label: t('chart.now') }] : []
  return (
    <Card className="not-prose my-6 p-4">
      <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">{t('chart.title')}</div>
      <LineChart
        points={points}
        step
        markers={markers}
        label={t('chart.label')}
        xFormat={(x) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : `${Math.round(x / 1e3)}k`)}
        yFormat={(y) => `${y}`}
        tooltip={(p) => (
          <>
            <div className="text-stone-500">Block {num(p.x)}</div>
            <div className="font-semibold text-stone-900 dark:text-white">{emissionAt(p.x)} ERG / block</div>
          </>
        )}
      />
      <p className="mt-2 text-xs text-stone-500">{t('chart.caption')}</p>
    </Card>
  )
}

export default function Erg() {
  const { t } = useT()
  const T = (k, extra, values) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const ns = useApi(() => api.networkState(), [], 60000)
  const d = ns.data
  // Average block time since launch, the same estimate the emission article uses.
  const dateAt = (h) => new Date(d.tipTimestamp + ((h - d.height) * (d.tipTimestamp - GENESIS_TIME)) / (d.height - 1))
  // First height of the next 3-ERG step down.
  const nextStep = d && (d.height < FIXED_RATE_PERIOD
    ? FIXED_RATE_PERIOD
    : FIXED_RATE_PERIOD + (Math.floor((d.height - FIXED_RATE_PERIOD) / EPOCH_LENGTH) + 1) * EPOCH_LENGTH)

  return (
    <>
      <p>{T('intro')}</p>

      <h2 id="tong-cung">{t('supply.title')}</h2>
      <p>{T('supply.p1')}</p>
      {d && <SupplyBar d={d} />}

      <h2 id="erg-tu-dau-ra">{t('origin.title')}</h2>
      <p>
        {T('origin.p1', { emission: <Link to={`/address/${EMISSION_ADDRESS}`} /> })}
      </p>
      <p>{t('origin.p2')}</p>
      <ul>
        <li>
          {T('origin.phase1', {
            treasury: <Link to={`/address/${TREASURY_ADDRESS}`} />,
            efyt: <a href="https://docs.ergoplatform.com/efyt/" target="_blank" rel="noreferrer" />,
          })}
        </li>
        <li>{T('origin.phase2')}</li>
      </ul>
      <RewardChart height={d?.height} />
      {d && (
        <p>
          {d.height >= REEMISSION_START
            ? T('origin.nowEnded', null, { end: num(REEMISSION_START) })
            : T('origin.now', null, {
                height: num(d.height),
                emission: emissionAt(d.height),
                next: num(nextStep),
                nextDate: dateAt(nextStep).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }),
                nextEmission: emissionAt(nextStep),
                end: num(REEMISSION_START),
                date: dateAt(REEMISSION_START).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }),
              })}
        </p>
      )}

      <h2 id="tai-phat-hanh">{t('reemission.title')}</h2>
      <p>{T('reemission.p1', { reemission: <Link to={`/address/${REEMISSION_ADDRESS}`} /> })}</p>
      <p>{T('reemission.p2')}</p>
      {d && (
        <Callout type="note">
          {d.height >= REEMISSION_START
            ? T('reemission.nowEnded')
            : T('reemission.now', null, { emission: emissionAt(d.height), reward: minerRewardAt(d.height) })}
        </Callout>
      )}

      <h2 id="bang-tom-tat">{t('summary.title')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('summary.period')}</th>
            <th>{t('summary.perBlock')}</th>
            <th>{t('summary.miner')}</th>
            <th>{t('summary.note')}</th>
          </tr>
        </thead>
        <tbody>
          {['r1', 'r2', 'r3', 'r4'].map((r) => (
            <tr key={r}>
              <td className="whitespace-nowrap">{t(`summary.${r}.period`)}</td>
              <td>{t(`summary.${r}.perBlock`)}</td>
              <td>{t(`summary.${r}.miner`)}</td>
              <td>{T(`summary.${r}.note`, { rent: <Link to="/learn/storage-rent" /> })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="nanoerg">{t('nano.title')}</h2>
      <p>{T('nano.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>ERG</th>
            <th>nanoERG</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td className="tabular-nums">1,000,000,000</td>
          </tr>
          <tr>
            <td>{t('nano.fee')}</td>
            <td className="tabular-nums">1,000,000</td>
          </tr>
          <tr>
            <td>0.000000001</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
      <p>{T('nano.p2', { units: <Link to="/tools/units" />, calc: <Link to="/tools/emission-calculator" /> })}</p>

      <Callout type="tip" title={t('more.title')}>
        {T('more.text', { emission: <Link to="/learn/emission" /> })}
      </Callout>

      <h2 id="tiep-theo">{t('next.title')}</h2>
      <p>{T('next.p1', { wallets: <Link to="/learn/wallets" /> })}</p>
    </>
  )
}
