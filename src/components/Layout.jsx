import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, Code2, GraduationCap, Menu, Moon, Search, ShieldCheck, Sun, Wrench, X } from 'lucide-react'
import SearchBar from './SearchBar'
import Sidebar from './Sidebar'
import { LANGS, t, useLang } from '../lib/i18n'

const REPO = 'https://github.com/dungvn3000/learnmeanergo'

const nav = () => [
  { to: '/beginners', label: t('Người mới', 'Beginners'), icon: GraduationCap },
  { to: '/technical', label: t('Kỹ thuật', 'Technical'), icon: BookOpen },
  { to: '/tools', label: t('Công cụ', 'Tools'), icon: Wrench },
  { to: '/explorer', label: 'Explorer', icon: Search },
]

function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex rounded-lg border border-stone-200 p-0.5 text-xs font-bold dark:border-stone-700" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2 py-1 uppercase ${lang === l ? 'bg-ergo-500 text-white' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-stone-900 dark:text-white">
      <img src="/icon-192.png" alt="" width="36" height="36" className="size-9 shrink-0" />
      <span className="leading-tight">
        Learn Me An <span className="text-ergo-500">Ergo</span>
      </span>
    </Link>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* storage blocked */
    }
  }, [dark])
  return (
    <button
      onClick={() => setDark(!dark)}
      className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white"
      title={dark ? t('Giao diện sáng', 'Light mode') : t('Giao diện tối', 'Dark mode')}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}

/** Logo, search, the menu tree and the settings — the whole left column. */
function Panel({ onNavigate, onClose }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 px-4 dark:border-stone-800">
        <Logo />
        {onClose && (
          <button className="rounded-lg p-2" onClick={onClose} aria-label={t('Đóng menu', 'Close menu')}>
            <X className="size-5" />
          </button>
        )}
      </div>
      <div className="border-b border-stone-200 p-3 dark:border-stone-800">
        <SearchBar onDone={onNavigate} />
      </div>
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <Sidebar onNavigate={onNavigate} />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-stone-200 px-4 py-2.5 dark:border-stone-800">
        <LangSwitch />
        <div className="flex items-center gap-1">
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-stone-500 hover:text-ergo-600"
            aria-label={t('Mã nguồn trên GitHub', 'Source code on GitHub')}
            title="GitHub"
          >
            <Code2 className="size-5" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const NAV = nav()
  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <div className="flex min-h-screen flex-col lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-stone-100 lg:block dark:border-stone-800 dark:bg-stone-900">
        <Panel />
      </aside>

      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur lg:hidden dark:border-stone-800 dark:bg-stone-950/90">
        <div className="flex h-14 items-center gap-2 px-3">
          <button className="rounded-lg p-2" onClick={() => setOpen(true)} aria-label={t('Mở menu', 'Open menu')}>
            <Menu className="size-5" />
          </button>
          <Logo />
          <div className="ml-auto flex items-center gap-1">
            <LangSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
        <Outlet />
      </main>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-stone-100 shadow-xl dark:bg-stone-900">
            <Panel onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <footer className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-8">
          <div>
            <Logo />
            <p className="mt-3 text-stone-500">
              {t('Học Ergo từ gốc rễ, lấy cảm hứng từ', 'Learn Ergo from the ground up, inspired by')}{' '}
              <a href="https://learnmeabitcoin.com" className="underline hover:text-ergo-600" target="_blank" rel="noreferrer">
                learnmeabitcoin.com
              </a>
              .
            </p>
            <p className="mt-2 text-stone-500">
              {t('Mã nguồn mở của trang này:', 'This site is open source:')}{' '}
              <a href={REPO} className="inline-flex items-center gap-1 underline hover:text-ergo-600" target="_blank" rel="noreferrer">
                <Code2 className="size-3.5" /> github.com/dungvn3000/learnmeanergo
              </a>
            </p>
          </div>
          <div>
            <div className="mb-2 font-semibold text-stone-900 dark:text-white">{t('Học', 'Learn')}</div>
            <ul className="space-y-1.5 text-stone-500">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-ergo-600">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 font-semibold text-stone-900 dark:text-white">{t('Dữ liệu', 'Data')}</div>
            <p className="text-stone-500">
              {t('Mọi số liệu trực tiếp lấy từ API của', 'All live data comes from the API of')}{' '}
              <a href="https://explorer.erg.vn" className="underline hover:text-ergo-600" target="_blank" rel="noreferrer">
                explorer.erg.vn
              </a>{' '}
              (Ergo Vietnam).
            </p>
            <p className="mt-2 text-stone-500">
              {t('Tài liệu gốc:', 'Official docs:')}{' '}
              <a href="https://docs.ergoplatform.com" className="underline hover:text-ergo-600" target="_blank" rel="noreferrer">
                docs.ergoplatform.com
              </a>
            </p>
            <p className="mt-2 text-stone-500">
              {t('Mã nguồn node Ergo:', 'Ergo node source code:')}{' '}
              <a href="https://github.com/ergoplatform/ergo" className="inline-flex items-center gap-1 underline hover:text-ergo-600" target="_blank" rel="noreferrer">
                <Code2 className="size-3.5" /> github.com/ergoplatform/ergo
              </a>
            </p>
            <p className="mt-2">
              <Link to="/privacy" className="inline-flex items-center gap-1 font-medium text-stone-600 hover:text-ergo-600 dark:text-stone-300">
                <ShieldCheck className="size-3.5" /> {t('Quyền riêng tư — không theo dõi gì cả', 'Privacy — we track nothing')}
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
