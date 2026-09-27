import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Lock, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { Async, Callout, Erg } from '../components/ui'
import { TxFlow, isFeeBox } from '../components/TxFlow'

/** A single illustrated box. */
function Box({ amount, owner, tone = 'stone', faded = false }) {
  const tones = {
    stone: 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900',
    ergo: 'border-ergo-300 bg-ergo-50 dark:border-ergo-800 dark:bg-ergo-950/40',
    amber: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  }
  return (
    <div className={`relative w-32 rounded-xl border-2 p-3 text-center ${tones[tone]} ${faded ? 'opacity-50 line-through' : ''}`}>
      <Lock className="absolute -top-3 left-1/2 size-6 -translate-x-1/2 rounded-full bg-white p-1 text-stone-600 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700" />
      <div className="mt-1 text-lg font-bold text-stone-900 dark:text-white">{amount}</div>
      <div className="text-xs text-stone-500">{owner}</div>
    </div>
  )
}

function SpendDiagram() {
  return (
    <div className="not-prose my-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900/50">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">
            <Flame className="size-3.5" /> Bị tiêu (phá huỷ)
          </div>
          <div className="flex gap-3">
            <Box amount="7 ERG" owner="khoá của An" />
            <Box amount="5 ERG" owner="khoá của An" />
          </div>
        </div>
        <ArrowRight className="size-8 text-ergo-500" />
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">
            <Sparkles className="size-3.5" /> Được tạo mới
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Box amount="10 ERG" owner="khoá của Bình" tone="ergo" />
            <Box amount="1.999 ERG" owner="khoá của An (tiền thừa)" />
            <Box amount="0.001 ERG" owner="phí thợ đào" tone="amber" />
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-stone-500">An gửi 10 ERG cho Bình: 7 + 5 = 10 + 1.999 + 0.001</p>
    </div>
  )
}

/** Pick a small, readable recent transaction to show as a real example. */
function RealTx() {
  const state = useApi(() => api.latestTransactions(30), [])
  return (
    <Async state={state}>
      {(txs) => {
        const simple = (t) => !t.coinbase && t.inputs.length <= 3 && t.outputs.length <= 4
        const tx = txs.find((t) => simple(t) && t.outputs.every((o) => !o.assets?.length)) ?? txs.find(simple) ?? txs[0]
        if (!tx) return null
        const fee = tx.outputs.find(isFeeBox)
        return (
          <div className="not-prose my-6">
            <TxFlow tx={tx} />
            <p className="mt-3 text-sm text-stone-500">
              Giao dịch <Link to={`/tx/${tx.id}`} className="font-mono text-ergo-600 hover:underline dark:text-ergo-400">{tx.id.slice(0, 12)}…</Link> ở
              block {tx.height}: {tx.inputs.length} box bị tiêu, {tx.outputs.length} box mới được tạo
              {fee && (
                <>
                  , trong đó có một box <Erg nano={fee.value} /> là phí cho thợ đào
                </>
              )}
              .
            </p>
          </div>
        )
      }}
    </Async>
  )
}

