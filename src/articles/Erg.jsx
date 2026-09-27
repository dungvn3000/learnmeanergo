import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num } from '../lib/format'
import { emissionAt, minerRewardAt, FIXED_RATE_PERIOD, EPOCH_LENGTH, REEMISSION_START, BLOCK_TIME_SEC } from '../lib/ergo'
import { Callout, Card } from '../components/ui'
import LineChart from '../components/LineChart'

function SupplyBar({ d }) {
  const pct = (v) => `${((v / d.maxSupply) * 100).toFixed(2)}%`
  const rest = d.maxSupply - d.issued
  return (
    <Card className="not-prose my-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-semibold text-stone-900 dark:text-white">Đã phát hành {pct(d.issued)} tổng cung</div>
        <div className="text-xs text-stone-500">cập nhật tại block {num(d.height)}</div>
      </div>
      <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div className="h-full bg-ergo-500" style={{ width: pct(d.circulating) }} title="Đang lưu hành" />
        <div className="h-full bg-ergo-200 dark:bg-ergo-800" style={{ width: pct(d.reemissionLocked) }} title="Khoá chờ tái phát hành" />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-ergo-500" /> Đang lưu hành
          </div>
          <div className="font-bold tabular-nums">{num(d.circulating)} ERG</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-ergo-200 dark:bg-ergo-800" /> Khoá chờ tái phát hành
          </div>
          <div className="font-bold tabular-nums">{num(d.reemissionLocked)} ERG</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <span className="size-2.5 rounded-sm bg-stone-200 dark:bg-stone-700" /> Chưa được đào
          </div>
          <div className="font-bold tabular-nums">{num(rest)} ERG</div>
        </div>
      </div>
    </Card>
  )
}

function RewardChart({ height }) {
  const points = useMemo(() => {
    const hs = [1, FIXED_RATE_PERIOD - 1]
    for (let h = FIXED_RATE_PERIOD; h <= REEMISSION_START + EPOCH_LENGTH; h += EPOCH_LENGTH) hs.push(h, h + EPOCH_LENGTH - 1)
    return hs.map((h) => ({ x: h, y: emissionAt(h) }))
  }, [])
  const markers = height ? [{ x: height, label: 'Hiện tại' }] : []
  return (
    <Card className="not-prose my-6 p-4">
      <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">ERG mới được tạo ra mỗi block</div>
      <LineChart
        points={points}
        step
        markers={markers}
        label="Lượng ERG phát hành mỗi block theo độ cao"
        xFormat={(x) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : `${Math.round(x / 1e3)}k`)}
        yFormat={(y) => `${y}`}
        tooltip={(p) => (
          <>
            <div className="text-stone-500">Block {num(p.x)}</div>
            <div className="font-semibold text-stone-900 dark:text-white">{emissionAt(p.x)} ERG / block</div>
          </>
        )}
      />
      <p className="mt-2 text-xs text-stone-500">Trục ngang: độ cao block. Mỗi bậc thang giảm 3 ERG, kéo dài 64,800 block (~3 tháng).</p>
    </Card>
  )
}

