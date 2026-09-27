import { lazy } from 'react'
import { Calculator, Fingerprint, Hash, KeyRound, ScanSearch } from 'lucide-react'
import { TOOLS } from './manifest'

const mods = import.meta.glob(['./*.jsx'])
const ICONS = { Calculator, Fingerprint, Hash, KeyRound, ScanSearch }

export const tools = TOOLS.map((t) => ({ ...t, icon: ICONS[t.icon], component: lazy(mods[`./${t.file}.jsx`]) }))

export const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug, t]))
