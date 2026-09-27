import { Link } from 'react-router-dom'
import { Download, Gift, Landmark, Pickaxe } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { num } from '../lib/format'
import { Callout, Card } from '../components/ui'

const PDF = 'https://ergoplatform.org/uploads/whitepaper_668cb39ee5.pdf'
const WEB = 'https://docs.ergoplatform.com/doc/whitepaper/'

// The three genesis boxes (whitepaper §7.1). The whitepaper rounds the emission box to
// 93,409,132 ERG; on-chain it held 93,409,132.5 (block 1 spends it), which sums to MAX_SUPPLY.
const GENESIS = { noPremine: 1, treasury: 4_330_791.5, miners: 93_409_132.5 }

function Changed({ children }) {
  return (
    <Callout type="warn" title="Đã thay đổi từ 2019">
      {children}
    </Callout>
  )
}

function GenesisBoxes() {
  const net = useApi(() => api.networkState(), [])
  const total = GENESIS.noPremine + GENESIS.treasury + GENESIS.miners
  const boxes = [
    { icon: Gift, name: 'No-premine proof', value: GENESIS.noPremine, desc: 'Box không thể tiêu, chứa tiêu đề báo Guardian, Vedomosti, Xinhua và id block Bitcoin, Ethereum mới nhất lúc ra mắt — bằng chứng không ai đào trước.' },
    { icon: Landmark, name: 'Treasury', value: GENESIS.treasury, desc: 'Quỹ phát triển, khoá bằng chữ ký 2-trên-3, mở dần: 7.5 → 4.5 → 1.5 ERG/block trong ~2.5 năm đầu.' },
    { icon: Pickaxe, name: 'Miners reward', value: GENESIS.miners, desc: 'Hợp đồng phát hành: mỗi block trả phần thưởng cho thợ đào (khoá 720 block) và giữ phần còn lại trong chính nó.' },
  ]
  return (
    <div className="not-prose my-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {boxes.map((b) => (
          <Card key={b.name} className="p-4">
            <b.icon className="size-5 text-ergo-500" />
            <div className="mt-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{b.name}</div>
            <div className="text-lg font-bold tabular-nums text-stone-900 dark:text-white">{num(b.value, 1)} ERG</div>
            <p className="mt-1 text-sm text-stone-500">{b.desc}</p>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-sm text-stone-500">
        Tổng: <strong className="text-stone-800 dark:text-stone-200">{num(total, 1)} ERG</strong> — toàn bộ ERG sẽ từng tồn tại, đã nằm sẵn trong ba box này từ
        block genesis.
        {net.data && (
          <>
            {' '}
            Hôm nay đã phát ra {num(net.data.issued)} ERG ({((net.data.issued / total) * 100).toFixed(2)}%).
          </>
        )}
      </p>
    </div>
  )
}

