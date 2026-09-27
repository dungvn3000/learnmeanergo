import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react'
import { sectionOf } from '../articles'
import { Card, PageHeader } from '../components/ui'
import { useTranslation } from 'react-i18next'
import { pick } from '../lib/i18n'
import { useSeo } from '../lib/seo'

function ArticleCard({ a, n }) {
  return (
    <Link to={`/learn/${a.slug}`} className="group">
      <Card className="flex h-full gap-4 p-5 transition group-hover:-translate-y-0.5 group-hover:border-ergo-300 group-hover:shadow-md">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ergo-50 text-ergo-600 dark:bg-ergo-950/50 dark:text-ergo-400">
          <a.icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {n != null && <span className="text-xs font-bold text-stone-400 tabular-nums">{String(n).padStart(2, '0')}</span>}
            <h3 className="font-bold text-stone-900 group-hover:text-ergo-600 dark:text-white">{pick(a.title)}</h3>
          </div>
          <p className="mt-1 text-sm text-stone-500">{pick(a.summary)}</p>
        </div>
      </Card>
    </Link>
  )
}

export function Beginners() {
  const { t } = useTranslation()
  const list = sectionOf('beginners')
  useSeo({
    path: '/beginners',
    image: '/og/beginners.png',
    title: { vi: 'Người mới bắt đầu', en: 'Beginners' },
    description: { vi: 'Ergo giải thích đơn giản: box, ERG, ví, đào — không cần biết lập trình.', en: 'Ergo explained simply: boxes, ERG, wallets, mining — no programming required.' },
  })
  return (
    <>
      <PageHeader icon={GraduationCap} kicker={t('common.beginners')} title={t('sectionIndex.ergoExplainedSimply')}>
        {t('sectionIndex.noProgrammingOrCryptographyRequiredRead')}
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a, i) => (
          <ArticleCard key={a.slug} a={a} n={i + 1} />
        ))}
      </div>
      <Link to={`/learn/${list[0].slug}`} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ergo-600 px-5 py-3 font-semibold text-white hover:bg-ergo-700">
        {t('sectionIndex.startReading')} <ArrowRight className="size-4" />
      </Link>
    </>
  )
}

export function Technical() {
  const { t } = useTranslation()
  const list = sectionOf('technical')
  useSeo({
    path: '/technical',
    image: '/og/technical.png',
    title: { vi: 'Kỹ thuật', en: 'Technical' },
    description: { vi: 'Bên trong Ergo từng byte một: block, giao dịch, box, ErgoTree, Autolykos, lịch phát hành, storage rent.', en: 'Inside Ergo byte by byte: blocks, transactions, boxes, ErgoTree, Autolykos, emission, storage rent.' },
  })
  const groups = [...new Set(list.map((a) => a.group))]
  return (
    <>
      <PageHeader icon={BookOpen} kicker={t('common.technical')} title={t('sectionIndex.insideErgoByteByByte')}>
        {t('sectionIndex.blocksBoxesTransactionsScriptsAndThe')}
      </PageHeader>
      {groups.map((g) => (
        <section key={g.en} className="mb-10">
          <h2 className="mb-4 text-sm font-bold tracking-wide text-stone-500 uppercase">{pick(g)}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {list
              .filter((a) => a.group === g)
              .map((a) => (
                <ArticleCard key={a.slug} a={a} />
              ))}
          </div>
        </section>
      ))}
    </>
  )
}
