import { Link } from 'react-router-dom'
import { Trans } from 'react-i18next'
import { Package } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { erg, num, short } from '../lib/format'
import { articleNs } from '../lib/i18n'
import { Async, Badge, Callout, Card, Erg, Field, Hash, TokenChip } from '../components/ui'
import en from './locales/en/Box.json'
import vi from './locales/vi/Box.json'

const useT = articleNs('Box', { en, vi })

// Tag → element map shared by every <Trans> in this article; links are added per call.
const TAGS = { b: <strong />, em: <em />, code: <code />, sup: <sup /> }

/** Find a fresh output that carries at least two typed registers. */
async function pickBox() {
  const txs = (await api.latestTransactions(30)) ?? []
  for (const t of txs) {
    const o = t.outputs?.find((b) => b.registers?.length >= 2)
    if (o) return o
  }
  return txs[0]?.outputs?.[0] ?? null
}

/**
 * Decode a serialized Int/Long register (type byte + ZigZag-encoded VLQ).
 * Returns the intermediate steps so the article can show them.
 */
function decodeNumeric(raw) {
  const bytes = raw.match(/../g).map((h) => parseInt(h, 16))
  const [type, ...rest] = bytes
  let n = 0n
  let shift = 0n
  for (const b of rest) {
    n |= BigInt(b & 0x7f) << shift
    shift += 7n
    if (!(b & 0x80)) break
  }
  const value = n & 1n ? -((n + 1n) >> 1n) : n >> 1n
  return { type, vlq: rest, zigzag: n, value }
}

// `key` marks entries whose type name is translated (types.<key>).
const TYPE_CODES = [
  { code: '0x01', type: 'Boolean' },
  { code: '0x02', type: 'Byte' },
  { code: '0x03', type: 'Short' },
  { code: '0x04', type: 'Int (32 bit)' },
  { code: '0x05', type: 'Long (64 bit)' },
  { code: '0x06', type: 'BigInt' },
  { code: '0x07', key: 'group' },
  { code: '0x08', type: 'SigmaProp' },
  { code: '0x0e', key: 'bytes' },
]

const linkCls = 'text-ergo-600 hover:underline dark:text-ergo-400'

function Registers({ box }) {
  const { t } = useT()
  const r3 = `(${box.creationHeight}, ${short(box.transactionId, 8, 6)}, ${box.index})`
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Package className="size-5 shrink-0 text-ergo-500" />
          <Hash value={box.boxId} to={`/box/${box.boxId}`} head={10} tail={8} />
        </div>
        <Badge tone={box.spent || box.spentBy ? 'stone' : 'green'}>{box.spent || box.spentBy ? t('box.spent') : t('box.unspent')}</Badge>
      </div>
      <Field name="R0 · value" value={<Erg nano={box.value} />}>
        {t('box.r0', { nano: num(box.value) })}
      </Field>
      <Field name="R1 · script" value={<code className="font-mono text-xs break-all">{short(box.ergoTree, 40, 20)}</code>}>
        <Trans
          t={t}
          i18nKey="box.r1"
          values={{ address: short(box.address, 8, 6) }}
          components={{ address: <Link to={`/address/${box.address}`} className={linkCls} />, ergotree: <Link to="/learn/ergotree" className={linkCls} /> }}
        />
      </Field>
      <Field
        name="R2 · tokens"
        value={
          box.assets?.length ? (
            <div className="flex flex-wrap gap-1">
              {box.assets.map((a) => (
                <TokenChip key={a.tokenId} asset={a} />
              ))}
            </div>
          ) : (
            <span className="text-stone-400">{t('box.empty')}</span>
          )
        }
      >
        {t('box.r2')}
      </Field>
      <Field name="R3 · creation info" value={<code className="font-mono text-xs">{r3}</code>}>
        <Trans t={t} i18nKey="box.r3" components={{ rent: <Link to="/learn/storage-rent" className={linkCls} /> }} />
      </Field>
      {box.registers.map((r) => {
        const numeric = /^0[45]/.test(r.raw) ? decodeNumeric(r.raw) : null
        return (
          <Field key={r.key} name={`${r.key} · ${r.type}`} value={<code className="font-mono text-xs break-all">{r.value}</code>}>
            <Trans t={t} i18nKey="box.raw" values={{ raw: r.raw }} components={{ raw: <code className="font-mono break-all" /> }} />
            {numeric && (
              <>
                {' '}
                <Trans
                  t={t}
                  i18nKey="box.numeric"
                  values={{ type: numeric.type.toString(16).padStart(2, '0'), zigzag: numeric.zigzag.toString(), value: numeric.value.toString() }}
                  components={{ code: <code /> }}
                />
              </>
            )}
          </Field>
        )
      })}
    </Card>
  )
}

