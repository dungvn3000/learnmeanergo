import { Link } from 'react-router-dom'
import { Check, Database, Globe, HardDrive, ShieldCheck } from 'lucide-react'
import { t } from '../lib/i18n'
import { useSeo } from '../lib/seo'
import { Callout, Card, PageHeader } from '../components/ui'

const UPDATED = '2026-09-27'

export default function Privacy() {
  useSeo({
    path: '/privacy',
    image: '/og/privacy.png',
    title: { vi: 'Quyền riêng tư', en: 'Privacy' },
    description: {
      vi: 'Learn Me An Ergo không theo dõi bạn: không cookie, không analytics, không tài khoản, không script bên thứ ba.',
      en: 'Learn Me An Ergo does not track you: no cookies, no analytics, no accounts, no third-party scripts.',
    },
  })

  const none = [
    t('Không cookie', 'No cookies'),
    t('Không analytics hay đo lường', 'No analytics or measurement'),
    t('Không pixel theo dõi, không quảng cáo', 'No tracking pixels, no ads'),
    t('Không tài khoản, không thu thập email', 'No accounts, no email collection'),
    t('Không script bên thứ ba', 'No third-party scripts'),
    t('Không nhúng nội dung từ mạng xã hội', 'No embedded social media content'),
  ]

  return (
    <div className="max-w-3xl">
      <PageHeader icon={ShieldCheck} kicker={t('Quyền riêng tư', 'Privacy')} title={t('Chúng tôi không theo dõi bất cứ thứ gì', 'We don’t track anything')}>
        {t(
          'Trang này là tài liệu học miễn phí. Nó không cần biết bạn là ai, và được xây dựng để không thể biết.',
          'This site is a free learning resource. It doesn’t need to know who you are, and it is built so that it can’t.',
        )}
      </PageHeader>

      <div className="prose-ergo">
        <div className="not-prose my-6 grid gap-2 sm:grid-cols-2">
          {none.map((x) => (
            <div key={x} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-800 dark:bg-stone-900">
              <Check className="size-4 shrink-0 text-emerald-500" /> {x}
            </div>
          ))}
        </div>

        <h2 id="tren-may-ban">{t('Những gì được lưu trên máy bạn', 'What is stored on your device')}</h2>
        <p>
          {t(
            'Trang chỉ ghi hai lựa chọn vào bộ nhớ cục bộ của trình duyệt (localStorage): ngôn ngữ (EN/VI) và giao diện sáng/tối. Hai giá trị này nằm nguyên trên máy bạn, không bao giờ được gửi đi đâu, và biến mất khi bạn xoá dữ liệu trang web.',
            'The site writes just two preferences to your browser’s local storage: your language (EN/VI) and light/dark theme. Those values stay on your device, are never sent anywhere, and disappear when you clear site data.',
          )}
        </p>

        <h2 id="ket-noi">{t('Kết nối ra bên ngoài', 'Outbound connections')}</h2>
        <p>
          {t(
            'Để hiển thị số liệu thật, trình duyệt của bạn gọi trực tiếp tới hai dịch vụ dữ liệu Ergo do Ergo Vietnam vận hành. Như mọi request web, các máy chủ đó thấy địa chỉ IP của bạn và đường dẫn API được gọi (ví dụ “block mới nhất”), nhưng không nhận bất kỳ thông tin nào về bạn từ trang này.',
            'To show real numbers, your browser calls two Ergo data services run by Ergo Vietnam directly. Like any web request, those servers see your IP address and the API path requested (for example “latest blocks”), but they receive nothing about you from this site.',
          )}
        </p>
        <div className="not-prose my-6 grid gap-3">
          <Card className="flex gap-3 p-4">
            <Database className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div className="text-sm">
              <div className="font-semibold text-stone-900 dark:text-white">explorer.erg.vn</div>
              <p className="mt-1 text-stone-500">
                {t(
                  'Block, giao dịch, địa chỉ, token, biểu đồ — dùng trên hầu hết các trang. Explorer này công bố chính sách không ghi log truy cập.',
                  'Blocks, transactions, addresses, tokens, charts — used on most pages. The explorer states a no-logging policy.',
                )}
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 p-4">
            <Globe className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div className="text-sm">
              <div className="font-semibold text-stone-900 dark:text-white">sv1.erg.vn / sv2.erg.vn</div>
              <p className="mt-1 text-stone-500">
                {t('Node Ergo công khai — chỉ bài ', 'Public Ergo nodes — only the ')}
                <Link to="/learn/nipopow" className="text-ergo-600 hover:underline dark:text-ergo-400">
                  NiPoPoW
                </Link>
                {t(' gọi tới để tải một bằng chứng thật.', ' page calls them, to fetch a real proof.')}
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 p-4">
            <HardDrive className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div className="text-sm">
              <div className="font-semibold text-stone-900 dark:text-white">{t('Font chữ', 'Fonts')}</div>
              <p className="mt-1 text-stone-500">
                {t(
                  'Font được phục vụ từ chính domain này, không tải từ Google Fonts hay CDN nào khác.',
                  'Fonts are served from this domain, not loaded from Google Fonts or any other CDN.',
                )}
              </p>
            </div>
          </Card>
        </div>

        <h2 id="may-chu">{t('Máy chủ lưu trữ', 'Hosting')}</h2>
        <p>
          {t(
            'Trang là các tệp tĩnh. Nhà cung cấp lưu trữ có thể giữ log kỹ thuật tiêu chuẩn (địa chỉ IP, thời điểm, đường dẫn) trong thời gian ngắn để vận hành và chống tấn công; chúng tôi không dùng, không xuất và không ghép các log đó với bất kỳ dữ liệu nào để nhận diện người đọc.',
            'The site is a set of static files. The hosting provider may keep standard technical logs (IP address, time, path) for a short period for operations and abuse protection; we do not use, export or combine those logs with anything to identify readers.',
          )}
        </p>

        <h2 id="link-ngoai">{t('Link ra ngoài', 'External links')}</h2>
        <p>
          {t(
            'Bài viết dẫn tới tài liệu bên ngoài (docs.ergoplatform.com, GitHub, blog, bài báo). Khi bạn bấm vào, chính sách riêng tư của trang đó áp dụng.',
            'Articles link to outside material (docs.ergoplatform.com, GitHub, blogs, papers). Once you click through, that site’s privacy policy applies.',
          )}
        </p>

        <Callout type="tip" title={t('Tự kiểm tra', 'Check for yourself')}>
          {t(
            'Mở công cụ lập trình của trình duyệt (F12), thẻ Network, rồi tải lại trang: bạn sẽ chỉ thấy request tới domain này và tới *.erg.vn.',
            'Open your browser’s developer tools (F12), the Network tab, and reload: you will only see requests to this domain and to *.erg.vn.',
          )}
        </Callout>

        <p className="text-sm text-stone-500">{t('Cập nhật lần cuối:', 'Last updated:')} {UPDATED}</p>
      </div>
    </div>
  )
}
