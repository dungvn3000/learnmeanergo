import { lazy } from 'react'
import { Blocks, BookOpen, Boxes, Coins, Compass, Cpu, FileCode2, FileText, Gauge, Hourglass, KeyRound, Landmark, Layers, Link2, Lock, Megaphone, Pickaxe, RadioTower, ScrollText, Shapes, Sigma, TrendingDown, Wallet } from 'lucide-react'
import { ARTICLES } from './manifest'

// One JSX file per article; its text lives in ./locales/{en,vi}/<File>.json.
const files = import.meta.glob(['./*.jsx'])
const load = (file) => lazy(files[`./${file}.jsx`])

const ICONS = { Blocks, Boxes, Coins, Compass, Cpu, FileCode2, FileText, Gauge, Hourglass, KeyRound, Landmark, Layers, Link2, Lock, Megaphone, Pickaxe, RadioTower, ScrollText, Shapes, Sigma, TrendingDown, Wallet }

/** Every guide page, with its icon component and lazy-loaded body. Read text fields with pick().
 *  Unknown icon names fall back to BookOpen so a typo in the manifest never blanks the page. */
export const articles = ARTICLES.map((a) => ({ ...a, icon: ICONS[a.icon] ?? BookOpen, component: load(a.file) }))

export const bySlug = Object.fromEntries(articles.map((a) => [a.slug, a]))
export const sectionOf = (s) => articles.filter((a) => a.section === s)
