import { Link } from 'react-router-dom'
import { Ban, Coins, FileCode2, Hourglass, Network, Scale, ShieldCheck, Users } from 'lucide-react'
import { MAX_SUPPLY } from '../lib/ergo'
import { num } from '../lib/format'
import { Callout, Card } from '../components/ui'

const SOURCE = 'https://ergoplatform.org/en/blog/2021-04-26-the-ergo-manifesto/'

// The genesis treasury box, as stated in the whitepaper (§7.1).
const TREASURY = 4_330_791.5

const PRINCIPLES = [
  {
    icon: Network,
    title: 'Phi tập trung là trên hết',
    text: 'Không có điểm tập trung nào trong phát triển, khai thác hay quản trị. Phi tập trung lớn lên nhờ giáo dục, tài liệu minh bạch và cộng đồng tham gia — không phải nhờ cưỡng chế.',
    how: <>Autolykos v2 là PoW memory-hard, thân thiện với GPU để việc đào không rơi vào tay vài nhà máy ASIC.</>,
    to: '/learn/autolykos',
  },
  {
    icon: ShieldCheck,
    title: 'Mở, không cần cấp phép, an toàn',
    text: 'Giao thức không giới hạn loại ứng dụng. Mã nguồn mở và kiểm toán được. Ai cũng tham gia được; không cứu trợ, không danh sách đen, không phân biệt đối xử ở tầng giao thức. Quyền riêng tư là tuỳ chọn.',
    how: <>Sigma protocols đưa công cụ riêng tư vào ngay trong ngôn ngữ — ví dụ ký với tư cách “một người trong nhóm” mà không lộ là ai (chữ ký vòng) — có sẵn, dùng hay không là quyền của bạn.</>,
    to: '/learn/sigma',
  },
  {
    icon: Users,
    title: 'Dành cho người bình thường',
    text: 'Người dùng phổ thông phải chạy được full node và đào được. Ưu tiên giao dịch ngang hàng hơn là qua trung gian, cùng với giáo dục và công cụ dễ tiếp cận.',
    how: <>GPU phổ thông vẫn đào được Ergo, và node có thể xác minh mà không cần giữ toàn bộ lịch sử.</>,
    to: '/learn/mining-basics',
  },
  {
    icon: FileCode2,
    title: 'Nền tảng cho “tiền hợp đồng”',
    text: 'Ergo là tầng nền cho các hợp đồng tài chính, với phí thấp và cách triển khai hiệu quả để giao dịch thường ngày không trở thành gánh nặng.',
    how: <>Mô hình box eUTXO và ErgoScript: hợp đồng luôn chạy y hệt nhau, và bạn biết phí trước khi gửi.</>,
    to: '/learn/ergotree',
  },
  {
    icon: Hourglass,
    title: 'Tầm nhìn dài hạn',
    text: 'Theo đuổi nguyên tắc thay vì chu kỳ thị trường. Ergo ra đời giữa “mùa đông crypto” và phải tiếp tục thích nghi, tồn tại như hạ tầng có giá trị thật.',
    how: <>Storage rent giữ blockchain gọn và trả thu nhập cho thợ đào rất lâu sau khi phát hành kết thúc.</>,
    to: '/learn/storage-rent',
  },
]