export default function BeginnerBoxes() {
  return (
    <>
      <p>
        Khi bạn mở ứng dụng ngân hàng, bạn thấy một con số: <em>số dư</em>. Ngân hàng giữ một bảng tính, mỗi dòng là một tài khoản,
        và chuyển tiền nghĩa là trừ dòng này, cộng dòng kia.
      </p>
      <p>
        Ergo <strong>không hoạt động như vậy</strong>. Trên Ergo không có “tài khoản” nào cả. Thay vào đó, tiền nằm trong những
        chiếc <strong>hộp</strong> — gọi là <strong>box</strong>.
      </p>

      <h2 id="box-la-gi">Box là gì?</h2>
      <p>Hãy tưởng tượng mỗi box là một chiếc hộp nhỏ bằng kính:</p>
      <ul>
        <li>Bên trong có một lượng <strong>ERG</strong> (và có thể có cả <Link to="/learn/tokens">token</Link> khác).</li>
        <li>
          Bên ngoài có một chiếc <strong>ổ khoá</strong>. Ổ khoá này là một đoạn luật (script) nói rằng ai được mở hộp.
        </li>
        <li>Ai cũng nhìn thấy trong hộp có gì, nhưng chỉ ai thoả mãn ổ khoá mới lấy được.</li>
      </ul>
      <p>
        “Số dư” mà ví hiển thị cho bạn thực ra chỉ là <strong>tổng giá trị của tất cả những box mà khoá của bạn mở được</strong>. Ví
        tự cộng lại cho bạn tiện theo dõi.
      </p>

      <h2 id="tieu-tien">Tiêu tiền = phá hộp cũ, đóng hộp mới</h2>
      <p>
        Box có một đặc điểm quan trọng: <strong>không thể mở một phần</strong>. Bạn không thể lấy 3 ERG ra khỏi một box 7 ERG rồi để
        4 ERG còn lại bên trong. Thay vào đó, một giao dịch sẽ:
      </p>
      <ol>
        <li>Mở (và phá huỷ) một hoặc nhiều box cũ — gọi là <strong>inputs</strong>.</li>
        <li>Tạo ra các box mới với ổ khoá mới — gọi là <strong>outputs</strong>.</li>
      </ol>
      <p>
        Tổng tiền đi vào phải bằng tổng tiền đi ra. Phần dư được trả lại cho chính bạn trong một box mới, gọi là <em>tiền thừa</em>{' '}
        (change) — giống như đưa tờ 500 nghìn để mua ly cà phê và nhận lại tiền thối.
      </p>
      <SpendDiagram />
      <p>
        Nhìn kỹ: phí giao dịch cũng là một box! Trên Ergo, phí được gửi vào một box đặc biệt mà chỉ thợ đào mới mở được. Thợ đào của block
        gom tất cả box phí trong block đó về một box thưởng của mình — và box thưởng ấy bị khoá 720 block (khoảng một ngày) trước khi tiêu được.
      </p>

      <h2 id="vi-du-that">Một giao dịch thật, ngay lúc này</h2>
      <p>Đây là một giao dịch vừa được đào gần đây trên mainnet. Bên trái là các box bị tiêu, bên phải là các box mới:</p>
      <RealTx />
      <p>
        Mỗi box có một <strong>box id</strong> riêng — một dấu vân tay duy nhất. Nhấn vào box id bất kỳ để xem chiếc hộp đó chứa gì
        và đã bị tiêu hay chưa.
      </p>

      <h2 id="utxo">UTXO và eUTXO</h2>
      <p>
        Những box chưa bị tiêu được gọi là <strong>UTXO</strong> (Unspent Transaction Output). Bitcoin cũng dùng mô hình này. Tập hợp
        tất cả UTXO chính là “trạng thái” hiện tại của blockchain: ai sở hữu gì.
      </p>
      <p>
        Ergo mở rộng thêm, nên gọi là <strong>eUTXO</strong> (extended UTXO): box của Ergo có thể chứa token, chứa dữ liệu tuỳ ý trong
        các “ngăn” gọi là <em>register</em>, và ổ khoá có thể là cả một hợp đồng thông minh chứ không chỉ một chữ ký.
      </p>

      <h2 id="vi-sao-tot">Vì sao thiết kế này hay?</h2>
      <ul>
        <li>
          <strong>Dự đoán được:</strong> trước khi gửi, bạn biết chính xác box nào bị tiêu và box nào được tạo. Không có bất ngờ.
        </li>
        <li>
          <strong>Song song:</strong> các giao dịch chạm vào những box khác nhau không ảnh hưởng lẫn nhau.
        </li>
        <li>
          <strong>An toàn:</strong> một box chỉ có thể bị tiêu đúng một lần. Tiêu hai lần (double-spend) là điều mạng từ chối ngay.
        </li>
      </ul>
      <p>
        Lập trình viên David Przybilla tóm tắt cách nhìn này rất gọn trong bài{' '}
        <a href="https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e" target="_blank" rel="noreferrer">
          Learning Ergo 101: eUTXO explained for human beings
        </a>
        : với người xây ứng dụng, Ergo chỉ là một tập hợp box, thao tác duy nhất là giao dịch, và bạn chỉ cần mô tả “thế giới sau giao dịch trông ra sao” — script
        trong mỗi box sẽ quyết định điều đó có được phép hay không.
      </p>

      <Callout type="note" title="Muốn đi sâu hơn?">
        Bài kỹ thuật <Link to="/learn/box">Box &amp; registers</Link> giải thích từng trường R0–R9, còn{' '}
        <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link> nói về “ổ khoá” được viết ra sao.
      </Callout>

      <h2 id="doc-them">Đọc thêm</h2>
      <ul>
        <li>
          <a href="https://dav009.medium.com/learning-ergo-101-blockchain-paradigm-eutxo-c90b0274cf5e" target="_blank" rel="noreferrer">
            Learning Ergo 101: eUTXO explained for human beings
          </a>{' '}
          — David Przybilla, 12/2021 (tiếng Anh). Cách nhìn của một lập trình viên: blockchain là một tập hợp box, giao dịch là thao tác duy nhất, script chỉ
          là “người kiểm duyệt” trả lời đúng/sai — rất hợp để đọc ngay sau bài này.
        </li>
      </ul>

      <h2 id="tiep-theo">Tiếp theo</h2>
      <p>
        Những ERG trong box ban đầu đến từ đâu? Đọc tiếp <Link to="/learn/erg">ERG và nguồn cung</Link>.
      </p>
    </>
  )
}
