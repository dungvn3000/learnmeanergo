import { Link } from 'react-router-dom'
import { ArrowLeft, Inbox, Pickaxe, Server, Send } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { ago, num, short } from '../lib/format'
import { Async, Callout, Card } from '../components/ui'

/** The last few blocks drawn as a chain, each pointing back to its parent. */
function LiveChain() {
  const state = useApi(() => api.latestBlocks(5), [], 30000)
  return (
    <div className="not-prose my-6">
      <Async state={state}>
        {(blocks) => {
          const list = [...blocks].reverse()
          return (
            <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
              {list.map((b, i) => (
                <div key={b.id} className="flex items-center gap-1">
                  {i > 0 && <ArrowLeft className="size-4 shrink-0 text-stone-400" />}
                  <Link
                    to={`/block/${b.height}`}
                    className="block w-40 shrink-0 rounded-xl border border-stone-200 bg-white p-3 text-xs transition hover:border-ergo-400 dark:border-stone-700 dark:bg-stone-900"
                  >
                    <div className="text-base font-bold tabular-nums text-stone-900 dark:text-white">#{num(b.height)}</div>
                    <div className="mt-1 font-mono text-stone-500" title={b.id}>id {short(b.id, 5, 4)}</div>
                    <div className="font-mono text-stone-400" title={b.parentId}>cha {short(b.parentId, 5, 4)}</div>
                    <div className="mt-2 text-stone-600 dark:text-stone-300">{b.txCount} giao dịch</div>
                    <div className="text-stone-400">{ago(b.timestamp)}</div>
                  </Link>
                </div>
              ))}
            </div>
          )
        }}
      </Async>
      <p className="mt-1 text-xs text-stone-500">
        5 block mới nhất trên mainnet (tự cập nhật). Để ý: <span className="font-mono">cha</span> của mỗi block chính là{' '}
        <span className="font-mono">id</span> của block đứng trước nó.
      </p>
    </div>
  )
}

const STEPS = [
  { icon: Send, title: '1. Bạn tạo giao dịch', text: 'Ví của bạn chọn vài box để tiêu, ký bằng khoá bí mật và gửi đến một node.' },
  { icon: Inbox, title: '2. Vào mempool', text: 'Node kiểm tra giao dịch hợp lệ, rồi lan truyền nó tới các node khác. Giao dịch chờ trong “phòng chờ” gọi là mempool.' },
  { icon: Pickaxe, title: '3. Thợ đào gom vào block', text: 'Thợ đào chọn các giao dịch từ mempool, ghép thành block và thi nhau giải bài toán Proof-of-Work.' },
  { icon: Server, title: '4. Mọi node cập nhật', text: 'Block thắng cuộc được phát đi. Mỗi node tự kiểm tra lại toàn bộ rồi nối nó vào chuỗi của mình.' },
]

