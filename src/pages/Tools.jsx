import { Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { tools, toolBySlug } from '../tools'
import { Card, Loading, PageHeader } from '../components/ui'
import NotFound from './NotFound'
import { useTranslation } from 'react-i18next'
import { pick } from '../lib/i18n'
import { useSeo } from '../lib/seo'

export function ToolsIndex() {
  const { t } = useTranslation()
  useSeo({
    path: '/tools',
    image: '/og/tools.png',
    title: { vi: 'Công cụ', en: 'Tools' },
    description: { vi: 'Giải mã địa chỉ, dựng địa chỉ từ public key, băm Blake2b-256, đổi đơn vị ERG, tính lượng phát hành — chạy ngay trong trình duyệt.', en: 'Decode addresses, build one from a public key, hash with Blake2b-256, convert ERG units, calculate emission — all in your browser.' },
  })
  return (
    <>
      <PageHeader icon={Wrench} kicker={t('common.tools')} title={t('tools.takeErgoApartYourself')}>
        {t('tools.everyCalculationRunsRightInYour')}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((x) => (
          <Link key={x.slug} to={`/tools/${x.slug}`} className="group">
            <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-ergo-300 group-hover:shadow-md">
              <x.icon className="size-6 text-ergo-500" />
              <h3 className="mt-3 font-bold text-stone-900 group-hover:text-ergo-600 dark:text-white">{pick(x.title)}</h3>
              <p className="mt-1 text-sm text-stone-500">{pick(x.summary)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}

export function ToolPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const tool = toolBySlug[slug]
  useSeo({ skip: !tool, path: `/tools/${slug}`, title: tool?.title, description: tool?.summary, image: `/og/${slug}.png` })
  if (!tool) return <NotFound />
  const Body = tool.component
  return (
    <>
      <PageHeader icon={tool.icon} kicker={<Link to="/tools">{t('common.tools')}</Link>} title={pick(tool.title)}>
        {pick(tool.summary)}
      </PageHeader>
      <Suspense fallback={<Loading label={t('tools.loadingTool')} />}>
        <Body />
      </Suspense>
      <div className="mt-12 border-t border-stone-200 pt-6 dark:border-stone-800">
        <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('tools.moreTools')}</div>
        <div className="flex flex-wrap gap-2">
          {tools
            .filter((x) => x.slug !== slug)
            .map((x) => (
              <Link key={x.slug} to={`/tools/${x.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1 text-sm hover:border-ergo-300 hover:text-ergo-600 dark:border-stone-700">
                <x.icon className="size-3.5" /> {pick(x.title)}
              </Link>
            ))}
        </div>
      </div>
    </>
  )
}
