import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BookOpen, ChevronLeft, GraduationCap, Search, Wrench } from 'lucide-react'
import { sectionOf } from '../articles'
import { tools } from '../tools'
import { pick, t } from '../lib/i18n'

const EXPLORER_PATHS = ['/explorer', '/block/', '/tx/', '/address/', '/box/', '/token/']

/** The site tree shown in the vertical menu. */
function tree() {
  const technical = sectionOf('technical')
  const groups = [...new Set(technical.map((a) => a.group))]
  const item = (a) => ({ to: `/learn/${a.slug}`, label: pick(a.title) })
  return [
    {
      key: 'beginners',
      icon: GraduationCap,
      label: t('Người mới bắt đầu', 'Beginners'),
      groups: [
        { items: [{ to: '/beginners', label: t('Tổng quan', 'Overview') }] },
        { label: t('Hướng dẫn', 'Guide'), items: sectionOf('beginners').map(item) },
      ],
    },
    {
      key: 'technical',
      icon: BookOpen,
      label: t('Kỹ thuật', 'Technical'),
      groups: [
        { items: [{ to: '/technical', label: t('Tổng quan', 'Overview') }] },
        ...groups.map((g) => ({ label: pick(g), items: technical.filter((a) => a.group === g).map(item) })),
      ],
    },
    {
      key: 'tools',
      icon: Wrench,
      label: t('Công cụ', 'Tools'),
      groups: [
        { items: [{ to: '/tools', label: t('Tất cả công cụ', 'All tools') }] },
        { items: tools.map((x) => ({ to: `/tools/${x.slug}`, label: pick(x.title) })) },
      ],
    },
    {
      key: 'explorer',
      icon: Search,
      label: 'Explorer',
      to: '/explorer',
      match: (p) => EXPLORER_PATHS.some((x) => p.startsWith(x)),
    },
  ]
}

const owns = (sec, path) => (sec.match ? sec.match(path) : sec.groups.some((g) => g.items.some((i) => i.to === path)))

const row =
  'flex w-full items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-stone-800 transition hover:bg-stone-200/60 dark:text-stone-100 dark:hover:bg-stone-800'

function Section({ sec, path, onNavigate }) {
  const active = owns(sec, path)
  // Like learnmeabitcoin: only the section you are in starts expanded.
  const [open, setOpen] = useState(active)
  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  if (!sec.groups) {
    return (
      <NavLink to={sec.to} onClick={onNavigate} className={`${row} border-b border-stone-200 dark:border-stone-800 ${active ? 'text-ergo-600 dark:text-ergo-400' : ''}`}>
        <sec.icon className="size-[18px] text-stone-500" />
        <span className="flex-1">{sec.label}</span>
        {active && <span className="text-ergo-500">←</span>}
      </NavLink>
    )
  }

  return (
    <div className="border-b border-stone-200 dark:border-stone-800">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className={row}>
        <sec.icon className={`size-[18px] ${active ? 'text-ergo-500' : 'text-stone-500'}`} />
        <span className="flex-1 text-left">{sec.label}</span>
        <ChevronLeft className={`size-4 text-stone-400 transition-transform ${open ? '-rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="pb-3">
          {sec.groups.map((g, gi) => (
            <div key={gi} className={gi ? 'mt-2' : ''}>
              {g.label && <div className="px-4 pt-1 pb-0.5 text-sm font-semibold text-stone-900 dark:text-stone-200">{g.label}</div>}
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-baseline gap-2 py-1 pr-4 pl-8 font-mono text-[13.5px] leading-snug transition ${
                      isActive
                        ? 'bg-ergo-500/10 font-semibold text-ergo-700 dark:text-ergo-300'
                        : 'text-stone-600 hover:text-ergo-600 dark:text-stone-400 dark:hover:text-ergo-400'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{it.label}</span>
                      {isActive && <span className="text-ergo-500">←</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ onNavigate }) {
  const { pathname } = useLocation()
  const ref = useRef(null)
  // Keep the current page visible in a long menu.
  useEffect(() => {
    ref.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
  }, [pathname])
  return (
    <nav ref={ref} aria-label={t('Mục lục', 'Site navigation')}>
      {tree().map((sec) => (
        <Section key={sec.key} sec={sec} path={pathname} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}
