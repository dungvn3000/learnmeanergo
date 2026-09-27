import { useMemo, useState } from 'react'
import { blake2b256, bytesToHex, hexToBytes } from '../lib/ergo'
import { Callout, Card, CopyButton, Field } from '../components/ui'
import { useTranslation } from 'react-i18next'

const EXAMPLES = [
  { mode: 'text', value: 'Ergo' },
  { mode: 'text', value: 'ergo' },
  { mode: 'text', value: '' },
  { mode: 'hex', value: '0008cd0274e729bb6615cbda94d9d176a2f1525068f12b330e38bbbf387232797dfd891f' },
]

export default function Blake2b() {
  const { t } = useTranslation()
  const [mode, setMode] = useState('text')
  const [input, setInput] = useState('Ergo')

  const res = useMemo(() => {
    try {
      const bytes = mode === 'text' ? new TextEncoder().encode(input) : hexToBytes(input || '')
      return { bytes, hash: bytesToHex(blake2b256(bytes)) }
    } catch (e) {
      return { err: e.message }
    }
  }, [mode, input])

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="mb-3 flex gap-2">
          {[
            ['text', t('blake2b.textUtf8')],
            ['hex', 'Hex'],
          ].map(([m, l]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-3 py-1 text-xs ${
                mode === m ? 'border-ergo-400 bg-ergo-50 text-ergo-700 dark:bg-ergo-950/50 dark:text-ergo-300' : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder={mode === 'hex' ? t('blake2b.eG0008cd02') : t('blake2b.typeAnything')}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-sm outline-none focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:border-stone-700 dark:bg-stone-950"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                setMode(ex.mode)
                setInput(ex.value)
              }}
              className="max-w-60 truncate rounded-full border border-stone-200 px-3 py-1 font-mono text-xs hover:border-ergo-300 dark:border-stone-700"
            >
              {ex.value === '' ? t('blake2b.emptyString') : ex.value}
            </button>
          ))}
        </div>
      </Card>

      {res.err ? (
        <Callout type="warn" title={t('blake2b.invalidHex')}>
          {t('blake2b.useOnlyTheCharacters09')}
        </Callout>
      ) : (
        <Card className="p-5">
          <Field name={t('blake2b.input')} value={`${res.bytes.length} byte`} />
          <Field
            name="blake2b256"
            value={
              <span className="inline-flex items-start gap-1">
                <span className="font-semibold text-ergo-600 dark:text-ergo-400">{res.hash}</span>
                <CopyButton text={res.hash} />
              </span>
            }
            mono
          >
            {t('blake2b.always32Bytes64HexCharacters')}
          </Field>
        </Card>
      )}

      <Callout type="note" title={t('blake2b.whereDoesErgoUseBlake2b256')}>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Block id</b> = blake2b256({t('blake2b.theSerializedHeader')}).
          </li>
          <li>
            <b>Transaction id</b> = blake2b256({t('blake2b.theTransactionWithoutSignaturesProofs')}).
          </li>
          <li>
            <b>Box id</b> = blake2b256({t('blake2b.theBoxContents')}).
          </li>
          <li>
            <b>{t('blake2b.addressChecksum')}</b> ={' '}
            {t('blake2b.theFirst4BytesOfBlake2b256')}
          </li>
          <li>
            <b>Autolykos v2</b> {t('blake2b.usesBlake2b256AsTheHashFunction')}
          </li>
        </ul>
      </Callout>
    </div>
  )
}
