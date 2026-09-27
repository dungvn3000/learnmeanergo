import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Callout, Card } from '../components/ui'

// Toy group for the demo: multiplicative group mod a small prime.
// Real Ergo uses the secp256k1 elliptic curve with 256-bit numbers.
const P = 2039n
const G = 7n
const ORDER = P - 1n

const modpow = (b, e, m) => {
  let r = 1n
  b %= m
  e = ((e % ORDER) + ORDER) % ORDER
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m
    b = (b * b) % m
    e >>= 1n
  }
  return r
}

function NumInput({ label, value, onChange, hint }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-stone-900 dark:text-white">{label}</span>
      <input
        type="number"
        min="1"
        max="2037"
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(2037, Number(e.target.value) || 1)))}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono tabular-nums outline-none focus:border-ergo-400 dark:border-stone-700 dark:bg-stone-900"
      />
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

function SchnorrDemo() {
  const [x, setX] = useState(1234)
  const [r, setR] = useState(777)
  const [e, setE] = useState(42)
  const [cheat, setCheat] = useState(false)

  const secret = BigInt(x)
  const h = modpow(G, secret, P) // public key
  const a = modpow(G, BigInt(r), P) // commitment
  // A cheater who does not know x uses a wrong secret when computing z.
  const used = cheat ? secret + 1n : secret
  const z = (((BigInt(r) + BigInt(e) * used) % ORDER) + ORDER) % ORDER
  const lhs = modpow(G, z, P)
  const rhs = (a * modpow(h, BigInt(e), P)) % P
  const ok = lhs === rhs

  const row = (step, who, text) => (
    <div className="grid grid-cols-[28px_1fr] gap-3 border-b border-stone-100 py-2.5 last:border-0 dark:border-stone-800">
      <span className="grid size-6 place-items-center rounded-full bg-ergo-500 text-xs font-bold text-white">{step}</span>
      <div className="min-w-0 text-sm">
        <span className="font-semibold text-stone-900 dark:text-white">{who}: </span>
        {text}
      </div>
    </div>
  )

  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">Thử nghiệm: Schnorr với số nhỏ (mod {String(P)}, g = {String(G)})</div>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumInput label="Khoá bí mật x" value={x} onChange={setX} hint="Chỉ người chứng minh biết" />
        <NumInput label="Số ngẫu nhiên r" value={r} onChange={setR} hint="Dùng một lần rồi bỏ" />
        <NumInput label="Thử thách e" value={e} onChange={setE} hint="Người xác minh chọn" />
      </div>
      <div className="mt-5 font-mono text-[13px]">
        {row(0, 'Công khai', <>h = gˣ mod p = <b>{String(h)}</b></>)}
        {row(1, 'Prover', <>gửi cam kết a = gʳ mod p = <b>{String(a)}</b></>)}
        {row(2, 'Verifier', <>gửi thử thách e = <b>{e}</b></>)}
        {row(3, 'Prover', <>gửi z = r + e·x mod (p−1) = <b>{String(z)}</b></>)}
        {row(4, 'Verifier', <>kiểm tra gᶻ = <b>{String(lhs)}</b> và a·hᵉ = <b>{String(rhs)}</b></>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cheat} onChange={(ev) => setCheat(ev.target.checked)} className="accent-ergo-500" />
          Giả làm kẻ gian (không biết x)
        </label>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          {ok ? <Check className="size-4" /> : <X className="size-4" />}
          {ok ? 'Bằng chứng hợp lệ' : 'Bằng chứng sai'}
        </span>
      </div>
    </Card>
  )
}

