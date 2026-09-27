import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { erg, num, short } from '../lib/format'
import { Async, Badge, Callout, Card, Erg, Field, Hash, TokenChip } from '../components/ui'

/** Find a fresh output that carries at least two typed registers. */
async function pickBox() {
  const txs = (await api.latestTransactions(30)) ?? []
  for (const t of txs) {
    const o = t.outputs?.find((b) => b.registers?.length >= 2)
    if (o) return o
  }
  return txs[0]?.outputs?.[0] ?? null
}

/**
 * Decode a serialized Int/Long register (type byte + ZigZag-encoded VLQ).
 * Returns the intermediate steps so the article can show them.
 */
function decodeNumeric(raw) {
  const bytes = raw.match(/../g).map((h) => parseInt(h, 16))
  const [type, ...rest] = bytes
  let n = 0n
  let shift = 0n
  for (const b of rest) {
    n |= BigInt(b & 0x7f) << shift
    shift += 7n
    if (!(b & 0x80)) break
  }
  const value = n & 1n ? -((n + 1n) >> 1n) : n >> 1n
  return { type, vlq: rest, zigzag: n, value }
}

const TYPE_CODES = [
  ['0x01', 'Boolean'],
  ['0x02', 'Byte'],
  ['0x03', 'Short'],
  ['0x04', 'Int (32 bit)'],
  ['0x05', 'Long (64 bit)'],
  ['0x06', 'BigInt'],
  ['0x07', 'GroupElement (điểm trên secp256k1)'],
  ['0x08', 'SigmaProp'],
  ['0x0e', 'Coll[Byte] (mảng byte)'],
]

function Registers({ box }) {
  const r3 = `(${box.creationHeight}, ${short(box.transactionId, 8, 6)}, ${box.index})`
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 font-bold text-stone-900 dark:text-white">
          <Package className="size-5 shrink-0 text-ergo-500" />
          <Hash value={box.boxId} to={`/box/${box.boxId}`} head={10} tail={8} />
        </div>
        <Badge tone={box.spent || box.spentBy ? 'stone' : 'green'}>{box.spent || box.spentBy ? 'đã tiêu' : 'chưa tiêu (UTXO)'}</Badge>
      </div>
      <Field name="R0 · value" value={<Erg nano={box.value} />}>
        Số ERG trong box, lưu bằng nanoERG ({num(box.value)}). Bắt buộc.
      </Field>
      <Field name="R1 · script" value={<code className="font-mono text-xs break-all">{short(box.ergoTree, 40, 20)}</code>}>
        ErgoTree — điều kiện để tiêu box. Địa chỉ{' '}
        <Link to={`/address/${box.address}`} className="text-ergo-600 hover:underline dark:text-ergo-400">
          {short(box.address, 8, 6)}
        </Link>{' '}
        chỉ là cách viết gọn của script này. Xem <Link to="/learn/ergotree" className="text-ergo-600 hover:underline dark:text-ergo-400">ErgoTree</Link>.
      </Field>
      <Field
        name="R2 · tokens"
        value={
          box.assets?.length ? (
            <div className="flex flex-wrap gap-1">
              {box.assets.map((a) => (
                <TokenChip key={a.tokenId} asset={a} />
              ))}
            </div>
          ) : (
            <span className="text-stone-400">(trống)</span>
          )
        }
      >
        Danh sách cặp (token id, số lượng). Có thể trống.
      </Field>
      <Field name="R3 · creation info" value={<code className="font-mono text-xs">{r3}</code>}>
        (creationHeight, id giao dịch tạo ra box, vị trí output). Height khai báo lúc tạo box — dùng cho <Link to="/learn/storage-rent" className="text-ergo-600 hover:underline dark:text-ergo-400">phí lưu trữ</Link>.
      </Field>
      {box.registers.map((r) => {
        const numeric = /^0[45]/.test(r.raw) ? decodeNumeric(r.raw) : null
        return (
          <Field key={r.key} name={`${r.key} · ${r.type}`} value={<code className="font-mono text-xs break-all">{r.value}</code>}>
            Bytes thô: <code className="font-mono break-all">{r.raw}</code>
            {numeric && (
              <>
                {' '}— byte đầu <code>0x{numeric.type.toString(16).padStart(2, '0')}</code> là mã kiểu, phần còn lại là VLQ ={' '}
                <code>{numeric.zigzag.toString()}</code>, giải ZigZag → <code>{numeric.value.toString()}</code>.
              </>
            )}
          </Field>
        )
      })}
    </Card>
  )
}

