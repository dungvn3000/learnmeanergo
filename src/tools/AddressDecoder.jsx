import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Radio, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { bytesToHex, decodeAddress } from '../lib/ergo'
import { Badge, Callout, Card, CopyButton, Field } from '../components/ui'
import { t } from '../lib/i18n'

const SEG = {
  prefix: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  content: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  checksum: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
}

function Seg({ kind, hex }) {
  return <span className={`rounded px-1 py-0.5 ${SEG[kind]}`}>{hex}</span>
}

const examples = () => [
  { label: 'Pool 2Miners (P2PK)', value: '9fQYeMEXvSfmL2iUfsDDJ88SVtuPuvTZiB5aR19nKeCKSACVmgx' },
  { label: 'HeroMiners (P2PK)', value: '9gLHUWsNSjEi957E23ChviPKGnD76DoMuNg5ykjrvrvTBZTo5qv' },
  { label: t('Hợp đồng phí (P2S)', 'Fee contract (P2S)'), value: '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe' },
]

export default function AddressDecoder() {
  const EXAMPLES = examples()
  const [params] = useSearchParams()
  const [input, setInput] = useState(() => params.get('a') || examples()[0].value)
  const [liveBusy, setLiveBusy] = useState(false)

  const result = useMemo(() => {
    const s = input.trim()
    if (!s) return null
    try {
      return { ok: decodeAddress(s) }
    } catch (e) {
      return { err: e.message }
    }
  }, [input])

  const loadLive = async () => {
    setLiveBusy(true)
    try {
      const [b] = (await api.latestBlocks(1)) ?? []
      if (b?.minerAddress) setInput(b.minerAddress)
    } catch {
      /* ignore */
    } finally {
      setLiveBusy(false)
    }
  }

  const d = result?.ok
  const prefixHex = d ? d.prefix.toString(16).padStart(2, '0') : ''
  const contentHex = d ? bytesToHex(d.content) : ''
  const checksumHex = d ? bytesToHex(d.checksum) : ''
  const expectedHex = d ? bytesToHex(d.expectedChecksum) : ''

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <label className="text-sm font-semibold text-stone-900 dark:text-white" htmlFor="addr">
          {t('Địa chỉ Ergo', 'Ergo address')}
        </label>
        <textarea
          id="addr"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-sm break-all outline-none focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:border-stone-700 dark:bg-stone-950"
          placeholder="9f…"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => setInput(ex.value)}
              className="rounded-full border border-stone-200 px-3 py-1 text-xs hover:border-ergo-300 hover:text-ergo-600 dark:border-stone-700"
            >
              {ex.label}
            </button>
          ))}
          <button
            onClick={loadLive}
            disabled={liveBusy}
            className="inline-flex items-center gap-1 rounded-full border border-ergo-200 bg-ergo-50 px-3 py-1 text-xs text-ergo-700 hover:border-ergo-400 disabled:opacity-50 dark:border-ergo-900 dark:bg-ergo-950/40 dark:text-ergo-300"
          >
            <Radio className="size-3" /> {liveBusy ? t('Đang tải…', 'Loading…') : t('Thợ đào của block mới nhất', 'Miner of the latest block')}
          </button>
        </div>
      </Card>

      {result?.err && (
        <Callout type="warn" title={t('Không giải mã được', 'Could not decode')}>
          {result.err}. {t('Địa chỉ Ergo dùng bảng chữ Base58 (không có 0, O, I, l).', 'Ergo addresses use the Base58 alphabet (no 0, O, I or l).')}
        </Callout>
      )}

      {d && (
        <>
          <Card className="p-5">
            <h2 className="mb-1 font-bold text-stone-900 dark:text-white">{t('Bước 1 — Giải mã Base58 thành byte', 'Step 1 — Decode Base58 into bytes')}</h2>
            <p className="mb-3 text-sm text-stone-500">
              {t(
                `Chuỗi ký tự thực chất là một con số lớn viết ở hệ cơ số 58. Đổi nó sang hệ 16 ta được ${d.raw.length} byte:`,
                `The string is really one big number written in base 58. Converting it to hex gives ${d.raw.length} bytes:`,
              )}
            </p>
            <div className="rounded-xl bg-stone-50 p-3 font-mono text-sm leading-7 break-all dark:bg-stone-950">
              <Seg kind="prefix" hex={prefixHex} />
              <Seg kind="content" hex={contentHex} />
              <Seg kind="checksum" hex={checksumHex} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className={`rounded px-2 py-0.5 ${SEG.prefix}`}>prefix · 1 byte</span>
              <span className={`rounded px-2 py-0.5 ${SEG.content}`}>{t('nội dung', 'content')} · {d.content.length} byte</span>
              <span className={`rounded px-2 py-0.5 ${SEG.checksum}`}>checksum · 4 byte</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-bold text-stone-900 dark:text-white">{t('Bước 2 — Đọc byte prefix', 'Step 2 — Read the prefix byte')}</h2>
            <Field name="Prefix" value={<span className="font-mono">0x{prefixHex}</span>}>
              {t(
                'prefix = loại mạng + loại địa chỉ. Nửa byte cao là mạng, nửa byte thấp là loại.',
                'prefix = network type + address type. The high nibble is the network, the low nibble is the type.',
              )}
            </Field>
            <Field
              name={t('Mạng', 'Network')}
              value={
                <span className="font-mono">
                  0x{d.network.toString(16).padStart(2, '0')} → <Badge tone={d.network === 0 ? 'green' : 'sky'}>{d.network === 0 ? 'Mainnet' : d.network === 0x10 ? 'Testnet' : t('Không rõ', 'Unknown')}</Badge>
                </span>
              }
            >
              {t(
                '0x00 = mainnet (địa chỉ P2PK bắt đầu bằng “9”), 0x10 = testnet (bắt đầu bằng “3”).',
                '0x00 = mainnet (P2PK addresses start with “9”), 0x10 = testnet (they start with “3”).',
              )}
            </Field>
            <Field
              name={t('Loại địa chỉ', 'Address type')}
              value={
                <span className="font-mono">
                  0x{d.type.toString(16).padStart(2, '0')} → <Badge tone="violet">{d.typeInfo?.code ?? t('Không rõ', 'Unknown')}</Badge>{' '}
                  <span className="font-sans text-stone-500">{d.typeInfo?.name}</span>
                </span>
              }
            >
              {d.typeInfo?.desc ?? t('Loại địa chỉ không hợp lệ (chỉ có 1, 2, 3).', 'Invalid address type (only 1, 2 and 3 exist).')}
            </Field>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-bold text-stone-900 dark:text-white">{t('Bước 3 — Kiểm tra checksum', 'Step 3 — Verify the checksum')}</h2>
            <p className="mb-3 text-sm text-stone-500">
              {t('Băm', 'Hash')} <span className="font-mono">{t('prefix ‖ nội dung', 'prefix ‖ content')}</span>{' '}
              {t(
                'bằng blake2b256 và lấy 4 byte đầu. Nếu gõ sai dù chỉ một ký tự, checksum sẽ không khớp.',
                'with blake2b256 and take the first 4 bytes. Mistype even a single character and the checksum won’t match.',
              )}
            </p>
            <Field name={t('Checksum trong địa chỉ', 'Checksum in the address')} value={<Seg kind="checksum" hex={checksumHex} />} mono />
            <Field name="blake2b256(…)[0..4]" value={<Seg kind="checksum" hex={expectedHex} />} mono />
            <div
              className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
                d.valid
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              {d.valid ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
              {d.valid
                ? t('Checksum khớp — địa chỉ hợp lệ.', 'Checksum matches — the address is valid.')
                : t('Checksum KHÔNG khớp — địa chỉ bị gõ sai hoặc hỏng.', 'Checksum does NOT match — the address is mistyped or corrupted.')}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-bold text-stone-900 dark:text-white">{t('Bước 4 — Script khoá tiền (ErgoTree)', 'Step 4 — The locking script (ErgoTree)')}</h2>
            {d.ergoTree ? (
              <>
                <p className="mb-3 text-sm text-stone-500">
                  {d.type === 1 ? (
                    <>
                      {t('Với P2PK, ErgoTree =', 'For P2PK, ErgoTree =')} <span className="font-mono">0008cd</span> {t('+ khoá công khai: header', '+ public key: header')}{' '}
                      <span className="font-mono">00</span>, {t('hằng số kiểu SigmaProp', 'a constant of type SigmaProp')} <span className="font-mono">08</span>,{' '}
                      {t('phép', 'the')} <span className="font-mono">ProveDlog</span> {t('mã lệnh', 'opcode')} <span className="font-mono">cd</span>.
                    </>
                  ) : (
                    t('Với P2S, nội dung địa chỉ chính là toàn bộ ErgoTree.', 'For P2S, the address content is the entire ErgoTree.')
                  )}
                </p>
                <div className="flex items-start gap-1 rounded-xl bg-stone-50 p-3 font-mono text-sm break-all dark:bg-stone-950">
                  <span className="min-w-0 flex-1">
                    {d.type === 1 ? (
                      <>
                        <span className="rounded bg-emerald-100 px-1 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">0008cd</span>
                        <Seg kind="content" hex={contentHex} />
                      </>
                    ) : (
                      d.ergoTree
                    )}
                  </span>
                  <CopyButton text={d.ergoTree} />
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-500">
                {t(
                  'P2SH chỉ chứa hash của script, nên không thể khôi phục ErgoTree từ địa chỉ — người tiêu phải tiết lộ script khi chi tiêu.',
                  'P2SH only holds a hash of the script, so the ErgoTree can’t be recovered from the address — the spender must reveal the script when spending.',
                )}
              </p>
            )}
            {d.valid && d.network === 0 && (
              <Link
                to={`/address/${input.trim()}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ergo-500 px-4 py-2 text-sm font-medium text-white hover:bg-ergo-600"
              >
                {t('Xem địa chỉ này trên explorer', 'View this address in the explorer')} <ArrowRight className="size-4" />
              </Link>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