export default function Manifesto() {
  return (
    <>
      <p>
        Tháng 4/2021, blog của Ergo Platform đăng <strong>The Ergo Manifesto</strong> — bản tuyên ngôn giải thích <em>vì sao</em> Ergo tồn tại, chứ không chỉ nó
        hoạt động thế nào. Nếu các bài khác trên trang này nói về box, script và thuật toán, thì bài này nói về những giá trị đứng sau các lựa chọn thiết kế đó.
      </p>
      <Callout type="note" title="Về bài viết này">
        Đây là phần tóm tắt và diễn giải bằng lời của chúng tôi, không phải bản dịch. Bạn nên đọc{' '}
        <a href={SOURCE} target="_blank" rel="noreferrer">
          bản gốc tiếng Anh
        </a>
        .
      </Callout>

      <h2 id="nguon-goc">Quay về gốc rễ cypherpunk</h2>
      <p>
        Tuyên ngôn bắt đầu từ Bitcoin: ra đời ngay sau khủng hoảng tài chính và những gói cứu trợ ngân hàng năm 2009, Bitcoin cho thấy mọi người có thể tự nắm giữ
        và trao đổi giá trị trực tiếp với nhau, không cần trung gian. Cả một ngành công nghiệp đã mọc lên từ ý tưởng đó.
      </p>
      <p>
        Nhưng theo tuyên ngôn, sau cơn sốt 2017 tinh thần ban đầu đã bị pha loãng: quảng cáo thổi phồng và đầu cơ giá lấn át việc xây dựng công cụ hữu ích, và
        nhiều dự án sống bằng cách “ăn” chính những người mới đến. Blockchain lại bị các tập đoàn dùng chủ yếu để cắt giảm chi phí. Ergo muốn đi ngược xu hướng đó:
        dùng blockchain như công cụ cho <strong>hợp tác ngang hàng và tương trợ</strong>, phục vụ người bình thường, hợp tác xã và doanh nghiệp nhỏ.
      </p>

      <h2 id="vi-sao-quan-trong">Vì sao điều này quan trọng?</h2>
      <p>
        Khi kinh tế khủng hoảng, người giàu, doanh nghiệp lớn — và cả tội phạm — đều có cách tự bảo vệ tài sản; người dân bình thường thì không. Tuyên ngôn lấy ví
        dụ đồng tiền mất giá ở Thổ Nhĩ Kỳ: khi hệ thống tài chính tập trung thất bại, người chịu thiệt nhất là những người không có lối thoát. Blockchain có thể là
        lối thoát đó — <em>nếu</em> nó thật sự phi tập trung, không lưu ký (bạn tự giữ khoá) và ai cũng dùng được.
      </p>

      <h3>Khi tiền bị biến thành vũ khí</h3>
      <p>Tuyên ngôn cảnh báo rằng tiền kỹ thuật số của ngân hàng trung ương (CBDC) có thể bị dùng để kiểm soát người dân theo ít nhất ba cách:</p>
      <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Hourglass, t: 'Tiền có “hạn dùng”', d: 'Số dư có thể bị buộc hết hạn hoặc bị huỷ — một hình thức tước đoạt.' },
          { icon: Scale, t: 'Chi tiêu có điều kiện', d: 'Quyền tiêu tiền gắn với việc “tuân thủ”, trở thành công cụ dập tắt bất đồng.' },
          { icon: Ban, t: 'Kiểm duyệt thị trường', d: 'Chặn quyền truy cập thị trường, phá huỷ chủ quyền tiền tệ của cá nhân.' },
        ].map((x) => (
          <Card key={x.t} className="p-4">
            <x.icon className="size-5 text-ergo-500" />
            <div className="mt-2 font-semibold text-stone-900 dark:text-white">{x.t}</div>
            <p className="mt-1 text-sm text-stone-500">{x.d}</p>
          </Card>
        ))}
      </div>

      <h3>Quyền riêng tư</h3>
      <p>
        Với tuyên ngôn, quyền riêng tư là nền móng của một xã hội tự do: nó cho phép con người tự quyết định mà không bị giám sát hay ép buộc, và bảo vệ tài sản
        trước những chính quyền độc đoán. Nhưng Ergo không <em>bắt buộc</em> riêng tư — nó cung cấp công cụ, còn dùng hay không là lựa chọn của mỗi người.
      </p>

      <h2 id="ergonomic-money">“Ergo.nomic money”</h2>
      <p>
        Cách chơi chữ trong tên gọi: tiền <strong>ergonomic</strong> — “tiện dụng”, được thiết kế quanh con người — phục vụ đời sống của người dùng thay vì bị dùng
        để bòn rút họ. Mục tiêu là những công cụ riêng tư, bền bỉ, chống kiểm duyệt mà người bình thường thực sự dùng được, nhất là những người dễ tổn thương nhất
        khi khủng hoảng ập đến.
      </p>

      <h2 id="nguyen-tac">Năm nguyên tắc cơ bản</h2>
      <p>
        Phần cốt lõi của tuyên ngôn là năm nguyên tắc. Dưới mỗi nguyên tắc, chúng tôi ghi thêm <em>nơi bạn thấy nó trong giao thức</em> — phần này là liên hệ của
        chúng tôi, không nằm trong bản gốc.
      </p>
      <div className="not-prose my-6 grid gap-4">
        {PRINCIPLES.map((p, i) => (
          <Card key={p.title} className="flex gap-4 p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ergo-50 text-ergo-600 dark:bg-ergo-950/50 dark:text-ergo-400">
              <p.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-stone-400 tabular-nums">{i + 1}</span>
                <h3 className="font-bold text-stone-900 dark:text-white">{p.title}</h3>
              </div>
              <p className="mt-1 text-[15px] leading-7 text-stone-600 dark:text-stone-400">{p.text}</p>
              <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:bg-stone-800/60 dark:text-stone-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200">Trong giao thức: </span>
                {p.how}{' '}
                <Link to={p.to} className="font-medium text-ergo-600 hover:underline dark:text-ergo-400">
                  Tìm hiểu →
                </Link>
              </p>
            </div>
          </Card>
        ))}
      </div>

      <h2 id="ra-mat-cong-bang">Ra mắt công bằng</h2>
      <p>
        Tuyên ngôn nhấn mạnh Ergo được ra mắt công bằng: <strong>không ICO, không pre-mine</strong> cho nhà sáng lập. Mọi ERG đều được đào ra theo một lịch phát
        hành cố định, viết cứng vào luật đồng thuận từ block đầu tiên.
      </p>
      <Card className="not-prose my-6 flex items-start gap-4 p-5">
        <Coins className="mt-0.5 size-6 shrink-0 text-ergo-500" />
        <div className="text-[15px] leading-7">
          Phần duy nhất không về tay thợ đào là quỹ phát triển (treasury) trong khoảng 2.5 năm đầu: 7.5 ERG/block, sau đó 4.5 rồi 1.5 ERG/block. Cộng lại là{' '}
          <strong>{num(TREASURY, 1)} ERG</strong> — khoảng <strong>{((TREASURY / MAX_SUPPLY) * 100).toFixed(2)}%</strong> tổng cung{' '}
          {num(MAX_SUPPLY)} ERG, và dù đã nằm sẵn trong một box từ block genesis, hợp đồng của box chỉ cho rút ra dần theo từng block.{' '}
          <Link to="/learn/emission" className="font-medium text-ergo-600 hover:underline dark:text-ergo-400">
            Xem lịch phát hành →
          </Link>
        </div>
      </Card>

      <h2 id="ergo-khong-phai">Ergo muốn là gì — và không muốn là gì</h2>
      <table>
        <thead>
          <tr>
            <th>Nên là</th>
            <th>Không nên là</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Công cụ cho người bình thường, hợp tác xã, doanh nghiệp nhỏ</td>
            <td>Công cụ cắt giảm chi phí cho tập đoàn</td>
          </tr>
          <tr>
            <td>Tài chính từ cơ sở, ngang hàng, tự giữ khoá</td>
            <td>Hệ thống lưu ký, phụ thuộc trung gian</td>
          </tr>
          <tr>
            <td>Hạ tầng riêng tư (tuỳ chọn), chống kiểm duyệt</td>
            <td>Công cụ giám sát và kiểm soát</td>
          </tr>
          <tr>
            <td>Hợp đồng thông minh chi phí hợp lý</td>
            <td>Nền tảng có cứu trợ, danh sách đen hay phân biệt đối xử</td>
          </tr>
          <tr>
            <td>Đào và phát triển phân tán rộng</td>
            <td>Tập trung quyền lực đào hay phát triển vào vài bên</td>
          </tr>
        </tbody>
      </table>

      <Callout type="tip" title="Từ triết lý đến kỹ thuật">
        Phần còn lại của trang này cho bạn thấy các nguyên tắc trên được biến thành code ra sao. Bắt đầu với{' '}
        <Link to="/learn/boxes">Box: những chiếc hộp giữ tiền</Link>.
      </Callout>

      <h2 id="doc-them">Đọc thêm</h2>
      <ul>
        <li>
          <a href={SOURCE} target="_blank" rel="noreferrer">
            The Ergo Manifesto
          </a>{' '}
          — blog Ergo Platform, 26/04/2021 (tiếng Anh).
        </li>
      </ul>
    </>
  )
}
