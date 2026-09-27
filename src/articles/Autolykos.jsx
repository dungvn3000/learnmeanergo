import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { p2pkAddress } from '../lib/ergo'
import { num } from '../lib/format'
import { Async, Callout, Card, Field, Hash } from '../components/ui'

// Autolykos v2 table size N(h): 2^26, then +5% every 51,200 blocks from height 614,400,
// frozen from height 4,198,400 (reference node: AutolykosPowScheme.calcN).
const N_BASE = 2 ** 26
const N_INCREASE_START = 614_400
const N_INCREASE_PERIOD = 51_200
const N_FREEZE_HEIGHT = 4_198_400
const V2_ACTIVATION = 417_792
const K = 32

function calcN(h) {
  if (h < N_INCREASE_START) return N_BASE
  if (h >= N_FREEZE_HEIGHT) return 2_143_944_600
  const iterations = Math.floor((h - N_INCREASE_START) / N_INCREASE_PERIOD) + 1
  let n = N_BASE
  for (let i = 0; i < iterations; i++) n = Math.floor(n / 100) * 105
  return n
}

const G_HEX = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

function LivePow() {
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) => {
        const b = blocks?.[0]
        if (!b?.pow) return <p>Không lấy được lời giải PoW.</p>
        let pkAddr = null
        try {
          pkAddr = p2pkAddress(b.pow.pk)
        } catch {
          pkAddr = null
        }
        const N = calcN(b.height)
        return (
          <Card className="not-prose my-6 p-2 sm:p-4">
            <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
              Lời giải PoW của block <Link to={`/block/${b.height}`} className="text-ergo-600 hover:underline dark:text-ergo-400">#{num(b.height)}</Link>
            </div>
            <Field name="pk" value={<Hash value={b.pow.pk} full />}>
              Khoá công khai của thợ đào. Nó chính là{' '}
              {pkAddr ? (
                <>
                  địa chỉ <Hash value={pkAddr} to={`/address/${pkAddr}`} />
                  {pkAddr === b.minerAddress && (
                    <span className="ml-1 inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <Check className="size-3.5" /> trùng với địa chỉ nhận thưởng
                    </span>
                  )}
                </>
              ) : (
                'địa chỉ nhận thưởng'
              )}
              . Phần thưởng của block chỉ mở được bằng khoá này.
            </Field>
            <Field name="w" value={<Hash value={b.pow.w} full />}>
              {b.pow.w === G_HEX ? 'Chính là điểm sinh G của secp256k1 — ' : ''}
              một giá trị cố định trong Autolykos v2, giữ lại chỉ để định dạng header không đổi.
            </Field>
            <Field name="n (nonce)" value={<span className="font-mono">{b.pow.n}</span>}>
              8 byte mà thợ đào thay đổi liên tục cho tới khi tìm được giá trị băm đủ nhỏ. Đây là phần duy nhất thật sự “được đào”.
            </Field>
            <Field name="d" value={<span className="font-mono">{String(b.pow.d)}</span>}>
              Luôn bằng 0 trong v2 (ở v1, d là một phần của lời giải).
            </Field>
            <Field name="N ở độ cao này" value={<span className="font-mono">{num(N)}</span>}>
              Số phần tử trong bảng mà thợ đào phải giữ trong bộ nhớ. N × 32 byte ≈ {(N * 32 / 2 ** 30).toFixed(1)} GiB (con số lý thuyết — phần mềm đào có thể tổ
              chức bảng khác đi một chút).
            </Field>
          </Card>
        )
      }}
    </Async>
  )
}