export default function Whitepaper() {
  return (
    <>
      <p>
        <strong>Ergo: A Resilient Platform For Contractual Money</strong> là whitepaper chính thức của Ergo (phiên bản 1.0, 14/05/2019, tác giả “Ergo
        Developers”), công bố ngay trước khi mainnet ra mắt. Trang này đi qua từng phần của whitepaper, tóm tắt bằng lời của chúng tôi, chỉ ra chỗ nào{' '}
        <strong>đã thay đổi</strong> kể từ 2019, và dẫn tới bài giải thích chi tiết trên trang này.
      </p>
      <div className="not-prose my-6 flex flex-wrap gap-3">
        <a href={PDF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ergo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ergo-600">
          <Download className="size-4" /> Whitepaper (PDF)
        </a>
        <a href={WEB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold hover:border-stone-400 dark:border-stone-700">
          Bản web trên docs.ergoplatform.com
        </a>
      </div>

      <h2 id="tom-tat">Tóm tắt</h2>
      <p>
        Ergo là một blockchain linh hoạt dành cho hợp đồng tài chính an toàn. Mỗi đồng coin được bảo vệ bởi một chương trình ErgoScript dựa trên{' '}
        <Link to="/learn/sigma">Sigma protocols</Link>, cho phép lập trình viên mô tả chính xác điều kiện để tiêu nó. Nền tảng hỗ trợ node nhẹ chạy trên phần
        cứng phổ thông, chỉ dùng các giải pháp mật mã đã được kiểm chứng, và có cơ chế tự sửa đổi giao thức để thích nghi trong tương lai.
      </p>

      <h2 id="gioi-thieu">Vấn đề cần giải quyết</h2>
      <p>
        Whitepaper chỉ ra hai điểm yếu của các blockchain thời đó. Thứ nhất là <strong>tài nguyên</strong>: mọi người dùng phải tải và kiểm tra mọi giao dịch, còn
        phí giao dịch vẫn cao dù đang được trợ giá bởi phần thưởng block. Thứ hai là <strong>mô hình dữ liệu</strong>: mô hình tài khoản của Ethereum linh hoạt
        nhưng khiến hợp đồng dễ có lỗi — whitepaper nhắc tới khoản thiệt hại khoảng 150 triệu USD năm 2017 do lỗi hợp đồng. Lập luận của Ergo: phần lớn ứng dụng tài
        chính không cần Turing-complete, nên một mô hình UTXO được mở rộng khả năng hợp đồng là lựa chọn an toàn hơn.
      </p>

      <h2 id="tam-nhin">Tầm nhìn</h2>
      <p>Năm nguyên tắc định hướng — chính là những nguyên tắc sau này được nhắc lại trong Tuyên ngôn Ergo:</p>
      <ul>
        <li>
          <strong>Phi tập trung là trên hết</strong> — giảm phụ thuộc vào bất kỳ bên nào: nhà phát triển, thợ đào, nhà sản xuất phần cứng.
        </li>
        <li>
          <strong>Dành cho người bình thường</strong> — ai cũng đào và chạy node được; chống tập trung hoá việc đào.
        </li>
        <li>
          <strong>Nền tảng cho tiền hợp đồng</strong> — tập trung vào hợp đồng tài chính hiệu quả và an toàn.
        </li>
        <li>
          <strong>Tầm nhìn dài hạn</strong> — thiết kế để tồn tại hàng thế kỷ, không trông chờ vào hard fork hay một loại phần cứng cụ thể.
        </li>
        <li>
          <strong>Mở và không cần cấp phép</strong> — không phân biệt đối xử, không danh sách đen, không cứu trợ ở tầng giao thức.
        </li>
      </ul>
      <p>
        Xem thêm: <Link to="/learn/manifesto">Tuyên ngôn Ergo</Link>.
      </p>

      <h2 id="autolykos">Đồng thuận Autolykos</h2>
      <p>
        Ergo dùng Proof-of-Work <strong>Autolykos</strong>, được giới thiệu là giao thức đầu tiên vừa <em>memory-hard</em> vừa <em>chống pool</em>. Thay vì băm từng
        nonce một, thợ đào phải chọn 32 số trong một bảng khổng lồ sao cho tổng của chúng “vừa khớp”. Nói chính xác, đó là bài toán “one-list k-sum”: tìm <strong>k = 32</strong> phần tử trong một danh sách cố định gồm <strong>N = 2<sup>26</sup></strong> phần tử (khoảng 2 GB) sao cho
        tổng của chúng thoả một điều kiện với mục tiêu <code>b</code>. Danh sách phải nằm trong bộ nhớ, vì tính lại từng phần tử mỗi lần thử là quá chậm.
      </p>
      <p>
        Để chống pool, phiên bản đầu yêu cầu <strong>khoá bí mật</strong> của thợ đào trong quá trình đào — không thể giao việc cho pool mà không giao luôn quyền tiêu
        phần thưởng. Độ khó được điều chỉnh bằng hồi quy tuyến tính (bình phương tối thiểu) trên <strong>8 epoch × 1024 block</strong> gần nhất, nhắm tới block ~2
        phút.
      </p>
      <Changed>
        Từ block <strong>417,792</strong> (tháng 2/2021), Ergo chuyển sang <strong>Autolykos v2</strong>: bỏ tính chống pool để pool đào hoạt động bình thường, và kích thước
        danh sách không còn cố định mà tăng dần theo độ cao. Thuật toán điều chỉnh độ khó sau đó cũng được sửa bởi EIP-37. Xem{' '}
        <Link to="/learn/autolykos">Autolykos v2</Link> và <Link to="/learn/difficulty">Độ khó &amp; nBits</Link>.
      </Changed>

      <h2 id="trang-thai">Trạng thái của Ergo</h2>
      <p>
        Thay cho tài khoản, Ergo dùng mô hình <strong>UTXO mở rộng</strong> xoay quanh các <em>box</em> bất biến. Mỗi box có 10 register: R0 giá trị ERG, R1 script
        bảo vệ, R2 token, R3 thông tin tạo (độ cao, id giao dịch, vị trí output), và R4–R9 dành cho dữ liệu tuỳ ý.
      </p>
      <p>Whitepaper liệt kê các lợi thế so với mô hình tài khoản:</p>
      <ul>
        <li>Chống tấn công phát lại (replay) và sắp xếp lại giao dịch đơn giản hơn.</li>
        <li>Xử lý giao dịch song song, vì các giao dịch không sửa chung một trạng thái.</li>
        <li>Giao dịch nguyên tử: hoặc thành công trọn vẹn, hoặc không gì cả — không có lỗi “hết gas” giữa chừng.</li>
        <li>Nền móng cho client không cần lưu trạng thái (stateless).</li>
      </ul>
      <p>
        Hãy hình dung trạng thái như một dấu vân tay có thể chứng minh cả những gì nằm bên trong. Tập box chưa tiêu được lưu trong một <strong>cây AVL+ có xác thực</strong>, gói gọn trong một digest <strong>33 byte</strong> — chính là trường{' '}
        <code>stateRoot</code> trong header. Cây này tạo được bằng chứng một box có (hoặc không có) trong tập, và bằng chứng cho mọi thay đổi. Nhờ vậy node nhẹ kiểm
        tra block chỉ bằng các bằng chứng đi kèm, với mức an toàn như full node. Theo whitepaper, bằng chứng AVL+ nhỏ hơn khoảng 3 lần so với Merkle Patricia trie
        của Ethereum. Xem <Link to="/learn/box">Box &amp; registers</Link> và <Link to="/learn/block">Block &amp; header</Link>.
      </p>

      <h2 id="ben-vung">Sức bền và khả năng tồn tại</h2>
      <p>Để sống lâu, whitepaper đặt ra bốn hướng:</p>
      <ol>
        <li>
          <strong>Không dùng giải pháp tự chế</strong>: chỉ dùng mật mã đã được bình duyệt và kiểm thử. Ví dụ phản diện được nêu là IOTA với hàm băm tự thiết kế, dẫn
          tới lỗ hổng nghiêm trọng và phải hard fork.
        </li>
        <li>
          <strong>Hỗ trợ client nhẹ</strong>: nhờ trạng thái AVL+ có xác thực, thiết bị di động hay mạng yếu vẫn xác minh được.
        </li>
        <li>
          <strong>Storage rent</strong>: box nằm yên 4 năm bị thu phí theo byte — chống “bụi” và phình trạng thái, giảm nguy cơ DoS kiểu tấn công Ethereum năm 2016,
          tạo thu nhập ổn định cho thợ đào sau khi hết phát hành, và đưa coin bị mất quay lại lưu thông. Xem{' '}
          <Link to="/learn/storage-rent">Phí lưu trữ</Link>.
        </li>
        <li>
          <strong>Giao thức tự sửa đổi</strong>: tham số “mềm” như kích thước block hay mức phí lưu trữ được thợ đào bỏ phiếu theo từng epoch 1024 block (tối đa hai
          tham số mỗi epoch). Thay đổi lớn — như thêm lệnh mới cho ErgoScript — cần <strong>90%</strong> phiếu thuận trong <strong>32,768</strong> block, rồi thêm
          32,768 block nữa mới kích hoạt. Node cũ bỏ qua quy tắc mới nhưng vẫn kiểm tra mọi quy tắc nó biết.
        </li>
      </ol>

      <h2 id="dong-erg">Đồng ERG</h2>
      <p>
        Đồng tiền gốc tên là <strong>Erg</strong>, chia nhỏ tới 10<sup>9</sup> nanoErg. Nó dùng để thưởng cho thợ đào (bảo vệ mạng khỏi tấn công 51%), trả phí cho
        tài nguyên tính toán và lưu trữ, và trả storage rent. Toàn bộ nguồn cung được tạo sẵn trong <strong>ba box genesis</strong>:
      </p>
      <GenesisBoxes />
      <p>Lịch phát hành theo whitepaper:</p>
      <table>
        <thead>
          <tr>
            <th>Block</th>
            <th>Thợ đào</th>
            <th>Treasury</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1 – 525,599 (~2 năm)</td>
            <td>67.5 ERG</td>
            <td>7.5 ERG</td>
          </tr>
          <tr>
            <td>525,600 – 590,399 (~3 tháng)</td>
            <td>67.5 ERG</td>
            <td>4.5 ERG</td>
          </tr>
          <tr>
            <td>590,400 – 655,199 (~3 tháng)</td>
            <td>67.5 ERG</td>
            <td>1.5 ERG</td>
          </tr>
          <tr>
            <td>655,200 – 719,999</td>
            <td>66 ERG</td>
            <td>—</td>
          </tr>
          <tr>
            <td>từ 720,000</td>
            <td>giảm 3 ERG mỗi 64,800 block</td>
            <td>—</td>
          </tr>
          <tr>
            <td>2,080,800</td>
            <td>0 — hết phát hành</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <Changed>
        <strong>EIP-27</strong> (kích hoạt ở block 777,217) giữ nguyên tổng cung nhưng khoá một phần phần thưởng mỗi block vào hợp đồng tái phát hành, rồi trả dần 3
        ERG/block cho thợ đào <em>sau</em> block 2,080,800 — kéo dài thu nhập của thợ đào thêm nhiều năm. Xem{' '}
        <Link to="/learn/emission">Lịch phát hành &amp; EIP-27</Link>.
      </Changed>

      <h2 id="tien-hop-dong">Tiền hợp đồng</h2>
      <p>
        Mỗi box được bảo vệ bởi một công thức logic kết hợp điều kiện thông thường với các mệnh đề mật mã chứng minh được bằng Sigma protocols, nối bằng AND, OR và{' '}
        <em>k-trên-n</em>. Whitepaper phân biệt hai loại ERG (và token):
      </p>
      <ul>
        <li>
          <strong>Tự do</strong> — chủ sở hữu gửi đi đâu cũng được, như một ví thông thường.
        </li>
        <li>
          <strong>Ràng buộc</strong> — hợp đồng bắt giao dịch tiêu nó phải tạo output có tính chất nhất định (script, số lượng…). Đây là cách xây hợp đồng nhiều
          bước.
        </li>
      </ul>
      <p>Những tính năng nền tảng cho hợp đồng:</p>
      <ul>
        <li>
          <strong>ErgoScript</strong> — ngôn ngữ bậc cao có kiểu, ví dụ “chứng minh biết khoá pk1 <em>hoặc</em> pk2” viết là <code>pk1 || pk2</code>. Xem{' '}
          <Link to="/learn/ergotree">ErgoTree &amp; ErgoScript</Link>.
        </li>
        <li>
          <strong>Data inputs</strong> — đọc một box mà không tiêu huỷ nó; rất hợp cho oracle. Xem <Link to="/learn/transaction">Giao dịch</Link>.
        </li>
        <li>
          <strong>Token tuỳ biến</strong> — mỗi giao dịch phát hành được một token mới, id bằng id box input đầu tiên, số lượng từ 1 tới
          9,223,372,036,854,775,807. Token được phép đốt (output ≤ input), còn ERG thì bảo toàn tuyệt đối (input = output). Xem{' '}
          <Link to="/learn/tokens">Token (EIP-4)</Link>.
        </li>
      </ul>
      <h3>Hai ví dụ trong whitepaper</h3>
      <ul>
        <li>
          <strong>Cá cược nhiệt độ với oracle</strong>: oracle phát hành một token duy nhất và đặt nó trong box chứa nhiệt độ (R4) và thời điểm (R5). Hợp đồng cá cược
          của Alice và Bob chỉ cần kiểm tra data input đầu tiên có mang token đó — sự hiện diện của token chính là chữ ký của oracle.
        </li>
        <li>
          <strong>Trộn coin không tương tác</strong>: Bob tiêu box của Alice cùng một box của mình để tạo hai output giống hệt nhau về script; mỗi người chỉ tiêu được
          một cái, nhưng người ngoài không biết cái nào của ai.
        </li>
      </ul>
      <p>Whitepaper cũng nhắc tới atomic swap, gây quỹ cộng đồng, hệ thống trao đổi địa phương và ICO như những ứng dụng khác.</p>

      <h2 id="thay-doi">2019 và hôm nay</h2>
      <table>
        <thead>
          <tr>
            <th>Chủ đề</th>
            <th>Whitepaper (2019)</th>
            <th>Hiện nay</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Thời gian block</td>
            <td>~2 phút</td>
            <td>Không đổi</td>
          </tr>
          <tr>
            <td>PoW</td>
            <td>Autolykos v1, chống pool, N = 2^26 cố định</td>
            <td>Autolykos v2 từ block 417,792; cho phép pool, N tăng dần</td>
          </tr>
          <tr>
            <td>Điều chỉnh độ khó</td>
            <td>Hồi quy trên 8 × 1024 block</td>
            <td>Đã sửa bởi EIP-37</td>
          </tr>
          <tr>
            <td>Phát hành</td>
            <td>Kết thúc ở block 2,080,800</td>
            <td>Như cũ, cộng thêm tái phát hành EIP-27 sau đó</td>
          </tr>
          <tr>
            <td>Storage rent</td>
            <td>4 năm, phí theo byte</td>
            <td>Không đổi; áp dụng thật từ 2023</td>
          </tr>
        </tbody>
      </table>

      <h2 id="doc-them">Đọc thêm</h2>
      <ul>
        <li>
          <a href={PDF} target="_blank" rel="noreferrer">
            Ergo: A Resilient Platform For Contractual Money
          </a>{' '}
          — whitepaper v1.0, 14/05/2019 (PDF, tiếng Anh).
        </li>
        <li>
          <a href={WEB} target="_blank" rel="noreferrer">
            Bản web của whitepaper
          </a>{' '}
          trên docs.ergoplatform.com.
        </li>
      </ul>
    </>
  )
}
