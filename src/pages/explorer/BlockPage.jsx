import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, bytes, erg, num, short, utc } from '../../lib/format'
import { Async, Badge, Card, Erg, Field, Hash } from '../../components/ui'
import { TxFlow } from '../../components/TxFlow'
import { Learn, Section } from './common'
import { t } from '../../lib/i18n'
import { useSeo } from '../../lib/seo'

function TxRow({ tx, open: initial }) {
  const [open, setOpen] = useState(initial)
  const total = tx.outputs.reduce((s, o) => s + o.value, 0)
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/40">
        <span className="w-6 text-xs font-bold text-stone-400 tabular-nums">#{tx.index}</span>
        <div className="min-w-0 flex-1">
          <Hash value={tx.id} to={`/tx/${tx.id}`} head={12} tail={8} copy={false} />
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <Badge tone={tx.coinbase ? 'ergo' : 'stone'}>{tx.kind}</Badge>
            {tx.inputs.length} input → {tx.outputs.length} output · {bytes(tx.size)}
          </div>
        </div>
        <div className="hidden text-right text-sm sm:block">
          <Erg nano={total} digits={4} />
          <div className="text-xs text-stone-500">{t('phí', 'fee')} {erg(tx.fee)} ERG</div>
        </div>
        <ChevronDown className={`size-4 shrink-0 text-stone-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-stone-100 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
          <TxFlow tx={tx} limit={8} />
        </div>
      )}
    </Card>
  )
}

function Block({ b }) {
  const hashrate = b.difficulty / 120 / 1e12
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
            <Layers className="size-4" /> Block
          </div>
          <h1 className="font-mono text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">{num(b.height)}</h1>
          <div className="mt-2 text-sm text-stone-500">
            {utc(b.timestamp)} · {ago(b.timestamp)} · {num(b.confirmations)} {t('xác nhận', 'confirmations')}
          </div>
        </div>
        <div className="flex gap-2">
          {b.height > 1 && (
            <Link to={`/block/${b.height - 1}`} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">
              <ChevronLeft className="size-4" /> {num(b.height - 1)}
            </Link>
          )}
          {b.confirmations > 1 && (
            <Link to={`/block/${b.height + 1}`} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">
              {num(b.height + 1)} <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="px-5 py-2">
          <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">
            Header <span className="font-normal normal-case">— <Learn to="/learn/block">{t('giải thích từng trường', 'every field explained')}</Learn></span>
          </div>
          <Field name="Block id" value={<Hash value={b.id} full />}>
            {t('blake2b256 của header đã tuần tự hoá. Thay đổi bất kỳ byte nào thì id đổi hoàn toàn.', 'blake2b256 of the serialized header. Change any single byte and the id changes completely.')}
          </Field>
          <Field name="Parent id" value={<Hash value={b.parentId} to={b.height > 1 ? `/block/${b.height - 1}` : undefined} full />}>
            {t('Id của block trước — sợi xích nối các block thành blockchain.', 'The id of the previous block — the link that chains blocks into a blockchain.')}
          </Field>
          <Field name="Version" value={b.version}>
            {t('Phiên bản giao thức của header; tăng lên sau mỗi lần nâng cấp mạng (ví dụ v2 kích hoạt Autolykos v2).', 'The header\'s protocol version; it goes up with each network upgrade (e.g. v2 activated Autolykos v2).')}
          </Field>
          <Field name="Timestamp" value={`${b.timestamp} (${utc(b.timestamp)})`}>
            {t('Thời điểm thợ đào tạo block, tính bằng mili-giây Unix.', 'When the miner created the block, in Unix milliseconds.')}
          </Field>
          <Field name="nBits" value={<span className="font-mono">{b.nBits}</span>}>
            {t('Độ khó mục tiêu ở dạng nén.', 'The target difficulty in compact form.')} <Learn to="/learn/difficulty">{t('Giải nén nBits', 'Decoding nBits')}</Learn>
          </Field>
          <Field name="Difficulty" value={num(b.difficulty)}>
            {t(`Tương đương ~${hashrate.toFixed(2)} TH/s hashrate toàn mạng với block 2 phút.`, `Equivalent to ~${hashrate.toFixed(2)} TH/s of network hashrate at 2-minute blocks.`)}
          </Field>
          <Field name="State root" value={<Hash value={b.stateRoot} full />} mono>
            {t('Digest (33 byte) của cây AVL+ chứa toàn bộ UTXO sau block này — cho phép node “nhẹ” xác minh trạng thái.', 'The 33-byte digest of the AVL+ tree holding the entire UTXO set after this block — it lets “light” nodes verify state.')}
          </Field>
          <Field name="Transactions root" value={<Hash value={b.txRoot} full />}>
            {t('Merkle root của các giao dịch trong block.', 'Merkle root of the block\'s transactions.')}
          </Field>
          <Field name="AD proofs root" value={<Hash value={b.adRoot} full />}>
            {t('Gốc của các bằng chứng thay đổi trạng thái (authenticated dictionary proofs).', 'Root of the state-change proofs (authenticated dictionary proofs).')}
          </Field>
          <Field name="Extension hash" value={<Hash value={b.extHash} full />}>
            {t('Merkle root của phần mở rộng: tham số mạng, NiPoPoW interlinks.', 'Merkle root of the extension section: network parameters, NiPoPoW interlinks.')}
          </Field>
          <Field name="Votes" value={<span className="font-mono">{b.votes}</span>}>
            {t('3 byte thợ đào dùng để bỏ phiếu thay đổi tham số (0 = không bỏ phiếu).', '3 bytes miners use to vote on parameter changes (0 = no vote).')}
          </Field>
        </Card>

        <div className="space-y-6">
          <Card className="px-5 py-2">
            <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">
              Proof of Work <span className="font-normal normal-case">— <Learn to="/learn/autolykos">Autolykos v2</Learn></span>
            </div>
            <Field name="Nonce (n)" value={<span className="font-mono">{b.pow.n}</span>}>
              {t('8 byte mà thợ đào thử liên tục cho tới khi hash đạt mục tiêu.', 'The 8 bytes a miner keeps changing until the hash meets the target.')}
            </Field>
            <Field name="Miner pk" value={<Hash value={b.pow.pk} full />}>
              {t('Khoá công khai thợ đào — phần thưởng bị khoá cho khoá này.', 'The miner\'s public key — the reward is locked to this key.')}
            </Field>
            <Field name="w" value={<Hash value={b.pow.w} full />}>
              {b.version >= 2
                ? t('Không dùng trong Autolykos v2; giữ giá trị điểm sinh G của secp256k1.', 'Unused in Autolykos v2; it holds the secp256k1 generator point G.')
                : t('Autolykos v1: khoá công khai dùng một lần mà thợ đào tạo cho block này.', 'Autolykos v1: a one-time public key the miner generated for this block.')}
            </Field>
            <Field name="d" value={<span className="font-mono break-all">{String(b.pow.d)}</span>}>
              {b.version >= 2
                ? t('Không dùng trong v2 (luôn 0).', 'Unused in v2 (always 0).')
                : t('Autolykos v1: giá trị lời giải d của bài toán k-sum; phải nhỏ hơn mục tiêu b.', 'Autolykos v1: the k-sum solution value d; it must be below the target b.')}
            </Field>
          </Card>

          <Card className="px-5 py-2">
            <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">
              {t('Thưởng & nội dung', 'Reward & contents')} <span className="font-normal normal-case">— <Learn to="/learn/emission">{t('lịch phát hành', 'emission schedule')}</Learn></span>
            </div>
            <Field name={t('Thợ đào', 'Miner')} value={<Link className="text-ergo-600 hover:underline dark:text-ergo-400" to={`/address/${b.minerAddress}`}>{b.miner || short(b.minerAddress, 10, 6)}</Link>} />
            <Field name={t('Phát hành mới', 'Newly emitted')} value={<Erg nano={b.emission} />}>
              {t('ERG mới sinh ra ở độ cao này theo lịch phát hành.', 'New ERG created at this height according to the emission schedule.')}
            </Field>
            {b.reemitted > 0 && (
              <Field name={t('Khoá tái phát hành', 'Re-emission lock')} value={<Erg nano={b.reemitted} />}>
                {t('EIP-27: phần này bị khoá vào hợp đồng tái phát hành, trả dần cho thợ đào sau khi phát hành chính kết thúc.', 'EIP-27: this part is locked into the re-emission contract and paid out to miners after the main emission ends.')}
              </Field>
            )}
            <Field name={t('Thợ đào nhận', 'Miner receives')} value={<Erg nano={b.reward} />} />
            <Field name={t('Phí giao dịch', 'Transaction fees')} value={<Erg nano={b.fees} />} />
            <Field name={t('Giao dịch', 'Transactions')} value={b.txCount} />
            <Field name={t('Kích thước', 'Size')} value={`${num(b.size)} byte`} />
          </Card>
        </div>
      </div>

      <Section title={`${t('Giao dịch', 'Transactions')} (${b.txCount})`} right={<Learn to="/learn/transaction">{t('Giao dịch hoạt động thế nào?', 'How do transactions work?')}</Learn>}>
        <div className="grid gap-3">
          {(b.transactions ?? []).map((t, i) => (
            <TxRow key={t.id} tx={t} open={i === 0 && b.txCount <= 3} />
          ))}
        </div>
      </Section>
    </>
  )
}

export default function BlockPage() {
  const { id } = useParams()
  const s = useApi(() => api.block(id), [id])
  useSeo({ path: `/block/${id}`, title: { vi: `Block ${id}`, en: `Block ${id}` }, noindex: true })
  return <Async state={s} notFound={t('Không tìm thấy block này.', 'Block not found.')}>{(b) => <Block b={b} />}</Async>
}
