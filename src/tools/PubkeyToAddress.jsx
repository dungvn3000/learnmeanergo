import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { base58Encode, blake2b256, bytesToHex, hexToBytes } from '../lib/ergo'
import { Callout, Card, CopyButton, Field } from '../components/ui'
import { t } from '../lib/i18n'

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
      t(
        `Khoá công khai nén phải dài đúng 33 byte (66 ký tự hex), bạn nhập ${pk.length} byte`,
        `A compressed public key must be exactly 33 bytes (66 hex characters); you entered ${pk.length} bytes`,
      ),
    )
  if (pk[0] !== 2 && pk[0] !== 3) throw new Error(
      t(
        'Byte đầu của khoá nén phải là 02 hoặc 03 (cho biết toạ độ y chẵn hay lẻ)',
        'The first byte of a compressed key must be 02 or 03 (it tells whether the y coordinate is even or odd)',
      ),
    )
  const prefix = network | 0x01
  const body = Uint8Array.from([prefix, ...pk])
  const hash = blake2b256(body)
  const checksum = hash.slice(0, 4)
  const full = Uint8Array.from([...body, ...checksum])
  return { pk: s, prefix, hash: bytesToHex(hash), checksum: bytesToHex(checksum), address: base58Encode(full), ergoTree: '0008cd' + s }
}

export default function PubkeyToAddress() {
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
          {t('Khoá công khai nén (33 byte, hex)', 'Compressed public key (33 bytes, hex)')}
        </label>
        <input
          id="pk"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          spellCheck={false}
          className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-sm outline-none focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:border-stone-700 dark:bg-stone-950"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone-500">{t('Mạng:', 'Network:')}</span>
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
            {t('Dùng ví dụ (khoá của pool 2Miners)', 'Use an example (the 2Miners pool key)')}
          </button>
        </div>
      </Card>

      {res.err && (
        <Callout type="warn" title={t('Khoá không hợp lệ', 'Invalid key')}>
          {res.err}
        </Callout>
      )}

      {r && (
        <Card className="p-5">
          <Field name="1. Prefix" value={<Seg kind="prefix" hex={px} />} mono>
            {t('Loại mạng', 'Network type')} ({network === 0 ? '0x00 mainnet' : '0x10 testnet'}) + {t('loại địa chỉ', 'address type')} (0x01 = P2PK) = 0x{px}.
          </Field>
          <Field
            name={t('2. Ghép nội dung', '2. Append the content')}
            value={
              <>
                <Seg kind="prefix" hex={px} />
                <Seg kind="content" hex={r.pk} />
              </>
            }
            mono
          >
            {t('Nội dung của địa chỉ P2PK chính là khoá công khai 33 byte.', 'The content of a P2PK address is simply the 33-byte public key.')}
          </Field>
          <Field name="3. blake2b256" value={<span className="text-stone-500">{r.hash}</span>} mono>
            {t('Băm phần', 'Hash')} <span className="font-mono">{t('prefix ‖ khoá', 'prefix ‖ key')}</span> {t('bằng blake2b256.', 'with blake2b256.')}
          </Field>
          <Field name="4. Checksum" value={<Seg kind="checksum" hex={r.checksum} />} mono>
            {t('Lấy 4 byte đầu tiên của hash làm checksum.', 'Take the first 4 bytes of the hash as the checksum.')}
          </Field>
          <Field
            name={t('5. Ghép tất cả', '5. Put it all together')}
            value={
              <>
                <Seg kind="prefix" hex={px} />
                <Seg kind="content" hex={r.pk} />
                <Seg kind="checksum" hex={r.checksum} />
              </>
            }
            mono
          >
            {t('38 byte = 1 prefix + 33 khoá + 4 checksum.', '38 bytes = 1 prefix + 33 key + 4 checksum.')}
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
            {t(
              'Mã hoá Base58 để có chuỗi dễ đọc, không có các ký tự dễ nhầm như 0/O, I/l.',
              'Encode with Base58 to get a readable string without easily confused characters like 0/O and I/l.',
            )}
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
            {t(
              'Script thật sự khoá các box gửi tới địa chỉ này: “chứng minh bạn biết khoá bí mật của khoá công khai này”.',
              'The script that actually locks boxes sent to this address: “prove you know the secret key behind this public key”.',
            )}
          </Field>
          {network === 0 && (
            <Link
              to={`/address/${r.address}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ergo-500 px-4 py-2 text-sm font-medium text-white hover:bg-ergo-600"
            >
              {t('Xem trên explorer', 'View in the explorer')} <ArrowRight className="size-4" />
            </Link>
          )}
        </Card>
      )}
    </div>
  )
}
