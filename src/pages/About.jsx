import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Blocks, Code2, Database, Hammer, Info, Layers } from 'lucide-react'
import { useSeo } from '../lib/seo'
import { Card, PageHeader } from '../components/ui'
import pkg from '../../package.json'

const REPO = 'https://github.com/dungvn3000/learnmeanergo'

// Versions come straight from package.json so this page never goes stale.
const ver = (name) => (pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? '').replace(/^[\^~]/, '')

const STACK = [
  { key: 'react', name: 'React', pkg: 'react', url: 'https://react.dev' },
  { key: 'vite', name: 'Vite', pkg: 'vite', url: 'https://vite.dev' },
  { key: 'router', name: 'React Router', pkg: 'react-router-dom', url: 'https://reactrouter.com' },
  { key: 'tailwind', name: 'Tailwind CSS', pkg: 'tailwindcss', url: 'https://tailwindcss.com' },
  { key: 'i18next', name: 'i18next + react-i18next', pkg: 'react-i18next', url: 'https://react.i18next.com' },
  { key: 'noble', name: '@noble/hashes', pkg: '@noble/hashes', url: 'https://github.com/paulmillr/noble-hashes' },
  { key: 'lucide', name: 'Lucide', pkg: 'lucide-react', url: 'https://lucide.dev' },
  { key: 'oxlint', name: 'Oxlint', pkg: 'oxlint', url: 'https://oxc.rs' },
]

// Card text sits outside .prose-ergo, so links and code get their own styling here.
const CARD_TEXT =
  'text-sm text-stone-600 dark:text-stone-300 [&_a]:font-medium [&_a]:text-ergo-600 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-ergo-400 [&_code]:font-mono [&_code]:text-[0.9em]'

const ext = (href) => <a href={href} target="_blank" rel="noreferrer" />

export default function About() {
  const { t } = useTranslation()
  useSeo({
    path: '/about',
    title: { vi: 'Giới thiệu', en: 'About' },
    description: {
      vi: 'Learn Me An Ergo được xây dựng thế nào: React, Vite, Tailwind CSS, i18next và dữ liệu mainnet trực tiếp từ explorer.erg.vn.',
      en: 'How Learn Me An Ergo is built: React, Vite, Tailwind CSS, i18next and live mainnet data from explorer.erg.vn.',
    },
  })
  const T = (k, components) => <Trans t={t} i18nKey={k} components={{ b: <strong />, code: <code />, ...components }} />

  return (
    <div className="max-w-3xl">
      <PageHeader icon={Info} kicker={t('about.kicker')} title={t('about.title')}>
        {t('about.lead')}
      </PageHeader>

      <div className="prose-ergo">
        <p>{T('about.intro')}</p>

        <h2 id="stack">{t('about.stack.title')}</h2>
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
          {STACK.map((s) => (
            <Card key={s.key} className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-stone-900 hover:text-ergo-600 dark:text-white dark:hover:text-ergo-400">
                  {s.name}
                </a>
                <span className="font-mono text-xs text-stone-500">{ver(s.pkg)}</span>
              </div>
              <p className="mt-1 text-sm text-stone-500">{t(`about.stack.${s.key}`)}</p>
            </Card>
          ))}
        </div>

        <h2 id="data">{t('about.data.title')}</h2>
        <div className="not-prose my-6 grid gap-3">
          <Card className="flex gap-3 p-4">
            <Database className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <p className={CARD_TEXT}>{T('about.data.api', { explorer: ext('https://explorer.erg.vn') })}</p>
          </Card>
          <Card className="flex gap-3 p-4">
            <Blocks className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <p className={CARD_TEXT}>{T('about.data.protocol')}</p>
          </Card>
        </div>

        <h2 id="i18n">{t('about.i18n.title')}</h2>
        <p>{T('about.i18n.p1')}</p>

        <h2 id="design">{t('about.design.title')}</h2>
        <p>{T('about.design.p1', { paper: ext('https://github.com/nanxiaobei/hugo-paper') })}</p>

        <h2 id="build">{t('about.build.title')}</h2>
        <div className="not-prose my-6 grid gap-3">
          <Card className="flex gap-3 p-4">
            <Hammer className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <p className={CARD_TEXT}>{T('about.build.p1')}</p>
          </Card>
          <Card className="flex gap-3 p-4">
            <Layers className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <p className={CARD_TEXT}>{T('about.build.p2')}</p>
          </Card>
        </div>

        <h2 id="source">{t('about.source.title')}</h2>
        <p>{T('about.source.p1', { repo: ext(REPO), privacy: <Link to="/privacy" /> })}</p>
        <p className="not-prose mt-6">
          <a href={REPO} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ergo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ergo-700">
            <Code2 className="size-4" /> github.com/dungvn3000/learnmeanergo
          </a>
        </p>
      </div>
    </div>
  )
}
