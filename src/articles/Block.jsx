import { Link } from 'react-router-dom'
import { Blocks, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { ago, bytes, compact, erg, num, utc } from '../lib/format'
import { Async, Badge, Callout, Card, Erg, Field, Hash } from '../components/ui'

/** Three chained headers: each one stores the id (hash) of the one before it. */
function ChainDiagram({ block }) {
  const cells = [
    { h: block.height - 1, id: block.parentId, parent: '…' },
    { h: block.height, id: block.id, parent: block.parentId, current: true },
    { h: block.height + 1, id: '?', parent: block.id, future: true },
  ]
  return (
    <div className="not-prose my-6 grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
      {cells.map((c, i) => (
        <div key={c.h} className="contents">
          {i > 0 && <div className="hidden items-center justify-center text-2xl text-ergo-500 sm:flex">←</div>}
          <div
            className={`rounded-xl border p-3 text-xs ${
              c.current
                ? 'border-ergo-400 bg-ergo-50 dark:border-ergo-700 dark:bg-ergo-950/40'
                : c.future
                  ? 'border-dashed border-stone-300 text-stone-400 dark:border-stone-700'
                  : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'
            }`}
          >
            <div className="font-semibold text-stone-900 dark:text-white">Block {num(c.h)}</div>
            <div className="mt-2 text-stone-500">parentId</div>
            <div className="truncate font-mono">{c.parent === '…' ? '…' : `${c.parent.slice(0, 12)}…`}</div>
            <div className="mt-2 text-stone-500">id</div>
            <div className="truncate font-mono">{c.id === '?' ? 'chưa được đào' : `${c.id.slice(0, 12)}…`}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The four sections a full Ergo block is made of. */
function SectionsDiagram() {
  const parts = [
    { name: 'Header', desc: '~250 byte. Chứa hash của 3 phần còn lại + lời giải PoW.', cls: 'border-ergo-400 bg-ergo-50 dark:border-ergo-700 dark:bg-ergo-950/40' },
    { name: 'Block transactions', desc: 'Danh sách giao dịch. Gốc Merkle nằm trong transactionsRoot.', cls: 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900' },
    { name: 'AD proofs', desc: 'Bằng chứng thay đổi UTXO set, cho node nhẹ. Hash nằm trong adProofsRoot.', cls: 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900' },
    { name: 'Extension', desc: 'Cặp key–value: tham số mạng, interlinks (NiPoPoW). Gốc Merkle trong extensionHash.', cls: 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900' },
  ]
  return (
    <div className="not-prose my-6 grid gap-2 sm:grid-cols-4">
      {parts.map((p) => (
        <div key={p.name} className={`rounded-xl border p-3 ${p.cls}`}>
          <div className="text-sm font-semibold text-stone-900 dark:text-white">{p.name}</div>
          <div className="mt-1 text-xs leading-5 text-stone-500">{p.desc}</div>
        </div>
      ))}
    </div>
  )
}

function LiveHeader({ block }) {
  const votes = String(block.votes ?? '').split(',')
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Blocks className="size-5 text-ergo-500" />
          <Link to={`/block/${block.height}`} className="hover:text-ergo-600">
            Block {num(block.height)}
          </Link>
        </div>
        <Badge tone="green">
          <RefreshCw className="size-3" /> dữ liệu trực tiếp · {ago(block.timestamp)}
        </Badge>
      </div>

      <Field name="version" value={block.version}>
        Phiên bản header. Nó tăng mỗi lần giao thức được nâng cấp bằng hard fork hoặc soft fork (ví dụ Autolykos v2 bắt đầu từ version 2).
      </Field>
      <Field name="parentId" value={<Hash value={block.parentId} to={`/block/${block.height - 1}`} full />}>
        Id của block ngay trước đó. Chính trường này nối các block thành một <em>chuỗi</em>: muốn sửa một block cũ, bạn phải đào lại mọi block phía sau.
      </Field>
      <Field name="height" value={num(block.height)}>
        Vị trí của block trong chuỗi, đếm từ block đầu tiên (height 1); mỗi block sau lớn hơn block trước đúng 1.
      </Field>
      <Field name="timestamp" value={`${block.timestamp} (${utc(block.timestamp)})`} mono>
        Thời điểm thợ đào tạo header, tính bằng <strong>mili giây</strong> Unix (Bitcoin dùng giây).
      </Field>
      <Field name="nBits" value={<code className="font-mono">{block.nBits}</code>}>
        Độ khó được mã hoá “compact” (giống Bitcoin): 1 byte số mũ + 3 byte phần định trị. Xem <Link to="/learn/difficulty">Độ khó &amp; nBits</Link>.
      </Field>
      <Field name="difficulty" value={`${num(block.difficulty)} (≈ ${compact(block.difficulty)})`}>
        Giá trị giải mã từ nBits. Chia cho 120 giây ta ước lượng được hashrate: ≈ {(block.difficulty / 120 / 1e12).toFixed(2)} TH/s.
      </Field>
      <Field name="stateRoot" value={<Hash value={block.stateRoot} full copy={false} />}>
        Dấu vân tay của toàn bộ box chưa tiêu sau block này. Gồm 33 byte: 32 byte gốc của cây <strong>AVL+</strong> chứa cả UTXO set, cộng 1 byte chiều cao cây. Có dấu vân tay này và một bằng chứng nhỏ, node nhẹ kiểm tra được một box có tồn tại mà không cần lưu cả tập.
      </Field>
      <Field name="transactionsRoot" value={<Hash value={block.txRoot} full copy={false} />}>
        Gốc Merkle của các giao dịch trong block. Đổi một byte bất kỳ trong một giao dịch, gốc này đổi theo → header (và id) đổi theo.
      </Field>
      <Field name="adProofsRoot" value={<Hash value={block.adRoot} full copy={false} />}>
        Bằng chứng rằng UTXO set đã thay đổi đúng trong block này. Đây là hash của phần <em>AD proofs</em> (authenticated dictionary proofs), cho thấy từng bước stateRoot cũ biến thành stateRoot mới.
      </Field>
      <Field name="extensionHash" value={<Hash value={block.extHash} full copy={false} />}>
        Gốc Merkle của phần <em>extension</em>: tham số mạng (khi miner bỏ phiếu thay đổi) và interlinks dùng cho NiPoPoW.
      </Field>
      <Field name="votes" value={<code className="font-mono">{block.votes}</code>}>
        3 byte phiếu bầu của thợ đào cho việc thay đổi tham số (kích thước block, phí lưu trữ…). {votes.every((v) => v.trim() === '0') ? 'Toàn 0 nghĩa là block này không bỏ phiếu gì.' : 'Block này đang bỏ phiếu cho một thay đổi tham số.'}
      </Field>
      <Field name="pow.pk" value={<Hash value={block.pow?.pk} full />}>
        Khoá công khai của thợ đào. Phần thưởng block bị khoá cho đúng khoá này — ai tìm ra lời giải cũng không thể “đánh cắp” nó.
      </Field>
      <Field name="pow.w" value={<Hash value={block.pow?.w} full copy={false} />}>
        Trong Autolykos v1 đây là khoá tạm thời. Từ v2 nó không còn dùng: giá trị cố định chính là điểm sinh <code>G</code> của secp256k1 (<code>0279be66…</code>).
      </Field>
      <Field name="pow.n" value={<code className="font-mono">{block.pow?.n}</code>}>
        <strong>Nonce</strong> 8 byte — thứ thợ đào thay đổi hàng tỉ lần mỗi giây cho tới khi hash đủ nhỏ. Xem <Link to="/learn/autolykos">Autolykos v2</Link>.
      </Field>
      <Field name="pow.d" value={<code className="font-mono">{block.pow?.d}</code>}>
        Cũng là di sản của v1; trong v2 luôn bằng 0.
      </Field>
      <Field name="id" value={<Hash value={block.id} full />}>
        Không phải một trường được lưu trong header: đây là <code>blake2b256(header)</code>, dùng để nhắc tới block này (và là parentId của block kế tiếp).
      </Field>

      <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-4 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500">Giao dịch</div>
          <div className="font-semibold">{num(block.txCount)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500">Kích thước</div>
          <div className="font-semibold">{bytes(block.size)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-500">Thợ đào nhận</div>
          <div className="font-semibold">
            <Erg nano={block.reward} />
          </div>
        </div>
        <div>
          <div className="text-xs text-stone-500">Phí giao dịch</div>
          <div className="font-semibold">
            <Erg nano={block.fees} />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Block() {
  const state = useApi(() => api.latestBlocks(1).then((b) => b?.[0] ?? null), [], 30000)
  return (
    <>
      <p>
        Một <strong>block</strong> là một gói giao dịch được thợ đào đóng dấu bằng Proof-of-Work. Khoảng mỗi <strong>2 phút</strong>, một block mới được thêm vào
        cuối chuỗi, và mọi node trên thế giới cập nhật cùng một bản sổ cái.
      </p>
      <p>
        Bài này mổ xẻ phần quan trọng nhất của block — <strong>header</strong> — trên block mới nhất của mạng Ergo, lấy trực tiếp từ explorer. Trang tự làm mới
        mỗi 30 giây, nên có thể bạn đang nhìn một block vừa được đào xong.
      </p>

      <h2 id="cau-truc">Một block gồm những gì?</h2>
      <p>
        Khác với Bitcoin (header + danh sách giao dịch), block Ergo được chia thành <strong>bốn phần</strong> tách rời. Header chỉ chứa hash của ba phần còn lại,
        nên một node có thể tải header trước và chỉ lấy những phần nó thật sự cần.
      </p>
      <SectionsDiagram />
      <Callout type="tip" title="Vì sao tách ra?">
        Node nhẹ (light node) hoặc điện thoại không cần giữ toàn bộ trạng thái hay lịch sử: với header, giao dịch của block mới và AD proofs, nó kiểm tra được rằng trạng thái đã được cập nhật đúng.
      </Callout>

      <h2 id="chuoi-block">Chuỗi các block</h2>
      <p>
        Mỗi header chứa <code>parentId</code> — id của block trước. Vì id là hash của header, sửa bất kỳ block cũ nào sẽ làm đổi id của nó, phá vỡ liên kết với mọi
        block phía sau.
      </p>
      <Async state={state}>{(b) => <ChainDiagram block={b} />}</Async>

      <h2 id="header">Header, từng trường một</h2>
      <p>Dưới đây là header của block mới nhất. Mỗi dòng gồm tên trường, giá trị thật, và ý nghĩa của nó.</p>
      <Async state={state}>{(b) => <LiveHeader block={b} />}</Async>

      <h2 id="block-id">Block id được tính thế nào?</h2>
      <p>
        Tất cả các trường trên được tuần tự hoá thành bytes theo một thứ tự cố định, rồi đưa qua hàm băm <strong>Blake2b-256</strong>. Kết quả 32 byte chính là
        block id. Bạn có thể thử hàm băm này tại <Link to="/tools/blake2b">công cụ Blake2b</Link>.
      </p>
      <pre>
        <code>{`block id = blake2b256( serialize(header) )`}</code>
      </pre>
      <p>
        Lưu ý: điều kiện Proof-of-Work <em>không</em> phải “block id nhỏ hơn target” như Bitcoin. Autolykos tính một hash riêng từ header (không gồm lời giải) và
        nonce, rồi so với target. Chi tiết ở bài <Link to="/learn/autolykos">Autolykos v2</Link>.
      </p>

      <h2 id="phan-thuong">Phần thưởng block</h2>
      <p>
        Giao dịch đầu tiên của mỗi block là giao dịch thưởng (explorer gọi là “Block reward”). Khác coinbase của Bitcoin, nó không tạo ERG mới. Thay vào đó, nó tiêu box của
        hợp đồng phát hành (emission contract) và chuyển một phần ERG có sẵn trong đó sang box thưởng của thợ đào — xem{' '}
        <Link to="/learn/transaction#coinbase">Không có “coinbase” như Bitcoin</Link>. Hiện nay, EIP-27 còn khoá một phần phát hành của mỗi block vào hợp đồng tái phát
        hành, nên thợ đào nhận ít hơn con số “phát hành” danh nghĩa.
      </p>
      <Async state={state}>
        {(b) => (
          <table>
            <tbody>
              <tr>
                <td>ERG được phát hành (rút từ emission contract)</td>
                <td className="tabular-nums">{erg(b.emission)} ERG</td>
              </tr>
              <tr>
                <td>Bị khoá vào hợp đồng tái phát hành (EIP-27)</td>
                <td className="tabular-nums">{erg(b.reemitted)} ERG</td>
              </tr>
              <tr>
                <td>Thợ đào nhận từ phát hành</td>
                <td className="tabular-nums">{erg(b.reward)} ERG</td>
              </tr>
              <tr>
                <td>Cộng phí giao dịch</td>
                <td className="tabular-nums">{erg(b.fees)} ERG</td>
              </tr>
            </tbody>
          </table>
        )}
      </Async>
      <p>
        Toàn bộ lịch trình được giải thích trong <Link to="/learn/emission">Lịch phát hành &amp; EIP-27</Link>; bạn có thể xem giao dịch coinbase và các giao dịch khác
        của block bằng cách mở trang <Link to="/explorer">explorer</Link>.
      </p>

      <Callout type="note" title="Xác nhận (confirmations)">
        Một giao dịch nằm trong block ở height <code>h</code> có số xác nhận = <code>tip − h + 1</code>. Mỗi block mới đè lên làm việc viết lại lịch sử khó hơn theo
        cấp số — đó là lý do sàn giao dịch chờ vài chục xác nhận trước khi ghi nhận tiền nạp.
      </Callout>
    </>
  )
}
