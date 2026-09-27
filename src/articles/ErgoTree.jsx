import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { decodeAddress, P2PK_TREE_PREFIX } from '../lib/ergo'
import { short } from '../lib/format'
import { Async, Badge, Callout, Card, Field, Hash } from '../components/ui'
import { isFeeBox } from '../components/TxFlow'

const FEE_TREE =
  '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304'

const TONES = {
  header: 'bg-ergo-100 text-ergo-800 dark:bg-ergo-900/50 dark:text-ergo-200',
  type: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  op: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  data: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rest: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
}

/** Coloured hex segments with a legend underneath. */
function Bytes({ parts }) {
  return (
    <div className="not-prose my-6">
      <div className="rounded-xl border border-stone-200 bg-white p-4 font-mono text-sm leading-7 break-all dark:border-stone-800 dark:bg-stone-900">
        {parts.map((p, i) => (
          <span key={i} className={`mr-0.5 rounded px-1 py-0.5 ${TONES[p.tone]}`} title={p.label}>
            {p.hex}
          </span>
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {parts.map((p, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`shrink-0 rounded px-1.5 font-mono text-xs leading-6 ${TONES[p.tone]}`}>
              {p.hex.length > 10 ? p.hex.slice(0, 6) + '…' : p.hex}
            </span>
            <span className="text-stone-600 dark:text-stone-400">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveP2PK() {
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) => {
        const b = blocks?.[0]
        let tree = null
        try {
          tree = b?.minerAddress ? decodeAddress(b.minerAddress).ergoTree : null
        } catch {
          tree = null
        }
        if (!tree) return <p>Không lấy được địa chỉ thợ đào của block mới nhất.</p>
        return (
          <>
            <p>
              Đây là ErgoTree của địa chỉ đã đào block <Link to={`/block/${b.height}`}>#{b.height.toLocaleString('en-US')}</Link> (
              {b.miner || 'thợ đào'}): <Hash value={b.minerAddress} to={`/address/${b.minerAddress}`} />
            </p>
            <Bytes
              parts={[
                { hex: '00', tone: 'header', label: 'Header: version 0, không tách hằng số, không kèm kích thước' },
                { hex: '08', tone: 'type', label: 'Mã kiểu SigmaProp — phần thân là một hằng số kiểu SigmaProp' },
                { hex: 'cd', tone: 'op', label: 'ProveDlog: “chứng minh bạn biết khoá bí mật của pubkey sau”' },
                { hex: tree.slice(6), tone: 'data', label: 'Khoá công khai nén 33 byte (GroupElement trên secp256k1)' },
              ]}
            />
          </>
        )
      }}
    </Async>
  )
}

const DECO = 'https://deco-education.github.io/deco-docs/docs/into-the-woods/trail1-eutxo-n-nfts/registers-guardscripts-ergoscript'

/** Guard script “kind” of a box, judged from its address type and a few well-known trees. */
function kindOf(box) {
  if (isFeeBox(box)) return { label: 'Hợp đồng phí', tone: 'ergo', note: 'P2S — chỉ thợ đào gom được; box thưởng nhận về bị khoá 720 block' }
  try {
    const d = decodeAddress(box.address)
    if (d.type === 1) return { label: 'P2PK', tone: 'green', note: 'sigmaProp(pk) — cần chữ ký của chủ khoá' }
    if (d.type === 2) return { label: 'P2SH', tone: 'violet', note: 'hash của script — script lộ ra khi tiêu' }
    return { label: 'P2S', tone: 'sky', note: 'script tuỳ biến — một hợp đồng thật' }
  } catch {
    return { label: '?', tone: 'stone', note: '' }
  }
}

/** Outputs of the newest transactions, labelled by the kind of guard script that locks them. */
function LiveGuards() {
  const state = useApi(() => api.latestTransactions(6), [])
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">Ổ khoá của các box vừa được tạo trên mainnet</div>
      <Async state={state}>
        {(txs) => {
          const outs = txs.flatMap((t) => t.outputs.map((o) => ({ ...o, txId: t.id }))).slice(0, 10)
          return (
            <div className="divide-y divide-stone-100 text-sm dark:divide-stone-800">
              {outs.map((o) => {
                const k = kindOf(o)
                return (
                  <div key={o.boxId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <Hash value={o.boxId} to={`/box/${o.boxId}`} head={6} tail={4} copy={false} className="w-28" />
                    <Badge tone={k.tone}>{k.label}</Badge>
                    <span className="min-w-0 flex-1 truncate text-stone-500">{k.note}</span>
                    <span className="font-mono text-[11px] text-stone-400">R1 = {short(o.ergoTree, 10, 6)}</span>
                  </div>
                )
              })}
            </div>
          )
        }}
      </Async>
      <p className="mt-3 text-xs text-stone-500">
        Phần lớn box là P2PK — ví thông thường. Mỗi giao dịch còn tạo một box phí (P2S). Thỉnh thoảng bạn sẽ thấy box P2S dài ngoằng: đó là các hợp đồng DeFi, oracle
        hay đúc token.
      </p>
    </Card>
  )
}

export default function ErgoTree() {
  return (
    <>
      <p>
        Mỗi <Link to="/learn/box">box</Link> trên Ergo đều mang theo một đoạn mã quyết định <em>ai</em> (hoặc <em>điều kiện gì</em>) được phép tiêu nó. Đoạn
        mã đó được lưu trên blockchain dưới dạng <strong>ErgoTree</strong> — một cây cú pháp đã được tuần tự hoá thành byte. Còn thứ mà lập trình viên viết
        ra là <strong>ErgoScript</strong>, một ngôn ngữ có cú pháp giống Scala, được biên dịch xuống ErgoTree.
      </p>
      <p>
        Nói cách khác: ErgoScript dành cho con người, ErgoTree dành cho node. Node không bao giờ nhìn thấy ErgoScript — nó chỉ đọc byte và thực thi cây.
      </p>

      <h2 id="ergoscript">ErgoScript: hợp đồng trông như thế nào?</h2>
      <p>Một hợp đồng ErgoScript là một biểu thức trả về <code>SigmaProp</code> — một “mệnh đề cần được chứng minh”. Ví dụ đơn giản:</p>
      <pre>
        <code>{`{
  // Chỉ Alice mới tiêu được box này, và chỉ sau block 1,000,000
  sigmaProp(HEIGHT > 1000000) && alicePk
}`}</code>
      </pre>
      <p>Biểu thức này có hai phần:</p>
      <ul>
        <li>
          <code>sigmaProp(HEIGHT &gt; 1000000)</code> — một điều kiện boolean thông thường, được node tự kiểm tra từ ngữ cảnh (độ cao block hiện tại).
        </li>
        <li>
          <code>alicePk</code> — một <Link to="/learn/sigma">sigma proposition</Link>: người tiêu phải tạo ra bằng chứng mật mã rằng họ biết khoá bí mật của
          Alice.
        </li>
      </ul>
      <p>
        Script có thể đọc rất nhiều thứ trong ngữ cảnh giao dịch: <code>SELF</code> (chính box đang bị tiêu), <code>INPUTS</code>, <code>OUTPUTS</code>,{' '}
        <code>CONTEXT.dataInputs</code>, <code>HEIGHT</code>, các register <code>R4</code>–<code>R9</code> của bất kỳ box nào… Nhờ vậy một box có thể tự đặt
        luật cho giao dịch tiêu nó — ví dụ “output đầu tiên phải trả ít nhất 100 ERG về địa chỉ này”. Đây chính là chữ “extended” trong{' '}
        <strong>eUTXO</strong>.
      </p>
      <Callout type="tip" title="Không có vòng lặp vô hạn">
        ErgoScript không có vòng lặp tự do hay đệ quy. Chi phí thực thi của mỗi script được ước lượng và giới hạn, nên một hợp đồng không bao giờ có thể làm
        node “treo”. Muốn làm logic nhiều bước, bạn chuỗi nhiều giao dịch lại với nhau.
      </Callout>

      <h2 id="guard-script">Guard script: chương trình ErgoScript thật sự làm gì</h2>
      <p>
        Một chương trình ErgoScript đặt vào register R1 của box được gọi là <strong>guard script</strong>: nó quyết định <em>ai</em> và <em>trong điều kiện
        nào</em> được tiêu box. Trên Ergo không có gì khác ngoài box và guard script, nên trước khi nhìn vào từng byte, hãy xem guard script dùng để làm gì.
      </p>
      <LiveGuards />

      <h2 id="guard-validator">Guard script là một validator, không phải một chương trình</h2>
      <p>
        Trên Ethereum, hợp đồng là một chương trình có trạng thái riêng, và bạn “gọi hàm” của nó. Trên Ergo, guard script <strong>không chạy khi bạn gửi tiền vào
        box</strong> — nó chỉ chạy đúng một lần, khi có ai đó cố <em>tiêu</em> box. Khi đó node thực thi script với toàn bộ ngữ cảnh của giao dịch đang xét:
      </p>
      <table>
        <thead>
          <tr>
            <th>Biến trong ErgoScript</th>
            <th>Nghĩa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>SELF</code></td>
            <td>Chính box đang được tiêu — giá trị, token, registers của nó.</td>
          </tr>
          <tr>
            <td><code>INPUTS</code>, <code>OUTPUTS</code></td>
            <td>Mọi box đi vào và đi ra của giao dịch. Script có thể đòi hỏi output phải có hình dạng nhất định.</td>
          </tr>
          <tr>
            <td><code>CONTEXT.dataInputs</code></td>
            <td>Các box chỉ đọc (oracle, tham số) — xem <Link to="/learn/transaction">Giao dịch</Link>.</td>
          </tr>
          <tr>
            <td><code>HEIGHT</code></td>
            <td>Độ cao block hiện tại — dùng cho khoá thời gian.</td>
          </tr>
          <tr>
            <td><code>CONTEXT.minerPubKey</code></td>
            <td>Khoá của thợ đào block này — hợp đồng phí dùng nó.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Script phải trả về <strong>đúng</strong> thì box mới được tiêu; sai thì <em>cả giao dịch</em> bị từ chối và không có gì thay đổi. Vì thế cộng đồng Ergo và
        Cardano hay gọi guard script là <em>validator</em>: nó chỉ xác nhận hoặc bác bỏ một giao dịch mà bạn đã tự dựng sẵn, chứ không tự làm gì cả.
      </p>

      <h2 id="guard-sigma">Đúng/sai … cộng thêm chữ ký</h2>
      <p>
        Chính xác hơn, một guard script không trả về một bit đúng/sai đơn thuần mà trả về một <strong>mệnh đề sigma</strong> (<code>SigmaProp</code>). Node rút gọn
        script theo ngữ cảnh: các điều kiện thường (độ cao, giá trị output…) được tính ngay thành đúng/sai, còn phần “chứng minh bạn biết khoá bí mật” được giữ lại thành
        một cây điều kiện mật mã. Người tiêu box phải cung cấp chữ ký thoả cây đó — chữ ký ấy chính là <em>spending proof</em> đi kèm input. Toàn bộ cơ chế nằm trong{' '}
        <Link to="/learn/sigma">Sigma protocols</Link>.
      </p>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-600">
            <CheckCircle2 className="size-4" /> Box được tiêu khi
          </div>
          <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>mọi điều kiện thường trong script đều đúng, và</li>
            <li>chữ ký (proof) thoả phần mật mã còn lại, và</li>
            <li>chi phí chạy script nằm trong giới hạn.</li>
          </ul>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 font-semibold text-red-600">
            <XCircle className="size-4" /> Giao dịch bị từ chối khi
          </div>
          <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>bất kỳ input nào có script trả về sai,</li>
            <li>thiếu hoặc sai chữ ký cho một input,</li>
            <li>hoặc script rút gọn thành <code>false</code> tuyệt đối (box “bị đốt” vĩnh viễn — không ai tiêu được).</li>
          </ul>
        </Card>
      </div>

      <h2 id="guard-kinds">Những dạng guard script thường gặp</h2>
      <p>Viết bằng ErgoScript, biên dịch thành ErgoTree (cấu trúc byte ở phần dưới) rồi đặt vào R1:</p>
      <h3>1. Khoá công khai — ví thông thường (P2PK)</h3>
      <pre>
        <code>{`sigmaProp(pk)   // pk là khoá công khai của bạn`}</code>
      </pre>
      <p>
        Chỉ người có khoá bí mật tương ứng mới ký được. Mọi địa chỉ bắt đầu bằng <code>9</code> đều là script này với khoá khác nhau — xem{' '}
        <Link to="/learn/address">Địa chỉ</Link>.
      </p>
      <h3>2. Khoá thời gian</h3>
      <pre>
        <code>{`sigmaProp(HEIGHT > 1200000) && pk`}</code>
      </pre>
      <p>Chủ khoá vẫn phải ký, nhưng giao dịch chỉ hợp lệ khi chuỗi đã vượt block 1,200,000. Dùng cho vesting, ký quỹ có hạn.</p>
      <h3>3. Nhiều chữ ký / ngưỡng</h3>
      <pre>
        <code>{`atLeast(2, Coll(pk1, pk2, pk3))   // 2 trong 3 người
pk1 && pk2                          // cả hai cùng ký
pk1 || pk2                          // một trong hai — chữ ký vòng`}</code>
      </pre>
      <h3>4. Điều kiện về output — hợp đồng nhiều bước</h3>
      <pre>
        <code>{`sigmaProp(
  OUTPUTS(0).value >= SELF.value &&
  OUTPUTS(0).propositionBytes == SELF.propositionBytes
)`}</code>
      </pre>
      <p>
        Ai cũng tiêu được box này, miễn là output đầu tiên giữ ít nhất số ERG cũ <em>và</em> mang đúng script này. Box “tự tái sinh” như vậy là cách Ergo xây các hợp
        đồng có trạng thái: emission contract, oracle pool, DEX đều là biến thể của mẫu này. Xem giao dịch thưởng block trong{' '}
        <Link to="/learn/transaction#coinbase">Giao dịch</Link>.
      </p>
      <h3>5. Khoá bằng hash (HTLC)</h3>
      <pre>
        <code>{`sigmaProp(blake2b256(getVar[Coll[Byte]](0).get) == expectedHash) && pk`}</code>
      </pre>
      <p>
        Người tiêu phải tiết lộ một bí mật có hash cho trước (đưa qua biến ngữ cảnh <code>getVar</code>). Kết hợp với khoá thời gian, đây là nền của atomic swap
        xuyên chuỗi.
      </p>

      <h2 id="guard-address">Script quyết định địa chỉ</h2>
      <p>
        Địa chỉ Ergo chỉ là cách mã hoá ErgoTree cho dễ đọc, nên <strong>hai box có guard script giống hệt nhau thì có cùng địa chỉ</strong>. Đó là lý do mọi box phí trên
        mạng đều nằm ở một địa chỉ P2S duy nhất (bắt đầu bằng <code>2iHkR7…</code>), và vì sao “số dư của một hợp đồng” chỉ là tổng các box mang script đó. Bạn có
        thể tự tách một địa chỉ ra script bằng <Link to="/tools/address-decoder">công cụ giải mã địa chỉ</Link>.
      </p>

      <h2 id="ergotree-layout">Cấu trúc byte của ErgoTree</h2>
      <p>
        Mục này dành cho ai muốn đọc một cây từng byte một, như công cụ giải mã địa chỉ vẫn làm. Nếu bạn chỉ quan tâm hợp đồng <em>làm gì</em>, có thể nhảy
        xuống ví dụ hợp đồng phí bên dưới. Một ErgoTree tuần tự hoá gồm bốn phần, theo đúng thứ tự:
      </p>
      <ol>
        <li>
          <strong>Header</strong> (1 byte): 3 bit thấp là version; bit <code>0x08</code> báo có trường kích thước đi kèm; bit <code>0x10</code> báo cây dùng{' '}
          <em>constant segregation</em>.
        </li>
        <li>
          <strong>Kích thước</strong> (tuỳ chọn) — độ dài phần còn lại của cây, ghi dạng VLQ (một kiểu số nguyên nén, dài ngắn tuỳ giá trị). Bắt buộc từ
          ErgoTree version 1 trở đi, để node có thể bỏ qua cây mà không cần hiểu hết nó.
        </li>
        <li>
          <strong>Danh sách hằng số</strong> (nếu có constant segregation): số lượng, rồi từng hằng số dạng <code>kiểu ‖ giá trị</code>.
        </li>
        <li>
          <strong>Thân cây</strong>: chính biểu thức, ghi dưới dạng opcode rồi tới các toán hạng — phép toán đi trước, rồi tới những thứ nó tác động (duyệt
          theo thứ tự tiền tố).
        </li>
      </ol>
      <Card className="not-prose my-6 p-2 sm:p-4">
        <Field name="0x00" value="Version 0, không tách hằng số">
          Dạng gọn nhất. Hằng số nằm ngay trong thân cây. Hầu hết địa chỉ ví P2PK dùng header này.
        </Field>
        <Field name="0x10" value="Version 0 + constant segregation">
          Hằng số được tách ra đầu cây, thân cây chỉ còn các “chỗ giữ” (<code>ConstantPlaceholder</code>, opcode <code>0x73</code>).
        </Field>
        <Field name="0x18 / 0x19…" value="Có kèm kích thước, version ≥ 0/1">
          Thêm bit <code>0x08</code> (size flag). Version 1 trở lên luôn có kích thước.
        </Field>
      </Card>

      <h2 id="p2pk">Giải phẫu một cây P2PK: 0008cd…</h2>
      <p>
        Hợp đồng phổ biến nhất trên Ergo là “chỉ chủ của khoá công khai này được tiêu” — tương đương ErgoScript <code>{'{ pk }'}</code>. Mọi địa chỉ ví thông
        thường (bắt đầu bằng chữ <code>9</code>) đều biểu diễn cây này. Nó luôn có dạng <code>{P2PK_TREE_PREFIX}</code> + 33 byte khoá công khai:
      </p>
      <LiveP2PK />
      <p>
        Chỉ 36 byte. Đó là lý do <Link to="/learn/address">địa chỉ P2PK</Link> không lưu cả cây mà chỉ lưu 33 byte khoá công khai — ví và node luôn biết cách
        dựng lại cây bằng cách thêm <code>0008cd</code> vào trước.
      </p>

      <h2 id="constant-segregation">Constant segregation: tách hằng số ra khỏi logic</h2>
      <p>
        Hãy tưởng tượng một nghìn người cùng dùng một hợp đồng khoá thời gian, chỉ khác nhau ở khoá công khai và độ cao mở khoá. Nếu hằng số nằm lẫn trong
        cây, mỗi box là một chuỗi byte khác nhau hoàn toàn. Với <strong>constant segregation</strong>, mọi hằng số được kéo lên đầu cây, thân cây chỉ chứa
        tham chiếu <code>7300</code>, <code>7301</code>… (placeholder số 0, số 1…). Lợi ích:
      </p>
      <ul>
        <li>
          <strong>Nhận diện template</strong>: hai box dùng cùng một hợp đồng có cùng phần thân, dù hằng số khác nhau. Explorer và dApp nhận ra loại hợp đồng
          chỉ bằng cách so thân cây.
        </li>
        <li>
          <strong>Cache</strong>: node có thể phân tích/ước lượng chi phí phần thân một lần rồi dùng lại.
        </li>
        <li>
          <strong>Thay hằng số</strong>: script có thể dùng <code>substConstants</code> để tạo ra một cây mới từ template bằng cách thay một hằng số — hợp đồng
          phí dưới đây dùng đúng mẹo này.
        </li>
      </ul>

      <h2 id="fee-contract">Ví dụ thật: hợp đồng phí cho thợ đào</h2>
      <p>
        Trên Ergo, phí giao dịch không phải là “phần chênh lệch” như Bitcoin. Người gửi tạo hẳn một <strong>output phí</strong>, khoá bởi một ErgoTree cố định
        mà mọi ví đều dùng. Đây là cây đó (105 byte):
      </p>
      <Bytes
        parts={[
          { hex: '10', tone: 'header', label: 'Header 0x10: version 0, có constant segregation' },
          { hex: '05', tone: 'type', label: 'Có 5 hằng số' },
          { hex: '0400', tone: 'data', label: 'Hằng số #0: Int 0' },
          { hex: '0400', tone: 'data', label: 'Hằng số #1: Int 0' },
          { hex: FEE_TREE.slice(12, 124), tone: 'data', label: 'Hằng số #2: Coll[Byte] 54 byte — bản thân nó là một ErgoTree (template “phần thưởng thợ đào”)' },
          { hex: FEE_TREE.slice(124, 134), tone: 'data', label: 'Hằng số #3: Coll[Int](1) — vị trí hằng số cần thay trong substConstants; hằng số #4: Int 1 — cho điều kiện OUTPUTS.size == 1' },
          { hex: FEE_TREE.slice(134), tone: 'op', label: 'Thân cây: các opcode tham chiếu tới hằng số qua 73xx' },
        ]}
      />
      <p>Viết lại bằng ErgoScript, ý nghĩa của nó xấp xỉ:</p>
      <pre>
        <code>{`{
  val out = OUTPUTS(0)
  // Template 54 byte: sigmaProp(HEIGHT >= creationHeight + 720) && <pk giữ chỗ>
  // Thay pk giữ chỗ bằng khoá công khai của thợ đào đang đào block này
  val rewardScript = substConstants(template, Coll(1), Coll(proveDlog(decodePoint(minerPubKey))))
  sigmaProp(
    HEIGHT == out.creationInfo._1 &&        // output được tạo ngay trong block này
    out.propositionBytes == rewardScript && // ...và khoá cho thợ đào, chờ 720 block
    OUTPUTS.size == 1                       // ...và không có output nào khác
  )
}`}</code>
      </pre>
      <p>
        Không ai cần ký để tiêu box phí. Bất kỳ ai cũng có thể “tiêu” nó — nhưng hợp đồng ép buộc tiền chỉ được chuyển vào một box khoá cho{' '}
        <code>minerPubKey</code> (khoá của thợ đào block hiện tại, lấy từ header), và box đó chỉ mở được sau 720 block (~1 ngày). Thực tế thợ đào tự đưa giao
        dịch gom phí này vào block của mình.
      </p>
      <Callout type="note" title="Vì sao lại là khoá của điểm G?">
        Bên trong template 54 byte có một khoá công khai bắt đầu bằng <code>0279be667e…</code> — đó là điểm sinh <em>G</em> của đường cong secp256k1, dùng làm
        giá trị “giữ chỗ” để <code>substConstants</code> thay bằng khoá của thợ đào. Bạn sẽ gặp lại điểm G trong trường <code>w</code> của{' '}
        <Link to="/learn/autolykos">lời giải Autolykos v2</Link>.
      </Callout>

      <h2 id="costing">Chi phí thực thi</h2>
      <p>
        Mỗi phép toán trong ErgoTree có một chi phí (cost). Khi xác thực giao dịch, node cộng dồn chi phí của mọi script đầu vào; nếu vượt giới hạn của block
        (một tham số mà thợ đào có thể bỏ phiếu thay đổi), giao dịch bị từ chối. Đây là cách Ergo cho phép hợp đồng mạnh mẽ mà không cần “gas” như Ethereum:
        không có vòng lặp không giới hạn nên chi phí luôn bị chặn, và node dừng script ngay khi chi phí cộng dồn vượt giới hạn (từ bản 5.0, chi phí được tính
        trong lúc chạy thay vì ước lượng trước).
      </p>

      <h2 id="xem-them">Xem thêm</h2>
      <ul>
        <li>
          <Link to="/learn/sigma">Sigma protocols</Link> — thứ thật sự nằm ở “lá” của mỗi cây.
        </li>
        <li>
          <Link to="/learn/address">Địa chỉ</Link> — ErgoTree được đóng gói thành địa chỉ ra sao.
        </li>
        <li>
          <Link to="/tools/address-decoder">Công cụ giải mã địa chỉ</Link> — dán một địa chỉ bất kỳ để xem ErgoTree của nó.
        </li>
              <li>
          <a href={DECO} target="_blank" rel="noreferrer">
            DECO Education — Registers, Guard Scripts, ErgoScript
          </a>{' '}
          (tiếng Anh).
        </li>
      </ul>
    </>
  )
}
