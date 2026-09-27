import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Radio, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { bytesToHex, decodeAddress } from '../lib/ergo'
import { Badge, Callout, Card, CopyButton, Field } from '../components/ui'
import { useTranslation } from 'react-i18next'

const SEG = {
  prefix: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  content: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  checksum: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
}

function Seg({ kind, hex }) {
  return <span className={`rounded px-1 py-0.5 ${SEG[kind]}`}>{hex}</span>
}

const examples = (t) => [
  { label: 'Pool 2Miners (P2PK)', value: '9fQYeMEXvSfmL2iUfsDDJ88SVtuPuvTZiB5aR19nKeCKSACVmgx' },
  { label: 'HeroMiners (P2PK)', value: '9gLHUWsNSjEi957E23ChviPKGnD76DoMuNg5ykjrvrvTBZTo5qv' },
  { label: t('addressDecoder.feeContractP2s'), value: '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe' },
]

export default function AddressDecoder() {
  const { t } = useTranslation()
  const EXAMPLES = examples(t)
  const [params] = useSearchParams()
  const [input, setInput] = useState(() => params.get('a') || examples(t)[0].value)
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
          {t('addressDecoder.ergoAddress')}
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
            <Radio className="size-3" /> {liveBusy ? t('addressDecoder.loading') : t('addressDecoder.minerOfTheLatestBlock')}
          </button>
        </div>
      </Card>

      {result?.err && (
        <Callout type="warn" title={t('addressDecoder.couldNotDecode')}>
          {result.err}. {t('addressDecoder.ergoAddressesUseTheBase58Alphabet')}
        </Callout>
      )}

      {d && (
        <>
          <Card className="p-5">
            <h2 className="mb-1 font-bold text-stone-900 dark:text-white">{t('addressDecoder.step1DecodeBase58IntoBytes')}</h2>
            <p className="mb-3 text-sm text-stone-500">
              {t('addressDecoder.theStringIsReallyOneBig', { length: d.raw.length })}
            </p>
            <div className="rounded-xl bg-stone-50 p-3 font-mono text-sm leading-7 break-all dark:bg-stone-950">
              <Seg kind="prefix" hex={prefixHex} />
              <Seg kind="content" hex={contentHex} />
              <Seg kind="checksum" hex={checksumHex} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className={`rounded px-2 py-0.5 ${SEG.prefix}`}>prefix · 1 byte</span>
              <span className={`rounded px-2 py-0.5 ${SEG.content}`}>{t('addressDecoder.content')} · {d.content.length} byte</span>
              <span className={`rounded px-2 py-0.5 ${SEG.checksum}`}>checksum · 4 byte</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-bold text-stone-900 dark:text-white">{t('addressDecoder.step2ReadThePrefixByte')}</h2>
            <Field name="Prefix" value={<span className="font-mono">0x{prefixHex}</span>}>
              {t('addressDecoder.prefixNetworkTypeAddressTypeThe')}
            </Field>
            <Field
              name={t('addressDecoder.network')}
              value={
                <span className="font-mono">
                  0x{d.network.toString(16).padStart(2, '0')} → <Badge tone={d.network === 0 ? 'green' : 'sky'}>{d.network === 0 ? 'Mainnet' : d.network === 0x10 ? 'Testnet' : t('common.unknown')}</Badge>
                </span>
              }
            >
              {t('addressDecoder.n0x00MainnetP2pkAddressesStartWith')}
            </Field>
            <Field
              name={t('addressDecoder.addressType')}
              value={
                <span className="font-mono">
                  0x{d.type.toString(16).padStart(2, '0')} → <Badge tone="violet">{d.typeInfo?.code ?? t('common.unknown')}</Badge>{' '}
                  <span className="font-sans text-stone-500">{d.typeInfo?.name}</span>
                </span>
              }
            >
              {d.typeInfo?.desc ?? t('addressDecoder.invalidAddressTypeOnly12')}
            </Field>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-bold text-stone-900 dark:text-white">{t('addressDecoder.step3VerifyTheChecksum')}</h2>
            <p className="mb-3 text-sm text-stone-500">
              {t('addressDecoder.hash')} <span className="font-mono">{t('addressDecoder.prefixContent')}</span>{' '}
              {t('addressDecoder.withBlake2b256AndTakeTheFirst')}
            </p>
            <Field name={t('addressDecoder.checksumInTheAddress')} value={<Seg kind="checksum" hex={checksumHex} />} mono />
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
                ? t('addressDecoder.checksumMatchesTheAddressIsValid')
                : t('addressDecoder.checksumDoesNotMatchTheAddress')}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-bold text-stone-900 dark:text-white">{t('addressDecoder.step4TheLockingScriptErgotree')}</h2>
            {d.ergoTree ? (
              <>
                <p className="mb-3 text-sm text-stone-500">
                  {d.type === 1 ? (
                    <>
                      {t('addressDecoder.forP2pkErgotree')} <span className="font-mono">0008cd</span> {t('addressDecoder.publicKeyHeader')}{' '}
                      <span className="font-mono">00</span>, {t('addressDecoder.aConstantOfTypeSigmaprop')} <span className="font-mono">08</span>,{' '}
                      {t('addressDecoder.the')} <span className="font-mono">ProveDlog</span> {t('addressDecoder.opcode')} <span className="font-mono">cd</span>.
                    </>
                  ) : (
                    t('addressDecoder.forP2sTheAddressContentIs')
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
                {t('addressDecoder.p2shOnlyHoldsAHashOf')}
              </p>
            )}
            {d.valid && d.network === 0 && (
              <Link
                to={`/address/${input.trim()}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ergo-500 px-4 py-2 text-sm font-medium text-white hover:bg-ergo-600"
              >
                {t('addressDecoder.viewThisAddressInTheExplorer')} <ArrowRight className="size-4" />
              </Link>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
