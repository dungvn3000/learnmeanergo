import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap } from 'lucide-react'
import { bySlug, sectionOf } from '../articles'
import { Loading } from '../components/ui'
import NotFound from './NotFound'
import { getLang, pick, t } from '../lib/i18n'
import { articleJsonLd, useSeo } from '../lib/seo'

const SECTION = {
  beginners: { label: { vi: 'Người mới bắt đầu', en: 'Beginners' }, to: '/beginners', icon: GraduationCap },
  technical: { label: { vi: 'Kỹ thuật', en: 'Technical' }, to: '/technical', icon: BookOpen },
}

/** Collect the article's <h2 id> headings after it renders, for the "on this page" list. */
function useToc(ref, key) {
  const [toc, setToc] = useState([])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setToc([...el.querySelectorAll('h2[id]')].map((h) => ({ id: h.id, text: h.textContent })))
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [ref, key])
  return toc
}

export default function ArticlePage() {
  const { slug } = useParams()
  const article = bySlug[slug]
  const body = useRef(null)
  const toc = useToc(body, slug)
  useSeo({
    skip: !article,
    path: `/learn/${slug}`,
    title: article?.title,
    description: article?.summary,
    type: 'article',
    image: `/og/${slug}.png`,
    jsonLd: article && articleJsonLd({ title: article.title, description: article.summary, path: `/learn/${slug}`, section: article.group ?? SECTION[article.section].label }),
  })
  if (!article) return <NotFound />

  const section = SECTION[article.section]
  const list = sectionOf(article.section)
  const i = list.indexOf(article)
  const prev = list[i - 1]
  const next = list[i + 1]
  const Body = article.component[getLang()]
  const Icon = article.icon

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_200px]">
      <article className="min-w-0 max-w-3xl">
        <div className="mb-8">
          <Link to={section.to} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-ergo-600 dark:text-ergo-400">
            <Icon className="size-4" /> {pick(article.group ?? section.label)}
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl dark:text-white">{pick(article.title)}</h1>
          <p className="mt-3 text-lg text-stone-600 dark:text-stone-400">{pick(article.summary)}</p>
        </div>
        <div ref={body} className="prose-ergo">
          <Suspense fallback={<Loading label={t('Đang tải bài viết…', 'Loading article…')} />}>
            <Body />
          </Suspense>
        </div>

        <div className="mt-14 grid gap-3 border-t border-stone-200 pt-6 sm:grid-cols-2 dark:border-stone-800">
          {prev ? (
            <Link to={`/learn/${prev.slug}`} className="group rounded-xl border border-stone-200 p-4 hover:border-ergo-300 dark:border-stone-800">
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <ArrowLeft className="size-3.5" /> {t('Bài trước', 'Previous')}
              </div>
              <div className="mt-1 font-semibold group-hover:text-ergo-600">{pick(prev.title)}</div>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/learn/${next.slug}`} className="group rounded-xl border border-stone-200 p-4 text-right hover:border-ergo-300 dark:border-stone-800">
              <div className="flex items-center justify-end gap-1 text-xs text-stone-500">
                {t('Bài tiếp theo', 'Next')} <ArrowRight className="size-3.5" />
              </div>
              <div className="mt-1 font-semibold group-hover:text-ergo-600">{pick(next.title)}</div>
            </Link>
          )}
        </div>
      </article>

      <aside className="hidden xl:block">
        {toc.length > 1 && (
          <div className="sticky top-24 text-sm">
            <div className="mb-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('Trong bài này', 'On this page')}</div>
            <ul className="space-y-2">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-stone-500 hover:text-ergo-600">
                    {t.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
