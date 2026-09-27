import { Link } from 'react-router-dom'
import { Clock, Cpu, Gauge, Pickaxe } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { compact, num } from '../lib/format'
import { minerRewardAt } from '../lib/ergo'
import { Async, Callout, Card, Stat } from '../components/ui'
import LineChart from '../components/LineChart'

function HashrateChart() {
  const state = useApi(() => api.chart('hashrate', 90), [])
  return (
    <Card className="not-prose my-6 p-4">
      <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">Hashrate toàn mạng, 90 ngày gần nhất</div>
      <Async state={state}>
        {(c) =>
          c.points?.length > 1 ? (
            <LineChart
              points={c.points.map((p) => ({ x: p.t, y: p.v }))}
              label="Hashrate mạng Ergo theo ngày"
              xFormat={(x) => new Date(x).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              yFormat={(y) => `${+y.toFixed(2)} ${c.unit}`}
            />
          ) : (
            <div className="py-6 text-center text-sm text-stone-500">Chưa có dữ liệu.</div>
          )
        }
      </Async>
    </Card>
  )
}

function PoolShare({ pools }) {
  const total = pools.reduce((s, p) => s + p.blocks, 0)
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-sm font-semibold text-stone-900 dark:text-white">Ai đã đào {total} block trong 24 giờ qua?</div>
      <div className="grid gap-2">
        {pools.map((p) => {
          const pct = (p.blocks / total) * 100
          return (
            <div key={p.address} className="grid grid-cols-[110px_1fr_70px] items-center gap-3 text-sm">
              <Link to={`/address/${p.address}`} className="truncate font-medium hover:text-ergo-600" title={p.address}>
                {p.name}
              </Link>
              <div className="h-3 rounded-full bg-stone-100 dark:bg-stone-800">
                <div className="h-full rounded-full bg-ergo-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right tabular-nums text-stone-500">
                {p.blocks} · {pct.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function MiningBasics() {
  const ns = useApi(() => api.networkState(), [], 60000)
  const d = ns.data
  return (
    <>
      <p>
        Không có ngân hàng trung ương nào quyết định giao dịch nào hợp lệ trên Ergo. Công việc đó thuộc về <strong>thợ đào</strong>{' '}
        (miner) — những người dùng máy tính để bảo vệ mạng lưới, và được trả công bằng ERG.
      </p>

      {d && (
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
          <Stat icon={Cpu} label="Hashrate" value={`${d.hashrate} TH/s`} sub={`${d.hashrateChange7d > 0 ? '+' : ''}${d.hashrateChange7d}% so với 7 ngày trước`} />
          <Stat icon={Clock} label="Thời gian block TB" value={`${Math.round(d.avgBlockTimeSec)} giây`} sub="mục tiêu: 120 giây" />
          <Stat icon={Gauge} label="Độ khó" value={compact(d.difficulty)} sub={`block #${num(d.height)}`} />
        </div>
      )}

      <h2 id="tho-dao-lam-gi">Thợ đào làm gì?</h2>
      <p>Mỗi thợ đào liên tục làm ba việc:</p>
      <ol>
        <li>Lấy các giao dịch đang chờ trong mempool và kiểm tra chúng hợp lệ.</li>
        <li>Ghép chúng thành một block ứng viên, trỏ về block mới nhất của chuỗi.</li>
        <li>
          Đổi một con số phụ trong block (gọi là <strong>nonce</strong>), tính lại dấu vân tay của block (mã băm), rồi xem nó đã đủ
          nhỏ chưa. Lặp lại hàng tỉ lần.
        </li>
      </ol>
      <p>
        Bước 3 giống như tung xúc xắc hàng tỉ lần để ra một con số cực hiếm. Không có mẹo nào — chỉ có thử thật nhiều và thật nhanh. Tốc
        độ thử của cả mạng gọi là <strong>hashrate</strong>.
      </p>
      <HashrateChart />

      <h2 id="phan-thuong">Phần thưởng</h2>
      <p>Thợ đào tìm ra block nhận được hai thứ:</p>
      <ul>
        <li>
          <strong>Phần thưởng block</strong>: ERG mới được tạo ra theo <Link to="/learn/erg">lịch phát hành</Link>.
          {d && (
            <>
              {' '}
              Ở độ cao hiện tại, thợ đào nhận ngay <strong>{minerRewardAt(d.height)} ERG</strong> mỗi block.
            </>
          )}
        </li>
        <li>
          <strong>Phí giao dịch</strong>: tổng phí của mọi giao dịch trong block.
        </li>
      </ul>
      <p>
        Khi phần thưởng block dần giảm, phí giao dịch và cơ chế tái phát hành (EIP-27) sẽ ngày càng quan trọng để giữ cho thợ đào tiếp
        tục bảo vệ mạng.
      </p>

      <h2 id="do-kho">Độ khó tự điều chỉnh</h2>
      <p>
        Nếu thêm nhiều thợ đào tham gia, block sẽ được tìm ra nhanh hơn. Để giữ nhịp khoảng <strong>2 phút một block</strong>, mạng tự
        động tăng <strong>độ khó</strong> (difficulty) — tức là yêu cầu mã băm phải nhỏ hơn nữa. Khi thợ đào rời đi, độ khó giảm xuống.
      </p>
      <p>
        Có một mối liên hệ đơn giản: <em>hashrate ≈ độ khó ÷ 120 giây</em>. Đó chính là cách explorer ước tính hashrate của cả mạng mà
        không cần hỏi từng thợ đào. Chi tiết trong bài <Link to="/learn/difficulty">Độ khó &amp; nBits</Link>.
      </p>

      <h2 id="gpu">Vì sao GPU vẫn đào được Ergo?</h2>
      <p>
        Bitcoin ngày nay chỉ đào được bằng máy ASIC chuyên dụng, đắt tiền, tập trung trong tay một số ít công ty. Ergo chọn hướng
        khác: thuật toán <strong>Autolykos v2</strong> là thuật toán <em>memory-hard</em> — mỗi lần thử cần đọc dữ liệu từ một bảng
        lớn trong bộ nhớ. Card đồ hoạ (GPU) phổ thông có bộ nhớ nhanh nên làm việc này rất tốt, còn chế tạo ASIC để vượt trội thì khó và
        kém hiệu quả hơn nhiều.
      </p>
      <p>Kết quả: bất kỳ ai có một dàn GPU đều có thể tham gia bảo vệ mạng.</p>
      <Callout type="note">
        Tìm hiểu cách Autolykos hoạt động và ý nghĩa của các trường <code>pk</code>, <code>w</code>, <code>n</code>, <code>d</code>{' '}
        trong mỗi block tại bài <Link to="/learn/autolykos">Autolykos v2</Link>.
      </Callout>

      <h2 id="pool">Đào một mình hay vào pool?</h2>
      <p>
        Với hàng nghìn thợ đào, xác suất một dàn máy nhỏ tự tìm được block là rất thấp — có thể phải chờ hàng tháng. Vì vậy phần lớn
        thợ đào tham gia <strong>pool</strong>: góp sức với nhau và chia phần thưởng theo đóng góp. Thu nhập ít hơn mỗi lần nhưng đều
        đặn hơn.
      </p>
      {d?.poolShare24h?.length > 0 && <PoolShare pools={d.poolShare24h} />}
      <p>
        Sự phân bổ giữa các pool rất đáng theo dõi: nếu một pool chiếm quá nửa hashrate, về lý thuyết nó có thể gây rối mạng. Thợ đào
        có thể chuyển pool bất cứ lúc nào — một cách “bỏ phiếu bằng chân” giữ cho mạng phi tập trung.
      </p>

      <h2 id="tiep-theo">Tiếp theo</h2>
      <p>
        <Pickaxe className="mr-1 inline size-4 text-ergo-500" />
        Bạn đã hoàn thành phần cho người mới! Sẵn sàng đi sâu hơn? Bắt đầu với <Link to="/learn/block">Block &amp; header</Link> trong
        phần <Link to="/technical">Kỹ thuật</Link>, hoặc xem các block vừa được đào trong <Link to="/explorer">explorer</Link>.
      </p>
    </>
  )
}
