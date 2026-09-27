import { Link } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { ago, erg, num, short, tokenAmount } from '../lib/format'
import { Async, Badge, Callout, Card, Hash } from '../components/ui'
import { TxFlow, isFeeBox } from '../components/TxFlow'

/** The first transaction of the latest block: the emission box being spent. */
function EmissionTx() {
  const state = useApi(async () => {
    const [latest] = await api.latestBlocks(1)
    return api.block(latest.height)
  }, [])
  return (
    <Async state={state}>
      {(b) => {
        const tx = b.transactions?.[0]
        if (!tx?.coinbase) return null
        return (
          <Card className="not-prose my-6 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="ergo">{tx.kind}</Badge>
              <span className="text-stone-500">
                giao dịch #0 của block <Link to={`/block/${b.height}`} className="font-mono text-ergo-600 hover:underline dark:text-ergo-400">{num(b.height)}</Link>
              </span>
              <Hash value={tx.id} to={`/tx/${tx.id}`} head={8} tail={6} className="ml-auto text-xs" />
            </div>
            <TxFlow tx={tx} limit={4} />
            <p className="mt-3 text-sm text-stone-500">
              Input là box phát hành. Output đầu tiên là chính box đó tạo lại, ít đi <strong>{erg(b.emission)} ERG</strong>; output thứ hai là box thưởng của thợ đào
              với {erg(b.emission)} ERG
              {b.reemitted > 0 && (
                <>
                  , trong đó {erg(b.reemitted)} ERG mang theo “Reemission Token” và phải nộp về hợp đồng tái phát hành khi tiêu (EIP-27) — thợ đào thực nhận{' '}
                  <strong>{erg(b.reward)} ERG</strong>
                </>
              )}
              . Tổng ERG vào bằng tổng ERG ra.
            </p>
          </Card>
        )
      }}
    </Async>
  )
}

/** Pick a recent, ordinary transaction: not coinbase, pays a fee, small enough to draw. */
async function pickExample() {
  const txs = (await api.latestTransactions(30)) ?? []
  const normal = txs.filter((t) => !t.coinbase && t.outputs?.some(isFeeBox) && t.inputs.length <= 6 && t.outputs.length <= 6)
  return normal.find((t) => t.outputs.some((o) => o.assets?.length)) ?? normal[0] ?? txs[0] ?? null
}

const sum = (boxes) => boxes.reduce((s, b) => s + Number(b.value), 0)

/** Per-token totals for inputs vs outputs. */
function tokenBalance(tx) {
  const map = new Map()
  const add = (boxes, key) =>
    boxes.forEach((b) =>
      (b.assets ?? []).forEach((a) => {
        const row = map.get(a.tokenId) ?? { tokenId: a.tokenId, name: a.name, decimals: a.decimals, in: 0, out: 0 }
        row[key] += Number(a.amount)
        map.set(a.tokenId, row)
      }),
    )
  add(tx.inputs, 'in')
  add(tx.outputs, 'out')
  return [...map.values()]
}

function Balance({ tx }) {
  const inSum = sum(tx.inputs)
  const outs = tx.outputs.filter((o) => !isFeeBox(o))
  const fee = sum(tx.outputs.filter(isFeeBox))
  const tokens = tokenBalance(tx)
  const firstInput = tx.inputs[0]?.boxId
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>ERG</th>
            <th className="text-right">nanoERG</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tổng inputs</td>
            <td className="text-right font-mono tabular-nums">{num(inSum)}</td>
          </tr>
          <tr>
            <td>Tổng outputs (không tính phí)</td>
            <td className="text-right font-mono tabular-nums">{num(sum(outs))}</td>
          </tr>
          <tr>
            <td>Box phí cho thợ đào</td>
            <td className="text-right font-mono tabular-nums">{num(fee)}</td>
          </tr>
          <tr>
            <td>
              <strong>Chênh lệch</strong>
            </td>
            <td className="text-right font-mono tabular-nums">
              <strong>{num(inSum - sum(tx.outputs))}</strong>
            </td>
          </tr>
        </tbody>
      </table>
      {tokens.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th className="text-right">Vào</th>
              <th className="text-right">Ra</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.tokenId}>
                <td>
                  <Link to={`/token/${t.tokenId}`}>{t.name || short(t.tokenId, 6, 4)}</Link>
                </td>
                <td className="text-right tabular-nums">{tokenAmount(t.in, t.decimals)}</td>
                <td className="text-right tabular-nums">{tokenAmount(t.out, t.decimals)}</td>
                <td className="text-sm">
                  {t.in === t.out
                    ? 'bảo toàn'
                    : t.out > t.in
                      ? t.tokenId === firstInput
                        ? 'phát hành mới (id = input đầu tiên)'
                        : 'tăng?'
                      : 'bị đốt (burn)'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

function Example({ tx }) {
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 font-bold text-stone-900 dark:text-white">
          <ScrollText className="size-5 shrink-0 text-ergo-500" />
          <Hash value={tx.id} to={`/tx/${tx.id}`} head={10} tail={8} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tx.kind && <Badge tone="ergo">{tx.kind}</Badge>}
          <Badge>
            block <Link to={`/block/${tx.height}`}>{num(tx.height)}</Link>
          </Badge>
          <Badge>{ago(tx.timestamp)}</Badge>
          <Badge>{num(tx.size)} byte</Badge>
        </div>
      </div>
      <TxFlow tx={tx} showRegisters />
    </Card>
  )
}

