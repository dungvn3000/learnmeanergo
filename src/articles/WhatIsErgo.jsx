import { Link } from 'react-router-dom'
import { Blocks, Clock, Cpu, ShieldCheck, Coins, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num, ago } from '../lib/format'
import { Callout, Card, Stat } from '../components/ui'

function LiveNow() {
  const state = useApi(() => api.networkState(), [], 30000)
  const d = state.data
  if (!d) return null
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
      <Stat icon={Blocks} label="Block hiện tại" value={<Link to={`/block/${d.height}`} className="hover:text-ergo-600">{num(d.height)}</Link>} sub={ago(d.tipTimestamp)} />
      <Stat icon={Coins} label="ERG đang lưu hành" value={num(d.circulating)} sub={`trên tối đa ${num(d.maxSupply)} ERG`} />
      <Stat icon={Cpu} label="Sức mạnh đào (hashrate)" value={`${d.hashrate} TH/s`} sub={`${d.peers} máy tính khác đang nói chuyện với node này`} />
    </div>
  )
}

const FEATURES = [
  { icon: ShieldCheck, title: 'Proof-of-Work', text: 'Bảo mật bằng năng lượng tính toán như Bitcoin, không phải bằng số coin nắm giữ.' },
  { icon: Blocks, title: 'Mô hình box (eUTXO)', text: 'Tiền nằm trong các “hộp” có khoá lập trình được, thay vì trong tài khoản.' },
  { icon: Users, title: 'Công bằng từ đầu', text: 'Không ICO, không pre-mine. Mọi ERG đều được tạo ra qua việc đào.' },
  { icon: Clock, title: 'Block mỗi ~2 phút', text: 'Nhanh hơn Bitcoin 5 lần, vẫn đủ an toàn cho mạng phi tập trung.' },
]