export default function Box() {
  const state = useApi(pickBox, [])
  return (
    <>
      <p>
        Trên Ergo, tiền không nằm trong “tài khoản”. Nó nằm trong những <strong>box</strong> — mỗi box giống một chiếc hộp có khoá, có số ERG bên trong, có thể
        đựng token và dán thêm tối đa sáu “nhãn” dữ liệu. Toàn bộ trạng thái của blockchain chính là tập hợp mọi box chưa bị tiêu (UTXO set).
      </p>

      <h2 id="eutxo">Mô hình eUTXO</h2>
      <p>
        Bitcoin dùng UTXO: mỗi output chỉ có giá trị và một script khoá. Ergo <em>mở rộng</em> (extended UTXO) theo hai hướng:
      </p>
      <ul>
        <li>
          Box mang <strong>dữ liệu tuỳ ý</strong> trong registers và <strong>token</strong> gốc của giao thức.
        </li>
        <li>
          Script khoá được thấy <strong>toàn bộ giao dịch</strong> đang tiêu nó: các output khác, data inputs, height hiện tại… Nhờ vậy hợp đồng có thể ra lệnh “chỉ
          được tiêu box này nếu output #0 trả lại cho tôi ít nhất 10 ERG”.
        </li>
      </ul>
      <p>
        Box là <strong>bất biến</strong>: không có lệnh “sửa” box. Muốn thay đổi trạng thái, giao dịch tiêu box cũ và tạo box mới. Hợp đồng cần “nhớ” trạng thái giữa các lần dùng (một oracle, một DEX pool) chỉ đơn giản là một chuỗi các box nối tiếp nhau, thường được nhận diện bằng
        một NFT đi theo.
      </p>

      <h2 id="registers">Mười registers: R0 – R9</h2>
      <p>Mỗi box có tối đa 10 registers. Bốn register đầu là bắt buộc và có ý nghĩa cố định:</p>
      <table>
        <thead>
          <tr>
            <th>Register</th>
            <th>Nội dung</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>R0</code>
            </td>
            <td>Giá trị ERG (nanoERG, kiểu Long)</td>
          </tr>
          <tr>
            <td>
              <code>R1</code>
            </td>
            <td>Script khoá, dạng ErgoTree đã tuần tự hoá</td>
          </tr>
          <tr>
            <td>
              <code>R2</code>
            </td>
            <td>Token: danh sách (token id, số lượng)</td>
          </tr>
          <tr>
            <td>
              <code>R3</code>
            </td>
            <td>(creationHeight, txId, output index)</td>
          </tr>
          <tr>
            <td>
              <code>R4</code>–<code>R9</code>
            </td>
            <td>Tuỳ chọn, do người tạo box đặt. Mỗi register có kiểu rõ ràng. Phải được dùng liên tiếp (có R6 thì phải có R4, R5).</td>
          </tr>
        </tbody>
      </table>

      <h2 id="vi-du">Một box thật</h2>
      <p>
        Đây là một output vừa được tạo trên mainnet có dùng registers tuỳ chọn. Các box kiểu này thường là của hợp đồng — oracle giá, DEX, sàn NFT… — lưu trạng
        thái vào R4–R9.
      </p>
      <Async state={state} notFound="Không tìm được box mẫu.">
        {(box) => <Registers box={box} />}
      </Async>

      <h3>Registers được mã hoá thế nào?</h3>
      <p>
        Mỗi register được lưu dưới dạng một <em>hằng số có kiểu</em>: byte đầu tiên cho biết kiểu dữ liệu, sau đó là giá trị. Số nguyên dùng mã hoá ZigZag + VLQ: VLQ ghi một số bằng đúng số byte nó cần, còn ZigZag đưa số âm về các số dương nhỏ để chúng cũng ngắn.
      </p>
      <table>
        <thead>
          <tr>
            <th>Mã kiểu</th>
            <th>Kiểu</th>
          </tr>
        </thead>
        <tbody>
          {TYPE_CODES.map(([c, t]) => (
            <tr key={c}>
              <td>
                <code>{c}</code>
              </td>
              <td>{t}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Ví dụ: <code>04e8d403</code> → kiểu <code>0x04</code> (Int), VLQ <code>e8 d4 03</code> = 60008, ZigZag giải ra <code>30004</code>.
      </p>

      <h2 id="box-id">Box id</h2>
      <p>
        <code>boxId = blake2b256(bytes của box)</code>, trong đó bytes gồm tất cả các register R0–R9. Vì R3 chứa id giao dịch và vị trí output, hai box không bao giờ
        trùng id — kể cả khi có cùng số tiền và cùng chủ.
      </p>
      <Callout type="tip" title="Tự kiểm tra">
        Mỗi input của một giao dịch chỉ là một <code>boxId</code> 32 byte. Node tra id đó trong UTXO set; nếu không thấy (đã tiêu hoặc không tồn tại) thì giao dịch
        bị từ chối — đó là cách chống tiêu hai lần.
      </Callout>

      <h2 id="gia-tri-toi-thieu">Giá trị tối thiểu</h2>
      <p>
        Mỗi box chiếm chỗ trong UTXO set mà mọi node phải lưu. Để không ai có thể lấp đầy nó bằng hàng triệu box rỗng, mỗi box phải chứa ít nhất{' '}
        <strong>360 nanoERG cho mỗi byte</strong> kích thước của nó (giá trị mặc định; thợ đào có thể bỏ phiếu thay đổi). Một box ví thông thường cỡ vài chục đến
        vài trăm byte, nên mức tối thiểu chỉ khoảng {erg(360 * 100)}–{erg(360 * 300)} ERG. Trên thực tế các ví thường dùng <code>0.001</code> ERG cho mỗi box chứa
        token.
      </p>
      <p>
        Box nằm yên quá 4 năm còn phải trả <Link to="/learn/storage-rent">phí lưu trữ</Link> — một cơ chế độc đáo khác của Ergo.
      </p>

      <h2 id="gioi-han">Giới hạn của box và registers</h2>
      <p>Vài con số cứng mà mọi giao dịch phải tôn trọng — biết trước sẽ tránh được nhiều lỗi khi tự tạo box:</p>
      <table>
        <thead>
          <tr>
            <th>Giới hạn</th>
            <th>Giá trị</th>
            <th>Ý nghĩa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kích thước box</td>
            <td><strong>4,096 byte</strong> (4 KB)</td>
            <td>Toàn bộ box — giá trị, script, token và registers — sau khi tuần tự hoá phải gọn trong 4 KB.</td>
          </tr>
          <tr>
            <td>Số loại token</td>
            <td><strong>255</strong></td>
            <td>Mỗi box mang tối đa 255 token id khác nhau (số lượng mỗi token thì tới 2<sup>63</sup> − 1).</td>
          </tr>
          <tr>
            <td>Registers</td>
            <td><strong>10</strong> (R0–R9)</td>
            <td>R0–R3 luôn có. R4–R9 tuỳ chọn nhưng phải dùng <em>liền nhau</em>: muốn có R5 thì phải có R4, không được bỏ trống ở giữa.</td>
          </tr>
          <tr>
            <td>Giá trị tối thiểu</td>
            <td>360 nanoERG × kích thước</td>
            <td>Box lớn nhất có thể (4,096 byte) cần {num(4096 * 360)} nanoERG ≈ {erg(4096 * 360)} ERG — vẫn rất nhỏ.</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip" title="0.001 ERG chỉ là thói quen của ví">
        Con số 1,000,000 nanoERG (0.001 ERG) mà nhiều ví dùng làm “giá trị tối thiểu” là mặc định của phần mềm ví, không phải luật đồng thuận. Luật thật là 360
        nanoERG mỗi byte, nên một box nhỏ chỉ cần vài chục nghìn nanoERG — nhưng dùng 0.001 ERG thì không bao giờ sai.
      </Callout>

      <h2 id="guard-script">Guard script: ổ khoá của box</h2>
      <p>
        Đoạn script trong register R1 được gọi là <strong>guard script</strong> (script bảo vệ). Nó không “chạy chương trình” theo nghĩa thông thường. Nó chỉ chạy khi
        một giao dịch muốn tiêu box: node đưa cho script toàn bộ ngữ cảnh — giao dịch đang xét, các input, output, data input và độ cao hiện tại — và script phải
        trả lời <strong>đúng</strong>. Trả lời sai, hay chứng minh (chữ ký) không hợp lệ, thì toàn bộ giao dịch bị từ chối. Vì thế cộng đồng Cardano và Ergo hay
        gọi các script này là <em>validator</em> hơn là “hợp đồng thông minh”.
      </p>
      <p>
        Guard script được lưu dưới dạng byte đã biên dịch (<Link to="/learn/ergotree">ErgoTree</Link>), còn ngôn ngữ để viết nó là ErgoScript. Mục{' '}
        <Link to="/learn/ergotree#guard-script">Guard script</Link> trong bài ErgoScript đi sâu hơn. Vì địa chỉ được suy
        ra từ script, hai box có script giống hệt nhau sẽ có cùng địa chỉ. Một số ổ khoá phổ biến:
      </p>
      <table>
        <thead>
          <tr>
            <th>Dạng</th>
            <th>ErgoScript</th>
            <th>Ai mở được</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Khoá công khai (P2PK)</td>
            <td><code>sigmaProp(pk)</code></td>
            <td>Người giữ khoá bí mật của <code>pk</code> — chính là ví thông thường.</td>
          </tr>
          <tr>
            <td>Khoá thời gian</td>
            <td><code>sigmaProp(HEIGHT &gt; 1200000) &amp;&amp; pk</code></td>
            <td>Chủ khoá, nhưng chỉ sau khi chuỗi vượt block 1,200,000.</td>
          </tr>
          <tr>
            <td>Multisig / ngưỡng</td>
            <td><code>atLeast(2, Coll(pk1, pk2, pk3))</code></td>
            <td>Bất kỳ 2 trong 3 người cùng ký.</td>
          </tr>
          <tr>
            <td>Điều kiện về giao dịch</td>
            <td><code>sigmaProp(OUTPUTS(0).value &gt;= SELF.value)</code></td>
            <td>Ai cũng tiêu được, miễn output đầu tiên giữ ít nhất số ERG của box này — nền tảng của hợp đồng nhiều bước.</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn" title="ErgoScript cố ý không Turing-complete">
        Một số tài liệu gọi ErgoScript là ngôn ngữ Turing-complete; thực ra thì ngược lại: nó không có vòng lặp không giới hạn hay đệ quy, nhờ vậy node tính được
        chi phí chạy script <em>trước</em> khi chạy và phí giao dịch mới ổn định. “Turing-complete” ở Ergo đạt được ở cấp blockchain — bằng cách nối nhiều giao dịch
        tiêu box này tạo box kia — chứ không phải trong một script. Xem <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link>.
      </Callout>

      <h2 id="xem-them">Tiếp theo</h2>
      <ul>
        <li>
          <Link to="/learn/transaction">Giao dịch</Link> — box được tiêu và tạo ra thế nào.
        </li>
        <li>
          <Link to="/learn/tokens">Token (EIP-4)</Link> — R2 và các registers metadata.
        </li>
        <li>
          <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link> — bên trong R1.
        </li>
        <li>
          <a href="https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e" target="_blank" rel="noreferrer">
            Learning Ergo 101: eUTXO explained for human beings
          </a>{' '}
          — bài viết ngoài (tiếng Anh) giải thích mô hình eUTXO dưới góc nhìn người xây ứng dụng.
        </li>
        <li>
          <a href="https://deco-education.github.io/deco-docs/docs/into-the-woods/trail1-eutxo-n-nfts/registers-guardscripts-ergoscript" target="_blank" rel="noreferrer">
            DECO Education — Registers, Guard Scripts, ErgoScript
          </a>{' '}
          — bài học trong khoá “Into the Woods” (tiếng Anh) về registers, giới hạn của box và các dạng guard script.
        </li>
      </ul>
    </>
  )
}
