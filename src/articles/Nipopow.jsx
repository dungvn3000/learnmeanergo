import { Link } from 'react-router-dom'
import { Layers, Link2, Scale, Zap } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { bytes, num } from '../lib/format'
import { Async, Callout, Card, Stat } from '../components/ui'

const DOC = 'https://docs.ergoplatform.com/dev/protocol/nipopows/'
const PAPER = 'https://eprint.iacr.org/2017/963.pdf'
const NODES = ['https://sv1.erg.vn', 'https://sv2.erg.vn']
const M = 6
const K = 10

/** Fetch a real NiPoPoW proof from a public Ergo node (the node API allows CORS). */
async function fetchProof() {
  let lastErr
  for (const n of NODES) {
    try {
      const r = await fetch(`${n}/nipopow/proof/${M}/${K}`, { headers: { Accept: 'application/json' } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const p = await r.json()
      const hdr = (x) => x.header ?? x
      const headers = [...p.prefix, p.suffixHead, ...p.suffixTail].map(hdr)
      return {
        node: n,
        m: p.m,
        k: p.k,
        headers,
        tip: headers.at(-1).height,
        prefixHeights: p.prefix.map((x) => x.header.height),
        levels: p.suffixHead.interlinks.length,
        approxBytes: headers.reduce((s, h) => s + (h.size || 0), 0),
      }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

function ProofStrip({ heights, tip }) {
  // Every included prefix header as a tick on a 0..tip axis: the sampling gets denser towards the tip.
  return (
    <div className="mt-4">
      <div className="relative h-10 rounded-lg bg-stone-100 dark:bg-stone-800">
        {heights.map((h) => (
          <span key={h} className="absolute top-1 bottom-1 w-px bg-ergo-500" style={{ left: `${(h / tip) * 100}%` }} title={`block ${num(h)}`} />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-stone-500">
        <span>block 1</span>
        <span>block {num(tip)}</span>
      </div>
    </div>
  )
}

function LiveProof() {
  const state = useApi(fetchProof, [])
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">
        Bằng chứng NiPoPoW thật — <code className="font-mono normal-case">GET /nipopow/proof/{M}/{K}</code>
      </div>
      <Async state={state}>
        {(p) => (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Layers} label="Chuỗi thật" value={num(p.tip)} sub="block header" />
              <Stat icon={Zap} label="Trong bằng chứng" value={num(p.headers.length)} sub={`header · ≈ ${bytes(p.approxBytes)}`} />
              <Stat icon={Scale} label="Nén" value={`${num(Math.round(p.tip / p.headers.length))}×`} sub={`m = ${p.m}, k = ${p.k}`} />
              <Stat icon={Link2} label="Mức superblock" value={p.levels} sub={`log₂(${num(p.tip)}) ≈ ${Math.log2(p.tip).toFixed(1)}`} />
            </div>
            <ProofStrip heights={p.prefixHeights} tip={p.tip} />
            <p className="mt-3 text-sm text-stone-500">
              Mỗi vạch cam là một header có mặt trong bằng chứng. Phần đầu chuỗi chỉ cần vài superblock rải rác; càng gần đỉnh, mẫu càng dày và {p.k} block cuối
              được lấy trọn. Dữ liệu từ node <span className="font-mono">{p.node.replace('https://', '')}</span>.
            </p>
          </>
        )}
      </Async>
    </Card>
  )
}

export default function Nipopow() {
  return (
    <>
      <p>
        Muốn tự kiểm tra rằng một giao dịch nằm trong chuỗi Ergo, cách “chuẩn” là tải toàn bộ block header — hơn 1.8 triệu cái, mỗi cái ~250 byte — rồi kiểm tra
        proof-of-work của từng cái. Với điện thoại, hay với một hợp đồng thông minh trên blockchain <em>khác</em>, thế là quá nhiều. <strong>NiPoPoW</strong>
        (Non-Interactive Proofs of Proof-of-Work) là cách rút chuỗi header ấy xuống còn vài trăm cái mà vẫn giữ được mức tin cậy tương đương.
      </p>
      <LiveProof />

      <h2 id="superblock">Superblock: có block “may mắn” hơn block khác</h2>
      <p>
        Thợ đào phải tìm một lời giải PoW nhỏ hơn mục tiêu <code>T</code> (xem <Link to="/learn/difficulty">Độ khó &amp; nBits</Link>). Nhưng lời giải thường
        nhỏ hơn <em>nhiều</em> so với yêu cầu: trung bình cứ 2 block thì có 1 block có lời giải nhỏ hơn <code>T/2</code>, cứ 4 block thì có 1 block nhỏ hơn{' '}
        <code>T/4</code>, và cứ 2<sup>μ</sup> block có 1 block nhỏ hơn <code>T/2<sup>μ</sup></code>. Block như vậy gọi là <strong>superblock mức μ</strong>.
      </p>
      <ul>
        <li>Mức 0: mọi block.</li>
        <li>Mức 1: khoảng một nửa số block.</li>
        <li>Mức μ: khoảng 1/2<sup>μ</sup> số block — mức cao nhất trong một chuỗi dài n block xấp xỉ log<sub>2</sub>(n).</li>
      </ul>
      <p>
        Ý tưởng then chốt: một superblock mức μ “chứa” lượng công việc kỳ vọng bằng 2<sup>μ</sup> block thường. Vì vậy, thay vì đưa ra toàn bộ chuỗi, người chứng
        minh chỉ cần đưa ra <em>chuỗi các superblock</em> ở mức cao — ít hơn nhiều nhưng đại diện cho lượng proof-of-work tương đương. Không ai “làm giả” được
        superblock: muốn có một block mức 20 phải may mắn gấp một triệu lần block thường.
      </p>

      <h2 id="interlink">Interlink: con trỏ ngược tới mọi mức</h2>
      <p>
        Header thường chỉ có một con trỏ ngược: <code>parentId</code>. Để đi từ superblock này tới superblock trước đó <em>cùng mức</em> mà không phải duyệt qua
        mọi block ở giữa, mỗi block Ergo còn mang thêm một vector <strong>interlink</strong>: phần tử thứ μ là id của superblock mức μ gần nhất trước nó. Vector này
        được ghi trong phần <em>extension</em> của block (header cam kết nó qua <code>extensionHash</code>), kèm một Merkle proof để ai cũng kiểm tra được mà không
        cần cả extension. Vector hiện có khoảng 21 phần tử — đúng bằng số mức superblock mà một chuỗi ~1.9 triệu block có thể có.
      </p>
      <Callout type="note" title="Vì sao Ergo có sẵn từ block 1">
        Bitcoin có thể thêm interlink bằng “velvet fork” (thợ đào ghi thêm dữ liệu, node cũ bỏ qua), nhưng chưa làm. Ergo được thiết kế bởi các nhà nghiên cứu
        gắn bó mật thiết với công trình NiPoPoW, nên interlink có trong mọi block ngay từ genesis — không cần fork gì cả.
      </Callout>

      <h2 id="bang-chung">Bằng chứng gồm những gì?</h2>
      <p>Một bằng chứng NiPoPoW có hai tham số bảo mật và ba phần:</p>
      <table>
        <thead>
          <tr>
            <th>Thành phần</th>
            <th>Ý nghĩa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>m</code>
            </td>
            <td>Số superblock tối thiểu phải có ở mỗi mức được dùng — càng lớn càng khó gian lận, bằng chứng càng dài.</td>
          </tr>
          <tr>
            <td>
              <code>k</code>
            </td>
            <td>Số block cuối chuỗi luôn được lấy trọn (giống “số xác nhận”), vì phần đuôi chưa ổn định.</td>
          </tr>
          <tr>
            <td>
              <code>prefix</code> (π)
            </td>
            <td>Chuỗi superblock từ genesis tới gần đỉnh, lấy ở mức cao nhất còn đủ m block, rồi xuống dần các mức thấp hơn khi tới gần đỉnh.</td>
          </tr>
          <tr>
            <td>
              <code>suffixHead</code> + <code>suffixTail</code> (χ)
            </td>
            <td>k header cuối cùng, kèm interlink của block đầu đuôi để nối với prefix.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Bằng chứng ở đầu trang dùng <code>m = {M}, k = {K}</code>. Node Ergo phục vụ nó qua API{' '}
        <code>/nipopow/proof/&#123;m&#125;/&#123;k&#125;</code> — và bạn có thể xin bằng chứng tới một block cụ thể bằng{' '}
        <code>/nipopow/proof/&#123;m&#125;/&#123;k&#125;/&#123;headerId&#125;</code>.
      </p>

      <h2 id="so-sanh">Người kiểm tra tin ai?</h2>
      <p>
        Người kiểm tra không cần tin bất kỳ node nào. Họ xin bằng chứng từ <strong>nhiều</strong> node và giữ lại bằng chứng tốt nhất. Để so sánh hai bằng chứng:
      </p>
      <ol>
        <li>Tìm block chung cuối cùng của hai bằng chứng — mọi thứ trước đó đều đã thống nhất.</li>
        <li>Từ điểm đó trở đi, xét mức superblock cao nhất mà cả hai bằng chứng vẫn còn ít nhất m block.</li>
        <li>Đếm số block ở mức đó của mỗi bên. Một block mức μ đại diện cho 2<sup>μ</sup> block thường về lượng công việc, nên bên nào nhiều hơn tức là
          đại diện cho nhiều proof-of-work hơn — và thắng.</li>
      </ol>
      <p>
        Chỉ cần <em>ít nhất một</em> node trung thực trong số được hỏi, kết quả sẽ đúng — cùng giả định “đa số sức mạnh băm là trung thực” mà chính blockchain
        dựa vào.
      </p>
      <Callout type="warn" title="Không phải phép màu">
        NiPoPoW chứng minh “chuỗi này có nhiều proof-of-work nhất”, không chứng minh từng giao dịch hợp lệ — việc đó vẫn cần full node. Ứng dụng chỉ nhận đúng
        một bằng chứng (ví dụ hợp đồng trên chuỗi khác) phải đặt ngưỡng công việc tối thiểu và đợi đủ xác nhận.
      </Callout>

      <h2 id="electrum">So với SPV của Bitcoin (Electrum)</h2>
      <p>
        Ví nhẹ của Bitcoin như <strong>Electrum</strong> dùng mô hình <em>SPV</em> (Simplified Payment Verification) mà Satoshi mô tả trong whitepaper: tải{' '}
        <strong>toàn bộ</strong> block header (80 byte mỗi cái), kiểm tra proof-of-work của cả chuỗi, rồi hỏi máy chủ Electrum bằng chứng Merkle cho từng giao
        dịch mình quan tâm. NiPoPoW giữ nguyên ý tưởng đó nhưng thay “toàn bộ header” bằng “vài trăm superblock”:
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Bitcoin SPV / Electrum</th>
            <th>Ergo NiPoPoW</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Header cần tải</td>
            <td>Tất cả — khoảng 950 nghìn header × 80 byte ≈ 75 MB (2026), tăng tuyến tính mãi mãi</td>
            <td>Vài trăm header — bằng chứng ở đầu trang chỉ ~40 KB, tăng theo log của chiều dài chuỗi</td>
          </tr>
          <tr>
            <td>Chứng minh giao dịch nằm trong chuỗi</td>
            <td>Nhánh Merkle tới header của block</td>
            <td>Nhánh Merkle tới header, cộng bằng chứng NiPoPoW rằng header đó thuộc chuỗi nặng nhất</td>
          </tr>
          <tr>
            <td>Kiểm tra số dư / UTXO</td>
            <td>Phải tin máy chủ: nó có thể giấu bớt giao dịch của bạn</td>
            <td>Có thể tự kiểm tra bằng bằng chứng AVL+ so với <code>stateRoot</code> trong header — máy chủ không giấu được</td>
          </tr>
          <tr>
            <td>Mô hình tin cậy</td>
            <td>Đa số hashrate trung thực; máy chủ trung thực về lịch sử địa chỉ</td>
            <td>Đa số hashrate trung thực; ít nhất một trong các node được hỏi trung thực</td>
          </tr>
          <tr>
            <td>Xác minh trong hợp đồng ở chuỗi khác</td>
            <td>Gần như bất khả thi — 75 MB header không nhét vào hợp đồng được</td>
            <td>Khả thi — vài chục KB, đủ cho sidechain và cầu nối</td>
          </tr>
          <tr>
            <td>Trên điện thoại</td>
            <td>Electrum dùng “checkpoint” gắn cứng trong phần mềm để đỡ tải header cũ — tức là tin nhà phát triển</td>
            <td>Không cần checkpoint: bằng chứng tự đứng được từ genesis</td>
          </tr>
        </tbody>
      </table>
      <p>
        Cả hai đều <em>không</em> kiểm tra từng giao dịch có hợp lệ hay không — đó vẫn là việc của full node. Điểm khác là NiPoPoW làm cho việc “xác minh chuỗi” rẻ tới
        mức một hợp đồng thông minh cũng làm được, còn <code>stateRoot</code> của Ergo lấp nốt lỗ hổng lớn nhất của SPV: máy chủ không thể nói dối về tập UTXO. Bitcoin
        cũng có thể có NiPoPoW qua một velvet fork, nhưng tới nay chưa triển khai.
      </p>

      <h2 id="ung-dung">Ergo dùng NiPoPoW để làm gì?</h2>
      <ul>
        <li>
          <strong>Khởi động node nhanh</strong>: node Ergo có thể bắt đầu từ một bằng chứng NiPoPoW (xin từ nhiều peer, giữ bằng chứng tốt nhất) rồi tải ảnh chụp
          tập UTXO, thay vì đồng bộ từ block 1. Bật bằng <code>ergo.node.nipopow.nipopowBootstrap = true</code>. Tài liệu Ergo ước tính bằng chứng cho vài năm
          chuỗi chỉ cỡ 30–40 KB, so với ảnh chụp UTXO vài trăm MB.
        </li>
        <li>
          <strong>Client nhẹ</strong>: ví trên điện thoại kiểm tra chuỗi bằng vài trăm header thay vì gần hai triệu, kết hợp với{' '}
          <Link to="/learn/block">stateRoot</Link> để xác minh box.
        </li>
        <li>
          <strong>Đào trong không gian logarit</strong>: thợ đào chỉ giữ các superblock quan trọng thay vì cả lịch sử (“logarithmic space mining”).
        </li>
        <li>
          <strong>Sidechain và cầu nối</strong>: hợp đồng trên một chuỗi khác có thể xác minh “sự kiện X đã xảy ra trên Ergo” từ một bằng chứng — nền tảng cho
          two-way peg, atomic swap xuyên chuỗi mà không cần bên trung gian.
        </li>
      </ul>
      <p>
        Node 6.0.5 siết thêm ba kiểm tra: xác nhận tham số m/k của bằng chứng yêu cầu, kiểm tra proof-of-work của từng header trước khi dùng để khởi động, và từ
        chối tham số m/k không hợp lệ từ peer.
      </p>

      <h2 id="doc-them">Đọc thêm</h2>
      <ul>
        <li>
          <a href={DOC} target="_blank" rel="noreferrer">
            NiPoPoWs — Ergo docs
          </a>{' '}
          (tiếng Anh), cùng các trang con về light client, light miner và sidechain.
        </li>
        <li>
          <a href={PAPER} target="_blank" rel="noreferrer">
            Non-Interactive Proofs of Proof-of-Work
          </a>{' '}
          — Kiayias, Miller, Zindros (2017), bài báo gốc.
        </li>
        <li>
          <a href="https://eprint.iacr.org/2019/1444.pdf" target="_blank" rel="noreferrer">
            Compact Storage of Superblocks for NIPoPoW Applications
          </a>{' '}
          — cách Ergo lưu interlink gọn trong extension.
        </li>
      </ul>
    </>
  )
}
