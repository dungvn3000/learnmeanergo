import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Shapes } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { ago, num, tokenAmount } from '../../lib/format'
import { Async, Card, Field, Hash, Pager, Swatch } from '../../components/ui'
import { Learn, Section, Table, td } from './common'
import { t } from '../../lib/i18n'
import { useSeo } from '../../lib/seo'

function Holders({ tok }) {
  const [page, setPage] = useState(1)
  const s = useApi(() => api.tokenHolders(tok.id, page, 10), [tok.id, page])
  return (
    <Async state={s}>
      {(d) => (
        <>
          <Table head={['#', t('Địa chỉ', 'Address'), { label: t('Số lượng', 'Amount'), right: true }, { label: t('% cung', '% of supply'), right: true }]}>
            {d.items.map((h) => (
              <tr key={h.address}>
                <td className={`${td} text-stone-400 tabular-nums`}>{h.rank}</td>
                <td className={td}>
                  <Hash value={h.address} to={`/address/${h.address}`} head={10} tail={8} />
                </td>
                <td className={`${td} text-right tabular-nums`}>{tokenAmount(h.amount, tok.decimals)}</td>
                <td className={`${td} text-right tabular-nums text-stone-500`}>{((h.amount / tok.supply) * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </Table>
          <Pager page={page} setPage={setPage} hasNext={page * 10 < d.total} />
        </>
      )}
    </Async>
  )
}

function Token({ tok }) {
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
          <Shapes className="size-4" /> Token
        </div>
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-stone-900 dark:text-white">
          <Swatch id={tok.id} className="size-6 rounded-full" /> {tok.name || t('Token không tên', 'Unnamed token')}
        </h1>
        {tok.desc && <p className="mt-2 text-stone-600 dark:text-stone-400">{tok.desc}</p>}
      </div>

      <Card className="px-5 py-2">
        <Field name="Token id" value={<Hash value={tok.id} full />}>
          {t('Bằng đúng id của box input đầu tiên trong giao dịch phát hành — nên không thể có hai token trùng id.', 'Equal to the id of the first input box of the issuing transaction — so no two tokens can share an id.')}{' '}
          <Learn to="/learn/tokens">EIP-4</Learn>
        </Field>
        <Field name={t('Tổng cung', 'Total supply')} value={`${tokenAmount(tok.supply, tok.decimals)} (${num(tok.supply)} ${t('đơn vị gốc', 'base units')})`}>
          {t(`Blockchain chỉ lưu số nguyên; ${tok.decimals} chữ số thập phân (R6) là quy ước hiển thị.`, `The blockchain stores only integers; the ${tok.decimals} decimal places (R6) are a display convention.`)}
        </Field>
        <Field name={t('Phát hành tại', 'Issued at')} value={<Link to={`/block/${tok.issueHeight}`} className="font-mono text-ergo-600 hover:underline dark:text-ergo-400">block {num(tok.issueHeight)}</Link>} />
        <Field name={t('Giao dịch phát hành', 'Issuing transaction')} value={<Hash value={tok.issueTx} to={`/tx/${tok.issueTx}`} full />} />
        <Field name={t('Box phát hành', 'Issuing box')} value={<Hash value={tok.issueBox} to={`/box/${tok.issueBox}`} full />}>
          {t('Box đầu tiên chứa token; R4–R6 của nó giữ tên, mô tả và số thập phân.', 'The first box holding the token; its R4–R6 hold the name, description and decimals.')}
        </Field>
        {tok.holderCount != null && <Field name={t('Số người nắm giữ', 'Holders')} value={num(tok.holderCount)} />}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t('Người nắm giữ lớn nhất', 'Top holders')}>
          <Holders tok={tok} />
        </Section>
        {tok.transfers?.length > 0 && (
          <Section title={t('Chuyển khoản gần đây', 'Recent transfers')}>
            <Table head={[t('Giao dịch', 'Transaction'), t('Tới', 'To'), { label: t('Số lượng', 'Amount'), right: true }]}>
              {tok.transfers.map((x, i) => (
                <tr key={x.id + i}>
                  <td className={td}>
                    <Hash value={x.id} to={`/tx/${x.id}`} head={6} tail={4} copy={false} />
                    <div className="text-xs text-stone-500">{ago(x.timestamp)}</div>
                  </td>
                  <td className={td}>
                    <Hash value={x.to} to={`/address/${x.to}`} head={6} tail={4} copy={false} />
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{tokenAmount(x.amount, tok.decimals)}</td>
                </tr>
              ))}
            </Table>
          </Section>
        )}
      </div>
    </>
  )
}

export default function TokenPage() {
  const { id } = useParams()
  const s = useApi(() => api.token(id), [id])
  useSeo({ path: `/token/${id}`, title: { vi: `Token ${s.data?.name || id.slice(0, 12) + '…'}`, en: `Token ${s.data?.name || id.slice(0, 12) + '…'}` }, noindex: true })
  return <Async state={s} notFound={t('Không tìm thấy token này.', 'Token not found.')}>{(tok) => <Token tok={tok} />}</Async>
}
