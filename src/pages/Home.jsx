import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, Boxes, Clock, Coins, Cpu, FileCode2, GraduationCap, Hourglass, Layers, Pickaxe, Wrench,
} from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { ago, num, short } from '../lib/format'
import { sectionOf } from '../articles'
import { tools } from '../tools'
import { Card, Stat } from '../components/ui'
import SearchBar from '../components/SearchBar'
import { useTranslation } from 'react-i18next'
import { pick } from '../lib/i18n'
import { useSeo, websiteJsonLd } from '../lib/seo'

function LiveChain() {
  const { t } = useTranslation()
  const s = useApi(() => api.latestBlocks(5), [], 20_000)
  const blocks = s.data ? [...s.data].reverse() : []
  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        {t('home.theChainRightNow')}
      </div>
      {/* Fixed-width blocks, newest anchored on the right; older ones run off the left edge under a fade. */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent dark:from-stone-900" />
        <div className="flex items-center justify-end">
          {(blocks.length ? blocks : Array.from({ length: 5 }, () => null)).map((b, i) => (
            <div key={b?.id ?? i} className="flex shrink-0 items-center">
              {i > 0 && <div className="h-0.5 w-4 shrink-0 bg-ergo-300 dark:bg-ergo-800" />}
              {b ? (
                <Link
                  to={`/block/${b.height}`}
                  className={`group w-[118px] rounded-xl border p-2.5 transition hover:-translate-y-0.5 ${
                    i === blocks.length - 1
                      ? 'border-ergo-400 bg-ergo-500 text-white shadow-lg shadow-ergo-500/25'
                      : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase opacity-70">
                    <Layers className="size-3" /> Block
                  </div>
                  <div className="font-mono text-sm font-bold tabular-nums whitespace-nowrap">{num(b.height)}</div>
                  <div className="truncate text-[11px] opacity-70">{b.txCount} tx · {ago(b.timestamp)}</div>
                </Link>
              ) : (
                <div className="h-[74px] w-[118px] animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
              )}
            </div>
          ))}
        </div>
      </div>
      {blocks.length > 0 && (
        <p className="mt-3 text-xs text-stone-500">
          {t('home.eachBlockPointsToThePrevious')} <code className="font-mono">parentId</code>. {t('home.theLatestBlock')}{' '}
          <span className="font-mono">{short(blocks.at(-1).id, 6, 4)}</span> {t('home.wasMinedBy')}{' '}
          <span className="font-medium">{blocks.at(-1).miner || short(blocks.at(-1).minerAddress)}</span>.
        </p>
      )}
    </div>
  )
}

function NetworkStats() {
  const { t } = useTranslation()
  const s = useApi(() => api.networkState(), [], 30_000)
  const d = s.data
  const dash = '—'
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={Layers} label={t('common.height')} value={d ? num(d.height) : dash} sub={d ? `${t('home.lastBlock')} ${ago(d.tipTimestamp)}` : ' '} />
      <Stat icon={Cpu} label="Hashrate" value={d ? `${d.hashrate} TH/s` : dash} sub={d ? `${d.hashrateChange7d > 0 ? '+' : ''}${d.hashrateChange7d}% ${t('home.over7Days')}` : ' '} />
      <Stat icon={Coins} label={t('home.circulatingErg')} value={d ? `${num(d.circulating / 1e6, 2)}M` : dash} sub={d ? `${t('home.ofMax')} ${num(d.maxSupply / 1e6, 2)}M ERG` : ' '} />
      <Stat icon={Clock} label={t('home.blockTime')} value={d ? `${Math.floor(d.avgBlockTimeSec / 60)}m ${String(Math.round(d.avgBlockTimeSec % 60)).padStart(2, '0')}s` : dash} sub={t('home.target2Minutes')} />
    </div>
  )
}

const features = (t) => [
  { icon: Boxes, title: t('home.theEutxoModel'), text: t('home.coinsLiveInLockedBoxesThat'), to: '/learn/boxes' },
  { icon: FileCode2, title: 'ErgoScript & Sigma', text: t('home.smartContractsBuiltOnSigmaProtocols'), to: '/learn/ergotree' },
  { icon: Pickaxe, title: 'Autolykos v2', text: t('home.memoryHardGpuFriendlyAsicResistant'), to: '/learn/autolykos' },
  { icon: Hourglass, title: 'Storage rent', text: t('home.boxesLeftUntouchedFor4Years'), to: '/learn/storage-rent' },
]

function PathCard({ icon: Icon, title, to, list, cta }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-ergo-500 text-white">
          <Icon className="size-5" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 dark:text-white">{title}</h3>
      </div>
      <ol className="mt-5 flex-1 space-y-1">
        {list.map((a, i) => (
          <li key={a.slug}>
            <Link to={`/learn/${a.slug}`} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800/60">
              <span className="w-5 text-right text-xs font-bold text-stone-400 tabular-nums">{i + 1}</span>
              <a.icon className="size-4 text-stone-400 group-hover:text-ergo-500" />
              <span className="text-sm font-medium group-hover:text-ergo-600">{pick(a.title)}</span>
            </Link>
          </li>
        ))}
      </ol>
      <Link to={to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ergo-600 hover:gap-2 dark:text-ergo-400">
        {cta} <ArrowRight className="size-4 transition-all" />
      </Link>
    </Card>
  )
}

export default function Home() {
  const { t } = useTranslation()
  useSeo({ path: '/', jsonLd: websiteJsonLd() })
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {t('home.liveDataFromErgoMainnet')}
          </div>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-stone-900 sm:text-5xl dark:text-white">
            {t('home.ergoExplained')}<span className="text-ergo-500">{t('home.forEveryone')}</span>.
          </h1>
          <p className="mt-3 text-sm font-medium text-stone-500">
            {t('home.inspiredBy')}{' '}
            <Link to="/learn/manifesto" className="text-stone-700 hover:text-ergo-600 dark:text-stone-300">
              The Ergo Manifesto
            </Link>
            : <em>Created for regular people</em>.
          </p>
          <p className="mt-5 max-w-xl text-lg text-stone-600 dark:text-stone-400">
            {t('home.aSimpleYetTechnicalGuideTo')}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/beginners" className="inline-flex items-center gap-2 rounded-xl bg-ergo-500 px-5 py-3 font-semibold text-white shadow-lg shadow-ergo-500/25 hover:bg-ergo-600">
              <GraduationCap className="size-5" /> {t('common.beginners')}
            </Link>
            <Link to="/technical" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900">
              <BookOpen className="size-5" /> {t('common.technical')}
            </Link>
          </div>
        </div>
        <Card className="p-5 sm:p-6">
          <LiveChain />
          <div className="mt-5 border-t border-stone-100 pt-5 dark:border-stone-800">
            <SearchBar big />
            <p className="mt-2 text-xs text-stone-500">{t('home.tryABlockHeightEG')}</p>
          </div>
        </Card>
      </section>

      <section>
        <NetworkStats />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PathCard icon={GraduationCap} title={t('common.beginners')} to="/beginners" list={sectionOf('beginners')} cta={t('home.allBeginnerGuides')} />
        <PathCard icon={BookOpen} title={t('common.technical')} to="/technical" list={sectionOf('technical').slice(0, 6)} cta={t('home.allTechnicalGuides', { length: sectionOf('technical').length })} />
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-stone-900 dark:text-white">{t('home.whatMakesErgoDifferent')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features(t).map((f) => (
            <Link key={f.title} to={f.to} className="group">
              <Card className="h-full p-5 transition group-hover:border-ergo-300">
                <f.icon className="size-6 text-ergo-500" />
                <h3 className="mt-3 font-bold text-stone-900 group-hover:text-ergo-600 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm text-stone-500">{f.text}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-stone-900 p-6 text-white sm:p-10 dark:bg-stone-900/60 dark:ring-1 dark:ring-stone-800">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-ergo-400">
              <Wrench className="size-4" /> {t('common.tools')}
            </div>
            <h2 className="mt-2 text-2xl font-bold">{t('home.donTJustReadCalculateIt')}</h2>
          </div>
          <Link to="/tools" className="inline-flex items-center gap-1 text-sm font-semibold text-ergo-400 hover:gap-2">
            {t('common.allTools')} <ArrowRight className="size-4 transition-all" />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {tools.map((x) => (
            <Link key={x.slug} to={`/tools/${x.slug}`} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
              <x.icon className="size-5 text-ergo-400" />
              <div className="mt-2 text-sm font-semibold">{pick(x.title)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