export default function Erg() {
  const ns = useApi(() => api.networkState(), [], 60000)
  const d = ns.data
  const endDate = d ? new Date(d.tipTimestamp + (REEMISSION_START - d.height) * BLOCK_TIME_SEC * 1000) : null

  return (
    <>
      <p>
        <strong>ERG</strong> là đồng tiền gốc của Ergo. Bạn dùng nó để gửi cho người khác, trả phí giao dịch, và thợ đào nhận nó làm
        phần thưởng khi bảo vệ mạng lưới.
      </p>

      <h2 id="tong-cung">Tổng cung có giới hạn</h2>
      <p>
        Sẽ chỉ có tối đa <strong>97,739,925 ERG</strong> được tạo ra — không hơn một đồng. Con số này không phải lời hứa của ai, mà
        được viết vào bộ luật mà mọi node đều thực thi. Block nào định tạo ra nhiều ERG hơn lịch cho phép thì mọi node đơn giản là vứt
        bỏ nó.
      </p>
      {d && <SupplyBar d={d} />}

      <h2 id="erg-tu-dau-ra">ERG từ đâu ra?</h2>
      <p>
        Mỗi block mới được đào sẽ tạo ra một lượng ERG mới. Đây là cách <strong>duy nhất</strong> ERG được sinh ra — không có ICO,
        không có pre-mine. Tất cả số ERG tương lai đang nằm sẵn trong một box đặc biệt gọi là <em>emission box</em>, được khoá bởi
        một hợp đồng chỉ cho phép rút ra đúng số lượng quy định ở mỗi block.
      </p>
      <p>Lịch phát hành có hai giai đoạn:</p>
      <ul>
        <li>
          <strong>2 năm đầu</strong> (525,600 block): mỗi block tạo ra <strong>75 ERG</strong>, trong đó 7.5 ERG vào quỹ phát triển
          (treasury).
        </li>
        <li>
          <strong>Sau đó</strong>: cứ mỗi 64,800 block (~3 tháng), lượng ERG mỗi block giảm <strong>3 ERG</strong>, cho đến khi về 0.
        </li>
      </ul>
      <RewardChart height={d?.height} />
      {d && (
        <p>
          Hiện tại (block {num(d.height)}) mỗi block tạo ra <strong>{emissionAt(d.height)} ERG</strong>. Việc phát hành từ emission
          box sẽ kết thúc ở khoảng block <strong>{num(REEMISSION_START)}</strong> — ước tính vào khoảng{' '}
          <strong>{endDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</strong>.
        </p>
      )}

      <h2 id="tai-phat-hanh">Tái phát hành (EIP-27)</h2>
      <p>
        Khi phần thưởng giảm dần về 0, lấy gì trả công cho thợ đào? Năm 2022, cộng đồng đã thông qua một thay đổi luật gọi là{' '}
        <strong>EIP-27</strong> (“Ergo Improvement Proposal” — cách mọi thay đổi luật của Ergo được đề xuất và thống nhất). Từ block
        777,217, một phần phần thưởng mỗi block (tối đa 12 ERG) được <strong>khoá lại</strong> trong một hợp đồng “tiết kiệm” — hợp đồng
        tái phát hành — thay vì trả ngay cho thợ đào.
      </p>
      <p>
        Sau khi emission box cạn, hợp đồng này sẽ tiếp tục nhả ra <strong>3 ERG mỗi block</strong> cho thợ đào, kéo dài thời gian họ
        được trả thưởng thêm nhiều năm. Tổng cung không đổi — chỉ là ERG được “để dành” cho tương lai.
      </p>
      {d && (
        <Callout type="note">
          Ở block hiện tại, trong {emissionAt(d.height)} ERG được tạo ra, thợ đào nhận ngay{' '}
          <strong>{minerRewardAt(d.height)} ERG</strong>, phần còn lại được khoá cho giai đoạn tái phát hành.
        </Callout>
      )}

      <h2 id="nanoerg">Đơn vị nhỏ nhất: nanoERG</h2>
      <p>
        Blockchain không lưu số thập phân. Mọi giá trị được lưu dưới dạng số nguyên <strong>nanoERG</strong>:
      </p>
      <table>
        <thead>
          <tr>
            <th>ERG</th>
            <th>nanoERG</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td className="tabular-nums">1,000,000,000</td>
          </tr>
          <tr>
            <td>0.001 (phí giao dịch phổ biến)</td>
            <td className="tabular-nums">1,000,000</td>
          </tr>
          <tr>
            <td>0.000000001</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
      <p>
        Thử đổi qua lại bằng công cụ <Link to="/tools/units">Đổi đơn vị ERG</Link>, hoặc tính phần thưởng ở bất kỳ độ cao nào với{' '}
        <Link to="/tools/emission-calculator">Máy tính phát hành</Link>.
      </p>

      <Callout type="tip" title="Muốn chi tiết hơn?">
        Bài kỹ thuật <Link to="/learn/emission">Lịch phát hành &amp; EIP-27</Link> đi vào công thức chính xác và cách chia phần
        thưởng giữa thợ đào, treasury và hợp đồng tái phát hành.
      </Callout>

      <h2 id="tiep-theo">Tiếp theo</h2>
      <p>
        Bạn đã biết ERG đến từ đâu. Giờ là lúc tìm hiểu cách giữ chúng an toàn: <Link to="/learn/wallets">ví, khoá và địa chỉ</Link>.
      </p>
    </>
  )
}
