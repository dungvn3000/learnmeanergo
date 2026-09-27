import { Link, useParams } from 'react-router-dom'
import { Lock, LockOpen, Package } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { num } from '../../lib/format'
import { Async, Badge, Card, CopyButton, Erg, Field, Hash, TokenChip } from '../../components/ui'
import { isFeeBox } from '../../components/TxFlow'
import { Learn, Section } from './common'
import { t } from '../../lib/i18n'
import { useSeo } from '../../lib/seo'

const regHelp = () => ({
  R4: t('Register tự do đầu tiên. Với token EIP-4, R4 thường chứa tên token.', 'The first free register. For EIP-4 tokens, R4 usually holds the token name.'),
  R5: t('Register tự do. Với token EIP-4, R5 thường chứa mô tả.', 'A free register. For EIP-4 tokens, R5 usually holds the description.'),
  R6: t('Register tự do. Với token EIP-4, R6 thường chứa số chữ số thập phân.', 'A free register. For EIP-4 tokens, R6 usually holds the number of decimals.'),
  R7: t('Register tự do (R4–R9) — hợp đồng tự quy ước ý nghĩa.', 'A free register (R4–R9) — contracts define their own meaning.'),
  R8: t('Register tự do (R4–R9) — hợp đồng tự quy ước ý nghĩa.', 'A free register (R4–R9) — contracts define their own meaning.'),
  R9: t('Register tự do cuối cùng.', 'The last free register.'),
})

function Box({ b }) {
  const spent = !!b.spentBy
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
          <Package className="size-4" /> Box
          {spent ? (
            <Badge>
              <LockOpen className="size-3" /> {t('đã tiêu', 'spent')}
            </Badge>
          ) : (
            <Badge tone="green">
              <Lock className="size-3" /> {t('chưa tiêu', 'unspent')}
            </Badge>
          )}
          {isFeeBox(b) && <Badge tone="ergo">{t('box phí', 'fee box')}</Badge>}
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
          <Hash value={b.boxId} full />
        </h1>
        <p className="mt-3 max-w-3xl text-stone-600 dark:text-stone-400">
          {t(<>Box là đơn vị trạng thái của Ergo: một “chiếc hộp” giữ ERG, token và dữ liệu, bị khoá bởi một script. Nó chỉ có thể bị tiêu <em>một lần</em>, trọn vẹn.</>, <>A box is Ergo’s unit of state: a “box” holding ERG, tokens and data, locked by a script. It can only be spent <em>once</em>, in full.</>)} <Learn to="/learn/box">{t('Đọc về box', 'Read about boxes')}</Learn>
        </p>
      </div>

      <Card className="px-5 py-2">
        <div className="border-b border-stone-100 py-3 text-xs font-bold tracking-wide text-stone-500 uppercase dark:border-stone-800">{t('Register bắt buộc (R0–R3)', 'Mandatory registers (R0–R3)')}</div>
        <Field name={t('R0 · Giá trị', 'R0 · Value')} value={<Erg nano={b.value} />}>
          {t(`Lượng ERG trong box, lưu bằng nanoERG (${num(b.value)}).`, `The amount of ERG in the box, stored in nanoERG (${num(b.value)}).`)}
        </Field>
        <Field
          name="R1 · Script"
          value={
            <span className="flex items-start gap-1">
              <span className="font-mono text-xs break-all">{b.ergoTree}</span>
              <CopyButton text={b.ergoTree} />
            </span>
          }
        >
          {t('ErgoTree khoá box. Tương ứng địa chỉ', 'The ErgoTree locking the box. It corresponds to the address')}{' '}
          {b.address ? (
            <Link to={`/address/${b.address}`} className="text-ergo-600 hover:underline dark:text-ergo-400">
              {b.address.slice(0, 16)}…
            </Link>
          ) : (
            '—'
          )}
          . <Learn to="/learn/ergotree">ErgoTree</Learn>
        </Field>
        <Field
          name="R2 · Token"
          value={
            b.assets?.length ? (
              <div className="flex flex-wrap gap-1">
                {b.assets.map((a) => (
                  <TokenChip key={a.tokenId} asset={a} />
                ))}
              </div>
            ) : (
              <span className="text-stone-400">{t('không có', 'none')}</span>
            )
          }
        >
          {t('Danh sách (tokenId, số lượng).', 'A list of (tokenId, amount).')} <Learn to="/learn/tokens">Token</Learn>
        </Field>
        <Field
          name={t('R3 · Nguồn gốc', 'R3 · Origin')}
          value={
            <span>
              {t('độ cao tạo', 'creation height')} {num(b.creationHeight)}, tx <Hash value={b.transactionId} to={`/tx/${b.transactionId}`} />, output #{b.index}
            </span>
          }
        >
          {t('Box id = blake2b256 của toàn bộ nội dung box, nên (txId, index) khiến mọi box là duy nhất.', 'Box id = blake2b256 of the box\'s full contents, and (txId, index) makes every box unique.')}
        </Field>
      </Card>

      <Section title={t('Register tuỳ biến (R4–R9)', 'Custom registers (R4–R9)')} right={<Learn to="/learn/box">Registers</Learn>}>
        {b.registers?.length ? (
          <Card className="px-5 py-2">
            {b.registers.map((r) => (
              <Field
                key={r.key}
                name={
                  <span>
                    {r.key} <span className="font-mono text-xs font-normal text-violet-600 dark:text-violet-400">{r.type}</span>
                  </span>
                }
                value={<span className="font-mono text-xs break-all">{r.value}</span>}
              >
                <span className="font-mono break-all">raw: {r.raw}</span>
                <br />
                {regHelp()[r.key]}
              </Field>
            ))}
          </Card>
        ) : (
          <p className="text-sm text-stone-500">{t('Box này không dùng register tuỳ biến nào.', 'This box uses no custom registers.')}</p>
        )}
      </Section>

      <Section title={t('Vòng đời', 'Lifecycle')}>
        <Card className="px-5 py-2">
          <Field name={t('Được tạo bởi', 'Created by')} value={<Hash value={b.transactionId} to={`/tx/${b.transactionId}`} full />} />
          <Field name={t('Bị tiêu bởi', 'Spent by')} value={spent ? <Hash value={b.spentBy} to={`/tx/${b.spentBy}`} full /> : <span className="text-emerald-600">{t('chưa — box vẫn là một UTXO', 'not yet — the box is still a UTXO')}</span>} />
        </Card>
      </Section>
    </>
  )
}

export default function BoxPage() {
  const { id } = useParams()
  const s = useApi(() => api.box(id), [id])
  useSeo({ path: `/box/${id}`, title: { vi: `Box ${id.slice(0, 12)}…`, en: `Box ${id.slice(0, 12)}…` }, noindex: true })
  return <Async state={s} notFound={t('Không tìm thấy box này.', 'Box not found.')}>{(b) => <Box b={b} />}</Async>
}