export default function WhatIsErgo() {
  return (
    <>
      <p>
        <strong>Ergo</strong> là một blockchain — một cuốn sổ cái công khai mà ai cũng có thể đọc, không ai có thể sửa, và
        không có công ty nào đứng ra quản lý. Đơn vị tiền của nó là <strong>ERG</strong>.
      </p>
      <p>
        Nếu bạn đã nghe về Bitcoin, bạn đã hiểu được 70% Ergo. Ergo giữ lại những gì Bitcoin làm tốt nhất — bảo mật bằng sức mạnh
        tính toán (Proof-of-Work), tiền cất trong những chiếc hộp có khoá thay vì tài khoản, và số coin tối đa cố định — rồi thêm vào
        một thứ Bitcoin gần như không có: <strong>hợp đồng thông minh</strong> mạnh mẽ nhưng vẫn an toàn (những luật gắn vào tiền mà
        chính mạng lưới tự thực thi).
      </p>

      <LiveNow />

      <h2 id="mot-cau-ngan-gon">Một câu ngắn gọn</h2>
      <p>
        Ergo là <em>“Bitcoin có thể lập trình được”</em>: mỗi đồng tiền trên Ergo được cất trong một chiếc hộp, và mỗi chiếc hộp
        mang theo một đoạn luật nhỏ nói rằng <em>ai</em> và <em>trong điều kiện nào</em> được phép mở nó.
      </p>
      <p>
        Với Bitcoin, luật đó hầu như luôn là “ai có chữ ký của khoá này thì được mở”. Với Ergo, luật có thể là “ai có chữ ký, <em>và</em>{' '}
        chỉ sau block 2,000,000, <em>và</em> phải trả lại ít nhất 100 ERG cho địa chỉ kia”. Chính những luật như vậy tạo nên sàn giao
        dịch phi tập trung, stablecoin, quỹ tiết kiệm có thời hạn… mà không cần ai giữ tiền hộ bạn.
      </p>

      <h2 id="dac-diem-chinh">Những đặc điểm chính</h2>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title} className="flex gap-3 p-4">
            <f.icon className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div>
              <div className="font-semibold text-stone-900 dark:text-white">{f.title}</div>
              <div className="mt-1 text-sm text-stone-500">{f.text}</div>
            </div>
          </Card>
        ))}
      </div>

      <h2 id="lich-su">Một chút lịch sử</h2>
      <p>
        Mạng chính (mainnet) của Ergo khởi chạy ngày <strong>1 tháng 7 năm 2019</strong>. Dự án được xây dựng bởi nhóm nhà nghiên
        cứu mật mã và blockchain, trong đó có Alexander Chepurnoy và Dmitry Meshkov.
      </p>
      <p>
        Ergo ra đời không qua ICO hay bán trước coin cho nhà đầu tư. Ngay từ block đầu tiên, ERG chỉ được tạo ra theo một cách:
        thợ đào tìm ra block mới và nhận phần thưởng. Trong hai năm đầu có một phần nhỏ phần thưởng (7.5 ERG mỗi block) được
        chuyển vào quỹ phát triển (treasury), rồi giảm dần và chấm dứt sau khoảng 2.5 năm — và điều này được ghi sẵn trong luật của
        mạng từ ngày đầu, ai cũng kiểm tra được.
      </p>

      <h2 id="ten-goi">Cái tên “Ergo” từ đâu ra?</h2>
      <p>
        Theo{' '}
        <a href="https://docs.ergoplatform.com/faq/" target="_blank" rel="noreferrer">
          tài liệu chính thức
        </a>
        , cái tên gói ba lớp nghĩa:
      </p>
      <ul>
        <li>
          Trong tiếng Latin, <strong>ergo</strong> là liên từ nghĩa là <em>“do đó”</em> — như trong “Tôi tư duy, <strong>do đó</strong> tôi tồn tại” — dùng để
          dẫn vào một kết luận logic.
        </li>
        <li>
          Trong tiếng Hy Lạp, từ họ hàng <strong>ἔργον</strong> (<em>ergon</em>) nghĩa là <em>“công việc”</em> — ngầm chỉ công sức đào và duy trì blockchain.
        </li>
        <li>
          Mã đồng tiền <strong>ERG</strong> cũng gợi tới <em>erg</em>, một đơn vị năng lượng nhỏ trong vật lý — lại quay về ý “công” và “năng lượng”.
        </li>
      </ul>

      <h2 id="danh-cho-ai">Ergo dành cho ai?</h2>
      <ul>
        <li>
          <strong>Người dùng bình thường</strong> muốn giữ tiền của chính mình, gửi nhận nhanh với phí rất thấp (thường chỉ 0.001 ERG).
        </li>
        <li>
          <strong>Thợ đào GPU</strong> — thuật toán Autolykos v2 được thiết kế để máy đào chuyên dụng (ASIC) khó chiếm ưu thế.
        </li>
        <li>
          <strong>Lập trình viên</strong> muốn viết hợp đồng thông minh mà hành vi của nó có thể dự đoán được trước khi gửi giao dịch.
        </li>
      </ul>

      <Callout type="tip" title="Bạn không cần tin chúng tôi">
        Mọi con số trên trang này — độ cao block, nguồn cung, hashrate — được lấy trực tiếp từ blockchain qua{' '}
        <a href="https://explorer.erg.vn" target="_blank" rel="noreferrer">explorer.erg.vn</a>. Đó chính là tinh thần của
        blockchain: <em>đừng tin, hãy kiểm chứng</em>.
      </Callout>

      <h2 id="tiep-theo">Tiếp theo</h2>
      <p>
        Hãy xem <Link to="/learn/how-it-works">blockchain Ergo hoạt động thế nào</Link> — node, thợ đào và block phối hợp với nhau
        ra sao. Hoặc nếu tò mò, hãy nhảy thẳng vào <Link to="/explorer">explorer</Link> để xem những block đang được đào ngay lúc này.
      </p>
    </>
  )
}
