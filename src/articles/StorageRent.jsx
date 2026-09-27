import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { BLOCK_TIME_SEC, MIN_VALUE_PER_BYTE, STORAGE_FEE_FACTOR, STORAGE_PERIOD } from '../lib/ergo'
import { erg, num } from '../lib/format'
import { Callout, Card, Field } from '../components/ui'

const years = (blocks) => (blocks * BLOCK_TIME_SEC) / (365.25 * 86400)

function RentCalculator() {
  const [size, setSize] = useState(100)
  const [value, setValue] = useState(1)
  const [created, setCreated] = useState('')
  const info = useApi(() => api.info(), [])
  const height = info.data?.height

  const fee = size * STORAGE_FEE_FACTOR // nanoERG per period
  const minValue = size * MIN_VALUE_PER_BYTE
  const valueNano = Math.round(value * 1e9)
  const periodsLeft = Math.floor(valueNano / fee)
  const createdH = Number(created || (height ? height - 1_200_000 : 0))
  const claimableAt = createdH + STORAGE_PERIOD

  const input = 'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono tabular-nums outline-none focus:border-ergo-400 dark:border-stone-700 dark:bg-stone-900'

  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">Máy tính phí lưu trữ</div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Kích thước box (byte)</span>
          <input type="range" min="40" max="4096" value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-ergo-500" />
          <span className="font-mono text-xs text-stone-500">{num(size)} byte</span>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Giá trị box (ERG)</span>
          <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Tạo ở độ cao</span>
          <input
            type="number"
            min="0"
            placeholder={height ? String(height - 1_200_000) : ''}
            value={created}
            onChange={(e) => setCreated(e.target.value)}
            className={input}
          />
        </label>
      </div>
      <div className="mt-4">
        <Field name="Phí mỗi chu kỳ" value={<span className="font-mono">{num(size)} × {num(STORAGE_FEE_FACTOR)} = {erg(fee)} ERG</span>}>
          Thợ đào được lấy tối đa chừng này mỗi lần box “quá hạn”.
        </Field>
        <Field name="Giá trị tối thiểu" value={<span className="font-mono">{num(size)} × {MIN_VALUE_PER_BYTE} = {erg(minValue)} ERG</span>}>
          Box nhỏ hơn mức này không được phép tạo ra ngay từ đầu.
        </Field>
        <Field
          name="Box sống được"
          value={
            valueNano < fee ? (
              <span className="font-semibold text-amber-600">Chưa tới 1 chu kỳ — thợ đào có thể lấy toàn bộ box khi quá hạn.</span>
            ) : (
              <span>
                {num(periodsLeft)} chu kỳ ≈ {num(periodsLeft * years(STORAGE_PERIOD), 0)} năm nếu không bao giờ được động tới
              </span>
            )
          }
        />
        {height && (
          <Field
            name="Quá hạn từ block"
            value={
              <span className="font-mono">
                {num(claimableAt)}{' '}
                <span className="font-sans text-xs">
                  {claimableAt <= height ? (
                    <span className="font-semibold text-amber-600">— đã có thể bị thu phí (hiện tại: {num(height)})</span>
                  ) : (
                    <span className="text-stone-500">— còn {num(claimableAt - height)} block (≈ {years(claimableAt - height).toFixed(1)} năm)</span>
                  )}
                </span>
              </span>
            }
          />
        )}
      </div>
    </Card>
  )
}

