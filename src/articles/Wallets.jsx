import { Link } from 'react-router-dom'
import { ArrowDown, CheckCircle2, FileKey2, KeyRound, ListOrdered, MapPin, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { p2pkAddress } from '../lib/ergo'
import { Async, Callout, Card, Hash } from '../components/ui'

const CHAIN = [
  { icon: ListOrdered, title: 'Seed phrase', text: 'Danh sách từ tiếng Anh, ví dụ “olive tiger …”. Bạn chép ra giấy.', tone: 'text-red-600 dark:text-red-400', secret: true },
  { icon: FileKey2, title: 'Khoá bí mật (private key)', text: 'Một con số khổng lồ (dài 256 bit) tính ra từ seed phrase. Chính nó ký các giao dịch của bạn.', tone: 'text-red-600 dark:text-red-400', secret: true },
  { icon: KeyRound, title: 'Khoá công khai (public key)', text: 'Tính ra từ khoá bí mật bằng một phép toán một chiều (cùng phương pháp đường cong elliptic mà Bitcoin dùng). Không ai tính ngược lại được khoá bí mật.', tone: 'text-emerald-600 dark:text-emerald-400' },
  { icon: MapPin, title: 'Địa chỉ', text: 'Khoá công khai được gắn thêm một nhãn nhỏ và một mã kiểm tra lỗi gõ, rồi viết ra thành chữ và số cho dễ chép.', tone: 'text-emerald-600 dark:text-emerald-400' },
]

function KeyChain() {
  return (
    <div className="not-prose my-6 grid gap-1">
      {CHAIN.map((c, i) => (
        <div key={c.title}>
          {i > 0 && <ArrowDown className="mx-auto my-1 size-4 text-stone-400" />}
          <Card className="flex items-start gap-3 p-4">
            <c.icon className={`mt-0.5 size-5 shrink-0 ${c.tone}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-stone-900 dark:text-white">
                {c.title}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.secret ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                  {c.secret ? 'bí mật — không bao giờ chia sẻ' : 'công khai — chia sẻ thoải mái'}
                </span>
              </div>
              <div className="mt-1 text-sm text-stone-500">{c.text}</div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

/** Rebuild the latest block's miner address from its public key, and check it matches. */
function LiveAddressDemo() {
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) => {
        const b = blocks[0]
        if (!b?.pow?.pk) return null
        let built = ''
        try {
          built = p2pkAddress(b.pow.pk)
        } catch {
          return null
        }
        const ok = built === b.minerAddress
        return (
          <Card className="not-prose my-6 space-y-3 p-5 text-sm">
            <div>
              <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Public key của thợ đào block <Link to={`/block/${b.height}`} className="text-ergo-600">#{b.height}</Link>
              </div>
              <Hash value={b.pow.pk} full />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Địa chỉ tính ngay trong trình duyệt của bạn</div>
              <Hash value={built} full to={`/address/${built}`} />
            </div>
            <div className={`flex items-center gap-2 font-medium ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
              {ok ? `Khớp với địa chỉ nhận thưởng mà explorer ghi nhận${b.miner ? ` (${b.miner})` : ''}.` : 'Thợ đào này nhận thưởng ở một địa chỉ khác.'}
            </div>
          </Card>
        )
      }}
    </Async>
  )
}

export default function Wallets() {
  return (
    <>
      <p>
        Một ví Ergo không thực sự “chứa” ERG. ERG của bạn nằm trong các <Link to="/learn/boxes">box</Link> trên blockchain. Thứ ví
        giữ là <strong>chìa khoá</strong> để mở những box đó.
      </p>

      <h2 id="tu-seed-den-dia-chi">Từ seed phrase đến địa chỉ</h2>
      <p>Khi bạn tạo ví mới, mọi thứ được sinh ra theo một chuỗi một chiều:</p>
      <KeyChain />
      <p>
        Mỗi mũi tên là một phép tính <strong>một chiều</strong>: đi xuôi thì dễ, đi ngược thì không thể. Ai biết địa chỉ của bạn cũng
        không thể suy ra khoá bí mật. Nhưng ai có seed phrase của bạn thì có <em>tất cả</em>.
      </p>

      <Callout type="warn" title="Quy tắc vàng">
        Seed phrase chính là tiền của bạn. Không chụp ảnh, không lưu lên cloud, không gửi cho ai — kể cả người tự xưng là “hỗ trợ kỹ
        thuật”. Mất seed phrase mà ví hỏng nghĩa là mất tiền vĩnh viễn; không có ngân hàng nào khôi phục giúp bạn.
      </Callout>

      <h2 id="dia-chi-bat-dau-bang-9">Vì sao địa chỉ Ergo bắt đầu bằng số 9?</h2>
      <p>
        Địa chỉ ví thông thường trên Ergo mainnet trông như thế này: <code>9fQYeMEX…KSACVmgx</code>. Chúng gần như luôn bắt đầu bằng
        chữ số <strong>9</strong>.
      </p>
      <p>
        Lý do như sau. Địa chỉ thực chất là một dãy byte ngắn được viết ra thành chữ và số (cách viết này gọi là Base58). Byte đầu
        tiên là một nhãn (gọi là <em>prefix</em>) cho biết địa chỉ thuộc <em>mạng</em> nào (mainnet hay testnet) và là <em>loại địa
        chỉ</em> gì. Loại phổ biến nhất — ví thông thường, gọi là <strong>P2PK</strong> (Pay-to-Public-Key) — trên mainnet có prefix{' '}
        <code>0x01</code>. Khi byte đó cùng khoá công khai phía sau được viết ra theo Base58, ký tự đầu tiên luôn là “9”.
      </p>
      <p>
        Cuối địa chỉ còn có 4 byte <strong>checksum</strong>. Nếu bạn gõ sai một ký tự, checksum sẽ không khớp và ví sẽ từ chối gửi
        — bảo vệ bạn khỏi lỗi đánh máy.
      </p>

      <h3>Tự kiểm chứng</h3>
      <p>
        Mỗi block Ergo chứa khoá công khai của thợ đào đã tìm ra nó. Dưới đây, trang web lấy khoá đó từ block mới nhất và tự tính ra
        địa chỉ — bạn có thể so sánh với địa chỉ mà thợ đào dùng để nhận thưởng:
      </p>
      <LiveAddressDemo />
      <p>
        Muốn mổ xẻ một địa chỉ bất kỳ từng byte một? Dùng công cụ <Link to="/tools/address-decoder">Giải mã địa chỉ</Link> hoặc{' '}
        <Link to="/tools/pubkey-to-address">Public key → Địa chỉ</Link>.
      </p>

      <h2 id="nhieu-dia-chi">Một ví, nhiều địa chỉ</h2>
      <p>
        Từ một seed phrase, ví có thể sinh ra rất nhiều cặp khoá (theo một chuẩn gọi là HD — “phân cấp tất định” — cũng là chuẩn hầu hết ví Bitcoin dùng), mỗi cặp một địa chỉ. Bạn có thể dùng địa
        chỉ khác nhau cho những mục đích khác nhau; số dư trong ví là tổng của tất cả chúng. Tất cả đều khôi phục được chỉ từ một seed
        phrase duy nhất.
      </p>

      <h2 id="dia-chi-hop-dong">Không phải địa chỉ nào cũng là một người</h2>
      <p>
        Vì ổ khoá của box trên Ergo có thể là một hợp đồng thông minh, nên cũng có những địa chỉ đại diện cho <strong>hợp đồng</strong>{' '}
        chứ không phải một khoá. Chúng thường rất dài (loại P2S chứa toàn bộ script bên trong) và không ai “sở hữu” chúng — chỉ ai
        thoả mãn luật của hợp đồng mới tiêu được. Chi tiết xem bài <Link to="/learn/address">Địa chỉ</Link>.
      </p>

      <h2 id="chon-vi">Chọn ví nào?</h2>
      <ul>
        <li>
          <strong>Nautilus</strong> — tiện ích trình duyệt, dùng để kết nối với các ứng dụng DeFi trên Ergo.
        </li>
        <li>
          <strong>Ergo Mobile Wallet</strong> — ví di động mã nguồn mở cho Android và iOS.
        </li>
        <li>
          <strong>Satergo</strong> — ví desktop, có thể chạy kèm một node đầy đủ.
        </li>
      </ul>
      <p>
        Dù dùng ví nào, nguyên tắc vẫn vậy: bạn giữ seed phrase, bạn giữ tiền. Hãy luôn tải ví từ nguồn chính thức.
      </p>

      <h2 id="tiep-theo">Tiếp theo</h2>
      <p>
        Chúng ta đã nói nhiều về thợ đào. Họ là ai và làm gì? Đọc tiếp <Link to="/learn/mining-basics">Đào Ergo</Link>.
      </p>
    </>
  )
}