export default function HowItWorks() {
  const ns = useApi(() => api.networkState(), [], 30000)
  return (
    <>
      <p>
        Ergo là một mạng lưới gồm rất nhiều máy tính trên khắp thế giới, cùng giữ một bản sao của một cuốn sổ cái. Không có máy
        chủ trung tâm. Vậy làm sao chúng đồng ý với nhau về việc ai có bao nhiêu tiền? Bài này trả lời câu hỏi đó.
      </p>

      <h2 id="node">Node: những người giữ sổ</h2>
      <p>
        Một <strong>node</strong> là máy tính chạy phần mềm Ergo. Nó tải về toàn bộ lịch sử blockchain, kiểm tra từng block, từng
        giao dịch theo đúng luật, và nói chuyện với các node khác (gọi là <em>peer</em>).
      </p>
      <p>
        Điều quan trọng: mỗi node <strong>tự kiểm tra mọi thứ</strong>. Nếu ai đó gửi một block gian lận — ví dụ tự in thêm ERG —
        mọi node trung thực sẽ từ chối nó. Không cần “tin” ai cả.
      </p>
      {ns.data && (
        <Callout type="note">
          Node đang cung cấp dữ liệu cho trang này là <code>{ns.data.nodeName}</code>, hiện kết nối với {ns.data.peers} peer.
        </Callout>
      )}

      <h2 id="hanh-trinh-giao-dich">Hành trình của một giao dịch</h2>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s) => (
          <Card key={s.title} className="p-4">
            <s.icon className="size-5 text-ergo-500" />
            <div className="mt-2 font-semibold text-stone-900 dark:text-white">{s.title}</div>
            <div className="mt-1 text-sm text-stone-500">{s.text}</div>
          </Card>
        ))}
      </div>
      {ns.data && (
        <p>
          Ngay lúc này có <strong>{ns.data.mempoolCount}</strong> giao dịch đang chờ trong mempool của node, đợi được đưa vào block
          tiếp theo.
        </p>
      )}

      <h2 id="block-va-chuoi">Block và chuỗi</h2>
      <p>
        Giao dịch không được ghi từng cái một, mà được gom thành <strong>block</strong>. Trên Ergo, trung bình cứ khoảng{' '}
        <strong>2 phút</strong> lại có một block mới. Mỗi block có một <strong>dấu vân tay</strong>: một đoạn mã ngắn (gọi là mã băm,
        hay hash) sẽ đổi hoàn toàn nếu chỉ một ký tự trong block thay đổi. Dấu vân tay đó là <em>id</em> của block, và mỗi block còn lưu
        id của block trước nó — gọi là <em>parent id</em>. Nhờ vậy các block nối với nhau thành một <strong>chuỗi</strong>:
      </p>
      <LiveChain />
      <p>
        Nếu ai đó muốn sửa một giao dịch cũ, id của block chứa nó sẽ thay đổi, kéo theo parent id của block sau cũng sai, rồi block
        sau nữa… Kẻ gian sẽ phải đào lại toàn bộ các block từ đó đến hiện tại, nhanh hơn cả phần còn lại của mạng cộng lại. Trên
        thực tế, điều đó gần như không thể.
      </p>

      <h2 id="tho-dao">Thợ đào và Proof-of-Work</h2>
      <p>
        Ai được quyền viết block tiếp theo? Câu trả lời là cuộc thi <strong>Proof-of-Work</strong> — một trò xổ số mà ai đoán nhanh
        hơn thì thắng. Thợ đào liên tục đổi một con số phụ trong block của mình (gọi là <em>nonce</em>) rồi tính lại dấu vân tay của
        block, hàng tỉ lần, cho đến khi dấu vân tay đủ nhỏ để được tính là thắng (nhỏ hơn một ngưỡng gọi là <em>target</em>). Thợ đào
        đầu tiên làm được sẽ phát block đi và nhận phần thưởng bằng ERG mới.
      </p>
      <p>
        Việc tìm lời giải rất tốn công, nhưng kiểm tra lời giải thì cực nhanh. Đó là lý do một chiếc laptop chạy node có thể xác minh
        công sức của cả mạng lưới đào. Chi tiết xem ở <Link to="/learn/mining-basics">Đào Ergo</Link>.
      </p>

      <h2 id="xac-nhan">Xác nhận (confirmations)</h2>
      <p>
        Khi giao dịch của bạn vào một block, nó có <strong>1 xác nhận</strong>. Mỗi block mới đào thêm phía sau lại cộng thêm một.
        Càng nhiều xác nhận, giao dịch càng khó bị đảo ngược. Với thanh toán thường ngày, vài xác nhận (vài phút) là đủ; với số tiền
        lớn, sàn giao dịch thường chờ lâu hơn.
      </p>

      <Callout type="tip" title="Thử xem">
        Mở một <Link to="/explorer">block mới nhất</Link> trong explorer, rồi quay lại sau vài phút — bạn sẽ thấy số xác nhận của nó
        tăng lên.
      </Callout>

      <h2 id="tiep-theo">Tiếp theo</h2>
      <p>
        Bạn đã biết giao dịch đi đâu. Nhưng bên trong giao dịch có gì? Trên Ergo, câu trả lời là những chiếc hộp —{' '}
        <Link to="/learn/boxes">box</Link>.
      </p>
    </>
  )
}
