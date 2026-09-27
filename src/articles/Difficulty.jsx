import { Link } from 'react-router-dom'
import { Check, Gauge, Timer, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { compact, num } from '../lib/format'
import { Async, Callout, Card, Field, Stat } from '../components/ui'
import LineChart from '../components/LineChart'

// Order of the secp256k1 group; Ergo's target is q / difficulty.
const Q = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/** Compact "nBits" → big integer (same format as Bitcoin, but it encodes the difficulty). */
function decodeNBits(hex) {
  const n = parseInt(hex, 16)
  const exponent = n >>> 24
  const mantissa = n & 0x007fffff
  const value = exponent <= 3 ? BigInt(mantissa >> (8 * (3 - exponent))) : BigInt(mantissa) << BigInt(8 * (exponent - 3))
  return { n, exponent, mantissa, value }
}

const ddMM = (t) => {
  const d = new Date(t)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function LiveNBits() {
  const state = useApi(() => Promise.all([api.latestBlocks(1), api.networkState()]), [])
  return (
    <Async state={state}>
      {([blocks, net]) => {
        const b = blocks?.[0]
        if (!b?.nBits) return <p>Không lấy được block mới nhất.</p>
        const d = decodeNBits(b.nBits)
        const matches = d.value === BigInt(b.difficulty)
        const target = Q / d.value
        const hashrate = Number(d.value) / 120
        return (
          <>
            <Card className="not-prose my-6 p-2 sm:p-4">
              <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Block <Link to={`/block/${b.height}`} className="text-ergo-600 hover:underline dark:text-ergo-400">#{num(b.height)}</Link>
              </div>
              <Field name="nBits" value={<span className="font-mono">0x{b.nBits.padStart(8, '0')}</span>}>
                4 byte trong header: 1 byte số mũ + 3 byte phần định trị.
              </Field>
              <Field name="Số mũ" value={<span className="font-mono">0x{d.exponent.toString(16).padStart(2, '0')} = {d.exponent}</span>}>
                Tổng số byte của con số đầy đủ.
              </Field>
              <Field name="Phần định trị" value={<span className="font-mono">0x{d.mantissa.toString(16)} = {num(d.mantissa)}</span>}>
                3 byte có nghĩa đầu tiên của con số.
              </Field>
              <Field
                name="Giải nén"
                value={
                  <span className="font-mono break-all">
                    {num(d.mantissa)} × 256<sup>{d.exponent - 3}</sup> = {d.value.toLocaleString('en-US')}
                  </span>
                }
              >
                {matches ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <Check className="size-3.5" /> Đúng bằng trường difficulty của block ({num(b.difficulty)}).
                  </span>
                ) : (
                  <>So sánh với difficulty mà API trả về: {num(b.difficulty)}.</>
                )}
              </Field>
              <Field name="Target = q / difficulty" value={<span className="font-mono break-all">0x{target.toString(16).padStart(64, '0')}</span>}>
                Giá trị băm của lời giải PoW phải nhỏ hơn số này. Để ý các số 0 ở đầu.
              </Field>
            </Card>

            <h2 id="hashrate">Từ độ khó ra hashrate</h2>
            <p>
              Mỗi lần thử có xác suất thành công xấp xỉ <em>target / 2²⁵⁶ ≈ 1 / difficulty</em>. Vậy trung bình cả mạng cần khoảng <em>difficulty</em> lần thử
              cho mỗi block, và nếu mỗi block mất ~120 giây:
            </p>
            <pre>
              <code>{`hashrate ≈ difficulty / 120 s
         ≈ ${num(b.difficulty)} / 120
         ≈ ${compact(hashrate)} H/s  ≈ ${(hashrate / 1e12).toFixed(2)} TH/s`}</code>
            </pre>
            {net && (
              <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
                <Stat icon={Zap} label="Hashrate (explorer)" value={`${net.hashrate} TH/s`} sub={`7 ngày: ${net.hashrateChange7d > 0 ? '+' : ''}${net.hashrateChange7d}%`} />
                <Stat icon={Gauge} label="Độ khó" value={compact(net.difficulty)} sub={num(net.difficulty)} />
                <Stat icon={Timer} label="Thời gian block TB" value={`${net.avgBlockTimeSec.toFixed(1)} s`} sub="Mục tiêu: 120 s" />
              </div>
            )}
          </>
        )
      }}
    </Async>
  )
}

function DifficultyChart() {
  const state = useApi(() => api.chart('difficulty', 180), [])
  return (
    <Async state={state}>
      {(c) =>
        c?.points?.length ? (
          <Card className="not-prose my-6 p-4">
            <div className="mb-2 text-sm font-semibold text-stone-900 dark:text-white">Độ khó theo ngày, 180 ngày gần nhất</div>
            <LineChart
              label="Độ khó mạng Ergo 180 ngày"
              points={c.points.map((p) => ({ x: p.t, y: p.v }))}
              xFormat={ddMM}
              yFormat={compact}
              tooltip={(p) => (
                <>
                  <div className="text-stone-500">{new Date(p.x).toISOString().slice(0, 10)}</div>
                  <div className="font-semibold tabular-nums text-stone-900 dark:text-white">{num(p.y)}</div>
                  <div className="text-stone-500">≈ {(p.y / 120 / 1e12).toFixed(2)} TH/s</div>
                </>
              )}
            />
          </Card>
        ) : (
          <p>Chưa có dữ liệu biểu đồ.</p>
        )
      }
    </Async>
  )
}

export default function Difficulty() {
  return (
    <>
      <p>
        Nếu bỗng dưng có gấp đôi số GPU tham gia đào, block sẽ ra nhanh gấp đôi — trừ khi bài toán khó lên gấp đôi. <strong>Độ khó (difficulty)</strong> là núm
        vặn giúp Ergo giữ nhịp trung bình <strong>một block mỗi 2 phút</strong>, bất kể có bao nhiêu thợ đào.
      </p>

      <h2 id="target">Target và difficulty</h2>
      <p>
        Trong <Link to="/learn/autolykos">Autolykos</Link>, lời giải hợp lệ khi giá trị băm cuối cùng — hiểu như một số nguyên 256 bit — nhỏ hơn một ngưỡng gọi
        là <strong>target</strong>. Target càng nhỏ thì càng khó. Ergo định nghĩa:
      </p>
      <pre>
        <code>{`target = q / difficulty
q = bậc của nhóm secp256k1
  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141`}</code>
      </pre>
      <p>
        Ở đây <code>q</code> chỉ là một hằng số cố định và khổng lồ — khoảng 1.16 × 10<sup>77</sup>, xấp xỉ 2<sup>256</sup>. Chia nó cho difficulty ta được
        target: với difficulty hiện nay cỡ 6 × 10<sup>13</sup>, chỉ khoảng một giá trị băm trong 60 nghìn tỷ lần thử rơi xuống dưới ngưỡng đó.
      </p>
      <p>
        Vì vậy difficulty là con số “dễ hiểu” hơn: difficulty tăng gấp đôi nghĩa là trung bình cần gấp đôi số lần thử. Và khác với Bitcoin (header lưu target),
        header Ergo lưu trực tiếp <em>difficulty</em> dưới dạng nén.
      </p>

      <h2 id="nbits">nBits: nén một số khổng lồ vào 4 byte</h2>
      <p>
        Difficulty có thể là một số rất lớn, nhưng header chỉ dành 4 byte cho nó. Ergo dùng lại định dạng “compact” của Bitcoin: byte đầu là <strong>số mũ</strong>{' '}
        (số byte của con số), 3 byte sau là <strong>phần định trị</strong> (3 byte có nghĩa đầu tiên). Giải nén:
      </p>
      <pre>
        <code>{`value = mantissa × 256^(exponent − 3)`}</code>
      </pre>
      <p>Hãy giải nén nBits của block mới nhất và so với difficulty mà explorer báo:</p>
      <LiveNBits />
      <Callout type="note" title="Chỉ là ước lượng">
        Không ai đếm được hashrate thật. Explorer suy ngược nó từ độ khó và thời gian giữa các block, nên con số dao động theo vận may của thợ đào trong ngắn
        hạn.
      </Callout>

      <h2 id="dieu-chinh">Điều chỉnh độ khó</h2>
      <p>
        Ban đầu Ergo tính lại độ khó sau mỗi <strong>epoch 1024 block</strong> bằng hồi quy tuyến tính (linear least squares) trên dữ liệu của 8 epoch gần
        nhất — tức là dự đoán xu hướng hashrate thay vì chỉ nhìn epoch vừa qua như Bitcoin.
      </p>
      <p>
        Epoch dài khiến mạng phản ứng chậm khi hashrate biến động mạnh (ví dụ khi thợ đào ồ ạt chuyển sang coin khác). Vì vậy{' '}
        <strong>EIP-37</strong> — kích hoạt tháng 10/2022 tại block 844,673 — thay đổi thuật toán:
      </p>
      <ul>
        <li>
          Epoch rút ngắn còn <strong>128 block</strong> (~4 giờ 16 phút), nên độ khó được cập nhật thường xuyên hơn nhiều.
        </li>
        <li>Độ khó mới là trung bình của dự đoán hồi quy tuyến tính và cách tính “kiểu Bitcoin” dựa trên epoch vừa qua.</li>
        <li>
          Mức thay đổi mỗi lần bị giới hạn (khoảng ±50%), tránh những cú nhảy quá lớn.
        </li>
      </ul>
      <p>
        Chi tiết chính xác (hệ số, cách làm tròn) nằm trong đặc tả EIP-37 và mã nguồn node tham chiếu. Điều quan trọng cần nhớ: thời gian block trung bình luôn
        được kéo về quanh 120 giây.
      </p>
      <DifficultyChart />

      <h2 id="xem-them">Xem thêm</h2>
      <ul>
        <li>
          <Link to="/learn/autolykos">Autolykos v2</Link> — giá trị băm nào được đem so với target.
        </li>
        <li>
          <Link to="/learn/block">Block &amp; header</Link> — nBits nằm ở đâu trong header.
        </li>
        <li>
          <Link to="/learn/emission">Lịch phát hành</Link> — phần thưởng mà thợ đào nhận được khi thắng.
        </li>
      </ul>
    </>
  )
}
