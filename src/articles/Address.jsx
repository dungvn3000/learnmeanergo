import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { bytesToHex, decodeAddress } from '../lib/ergo'
import { Async, Callout, Card, Field, Hash } from '../components/ui'

const SEG = {
  prefix: 'bg-ergo-100 text-ergo-800 dark:bg-ergo-900/50 dark:text-ergo-200',
  content: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  checksum: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
}

function Decoded({ address, label }) {
  let d
  try {
    d = decodeAddress(address)
  } catch (e) {
    return <p>Không giải mã được địa chỉ: {e.message}</p>
  }
  const prefixHex = d.prefix.toString(16).padStart(2, '0')
  const contentHex = bytesToHex(d.content)
  const checksumHex = bytesToHex(d.checksum)
  return (
    <Card className="not-prose my-6 p-5">
      <div className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{label}</div>
      <div className="mb-4 text-sm">
        <Hash value={address} to={`/address/${address}`} full />
      </div>
      <div className="mb-1 text-xs text-stone-500">Sau khi giải mã Base58 ({d.raw.length} byte):</div>
      <div className="rounded-lg bg-stone-50 p-3 font-mono text-sm leading-7 break-all dark:bg-stone-950">
        <span className={`rounded px-1 ${SEG.prefix}`}>{prefixHex}</span>
        <span className={`rounded px-1 ${SEG.content}`}>{contentHex}</span>
        <span className={`rounded px-1 ${SEG.checksum}`}>{checksumHex}</span>
      </div>
      <div className="mt-4">
        <Field
          name={<span className={`rounded px-1.5 ${SEG.prefix}`}>Prefix</span>}
          value={
            <span className="font-mono">
              0x{prefixHex} = network 0x{d.network.toString(16).padStart(2, '0')} ({d.networkName}) + type {d.type} ({d.typeInfo?.code ?? '?'})
            </span>
          }
        >
          4 bit cao là mạng, 4 bit thấp là loại địa chỉ.
        </Field>
        <Field name={<span className={`rounded px-1.5 ${SEG.content}`}>Nội dung</span>} value={`${d.content.length} byte`}>
          {d.typeInfo?.desc}
        </Field>
        <Field
          name={<span className={`rounded px-1.5 ${SEG.checksum}`}>Checksum</span>}
          value={
            <span className="inline-flex flex-wrap items-center gap-2 font-mono">
              {checksumHex}
              {d.valid ? (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-emerald-600">
                  <Check className="size-3.5" /> khớp blake2b256(prefix ‖ nội dung)[0..4] = {bytesToHex(d.expectedChecksum)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-red-600">
                  <X className="size-3.5" /> không khớp ({bytesToHex(d.expectedChecksum)})
                </span>
              )}
            </span>
          }
        >
          Tính lại ngay trong trình duyệt của bạn.
        </Field>
        {d.ergoTree && (
          <Field name="ErgoTree" value={<span className="font-mono break-all">{d.ergoTree}</span>}>
            {d.type === 1 ? 'P2PK: chỉ cần thêm 0008cd vào trước khoá công khai.' : 'P2S: nội dung chính là ErgoTree.'}
          </Field>
        )}
      </div>
    </Card>
  )
}

function LiveMiner() {
  const state = useApi(() => api.latestBlocks(1), [])
  return (
    <Async state={state}>
      {(blocks) =>
        blocks?.[0]?.minerAddress ? (
          <Decoded address={blocks[0].minerAddress} label={`Địa chỉ đã đào block #${blocks[0].height.toLocaleString('en-US')} (${blocks[0].miner || 'thợ đào'})`} />
        ) : (
          <p>Không lấy được block mới nhất.</p>
        )
      }
    </Async>
  )
}

const FEE_ADDRESS =
  '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe'

export default function Address() {
  return (
    <>
      <p>
        Trên blockchain, box không lưu “địa chỉ” — nó lưu một <Link to="/learn/ergotree">ErgoTree</Link>. Địa chỉ chỉ là cách viết ErgoTree (hoặc một phần của
        nó) sao cho con người có thể sao chép, dán và đọc qua điện thoại mà không sợ gõ nhầm. Một địa chỉ Ergo gồm ba phần, được mã hoá Base58:
      </p>
      <pre>
        <code>{`address = Base58( prefix ‖ content ‖ checksum )
checksum = blake2b256( prefix ‖ content )[0..4]`}</code>
      </pre>

      <h2 id="prefix">Byte prefix: mạng + loại</h2>
      <p>
        Byte đầu tiên gói hai thông tin: <strong>mạng</strong> (4 bit cao) và <strong>loại địa chỉ</strong> (4 bit thấp). Cộng chúng lại là ra prefix:
      </p>
      <table>
        <thead>
          <tr>
            <th>Loại</th>
            <th>Mainnet (0x00)</th>
            <th>Testnet (0x10)</th>
            <th>Nội dung</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>P2PK</strong> (1)
            </td>
            <td>
              <code>0x01</code> → bắt đầu bằng <code>9</code>
            </td>
            <td>
              <code>0x11</code> → bắt đầu bằng <code>3</code>
            </td>
            <td>Khoá công khai nén, 33 byte</td>
          </tr>
          <tr>
            <td>
              <strong>P2SH</strong> (2)
            </td>
            <td>
              <code>0x02</code> → bắt đầu bằng <code>6</code>, <code>7</code> hoặc <code>8</code>
            </td>
            <td>
              <code>0x12</code>
            </td>
            <td>24 byte đầu của blake2b256(script)</td>
          </tr>
          <tr>
            <td>
              <strong>P2S</strong> (3)
            </td>
            <td>
              <code>0x03</code>
            </td>
            <td>
              <code>0x13</code>
            </td>
            <td>Toàn bộ ErgoTree</td>
          </tr>
        </tbody>
      </table>
      <p>
        Vì Base58 biểu diễn cả chuỗi byte như một số lớn, byte đầu tiên gần như quyết định ký tự đầu tiên. Đó là lý do mọi địa chỉ ví thông thường (P2PK) trên mainnet
        đều bắt đầu bằng chữ <code>9</code>.
      </p>

      <h2 id="p2pk">P2PK: địa chỉ ví thông thường</h2>
      <p>
        Pay-to-Public-Key là loại bạn dùng hàng ngày. Nội dung chỉ là 33 byte khoá công khai; ErgoTree đầy đủ luôn là <code>0008cd</code> + khoá công khai, nên
        không cần lưu. Dưới đây là địa chỉ của thợ đào vừa tìm ra block mới nhất, được tách byte ngay trong trình duyệt:
      </p>
      <LiveMiner />

      <h2 id="p2s">P2S: địa chỉ của một hợp đồng</h2>
      <p>
        Pay-to-Script chứa <em>toàn bộ</em> ErgoTree. Kết quả là địa chỉ dài — đôi khi hàng trăm ký tự — nhưng bất kỳ ai cũng đọc được hợp đồng chỉ từ địa chỉ.
        Ví dụ: địa chỉ của hợp đồng phí thợ đào, thứ xuất hiện trong gần như mọi giao dịch:
      </p>
      <Decoded address={FEE_ADDRESS} label="Hợp đồng phí thợ đào (P2S)" />

      <h2 id="p2sh">P2SH: chỉ lưu giá trị băm</h2>
      <p>
        Pay-to-Script-Hash chỉ lưu 24 byte đầu (192 bit) của <code>blake2b256</code> của script. Địa chỉ ngắn gọn, nhưng người tiêu phải cung cấp script gốc
        khi tiêu box, và script chỉ bị lộ ra lúc đó. Trên thực tế P2SH ít được dùng; hầu hết dApp dùng P2S để hợp đồng minh bạch ngay từ đầu.
      </p>

      <h2 id="checksum">Checksum: bắt lỗi gõ nhầm</h2>
      <p>
        4 byte cuối là checksum: lấy <code>blake2b256</code> của (prefix ‖ nội dung) và giữ 4 byte đầu. Ví kiểm tra lại checksum trước khi gửi tiền; nếu bạn gõ
        sai một ký tự, xác suất checksum vẫn khớp chỉ khoảng 1 trên 4 tỷ.
      </p>
      <Callout type="note" title="Vì sao dùng Base58?">
        Base58 là Base64 bỏ đi những ký tự dễ nhầm: số <code>0</code> và chữ <code>O</code>, chữ <code>I</code> hoa và <code>l</code> thường, cùng dấu{' '}
        <code>+</code> và <code>/</code>. Ergo dùng cùng bảng chữ cái với Bitcoin.
      </Callout>

      <h2 id="mot-khoa-nhieu-dia-chi">Một ví, nhiều địa chỉ</h2>
      <p>
        Ví hiện đại (theo chuẩn BIP-32/BIP-44, với đường dẫn <code>m/44&apos;/429&apos;/0&apos;/0/i</code>) sinh ra cả dãy khoá từ một seed phrase — mỗi khoá là
        một địa chỉ P2PK. Và vì địa chỉ chỉ là cách viết ErgoTree, “địa chỉ” của một hợp đồng phức tạp cũng hợp lệ không kém một địa chỉ ví: bạn có thể gửi tiền
        tới nó như bình thường.
      </p>

      <h2 id="tu-thu">Tự thử</h2>
      <ul>
        <li>
          <Link to="/tools/address-decoder">Giải mã địa chỉ</Link> — dán địa chỉ bất kỳ để tách từng byte.
        </li>
        <li>
          <Link to="/tools/pubkey-to-address">Public key → Địa chỉ</Link> — tự dựng một địa chỉ P2PK.
        </li>
        <li>
          <Link to="/tools/blake2b">Blake2b-256</Link> — tự tính checksum.
        </li>
      </ul>
    </>
  )
}