export default function Transaction() {
  const state = useApi(pickExample, [])
  return (
    <>
      <p>
        Một <strong>giao dịch</strong> trên Ergo làm đúng một việc: <em>tiêu</em> một số box đang tồn tại và <em>tạo</em> ra các box mới. Không có “trừ số dư tài
        khoản A, cộng số dư tài khoản B” — chỉ có box bị phá huỷ và box được sinh ra. Nếu chưa quen khái niệm box, hãy đọc <Link to="/learn/box">Box &amp; registers</Link>{' '}
        trước.
      </p>

      <h2 id="vi-du">Một giao dịch thật</h2>
      <p>
        Đây là một giao dịch vừa được xác nhận trên mainnet (tải lại trang để lấy ví dụ khác). Bên trái là các box bị tiêu, bên phải là các box được tạo ra. Mỗi
        box có một ô màu làm “dấu vân tay” để bạn dễ nhận ra nếu nó xuất hiện ở trang khác.
      </p>
      <Async state={state} notFound="Không tìm được giao dịch mẫu.">
        {(tx) => <Example tx={tx} />}
      </Async>

      <h2 id="thanh-phan">Ba loại đầu vào/đầu ra</h2>
      <h3>Inputs</h3>
      <p>
        Một input nói “hãy tiêu box này”. Nó gọi tên box bằng <code>boxId</code> và đính kèm một <strong>spending proof</strong> — bằng chứng rằng bạn được phép mở ổ
        khoá (script) của box đó. Với box của một ví thông thường, proof chỉ là một chữ ký Schnorr; với hợp đồng phức tạp, proof là một{' '}
        <Link to="/learn/sigma">sigma protocol</Link> tổng quát hơn. Input còn có thể mang <em>context extension</em>: các biến bổ sung mà script đọc khi chạy.
      </p>
      <h3>Data inputs</h3>
      <p>
        Đây là điểm Ergo khác biệt so với Bitcoin. Data input tham chiếu một box <strong>chỉ để đọc</strong>: script của giao dịch có thể xem giá trị và registers
        của nó, nhưng box không bị tiêu và không cần proof. Nhờ vậy, hàng trăm giao dịch trong cùng một block có thể cùng đọc một box giá oracle mà không tranh
        chấp nhau.
      </p>
      <h3>Outputs</h3>
      <p>
        Các box mới, mỗi box có giá trị ERG, script khoá, tuỳ chọn token và registers R4–R9. Output chưa bị tiêu nằm trong UTXO set cho tới khi một giao dịch khác
        dùng nó làm input.
      </p>

      <h2 id="bao-toan">Quy tắc bảo toàn</h2>
      <p>Mọi node kiểm tra các quy tắc sau trước khi chấp nhận giao dịch:</p>
      <ul>
        <li>
          <strong>ERG được bảo toàn:</strong> tổng giá trị inputs phải bằng đúng tổng giá trị outputs. Không có phí “ngầm” như Bitcoin — phí cũng là một output.
        </li>
        <li>
          <strong>Token không tự sinh ra:</strong> với mỗi token id, lượng ra ≤ lượng vào. Phần thiếu bị <em>đốt</em>. Ngoại lệ duy nhất: được phát hành token mới có
          id bằng <code>boxId</code> của input đầu tiên (xem <Link to="/learn/tokens">Token (EIP-4)</Link>).
        </li>
        <li>
          <strong>Mọi script của inputs đều được thoả mãn</strong> bởi spending proof tương ứng.
        </li>
        <li>
          <strong>Mỗi output có đủ giá trị tối thiểu</strong> theo kích thước của nó (chống spam UTXO set).
        </li>
      </ul>
      <p>Kiểm chứng trên giao dịch mẫu ở trên:</p>
      <Async state={state}>{(tx) => <Balance tx={tx} />}</Async>

      <h2 id="phi">Phí giao dịch</h2>
      <p>
        Bạn trả phí bằng cách tạo một output khoá bởi một script đặc biệt — <strong>fee contract</strong>. Chỉ thợ đào mới mở được ổ khoá này. Trên thực tế, thợ đào
        của block gom nó ngay: giao dịch cuối của block gom mọi box phí lại thành một box khoá cho khoá công khai của thợ đào, và box đó mở khoá sau 720 block.
        Trong sơ đồ ở trên, box phí có viền vàng. Các ví thường đặt phí từ khoảng <code>0.001</code> ERG trở lên.
      </p>
      <Callout type="tip" title="Phí = một box">
        Vì phí là một output bình thường, bạn thấy chính xác bao nhiêu phí được trả chỉ bằng cách nhìn giao dịch — không cần trừ tổng input cho tổng output.
      </Callout>

      <h2 id="tx-id">Transaction id</h2>
      <p>
        Id của giao dịch là hash Blake2b-256 của giao dịch đã tuần tự hoá <strong>không kèm spending proofs</strong>:
      </p>
      <pre>
        <code>{`txId = blake2b256( serialize(inputs(boxIds + extensions), dataInputs, outputs) )`}</code>
      </pre>
      <p>
        Bỏ proof ra ngoài quan trọng vì hai lý do. Thứ nhất, chữ ký phải ký lên chính các byte này — mà chữ ký không thể tự ký chính nó. Thứ hai, không ai đổi được id
        của một giao dịch bằng cách sửa chữ ký (vấn đề “transaction malleability” Bitcoin từng gặp).
      </p>
      <p>
        <code>boxId</code> của mỗi output cũng phụ thuộc vào txId và vị trí của output (R3 chứa <code>txId</code> + <code>index</code>), nên box id là duy nhất
        toàn mạng.
      </p>

      <h2 id="coinbase">Không có “coinbase” như Bitcoin</h2>
      <p>
        Trong Bitcoin, giao dịch đầu tiên của mỗi block là <em>coinbase</em>: một giao dịch đặc biệt <strong>không có input</strong>, tạo ra coin mới từ hư không
        và trả cho thợ đào. Ergo không có ngoại lệ như vậy. Toàn bộ ERG sẽ từng tồn tại đã được tạo ra <strong>một lần duy nhất</strong> ở block genesis. Phần dành cho thợ đào
        (~93.4 triệu ERG) nằm trong một box gọi là <strong>emission box</strong>, khoá bởi <em>emission contract</em>; phần còn lại (~4.33 triệu ERG) nằm
        trong box treasury riêng.
      </p>
      <p>
        Từ đó, phần thưởng block chỉ là một giao dịch bình thường: thợ đào <strong>tiêu emission box</strong> làm input và tạo hai output —
      </p>
      <ol>
        <li>
          <strong>Emission box mới</strong>: cùng script, giữ số ERG còn lại (bớt đi đúng lượng phát hành của độ cao này).
        </li>
        <li>
          <strong>Box thưởng</strong> cho thợ đào, khoá cho khoá công khai của thợ đào và chỉ tiêu được sau 720 block.
        </li>
      </ol>
      <p>
        Vì thế quy tắc bảo toàn ERG vẫn đúng ở cả giao dịch thưởng: tổng input bằng tổng output. Không cần chữ ký nào — chính script của emission contract kiểm
        tra output đầu tiên vẫn là emission box, và số ERG rút ra đúng theo <Link to="/learn/emission">lịch phát hành</Link> cho độ cao hiện tại. Explorer gắn nhãn
        giao dịch này là “Block reward” để dễ nhận ra, nhưng với giao thức nó không có gì đặc biệt.
      </p>
      <EmissionTx />
      <Callout type="note" title="EIP-27 làm gì ở đây?">
        Từ block 777,217, box thưởng còn mang theo <em>Reemission Token</em>. Khi tiêu box thưởng, thợ đào phải chuyển số ERG tương ứng với token đó vào hợp đồng
        tái phát hành; phần này sẽ được trả lại cho thợ đào với tốc độ 3 ERG/block sau khi lịch phát hành chính kết thúc.
      </Callout>
      <Async state={state}>
        {(tx) => (
          <p className="text-sm text-stone-500">
            Giao dịch mẫu trả {erg(sum(tx.outputs.filter(isFeeBox)))} ERG phí và nằm ở vị trí #{tx.index} trong block {num(tx.height)}.
          </p>
        )}
      </Async>
    </>
  )
}
