import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Lock, Package, Target } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num } from '../lib/format'
import {
  BLOCK_TIME_SEC, EIP27_ACTIVATION, EPOCH_LENGTH, EPOCH_REDUCTION, FIXED_RATE, FIXED_RATE_PERIOD, MAX_SUPPLY, REEMISSION_PER_BLOCK, REEMISSION_START,
  emissionAt, emittedUpTo, heightToDate, minerRewardAt, reemissionLockAt, treasuryAt,
} from '../lib/ergo'
import { Callout, Card, Stat } from '../components/ui'
import LineChart from '../components/LineChart'

const MAX_H = 2_200_000

// Total ERG that EIP-27 locks between activation and the end of emission.
const TOTAL_REEMISSION = (() => {
  let s = 0
  for (let h = EIP27_ACTIVATION; h < REEMISSION_START; h++) s += reemissionLockAt(h)
  return s
})()
const REEMISSION_END = REEMISSION_START + Math.ceil(TOTAL_REEMISSION / REEMISSION_PER_BLOCK)

/** Heights at which the per-block emission changes, plus the chart ends. */
function breakpoints() {
  const hs = [1, FIXED_RATE_PERIOD]
  for (let h = FIXED_RATE_PERIOD + EPOCH_LENGTH; h <= MAX_H; h += EPOCH_LENGTH) hs.push(h)
  hs.push(MAX_H)
  return hs
}

