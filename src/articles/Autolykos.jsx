import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Check } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { p2pkAddress } from '../lib/ergo'
import { num } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Callout, Card, Field, Figure, Hash } from '../components/ui'
import en from './locales/en/Autolykos.json'
import vi from './locales/vi/Autolykos.json'

const useT = articleNs('Autolykos', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code />, sup: <sup /> }

// Autolykos v2 table size N(h): 2^26, then +5% every 51,200 blocks from height 614,400,
// frozen from height 4,198,400 (reference node: AutolykosPowScheme.calcN).
const N_BASE = 2 ** 26
const N_INCREASE_START = 614_400
const N_INCREASE_PERIOD = 51_200
const N_FREEZE_HEIGHT = 4_198_400
const V2_ACTIVATION = 417_792
const K = 32

function calcN(h) {
  if (h < N_INCREASE_START) return N_BASE
  if (h >= N_FREEZE_HEIGHT) return 2_143_944_600
  const iterations = Math.floor((h - N_INCREASE_START) / N_INCREASE_PERIOD) + 1
  let n = N_BASE
  for (let i = 0; i < iterations; i++) n = Math.floor(n / 100) * 105
  return n
}

const G_HEX = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

function LivePow() {
  const { t } = useT()
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) => {
        const b = blocks?.[0]
        if (!b?.pow) return <p>{t('pow.error')}</p>
        let pkAddr = null
        try {
          pkAddr = p2pkAddress(b.pow.pk)
        } catch {
          pkAddr = null
        }
        const N = calcN(b.height)
        return (
          <Card className="not-prose my-6 p-2 sm:p-4">
            <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
              <Trans
                t={t}
                i18nKey="pow.title"
                values={{ height: num(b.height) }}
                components={{ block: <Link to={`/block/${b.height}`} className="text-ergo-600 hover:underline dark:text-ergo-400" /> }}
              />
            </div>
            <Field name="pk" value={<Hash value={b.pow.pk} full />}>
              {t('pow.pk.intro')}{' '}
              {pkAddr ? (
                <>
                  {t('pow.pk.address')} <Hash value={pkAddr} to={`/address/${pkAddr}`} />
                  {pkAddr === b.minerAddress && (
                    <span className="ml-1 inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <Check className="size-3.5" /> {t('pow.pk.matches')}
                    </span>
                  )}
                </>
              ) : (
                t('pow.pk.reward')
              )}
              {t('pow.pk.outro')}
            </Field>
            <Field name="w" value={<Hash value={b.pow.w} full />}>
              {b.pow.w === G_HEX ? t('pow.w.isG') : ''}
              {t('pow.w.text')}
            </Field>
            <Field name="n (nonce)" value={<span className="font-mono">{b.pow.n}</span>}>
              {t('pow.n')}
            </Field>
            <Field name="d" value={<span className="font-mono">{String(b.pow.d)}</span>}>
              {t('pow.d')}
            </Field>
            <Field name={t('pow.N.name')} value={<span className="font-mono">{num(N)}</span>}>
              {t('pow.N.text', { gib: (N * 32 / 2 ** 30).toFixed(1) })}
            </Field>
          </Card>
        )
      }}
    </Async>
  )
}

export default function Autolykos() {
  const { t } = useT()
  const T = (k, values, extra) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  return (
    <>
      <p>{T('intro', undefined, { target: <Link to="/learn/difficulty" /> })}</p>

      <h2 id="y-tuong">{t('idea.title')}</h2>
      <p>{t('idea.p1')}</p>
      <p>{t('idea.p2', { k: K })}</p>
      <ol>
        <li>{T('idea.li1')}</li>
        <li>{T('idea.li2', { k: K })}</li>
        <li>{T('idea.li3', { k: K })}</li>
        <li>{t('idea.li4')}</li>
      </ol>
      <Figure src="/img/autolykos.webp" alt={t('idea.figAlt')} width={1360} height={383} caption={t('idea.figCaption', { k: K })} />
      <pre>
        <code>{t('idea.code')}</code>
      </pre>
      <p>{t('idea.p3', { k: K })}</p>

      <h2 id="bang-n">{t('table.title')}</h2>
      <p>{T('table.p1', { start: num(N_INCREASE_START), period: num(N_INCREASE_PERIOD), freeze: num(N_FREEZE_HEIGHT) })}</p>
      <table>
        <thead>
          <tr>
            <th>{t('table.height')}</th>
            <th>N</th>
            <th>{t('table.bytes')}</th>
          </tr>
        </thead>
        <tbody>
          {[500_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000].map((h) => (
            <tr key={h}>
              <td className="tabular-nums">{num(h)}</td>
              <td className="font-mono tabular-nums">{num(calcN(h))}</td>
              <td className="tabular-nums">{((calcN(h) * 32) / 2 ** 30).toFixed(1)} GiB</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="v1-v2">{t('versions.title')}</h2>
      <p>{T('versions.p1')}</p>
      <p>{T('versions.p2', { height: num(V2_ACTIVATION) })}</p>
      <ul>
        <li>{T('versions.pk')}</li>
        <li>{T('versions.w')}</li>
        <li>{T('versions.d')}</li>
        <li>{T('versions.n')}</li>
      </ul>

      <h2 id="block-that">{t('live.title')}</h2>
      <p>{t('live.p1')}</p>
      <LivePow />
      <Callout type="tip" title={t('verify.title')}>
        {t('verify.text', { k: K })}
      </Callout>

      <h2 id="xem-them">{t('more.title')}</h2>
      <ul>
        <li>{T('more.difficulty', undefined, { difficulty: <Link to="/learn/difficulty" /> })}</li>
        <li>{T('more.emission', undefined, { emission: <Link to="/learn/emission" /> })}</li>
        <li>{T('more.block', undefined, { block: <Link to="/learn/block" /> })}</li>
      </ul>
    </>
  )
}