export default function SigmaProtocols() {
  return (
    <>
      <p>
        Sigma protocol là cách chứng minh “tôi biết một bí mật” — chẳng hạn khoá bí mật — mà không để lộ bí mật đó. Mọi chữ ký trên Ergo đều là một sigma
        protocol, và khác chữ ký thông thường, nhiều sigma protocol có thể ghép lại thành một bằng chứng duy nhất. Bài này giải thích cách nó hoạt động và vì
        sao điều đó quan trọng.
      </p>
      <p>
        Trong Bitcoin, “chữ ký” là thứ duy nhất một script có thể yêu cầu về mặt mật mã, và việc kết hợp nhiều chữ ký (multisig) được làm bằng các opcode khá
        vụng về. Ergo đi theo một hướng khác: mọi yêu cầu mật mã đều là một <strong>Σ-protocol</strong> (sigma protocol), và các Σ-protocol có thể được ghép
        với nhau bằng <code>&amp;&amp;</code>, <code>||</code> và <code>atLeast</code> ngay trong <Link to="/learn/ergotree">ErgoScript</Link>. Đây là lý do
        kiểu trả về của mọi hợp đồng là <code>SigmaProp</code>.
      </p>

      <h2 id="sigma-protocol-la-gi">Σ-protocol là gì?</h2>
      <p>
        Σ-protocol là một kiểu <strong>zero-knowledge proof</strong> ba bước giữa người chứng minh (prover) và người xác minh (verifier). Prover muốn chứng
        minh “tôi biết một bí mật” mà không tiết lộ bí mật đó:
      </p>
      <ol>
        <li>
          <strong>Commitment</strong>: prover chọn một số ngẫu nhiên và gửi đi một “cam kết”.
        </li>
        <li>
          <strong>Challenge</strong>: verifier gửi lại một thử thách ngẫu nhiên.
        </li>
        <li>
          <strong>Response</strong>: prover trả lời bằng một con số chỉ có thể tính được nếu biết bí mật.
        </li>
      </ol>
      <p>
        Hình dạng “tới – lui – tới” của ba bước này trông giống chữ Σ, nên mới có tên như vậy. Trên blockchain không có ai để “nói chuyện qua lại”, nên thử
        thách được thay bằng giá trị băm của thông điệp (giao dịch) và cam kết — kỹ thuật <strong>Fiat–Shamir</strong>. Kết quả là một bằng chứng không tương
        tác, chính là thứ nằm trong trường <code>spendingProof</code> của mỗi input.
      </p>

      <h2 id="prove-dlog">proveDlog: chữ ký Schnorr</h2>
      <p>
        Σ-protocol cơ bản nhất là <code>proveDlog(h)</code>: “tôi biết <em>x</em> sao cho <em>h = gˣ</em>”. Ở đây <em>g</em> là điểm sinh của đường cong
        secp256k1, <em>x</em> là khoá bí mật và <em>h</em> là khoá công khai. Sau khi áp dụng Fiat–Shamir, đây chính là <strong>chữ ký Schnorr</strong>. Mọi
        địa chỉ ví thông thường (P2PK) là một <code>proveDlog</code> — cây <code>0008cd…</code> mà bạn đã gặp.
      </p>
      <p>Hãy tự chơi với phiên bản đồ chơi dưới đây. Đổi bất kỳ số nào — phép kiểm tra vẫn đúng, miễn là prover thật sự biết x:</p>
      <SchnorrDemo />
      <p>
        Vì sao nó đúng? gᶻ = g<sup>r + e·x</sup> = gʳ · (gˣ)ᵉ = a · hᵉ. Kẻ không biết <em>x</em> phải đoán trước được <em>e</em> mới gian lận được — mà{' '}
        <em>e</em> được chọn <em>sau</em> khi cam kết đã gửi đi.
      </p>
      <Callout type="warn" title="Không bao giờ dùng lại r">
        Nếu cùng một <em>r</em> được dùng cho hai thử thách khác nhau, bất kỳ ai cũng giải ra được <em>x</em> từ hai câu trả lời. Ví thật sinh <em>r</em>{' '}
        ngẫu nhiên (hoặc tất định từ khoá và thông điệp) cho mỗi chữ ký.
      </Callout>

      <h2 id="prove-dh-tuple">proveDHTuple</h2>
      <p>
        Σ-protocol cơ bản thứ hai là <code>proveDHTuple(g, h, u, v)</code>: “tôi biết <em>x</em> sao cho <em>u = gˣ</em> <strong>và</strong>{' '}
        <em>v = hˣ</em>” — tức bộ bốn (g, h, u, v) là một bộ Diffie–Hellman. Đây là viên gạch để xây các giao thức riêng tư như ZeroJoin/mixer phi tập trung
        và chữ ký ẩn danh nâng cao, nơi người ta cần chứng minh hai giá trị liên quan tới cùng một bí mật mà không lộ ra bí mật đó.
      </p>

      <h2 id="ket-hop">Ghép Σ-protocol: AND, OR, atLeast</h2>
      <p>Điều kỳ diệu là Σ-protocol có thể được ghép lại mà kết quả vẫn là một Σ-protocol — và vẫn cho ra một bằng chứng duy nhất:</p>
      <table>
        <thead>
          <tr>
            <th>ErgoScript</th>
            <th>Ý nghĩa</th>
            <th>Ứng dụng</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>alice &amp;&amp; bob</code>
            </td>
            <td>Cả hai cùng ký</td>
            <td>Multisig 2-trên-2</td>
          </tr>
          <tr>
            <td>
              <code>alice || bob</code>
            </td>
            <td>Một trong hai ký — verifier không biết là ai</td>
            <td>Ring signature</td>
          </tr>
          <tr>
            <td>
              <code>atLeast(2, Coll(a, b, c))</code>
            </td>
            <td>Ít nhất 2 trong 3 cùng ký</td>
            <td>Threshold signature, ví công ty, quỹ DAO</td>
          </tr>
          <tr>
            <td>
              <code>(alice &amp;&amp; bob) || carol</code>
            </td>
            <td>Lồng tuỳ ý</td>
            <td>Chính sách ký phức tạp</td>
          </tr>
        </tbody>
      </table>

      <h3 id="ring">Ring signature: ký thay mặt cả nhóm</h3>
      <p>
        Ring signature nói “một trong những người này đã ký” mà không nói là ai. Với <code>alice || bob || carol</code>, prover chỉ cần biết <em>một</em> khoá
        bí mật.
      </p>
      <p>
        Mẹo nằm ở cách xử lý các nhánh còn lại. Với nhánh mà prover <em>không</em> biết bí mật, họ <em>mô phỏng</em> bằng chứng: chọn trước thử thách và câu
        trả lời, rồi tính ngược ra cam kết sao cho phương trình vẫn khớp. Nhánh thật thì chứng minh bình thường. Cuối cùng, các thử thách được ràng buộc để
        XOR của chúng bằng thử thách tổng — chính ràng buộc này ngăn ai đó mô phỏng <em>mọi</em> nhánh. Nhìn vào bằng chứng hoàn chỉnh, không ai phân biệt
        được nhánh thật với nhánh mô phỏng, nên không ai biết ai trong nhóm đã ký.
      </p>

      <h3 id="threshold">Threshold: k trên n</h3>
      <p>
        Chữ ký ngưỡng nói “ít nhất k trong n người này đã ký”. <code>atLeast(k, …)</code> dùng cùng mẹo mô phỏng: k người ký thật, n − k nhánh còn lại được
        mô phỏng, và các thử thách được ràng buộc với nhau bằng một đa thức thay vì XOR (cùng ý tưởng với chia sẻ bí mật Shamir). Kết quả vẫn là{' '}
        <strong>một</strong> bằng chứng, và người ngoài không biết k người nào đã ký.
      </p>
      <Callout type="tip" title="Không cần opcode đặc biệt">
        Trong Bitcoin, multisig cần <code>OP_CHECKMULTISIG</code> và lộ ra khoá của những người đã ký. Trên Ergo, multisig, ring và threshold chỉ là cách viết
        biểu thức — và phần “ai đã ký” được giữ kín một cách tự nhiên.
      </Callout>

      <h2 id="trong-giao-dich">Trong một giao dịch thật</h2>
      <p>Khi node xác thực một input, nó làm hai bước:</p>
      <ol>
        <li>
          <strong>Rút gọn</strong> ErgoTree với ngữ cảnh hiện tại: mọi phần boolean (như <code>HEIGHT &gt; 1000000</code>) được tính ra true/false. Phần còn
          lại là một cây Σ-protocol thuần tuý (hoặc hằng true/false).
        </li>
        <li>
          <strong>Kiểm tra bằng chứng</strong> trong <code>spendingProof</code> với cây Σ đó, lấy thông điệp là các byte của giao dịch.
        </li>
      </ol>
      <p>
        Ví dụ box phí thợ đào rút gọn thành <code>true</code> nếu giao dịch đúng khuôn, nên bằng chứng của nó rỗng — không cần ai ký. Xem thêm tại{' '}
        <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link> và <Link to="/learn/transaction">Giao dịch</Link>.
      </p>
    </>
  )
}
