import { useMemo, useState } from 'react'
import { blake2b256, bytesToHex, hexToBytes } from '../lib/ergo'
import { Callout, Card, CopyButton, Field } from '../components/ui'
import { t } from '../lib/i18n'

const EXAMPLES = [
  { mode: 'text', value: 'Ergo' },
  { mode: 'text', value: 'ergo' },
  { mode: 'text', value: '' },
  { mode: 'hex', value: '0008cd0274e729bb6615cbda94d9d176a2f1525068f12b330e38bbbf387232797dfd891f' },
]

export default function Blake2b() {
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
            ['text', t('Văn bản (UTF-8)', 'Text (UTF-8)')],
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
          placeholder={mode === 'hex' ? t('ví dụ: 0008cd02…', 'e.g. 0008cd02…') : t('Nhập bất kỳ nội dung nào', 'Type anything')}
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
              {ex.value === '' ? t('(chuỗi rỗng)', '(empty string)') : ex.value}
            </button>
          ))}
        </div>
      </Card>

      {res.err ? (
        <Callout type="warn" title={t('Hex không hợp lệ', 'Invalid hex')}>
          {t(
            'Chỉ dùng ký tự 0–9, a–f và số ký tự phải chẵn (mỗi byte = 2 ký tự).',
            'Use only the characters 0–9 and a–f, with an even number of characters (each byte = 2 characters).',
          )}
        </Callout>
      ) : (
        <Card className="p-5">
          <Field name={t('Đầu vào', 'Input')} value={`${res.bytes.length} byte`} />
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
            {t(
              'Luôn 32 byte (64 ký tự hex), bất kể đầu vào dài bao nhiêu. Thử đổi “Ergo” thành “ergo”: kết quả thay đổi hoàn toàn.',
              'Always 32 bytes (64 hex characters), no matter how long the input is. Try changing “Ergo” to “ergo”: the result changes completely.',
            )}
          </Field>
        </Card>
      )}

      <Callout type="note" title={t('Ergo dùng blake2b256 ở đâu?', 'Where does Ergo use blake2b256?')}>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Block id</b> = blake2b256({t('header đã tuần tự hoá', 'the serialized header')}).
          </li>
          <li>
            <b>Transaction id</b> = blake2b256({t('giao dịch không kèm chữ ký/proof', 'the transaction without signatures/proofs')}).
          </li>
          <li>
            <b>Box id</b> = blake2b256({t('nội dung box', 'the box contents')}).
          </li>
          <li>
            <b>{t('Checksum địa chỉ', 'Address checksum')}</b> ={' '}
            {t(
              '4 byte đầu của blake2b256(prefix ‖ nội dung); P2SH dùng 24 byte đầu của hash script.',
              'the first 4 bytes of blake2b256(prefix ‖ content); P2SH uses the first 24 bytes of the script hash.',
            )}
          </li>
          <li>
            <b>Autolykos v2</b> {t('dùng blake2b256 làm hàm băm bên trong thuật toán đào.', 'uses blake2b256 as the hash function inside the mining algorithm.')}
          </li>
        </ul>
      </Callout>
    </div>
  )
}