export default function Autolykos() {
  return (
    <>
      <p>
        Giống Bitcoin, Ergo dùng <strong>Proof-of-Work</strong>: để thêm một block, thợ đào phải tìm một con số (nonce) sao cho giá trị băm của header nhỏ hơn
        một ngưỡng gọi là <Link to="/learn/difficulty">target</Link>. Khác biệt nằm ở hàm được băm. Bitcoin dùng SHA-256 đôi — rất nhanh, và vì thế bị thống
        trị bởi máy ASIC chuyên dụng. Ergo dùng <strong>Autolykos</strong>, một thuật toán <em>memory-hard</em>: tốc độ đào bị giới hạn bởi băng thông bộ nhớ,
        thứ mà GPU phổ thông đã làm rất tốt.
      </p>

      <h2 id="y-tuong">Ý tưởng: bài toán k-sum</h2>
      <p>
        Hãy hình dung một bảng tra khổng lồ chỉ vừa trong bộ nhớ của card đồ hoạ. Mỗi lần thử đào là “chọn ngẫu nhiên 32 ô trong bảng, cộng lại, băm tổng, rồi
        xem có may mắn không”. Phần khó không nằm ở phép toán — mà ở việc phải đọc 32 ô từ một bảng nhiều gigabyte, hàng tỷ lần.
      </p>
      <p>Autolykos dựa trên bài toán k-sum: chọn ra k phần tử từ một danh sách lớn sao cho tổng của chúng thoả một điều kiện. Cụ thể trong v2, với k = {K}:</p>
      <ol>
        <li>
          Có một <strong>bảng</strong> gồm N phần tử, mỗi phần tử được sinh ra bằng cách băm chỉ số của nó cùng với độ cao block. Thợ đào tính sẵn toàn
          bộ bảng cho độ cao hiện tại và giữ nó trong VRAM của GPU.
        </li>
        <li>
          Với mỗi nonce thử, băm (thông điệp header ‖ nonce) để sinh ra <strong>{K} chỉ số</strong> giả ngẫu nhiên trong bảng.
        </li>
        <li>
          Lấy {K} phần tử tại các chỉ số đó, <strong>cộng lại</strong>, rồi băm tổng bằng <code>blake2b256</code>.
        </li>
        <li>
          Nếu kết quả (hiểu như một số nguyên) nhỏ hơn target → tìm thấy block. Nếu không → đổi nonce, làm lại.
        </li>
      </ol>
      <pre>
        <code>{`for nonce in 0, 1, 2, ...:
    idx[0..31] = genIndexes(hash(msg ‖ nonce), N)
    s = table[idx[0]] + table[idx[1]] + ... + table[idx[31]]
    if blake2b256(s) < target:
        return nonce   // 🎉 block mới`}</code>
      </pre>
      <p>
        Mỗi lần thử cần {K} lần đọc ngẫu nhiên vào một bảng hàng GB. Tính lại phần tử của bảng mỗi lần thay vì lưu thì chậm hơn nhiều, nên ai có nhiều băng
        thông bộ nhớ nhất sẽ đào nhanh nhất. Một ASIC muốn cạnh tranh cũng phải mang theo lượng bộ nhớ lớn và nhanh — tức là về cơ bản trở thành một chiếc GPU.
      </p>

      <h2 id="bang-n">Bảng N ngày càng lớn</h2>
      <p>
        Để giữ lợi thế cho phần cứng phổ thông trong dài hạn, kích thước bảng N tăng dần theo thời gian: bắt đầu từ 2<sup>26</sup> (≈ 67 triệu phần tử), rồi từ
        độ cao {num(N_INCREASE_START)} cứ mỗi {num(N_INCREASE_PERIOD)} block (~71 ngày) lại tăng 5%, và dừng tăng quanh độ cao {num(N_FREEZE_HEIGHT)}.
      </p>
      <table>
        <thead>
          <tr>
            <th>Độ cao</th>
            <th>N</th>
            <th>≈ N × 32 byte</th>
          </tr>
        </thead>
        <tbody>
          {[500_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000].map((h) => (
            <tr key={h}>
              <td className="tabular-nums">{num(h)}</td>
              <td className="font-mono tabular-nums">{num(calcN(h))}</td>
              <td className="tabular-nums">{((calcN(h) * 32) / 2 ** 30).toFixed(1)} GiB</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="v1-v2">Autolykos v1 và v2</h2>
      <p>
        Phiên bản đầu tiên (v1, từ khi mainnet ra mắt năm 2019) được thiết kế <strong>non-outsourceable</strong>: lời giải được ràng buộc với khoá bí mật của
        thợ đào, nhằm khiến việc tham gia pool trở nên rủi ro — pool nào giao việc cho thợ đào thì thợ đào có thể lấy luôn phần thưởng. Trên thực tế, điều này
        không ngăn được pool (họ dùng hợp đồng thông minh để chia thưởng), mà chỉ làm mọi thứ phức tạp hơn.
      </p>
      <p>
        Hard fork tại block <strong>{num(V2_ACTIVATION)}</strong> (tháng 2/2021) đưa vào <strong>Autolykos v2</strong>: bỏ tính non-outsourceable để pool đào hoạt
        động bình thường, và đưa vào cơ chế tăng N nói trên. Định dạng header vẫn giữ bốn trường{' '}
        <code>pk, w, n, d</code>, nhưng:
      </p>
      <ul>
        <li>
          <code>pk</code> vẫn là khoá công khai của thợ đào (hoặc pool) — người sẽ nhận phần thưởng.
        </li>
        <li>
          <code>w</code> luôn là điểm sinh <em>G</em> của secp256k1 (<code>0279be667e…</code>) — một hằng số giữ chỗ.
        </li>
        <li>
          <code>d</code> luôn là 0.
        </li>
        <li>
          <code>n</code> — nonce 8 byte — là phần duy nhất thật sự mang thông tin của lời giải.
        </li>
      </ul>

      <h2 id="block-that">Trên một block thật</h2>
      <p>Đây là lời giải của block mới nhất, lấy trực tiếp từ mạng chính:</p>
      <LivePow />
      <Callout type="tip" title="Kiểm chứng rẻ, tìm kiếm đắt">
        Tìm nonce cần hàng chục nghìn tỷ lần thử trên toàn mạng (với ~0.5 TH/s, khoảng 60 nghìn tỷ lần cho mỗi block 2 phút). Nhưng để kiểm tra, node chỉ cần tính lại {K} phần tử của bảng tại {K} chỉ số — không cần giữ cả
        bảng. Nhờ vậy một node chạy trên máy tính bình thường vẫn xác thực được mọi block.
      </Callout>

      <h2 id="xem-them">Xem thêm</h2>
      <ul>
        <li>
          <Link to="/learn/difficulty">Độ khó &amp; nBits</Link> — target được tính và điều chỉnh ra sao.
        </li>
        <li>
          <Link to="/learn/emission">Lịch phát hành</Link> — thợ đào nhận được bao nhiêu ERG cho mỗi block.
        </li>
        <li>
          <Link to="/learn/block">Block &amp; header</Link> — lời giải PoW nằm ở đâu trong header.
        </li>
      </ul>
    </>
  )
}
