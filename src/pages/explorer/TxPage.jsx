import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftRight, CheckCircle2, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, bytes, erg, num, utc } from '../../lib/format'
import { Async, Badge, Card, Erg, Field, Hash } from '../../components/ui'
import { TxFlow, isFeeBox } from '../../components/TxFlow'
import { Learn, Section } from './common'
import { t } from '../../lib/i18n'
import { useSeo } from '../../lib/seo'

function Balance({ tx }) {
  const inSum = tx.inputs.reduce((s, b) => s + b.value, 0)
  const outSum = tx.outputs.reduce((s, b) => s + b.value, 0)
  const fee = tx.outputs.filter(isFeeBox).reduce((s, b) => s + b.value, 0)
  const ok = inSum === outSum
  return (
    <Card className="p-5">
      <div className="text-sm font-semibold text-stone-900 dark:text-white">{t('Kiểm tra bảo toàn ERG', 'ERG conservation check')}</div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm tabular-nums">
        <span className="text-stone-500">{t('Tổng inputs', 'Total inputs')}</span>
        <span className="text-right">{erg(inSum)} ERG</span>
        <span className="text-stone-500">{t('Tổng outputs', 'Total outputs')}</span>
        <span className="text-right">{erg(outSum)} ERG</span>
        <span className="text-stone-500">{t('…trong đó box phí', '…of which fee box')}</span>
        <span className="text-right">{erg(fee)} ERG</span>
      </div>
      <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${ok ? 'text-emerald-600' : 'text-stone-500'}`}>
        <CheckCircle2 className="size-4" />
        {ok ? t('Inputs = Outputs: không ERG nào tự sinh ra hay biến mất.', 'Inputs = Outputs: no ERG was created or destroyed.') : tx.coinbase ? t('Giao dịch thưởng block: ERG mới đến từ hợp đồng phát hành.', 'Block reward transaction: new ERG comes from the emission contract.') : t('Chênh lệch đến từ box chưa được index.', 'The difference comes from boxes that are not indexed yet.')}
      </div>
      {tx.coinbase && (
        <p className="mt-2 text-xs text-stone-500">
          {t('Ergo không có coinbase như Bitcoin: giao dịch thưởng tiêu box của hợp đồng phát hành (emission box) và tạo lại nó với ít ERG hơn, nên ERG vẫn được bảo toàn.', 'Ergo has no Bitcoin-style coinbase: the reward transaction spends the emission contract’s box and recreates it with less ERG, so ERG is still conserved.')}{' '}
          <Learn to="/learn/transaction#coinbase">{t('Vì sao?', 'Why?')}</Learn>
        </p>
      )}
      <p className="mt-2 text-xs text-stone-500">
        {t('Khác Bitcoin, phí trong Ergo không phải là “phần dư” — nó là một output riêng khoá bởi hợp đồng phí. Thợ đào của block gom các box phí về một box thưởng, và box thưởng đó bị khoá 720 block.', 'Unlike Bitcoin, an Ergo fee is not the “leftover” — it is a separate output locked by the fee contract. The block’s miner collects the fee boxes into a reward box, which stays locked for 720 blocks.')}
      </p>
    </Card>
  )
}

function Tx({ tx }) {
  const [regs, setRegs] = useState(false)
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
          <ArrowLeftRight className="size-4" /> {t('Giao dịch', 'Transaction')}
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          <Hash value={tx.id} full />
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <Badge tone={tx.coinbase ? 'ergo' : 'stone'}>{tx.kind}</Badge>
          {tx.pending ? (
            <Badge tone="sky">
              <Clock className="size-3" /> {t('đang chờ trong mempool', 'waiting in the mempool')}
            </Badge>
          ) : (
            <Badge tone="green">
              <CheckCircle2 className="size-3" /> {num(tx.confirmations)} {t('xác nhận', 'confirmations')}
            </Badge>
          )}
          <span>{ago(tx.timestamp)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="px-5 py-2">
          <Field name="Transaction id" value={<Hash value={tx.id} full />}>
            {t(<>blake2b256 của giao dịch đã tuần tự hoá <em>không kèm</em> chữ ký (proofs) — nên chữ ký không thể làm đổi id.</>, <>blake2b256 of the serialized transaction <em>without</em> its signatures (proofs) — so signatures can never change the id.</>)}
          </Field>
          <Field name="Block" value={tx.height ? <Link className="font-mono text-ergo-600 hover:underline dark:text-ergo-400" to={`/block/${tx.height}`}>{num(tx.height)}</Link> : t('chưa có', 'not yet')}>
            {tx.index != null && t(`Vị trí thứ ${tx.index} trong block.`, `Position ${tx.index} in the block.`)}
          </Field>
          <Field name={t('Thời gian', 'Time')} value={utc(tx.timestamp)} />
          <Field name={t('Kích thước', 'Size')} value={bytes(tx.size)} />
          <Field name={t('Phí', 'Fee')} value={<Erg nano={tx.fee} />}>
            {t('Mức phổ biến là 0.001 ERG (mức tối thiểu mặc định của node). Ví tự đặt phí, còn thợ đào ưu tiên giao dịch theo phí trên mỗi byte.', '0.001 ERG is typical (the node’s default minimum). The wallet sets the fee, and miners prioritize transactions by fee per byte.')}
          </Field>
          <Field name="Inputs / Outputs" value={`${tx.inputs.length} / ${tx.outputs.length}${tx.dataInputs?.length ? ` (+${tx.dataInputs.length} data input)` : ''}`}>
            {t('Input là box bị tiêu huỷ; output là box mới được tạo. Data input chỉ được đọc, không bị tiêu.', 'Inputs are boxes being destroyed; outputs are newly created boxes. Data inputs are only read, never spent.')}
          </Field>
        </Card>
        <Balance tx={tx} />
      </div>

      <Section
        title={t('Box đi vào → box đi ra', 'Boxes in → boxes out')}
        right={
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
              <input type="checkbox" checked={regs} onChange={(e) => setRegs(e.target.checked)} className="accent-ergo-500" /> {t('Hiện registers', 'Show registers')}
            </label>
            <Learn to="/learn/box">{t('Box là gì?', 'What is a box?')}</Learn>
          </div>
        }
      >
        <TxFlow tx={tx} showRegisters={regs} limit={50} />
      </Section>
    </>
  )
}

export default function TxPage() {
  const { id } = useParams()
  const s = useApi(() => api.transaction(id), [id])
  useSeo({ path: `/tx/${id}`, title: { vi: `Giao dịch ${id.slice(0, 12)}…`, en: `Transaction ${id.slice(0, 12)}…` }, noindex: true })
  return <Async state={s} notFound={t('Không tìm thấy giao dịch này.', 'Transaction not found.')}>{(tx) => <Tx tx={tx} />}</Async>
}