export default function Box() {
  const { t } = useT()
  const T = (k, extra, values) => <Trans t={t} i18nKey={k} values={values} components={{ ...TAGS, ...extra }} />
  const state = useApi(pickBox, [])
  return (
    <>
      <p>{T('intro')}</p>

      <h2 id="eutxo">{t('eutxo.title')}</h2>
      <p>{T('eutxo.p1')}</p>
      <ul>
        <li>{T('eutxo.li1')}</li>
        <li>{T('eutxo.li2')}</li>
      </ul>
      <p>{T('eutxo.p2')}</p>

      <h2 id="registers">{t('regs.title')}</h2>
      <p>{t('regs.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>Register</th>
            <th>{t('regs.thContents')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>R0</code>
            </td>
            <td>{t('regs.r0')}</td>
          </tr>
          <tr>
            <td>
              <code>R1</code>
            </td>
            <td>{t('regs.r1')}</td>
          </tr>
          <tr>
            <td>
              <code>R2</code>
            </td>
            <td>{t('regs.r2')}</td>
          </tr>
          <tr>
            <td>
              <code>R3</code>
            </td>
            <td>(creationHeight, txId, output index)</td>
          </tr>
          <tr>
            <td>
              <code>R4</code>–<code>R9</code>
            </td>
            <td>{t('regs.r49')}</td>
          </tr>
        </tbody>
      </table>

      <h2 id="vi-du">{t('example.title')}</h2>
      <p>{t('example.p1')}</p>
      <Async state={state} notFound={t('example.notFound')}>
        {(box) => <Registers box={box} />}
      </Async>

      <h3>{t('encoding.title')}</h3>
      <p>{T('encoding.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('encoding.thCode')}</th>
            <th>{t('encoding.thType')}</th>
          </tr>
        </thead>
        <tbody>
          {TYPE_CODES.map((c) => (
            <tr key={c.code}>
              <td>
                <code>{c.code}</code>
              </td>
              <td>{c.key ? t(`encoding.types.${c.key}`) : c.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{T('encoding.example')}</p>

      <h2 id="box-id">{t('boxId.title')}</h2>
      <p>{T('boxId.p1')}</p>
      <Callout type="tip" title={t('boxId.tipTitle')}>
        {T('boxId.tipText')}
      </Callout>

      <h2 id="gia-tri-toi-thieu">{t('minimum.title')}</h2>
      <p>{T('minimum.p1', null, { min: erg(360 * 100), max: erg(360 * 300) })}</p>
      <p>{T('minimum.p2', { rent: <Link to="/learn/storage-rent" /> })}</p>

      <h2 id="gioi-han">{t('limits.title')}</h2>
      <p>{t('limits.p1')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('limits.thLimit')}</th>
            <th>{t('limits.thValue')}</th>
            <th>{t('limits.thMeaning')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t('limits.size.name')}</td>
            <td>{T('limits.size.value')}</td>
            <td>{t('limits.size.text')}</td>
          </tr>
          <tr>
            <td>{t('limits.tokens.name')}</td>
            <td><strong>255</strong></td>
            <td>{T('limits.tokens.text')}</td>
          </tr>
          <tr>
            <td>Registers</td>
            <td><strong>10</strong> (R0–R9)</td>
            <td>{T('limits.registers.text')}</td>
          </tr>
          <tr>
            <td>{t('limits.minValue.name')}</td>
            <td>{t('limits.minValue.value')}</td>
            <td>{t('limits.minValue.text', { nano: num(4096 * 360), erg: erg(4096 * 360) })}</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip" title={t('habit.title')}>
        {t('habit.text')}
      </Callout>

      <h2 id="guard-script">{t('guard.title')}</h2>
      <p>{T('guard.p1')}</p>
      <p>{T('guard.p2', { ergotree: <Link to="/learn/ergotree" />, section: <Link to="/learn/ergotree#guard-script" /> })}</p>
      <table>
        <thead>
          <tr>
            <th>{t('guard.thKind')}</th>
            <th>ErgoScript</th>
            <th>{t('guard.thWho')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t('guard.p2pk.name')}</td>
            <td><code>sigmaProp(pk)</code></td>
            <td>{T('guard.p2pk.text')}</td>
          </tr>
          <tr>
            <td>{t('guard.time.name')}</td>
            <td><code>sigmaProp(HEIGHT &gt; 1200000) &amp;&amp; pk</code></td>
            <td>{t('guard.time.text')}</td>
          </tr>
          <tr>
            <td>{t('guard.multisig.name')}</td>
            <td><code>atLeast(2, Coll(pk1, pk2, pk3))</code></td>
            <td>{t('guard.multisig.text')}</td>
          </tr>
          <tr>
            <td>{t('guard.cond.name')}</td>
            <td><code>sigmaProp(OUTPUTS(0).value &gt;= SELF.value)</code></td>
            <td>{t('guard.cond.text')}</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn" title={t('turing.title')}>
        {T('turing.text', { ergotree: <Link to="/learn/ergotree" /> })}
      </Callout>

      <h2 id="xem-them">{t('next.title')}</h2>
      <ul>
        <li>{T('next.tx', { link: <Link to="/learn/transaction" /> })}</li>
        <li>{T('next.tokens', { link: <Link to="/learn/tokens" /> })}</li>
        <li>{T('next.ergotree', { link: <Link to="/learn/ergotree" /> })}</li>
        <li>{T('next.dav', { link: <a href="https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e" target="_blank" rel="noreferrer" /> })}</li>
        <li>
          {T('next.deco', {
            link: <a href="https://deco-education.github.io/deco-docs/docs/into-the-woods/trail1-eutxo-n-nfts/registers-guardscripts-ergoscript" target="_blank" rel="noreferrer" />,
          })}
        </li>
      </ul>
    </>
  )
}
