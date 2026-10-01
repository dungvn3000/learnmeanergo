// Thin client for the explorer.erg.vn REST API (CORS-enabled, called directly).
// Every response is wrapped as { data, errorCode, error }; 404 resolves to null.
const BASE = import.meta.env.VITE_API_BASE ?? 'https://explorer.erg.vn/api/v1'
const enc = encodeURIComponent

async function get(path, params) {
  const qs = params ? '?' + new URLSearchParams(params) : ''
  const res = await fetch(BASE + path + qs, { headers: { Accept: 'application/json' } })
  if (res.status === 404) return null
  let body = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`)
  return body ? body.data : null
}

export const api = {
  info: () => get('/info'),
  networkState: () => get('/networkState'),
  latestBlocks: (limit = 10) => get('/blocks/latest', { limit }),
  latestTransactions: (limit = 10) => get('/transactions/latest', { limit }),
  blocks: (page = 1, rowsPerPage = 25) => get('/blocks', { page, rowsPerPage }),
  block: (idOrHeight) => get('/blocks/' + enc(idOrHeight)),
  transaction: (id) => get('/transactions/' + enc(id)),
  box: (id) => get('/boxes/' + enc(id)),
  address: (addr, page = 1, rowsPerPage = 20) => get('/addresses/' + enc(addr), { page, rowsPerPage }),
  addressBoxes: (addr, page = 1, rowsPerPage = 20) => get('/addresses/' + enc(addr) + '/boxes', { page, rowsPerPage }),
  tokens: () => get('/tokens'),
  token: (id) => get('/tokens/' + enc(id)),
  tokenHolders: (id, page = 1, rowsPerPage = 10) => get('/tokens/' + enc(id) + '/holders', { page, rowsPerPage }),
  mempool: () => get('/mempool/transactions'),
  richlist: (page = 1, rowsPerPage = 50) => get('/richlist', { page, rowsPerPage }),
  distribution: () => get('/richlist/distribution'),
  chart: (name, days = 30) => get('/charts/' + enc(name), { days }),
  search: (q) => get('/search', { q }),
}

const ROUTE_BY_TYPE = { block: '/block/', transaction: '/tx/', address: '/address/', token: '/token/', box: '/box/' }

/** Resolve free text (height, id, address…) to an in-app route, or null. */
export async function resolveSearch(q) {
  q = String(q || '').trim()
  if (/^\d{1,3}([,._ ]\d{3})+$/.test(q)) q = q.replace(/[,._ ]/g, '') // 1,884,000 → 1884000
  if (!q) return null
  const hit = await api.search(q)
  return hit ? ROUTE_BY_TYPE[hit.type] + hit.id : null
}
