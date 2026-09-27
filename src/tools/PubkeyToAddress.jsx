import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { base58Encode, blake2b256, bytesToHex, hexToBytes } from '../lib/ergo'
import { Callout, Card, CopyButton, Field } from '../components/ui'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const SEG = {
  prefix: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  content: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  checksum: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
}
const Seg = ({ kind, hex }) => <span className={`rounded px-1 py-0.5 ${SEG[kind]}`}>{hex}</span>

const EXAMPLE = '0274e729bb6615cbda94d9d176a2f1525068f12b330e38bbbf387232797dfd891f'

function build(hex, network) {
  const s = hex.trim().toLowerCase().replace(/^0x/, '')
  if (!s) return null
  const pk = hexToBytes(s)
  if (pk.length !== 33) throw new Error(
      i18n.t('pubkeyToAddress.aCompressedPublicKeyMustBe', { length: pk.length }),
    )
  if (pk[0] !== 2 && pk[0] !== 3) throw new Error(
      i18n.t('pubkeyToAddress.theFirstByteOfACompressed'),
    )
  const prefix = network | 0x01
  const body = Uint8Array.from([prefix, ...pk])
  const hash = blake2b256(body)
  const checksum = hash.slice(0, 4)
  const full = Uint8Array.from([...body, ...checksum])
  return { pk: s, prefix, hash: bytesToHex(hash), checksum: bytesToHex(checksum), address: base58Encode(full), ergoTree: '0008cd' + s }
}

export default function PubkeyToAddress() {
  const { t } = useTranslation()
  const [hex, setHex] = useState(EXAMPLE)
  const [network, setNetwork] = useState(0x00)
  const res = useMemo(() => {
    try {
      return { ok: build(hex, network) }
    } catch (e) {
      return { err: e.message }
    }
  }, [hex, network])
  const r = res.ok
  const px = r ? r.prefix.toString(16).padStart(2, '0') : ''

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <label htmlFor="pk" className="text-sm font-semibold text-stone-900 dark:text-white">
          {t('pubkeyToAddress.compressedPublicKey33BytesHex')}
        </label>
        <input
          id="pk"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          spellCheck={false}
          className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-sm outline-none focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:border-stone-700 dark:bg-stone-950"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone-500">{t('pubkeyToAddress.network')}</span>
          {[
            [0x00, 'Mainnet'],
            [0x10, 'Testnet'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setNetwork(v)}
              className={`rounded-full border px-3 py-1 text-xs ${
                network === v ? 'border-ergo-400 bg-ergo-50 text-ergo-700 dark:bg-ergo-950/50 dark:text-ergo-300' : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              {l}
            </button>
          ))}
          <button onClick={() => setHex(EXAMPLE)} className="ml-auto text-xs text-ergo-600 hover:underline dark:text-ergo-400">
            {t('pubkeyToAddress.useAnExampleThe2minersPool')}
          </button>
        </div>
      </Card>

      {res.err && (
        <Callout type="warn" title={t('pubkeyToAddress.invalidKey')}>
          {res.err}
        </Callout>
      )}

      {r && (
        <Card className="p-5">
          <Field name="1. Prefix" value={<Seg kind="prefix" hex={px} />} mono>
            {t('pubkeyToAddress.networkType')} ({network === 0 ? '0x00 mainnet' : '0x10 testnet'}) + {t('pubkeyToAddress.addressType')} (0x01 = P2PK) = 0x{px}.
          </Field>
          <Field
            name={t('pubkeyToAddress.n2AppendTheContent')}
            value={
              <>
                <Seg kind="prefix" hex={px} />
                <Seg kind="content" hex={r.pk} />
              </>
            }
            mono
          >
            {t('pubkeyToAddress.theContentOfAP2pkAddress')}
          </Field>
          <Field name="3. blake2b256" value={<span className="text-stone-500">{r.hash}</span>} mono>
            {t('pubkeyToAddress.hash')} <span className="font-mono">{t('pubkeyToAddress.prefixKey')}</span> {t('pubkeyToAddress.withBlake2b256')}
          </Field>
          <Field name="4. Checksum" value={<Seg kind="checksum" hex={r.checksum} />} mono>
            {t('pubkeyToAddress.takeTheFirst4BytesOf')}
          </Field>
          <Field
            name={t('pubkeyToAddress.n5PutItAllTogether')}
            value={
              <>
                <Seg kind="prefix" hex={px} />
                <Seg kind="content" hex={r.pk} />
                <Seg kind="checksum" hex={r.checksum} />
              </>
            }
            mono
          >
            {t('pubkeyToAddress.n38Bytes1Prefix33Key')}
          </Field>
          <Field
            name="6. Base58"
            value={
              <span className="inline-flex items-start gap-1">
                <span className="text-base font-semibold text-ergo-600 dark:text-ergo-400">{r.address}</span>
                <CopyButton text={r.address} />
              </span>
            }
            mono
          >
            {t('pubkeyToAddress.encodeWithBase58ToGetA')}
          </Field>
          <Field
            name="ErgoTree"
            value={
              <span className="inline-flex items-start gap-1">
                <span>
                  <span className="rounded bg-emerald-100 px-1 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">0008cd</span>
                  {r.pk}
                </span>
                <CopyButton text={r.ergoTree} />
              </span>
            }
            mono
          >
            {t('pubkeyToAddress.theScriptThatActuallyLocksBoxes')}
          </Field>
          {network === 0 && (
            <Link
              to={`/address/${r.address}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ergo-600 px-4 py-2 text-sm font-medium text-white hover:bg-ergo-700"
            >
              {t('pubkeyToAddress.viewInTheExplorer')} <ArrowRight className="size-4" />
            </Link>
          )}
        </Card>
      )}
    </div>
  )
}