export default function StorageRent() {
  return (
    <>
      <p>
        Mỗi node Ergo phải giữ toàn bộ tập box chưa tiêu (UTXO set) để xác thực giao dịch mới. Tập này chỉ có thể lớn dần: người ta tạo box mới liên tục, còn
        những box bị bỏ quên — ví mất seed, bụi token, thí nghiệm của lập trình viên — thì nằm đó mãi mãi. Trong Bitcoin, người dùng trả phí <em>một lần</em> khi
        tạo output, rồi được lưu trữ miễn phí vĩnh viễn trên máy của mọi node. Ergo trả lời câu hỏi “ai trả tiền cho việc lưu trữ vĩnh viễn?” bằng{' '}
        <strong>storage rent</strong> (phí lưu trữ, còn gọi là demurrage).
      </p>

      <h2 id="quy-tac">Quy tắc</h2>
      <p>
        Nếu một box nằm yên — không bị tiêu, không được “làm mới” — trong <strong>{num(STORAGE_PERIOD)} block</strong> (≈ {years(STORAGE_PERIOD).toFixed(0)}{' '}
        năm), thợ đào được phép động vào nó dù không có khoá:
      </p>
      <ul>
        <li>
          Nếu giá trị box <strong>lớn hơn</strong> phí: thợ đào lấy đúng phần phí, và phải tạo lại một box y hệt (cùng script, token, register) với giá trị đã
          trừ phí và độ cao tạo mới. Đồng hồ 4 năm bắt đầu lại.
        </li>
        <li>
          Nếu giá trị box <strong>nhỏ hơn</strong> phí: thợ đào lấy <strong>tất cả</strong> — cả ERG lẫn mọi token hay NFT bên trong — và box biến mất
          khỏi UTXO set.
        </li>
      </ul>
      <Callout type="warn" title="Token và NFT không được miễn">
        Phí trả bằng ERG, nhưng khi box không còn đủ ERG để trả thì thợ đào nhận cả box, kể cả token. Một box giữ NFT quý kèm lượng ERG tối thiểu chính là loại
        bị “dọn” đầu tiên nếu bị bỏ quên nhiều năm.
      </Callout>
      <p>Phí được tính theo kích thước box:</p>
      <pre>
        <code>{`fee = boxSizeInBytes × storageFeeFactor
storageFeeFactor = ${num(STORAGE_FEE_FACTOR)} nanoERG / byte  (= ${erg(STORAGE_FEE_FACTOR)} ERG / byte, giá trị mặc định)`}</code>
      </pre>
      <Callout type="note" title="Tham số có thể bỏ phiếu">
        <code>storageFeeFactor</code> và <code>minValuePerByte</code> là tham số của mạng. Thợ đào bỏ phiếu thay đổi chúng qua trường <code>votes</code> trong
        header, nên con số thực tế có thể khác giá trị mặc định ở trên. Riêng chu kỳ 4 năm thì khác: muốn đổi nó cần một hard fork — điều cộng đồng thường
        tránh.
      </Callout>

      <h2 id="vi-du">Ví dụ tính toán</h2>
      <p>
        Một box ví thông thường (P2PK, không có token) có kích thước cỡ 100 byte. Phí mỗi chu kỳ là 100 × {num(STORAGE_FEE_FACTOR)} ={' '}
        {num(100 * STORAGE_FEE_FACTOR)} nanoERG = <strong>{erg(100 * STORAGE_FEE_FACTOR)} ERG mỗi 4 năm</strong>. Với box chứa 10 ERG, phí này là 1.25% sau
        mỗi 4 năm — và chỉ phát sinh nếu bạn không đụng tới ví trong suốt 4 năm. Chỉ cần gửi tiền cho chính mình một lần là đồng hồ đặt lại.
      </p>
      <p>
        Bài giải thích chính thức của Ergo ước tính mức thu điển hình là <strong>khoảng 0.14 ERG cộng phí giao dịch</strong> cho mỗi box — cao hơn chút so với
        con số 100 byte ở trên vì box ví thực tế thường lớn hơn một ít. Cũng theo bài đó, một box chứa <strong>1 ERG</strong> phải nằm im hoàn toàn khoảng{' '}
        <strong>32 năm</strong> thì thợ đào mới lấy hết được — với box 100 byte, đó đúng là 8 chu kỳ × 0.125 ERG. Máy tính bên dưới bắt đầu đúng từ trường hợp
        đó.
      </p>
      <RentCalculator />

      <h2 id="gia-tri-toi-thieu">Giá trị tối thiểu của box</h2>
      <p>
        Mặt kia của storage rent là quy tắc <strong>giá trị tối thiểu</strong>: mỗi box phải chứa ít nhất <code>{MIN_VALUE_PER_BYTE} nanoERG × kích thước</code>{' '}
        (mặc định). Nhờ vậy không ai tạo được hàng triệu box “bụi” gần như miễn phí để làm phình UTXO set. Đó là lý do một output tối thiểu trong ví thường vào
        khoảng 0.001 ERG — dư sức trên mức tối thiểu cho những box lớn hơn, có token.
      </p>

      <h2 id="vi-sao-tot">Vì sao đây là điều tốt</h2>
      <ul>
        <li>
          <strong>Chặn phình trạng thái</strong>: dữ liệu bị bỏ quên dần dần được dọn khỏi UTXO set, nên chi phí chạy node không tăng mãi mãi.
        </li>
        <li>
          <strong>Dọn “bụi”</strong>: những lượng coin lặt vặt rải rác trong hàng nghìn box bị quên là thứ bị dọn đầu tiên, vì chúng không đủ trả dù chỉ một
          chu kỳ phí.
        </li>
        <li>
          <strong>Thu nhập ổn định cho thợ đào</strong>: sau khi phát hành kết thúc, storage rent là nguồn thu không phụ thuộc vào việc mạng đông hay vắng — bổ
          sung cho phí giao dịch và <Link to="/learn/emission">tái phát hành EIP-27</Link>.
        </li>
        <li>
          <strong>Coin bị mất quay về lưu thông</strong>: ERG trong ví mất seed không bị “khoá chết” vĩnh viễn như với Bitcoin, mà chậm rãi chảy về cho thợ đào. Nhờ vậy coin tiếp tục lưu thông, làm dịu hiệu ứng giảm phát mà mọi đồng coin có nguồn cung cố định đều gặp khi
          người dùng mất khoá.
        </li>
        <li>
          <strong>Công bằng</strong>: người chiếm nhiều chỗ lưu trữ (box lớn) trả nhiều hơn người chiếm ít.
        </li>
      </ul>
      <Callout type="tip" title="Đã xảy ra thật">
        Mainnet Ergo ra mắt tháng 7/2019, nên những box đầu tiên chạm mốc {num(STORAGE_PERIOD)} block vào khoảng giữa năm 2023 — từ đó, phí lưu trữ không còn là lý thuyết
        mà là một phần có thật của kinh tế mạng chính.
      </Callout>

      <h2 id="lam-sao-tranh">Làm sao để không bị thu phí?</h2>
      <p>
        Rất đơn giản: thỉnh thoảng (ít hơn 4 năm một lần) hãy tiêu box — ví dụ gửi toàn bộ số dư cho chính mình. Box mới được tạo ra với độ cao mới, và đồng hồ
        bắt đầu lại.
      </p>
      <p>
        Phí tính <em>theo từng box</em>, nên <strong>gom box</strong> cũng có ích: gửi toàn bộ số dư về một địa chỉ trong một giao dịch sẽ gộp nhiều box nhỏ
        thành vài box lớn — ít box có thể bị thu phí hơn, và box nào cũng còn rất xa ngưỡng nguy hiểm.
      </p>
      <p>
        Muốn hiểu kích thước một box đến từ đâu? Xem <Link to="/learn/box">Box &amp; registers</Link>.
      </p>

      <h2 id="doc-them">Đọc thêm</h2>
      <ul>
        <li>
          <a href="https://ergoplatform.org/en/blog/2022-02-18-ergo-explainer-storage-rent/" target="_blank" rel="noreferrer">
            Ergo Explainer: Storage Rent
          </a>{' '}
          — blog Ergo Platform, 18/02/2022 (tiếng Anh).
        </li>
      </ul>
    </>
  )
}
