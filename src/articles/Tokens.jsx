import { Link } from 'react-router-dom'
import { ArrowDown, Check, Shapes } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num, short, tokenAmount } from '../lib/format'
import { Async, Badge, Callout, Card, Field, Hash, Swatch } from '../components/ui'

const SIGUSD = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04'

/** Load SigUSD plus its issuing transaction, so we can show id == first input. */
async function loadSigUsd() {
  const token = await api.token(SIGUSD)
  if (!token) return null
  const tx = token.issueTx ? await api.transaction(token.issueTx) : null
  return { token, tx }
}

function IssueProof({ token, tx }) {
  const first = tx?.inputs?.[0]?.boxId
  const issueBox = tx?.outputs?.find((o) => o.boxId === token.issueBox) ?? tx?.outputs?.find((o) => o.assets?.some((a) => a.tokenId === token.id))
  const match = first === token.id
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Shapes className="size-5 text-ergo-500" />
          <Link to={`/token/${token.id}`} className="hover:text-ergo-600">
            {token.name}
          </Link>
        </div>
        <Badge tone="ergo">phát hành ở block {num(token.issueHeight)}</Badge>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
          <div className="text-xs text-stone-500">Input đầu tiên của giao dịch phát hành</div>
          <Hash value={first} to={`/box/${first}`} full />
        </div>
        <div className="flex justify-center text-ergo-500">
          <ArrowDown className="size-5" />
        </div>
        <div className="rounded-xl border border-ergo-300 bg-ergo-50 p-3 dark:border-ergo-800 dark:bg-ergo-950/40">
          <div className="text-xs text-stone-500">Token id</div>
          <Hash value={token.id} full />
          <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${match ? 'text-emerald-600' : 'text-red-600'}`}>
            {match && <Check className="size-3.5" />}
            {match ? 'Trùng khớp từng byte.' : 'Không khớp (?)'}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Field name="Giao dịch phát hành" value={<Hash value={token.issueTx} to={`/tx/${token.issueTx}`} />} />
        <Field name="Tổng cung" value={`${tokenAmount(token.supply, token.decimals)} (thô: ${num(token.supply)})`}>
          Blockchain chỉ lưu số nguyên. Con số hiển thị có được là nhờ chia cho 10^{token.decimals}.
        </Field>
        {issueBox?.registers?.map((r) => (
          <Field key={r.key} name={`${r.key} · ${r.type}`} value={<code className="font-mono text-xs">{r.value}</code>}>
            {r.key === 'R4' && 'Tên token (chuỗi UTF-8).'}
            {r.key === 'R5' && 'Mô tả.'}
            {r.key === 'R6' && 'Số chữ số thập phân — cũng được lưu dưới dạng chuỗi.'}
          </Field>
        ))}
        {token.holderCount != null && <Field name="Số địa chỉ nắm giữ" value={num(token.holderCount)} />}
      </div>
    </Card>
  )
}

function TokenTable({ tokens }) {
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs text-stone-500 uppercase dark:bg-stone-900">
          <tr>
            <th className="px-3 py-2">Token</th>
            <th className="px-3 py-2">Id</th>
            <th className="px-3 py-2 text-right">Decimals</th>
            <th className="px-3 py-2 text-right">Block phát hành</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.id} className="border-t border-stone-100 dark:border-stone-800">
              <td className="px-3 py-2">
                <Link to={`/token/${t.id}`} className="flex items-center gap-2 font-medium hover:text-ergo-600">
                  <Swatch id={t.id} className="size-2.5 rounded-full" />
                  {t.name || short(t.id, 6, 4)}
                </Link>
                {t.desc && <div className="max-w-xs truncate text-xs text-stone-500">{t.desc}</div>}
              </td>
              <td className="px-3 py-2 font-mono text-xs">{short(t.id, 8, 6)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{t.decimals}</td>
              <td className="px-3 py-2 text-right tabular-nums">{t.issueHeight ? num(t.issueHeight) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Tokens() {
  const sig = useApi(loadSigUsd, [])
  const list = useApi(() => api.tokens(), [])
  return (
    <>
      <p>
        Trên Ethereum, một token là một hợp đồng thông minh giữ bảng số dư. Trên Ergo thì đơn giản hơn nhiều: token là <strong>công dân hạng nhất</strong> của giao thức — chính node hiểu chúng, không cần hợp đồng đứng giữa. Mỗi box có register <code>R2</code> chứa danh sách <code>(token id, số lượng)</code>, và node trực tiếp kiểm tra rằng token không bị tạo ra từ hư
        không. Không cần hợp đồng, không có hàm <code>transfer()</code> có thể bị lỗi.
      </p>

      <h2 id="phat-hanh">Phát hành một token</h2>
      <p>Quy tắc duy nhất của giao thức:</p>
      <Callout type="tip" title="Quy tắc phát hành">
        Một giao dịch được phép tạo ra <strong>một</strong> token mới, và token id <strong>phải bằng boxId của input đầu tiên</strong> của giao dịch đó.
      </Callout>
      <p>
        Vì mỗi box chỉ tiêu được một lần, id đó không bao giờ lặp lại — token id là duy nhất mà không cần ai cấp phát. Số lượng phát hành là tuỳ ý (kể cả 1 — đó là
        một NFT), và sau khi phát hành không thể in thêm.
      </p>
      <p>Kiểm chứng trên SigUSD — stablecoin của giao thức SigmaUSD:</p>
      <Async state={sig} notFound="Không tải được SigUSD.">
        {({ token, tx }) => <IssueProof token={token} tx={tx} />}
      </Async>

      <h2 id="eip-4">Metadata: chuẩn EIP-4</h2>
      <p>
        Giao thức không biết token tên gì — nó chỉ thấy 32 byte id. Tên, mô tả và số thập phân là quy ước của <strong>EIP-4</strong>: chúng được ghi vào registers
        của box đầu tiên chứa token (output của giao dịch phát hành), dưới dạng chuỗi UTF-8 kiểu <code>Coll[Byte]</code>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Register</th>
            <th>Ý nghĩa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>R4</code>
            </td>
            <td>Tên, ví dụ “SigUSD”</td>
          </tr>
          <tr>
            <td>
              <code>R5</code>
            </td>
            <td>Mô tả</td>
          </tr>
          <tr>
            <td>
              <code>R6</code>
            </td>
            <td>Số chữ số thập phân, ví dụ “2”</td>
          </tr>
          <tr>
            <td>
              <code>R7</code>–<code>R9</code>
            </td>
            <td>Mở rộng cho NFT: loại tài sản, hash nội dung, đường dẫn (URL)</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn" title="Tên không phải là danh tính">
        Ai cũng có thể phát hành một token tên “SigUSD”. Ví và explorer phải nhận diện token bằng <strong>id</strong>, không bằng tên. Trong chính giao dịch phát
        hành SigUSD ở trên cũng có một token khác tên “SigUSD” với id khác — thứ duy nhất đáng tin là id.
      </Callout>

      <h2 id="chuyen-va-dot">Chuyển và đốt token</h2>
      <p>Với mỗi token id, node kiểm tra: tổng lượng ở outputs ≤ tổng lượng ở inputs (trừ token vừa phát hành).</p>
      <ul>
        <li>
          <strong>Chuyển:</strong> tiêu box chứa token, tạo box mới khoá cho người nhận với cùng token. Token luôn phải nằm trong một box, nên box đó cũng phải có
          ít ERG tối thiểu.
        </li>
        <li>
          <strong>Đốt (burn):</strong> đơn giản là không đưa token vào output nào. Phần “biến mất” bị huỷ vĩnh viễn — không cần địa chỉ đốt.
        </li>
      </ul>
      <p>
        Một box có thể chứa nhiều loại token (tối đa 255 loại), và tổng kích thước box không được vượt 4 KB. Xem chi tiết về registers ở bài <Link to="/learn/box">Box &amp;
        registers</Link>.
      </p>

      <h2 id="token-noi-bat">Một số token trên mainnet</h2>
      <p>Danh sách do explorer.erg.vn theo dõi, lấy trực tiếp từ API:</p>
      <Async state={list} notFound="Không có dữ liệu token.">
        {(tokens) => <TokenTable tokens={tokens} />}
      </Async>

      <h2 id="nft-va-hop-dong">NFT như “chứng minh thư” cho hợp đồng</h2>
      <p>
        Một token có số lượng 1 là NFT. Ngoài tranh ảnh, NFT còn đóng vai trò quan trọng trong DeFi trên Ergo: một hợp đồng có trạng thái (oracle pool, ngân hàng
        SigmaUSD, pool DEX) giữ một NFT duy nhất, và mỗi lần trạng thái đổi, NFT được chuyển sang box mới. Muốn tìm “trạng thái hiện tại” của hợp đồng, bạn chỉ cần
        tìm box chưa tiêu đang giữ NFT đó.
      </p>
    </>
  )
}