const mil = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(0)}k` : String(v))

export default function Emission() {
  const state = useApi(() => Promise.all([api.info(), api.networkState()]), [])
  const [info, net] = state.data ?? []
  const height = info?.height

  // Estimated calendar date of a height: anchored to the live tip when we have it.
  const tipTime = net?.tipTimestamp
  const dateOf = (h) => (height && tipTime ? new Date(tipTime + (h - height) * BLOCK_TIME_SEC * 1000) : heightToDate(h))
  const fmtDate = (h) => {
    const d = dateOf(h)
    return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
  }

  const emissionPoints = useMemo(() => breakpoints().map((h) => ({ x: h, y: emissionAt(h) })), [])
  const supplyPoints = useMemo(() => {
    const pts = []
    for (let h = 0; h <= MAX_H; h += 20_000) pts.push({ x: h, y: emittedUpTo(h) })
    return pts
  }, [])
  const markers = height ? [{ x: height, label: 'Hiện tại' }] : []

  const tip = (p) => (
    <>
      <div className="text-stone-500">
        Block {num(p.x)} · ≈ {fmtDate(p.x)}
      </div>
      <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{emissionAt(p.x)} ERG / block</div>
      <div className="text-stone-500">Thợ đào nhận: {minerRewardAt(p.x)} ERG</div>
      {treasuryAt(p.x) > 0 && <div className="text-stone-500">Quỹ phát triển: {treasuryAt(p.x)} ERG</div>}
      {reemissionLockAt(p.x) > 0 && <div className="text-stone-500">Khoá EIP-27: {reemissionLockAt(p.x)} ERG</div>}
    </>
  )

  return (
    <>
      <p>
        Không có ICO nào cho ERG. Mọi đồng ERG đều được tạo ra theo một lịch trình cố định, viết sẵn trong giao thức từ ngày đầu tiên: mỗi block mới “in” thêm
        một lượng ERG nhất định, và lượng đó giảm dần theo thời gian cho tới khi bằng 0. Tổng cộng sẽ chỉ có <strong>{num(MAX_SUPPLY)} ERG</strong>.
      </p>

      {net && (
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Coins} label="Đã phát hành" value={num(net.issued)} sub={`${((net.issued / MAX_SUPPLY) * 100).toFixed(2)}% tổng cung`} />
          <Stat icon={Package} label="Đang lưu hành" value={num(net.circulating)} sub="Đã phát hành − phần khoá EIP-27" />
          <Stat icon={Lock} label="Khoá tái phát hành" value={num(net.reemissionLocked)} sub="Sẽ trả dần cho thợ đào" />
          <Stat icon={Target} label="Tổng cung tối đa" value={num(MAX_SUPPLY)} sub="ERG" />
        </div>
      )}

      <h2 id="lich-trinh">Lịch trình phát hành</h2>
      <p>Quy tắc rất đơn giản:</p>
      <ol>
        <li>
          <strong>{FIXED_RATE} ERG mỗi block</strong> trong {num(FIXED_RATE_PERIOD)} block đầu tiên (~2 năm với block 2 phút).
        </li>
        <li>
          Sau đó, cứ mỗi <strong>{num(EPOCH_LENGTH)} block</strong> (~3 tháng) lượng phát hành giảm <strong>{EPOCH_REDUCTION} ERG</strong>.
        </li>
        <li>
          Khi xuống tới 0 — ở block <strong>{num(REEMISSION_START)}</strong> — việc phát hành mới chấm dứt.
        </li>
      </ol>
      <Card className="not-prose my-6 p-4">
        <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">ERG được tạo ra mỗi block, theo độ cao</div>
        <LineChart
          label="Lượng ERG phát hành mỗi block theo độ cao"
          points={emissionPoints}
          step
          xFormat={mil}
          yFormat={(v) => `${v}`}
          markers={markers}
          tooltip={tip}
        />
      </Card>
      <p>
        Khác với Bitcoin “giảm một nửa” đột ngột mỗi 4 năm, đường cong của Ergo đi xuống theo những bậc thang nhỏ và đều. Và thay vì kéo dài hơn một thế kỷ,
        toàn bộ ERG được phát hành chỉ trong khoảng 8 năm — sau đó an ninh mạng dựa vào phí giao dịch (và tái phát hành, xem bên dưới).
      </p>

      <h2 id="quy-phat-trien">Phần dành cho quỹ phát triển</h2>
      <p>
        Trong giai đoạn đầu, một phần nhỏ của mỗi block được chuyển vào quỹ (treasury) để tài trợ phát triển: {treasuryAt(1)} ERG/block trong{' '}
        {num(FIXED_RATE_PERIOD)} block đầu, rồi {treasuryAt(FIXED_RATE_PERIOD)} và {treasuryAt(FIXED_RATE_PERIOD + EPOCH_LENGTH)} ERG trong hai epoch tiếp
        theo. Thợ đào nhận phần còn lại ({FIXED_RATE - treasuryAt(1)} ERG/block). Từ block {num(FIXED_RATE_PERIOD + 2 * EPOCH_LENGTH)}, toàn bộ lượng phát hành
        thuộc về thợ đào.
      </p>

      <h2 id="eip-27">EIP-27: tái phát hành</h2>
      <p>
        Lịch phát hành gốc có một vấn đề: phát hành kết thúc khá sớm, trong khi phí giao dịch chưa chắc đủ để giữ chân thợ đào. <strong>EIP-27</strong>, kích
        hoạt tại block <strong>{num(EIP27_ACTIVATION)}</strong> (năm 2022) bằng soft fork, “cất” bớt một phần phần thưởng hiện tại để trả dần trong tương lai:
      </p>
      <ul>
        <li>
          Nếu lượng phát hành của block ≥ 15 ERG: <strong>12 ERG</strong> bị khoá vào hợp đồng tái phát hành.
        </li>
        <li>
          Nếu nhỏ hơn 15 ERG: khoá <em>(lượng phát hành − 3)</em> ERG, để thợ đào luôn nhận ít nhất 3 ERG.
        </li>
        <li>
          Sau khi phát hành kết thúc (block {num(REEMISSION_START)}), hợp đồng trả lại <strong>{REEMISSION_PER_BLOCK} ERG mỗi block</strong> cho thợ đào, cho tới
          khi cạn.
        </li>
      </ul>
      <p>
        Cộng lại, EIP-27 khoá khoảng <strong>{num(TOTAL_REEMISSION)} ERG</strong>. Trả {REEMISSION_PER_BLOCK} ERG mỗi block, số đó đủ dùng thêm khoảng{' '}
        {num(Math.ceil(TOTAL_REEMISSION / REEMISSION_PER_BLOCK))} block — tới quanh block {num(REEMISSION_END)} (≈ năm {dateOf(REEMISSION_END).getUTCFullYear()}).
        Tổng cung không đổi; chỉ thời điểm ERG tới tay thợ đào bị kéo dài ra.
      </p>
      <Callout type="note" title="Thợ đào thực nhận bao nhiêu?">
        Ví dụ ở block {num(height ?? 1_881_901)}: phát hành {emissionAt(height ?? 1_881_901)} ERG, khoá {reemissionLockAt(height ?? 1_881_901)} ERG, thợ đào nhận{' '}
        {minerRewardAt(height ?? 1_881_901)} ERG + phí giao dịch. Mở một <Link to="/explorer">block bất kỳ</Link> để thấy các trường <code>emission</code>,{' '}
        <code>reemitted</code> và <code>reward</code>.
      </Callout>

      <h2 id="bang">Bảng tóm tắt</h2>
      <table>
        <thead>
          <tr>
            <th>Từ block</th>
            <th>≈ Thời điểm</th>
            <th>Phát hành</th>
            <th>Thợ đào nhận</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {[
            [1, 'Mainnet ra mắt, 75 ERG/block'],
            [FIXED_RATE_PERIOD, 'Bắt đầu giảm 3 ERG mỗi 64,800 block'],
            [FIXED_RATE_PERIOD + 2 * EPOCH_LENGTH, 'Hết phần quỹ phát triển'],
            [EIP27_ACTIVATION, 'Kích hoạt EIP-27'],
            [1_821_600, 'Phát hành xuống dưới 15 ERG'],
            [REEMISSION_START - 1, 'Block phát hành cuối cùng'],
            [REEMISSION_START, 'Chỉ còn tái phát hành 3 ERG/block'],
            [REEMISSION_END, 'Hợp đồng tái phát hành cạn (ước tính)'],
          ].map(([h, note]) => (
            <tr key={h}>
              <td className="tabular-nums">{num(h)}</td>
              <td className="tabular-nums">{fmtDate(h)}</td>
              <td className="tabular-nums">{emissionAt(h)} ERG</td>
              <td className="tabular-nums">{h >= REEMISSION_END ? 0 : minerRewardAt(h)} ERG</td>
              <td>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="tong-cung">Tổng cung theo thời gian</h2>
      <Card className="not-prose my-6 p-4">
        <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">Tổng ERG đã phát hành theo độ cao</div>
        <LineChart
          label="Tổng ERG đã phát hành theo độ cao"
          points={supplyPoints}
          xFormat={mil}
          yFormat={mil}
          markers={markers}
          tooltip={(p) => (
            <>
              <div className="text-stone-500">
                Block {num(p.x)} · ≈ {fmtDate(p.x)}
              </div>
              <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{num(p.y)} ERG</div>
              <div className="text-stone-500">{((p.y / MAX_SUPPLY) * 100).toFixed(1)}% tổng cung</div>
            </>
          )}
        />
      </Card>
      <p>
        Muốn biết con số ở một độ cao cụ thể? Dùng <Link to="/tools/emission-calculator">máy tính phát hành</Link>. Các ngày tháng ở trên là ước tính với block
        2 phút — thời gian thật có thể lệch vài tuần.
      </p>
    </>
  )
}
