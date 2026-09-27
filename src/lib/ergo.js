// Protocol constants and pure helpers used by the articles and tools.
import { blake2b } from '@noble/hashes/blake2.js'
import i18n from '../i18n'

export const blake2b256 = (bytes) => blake2b(bytes, { dkLen: 32 })

export const hexToBytes = (hex) => {
  hex = hex.trim().replace(/^0x/i, '')
  if (hex.length % 2 || /[^0-9a-f]/i.test(hex)) throw new Error(i18n.t('ergo.invalidHexString'))
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16)
  return out
}
export const bytesToHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')

// ---------- Base58 (Bitcoin alphabet, which Ergo addresses use) ----------
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export function base58Decode(str) {
  let n = 0n
  for (const ch of str) {
    const v = ALPHABET.indexOf(ch)
    if (v < 0) throw new Error(i18n.t('ergo.characterIsNotInTheBase58', { ch }))
    n = n * 58n + BigInt(v)
  }
  const out = []
  while (n > 0n) {
    out.unshift(Number(n & 0xffn))
    n >>= 8n
  }
  for (const ch of str) {
    if (ch !== '1') break
    out.unshift(0)
  }
  return Uint8Array.from(out)
}

export function base58Encode(bytes) {
  let n = 0n
  for (const b of bytes) n = (n << 8n) | BigInt(b)
  let s = ''
  while (n > 0n) {
    s = ALPHABET[Number(n % 58n)] + s
    n /= 58n
  }
  for (const b of bytes) {
    if (b !== 0) break
    s = '1' + s
  }
  return s
}

// ---------- Addresses ----------
export const NETWORKS = { 0x00: 'Mainnet', 0x10: 'Testnet' }
export const ADDRESS_TYPES = {
  1: { code: 'P2PK', name: 'Pay-to-Public-Key', get desc() { return i18n.t('ergo.theContentIsA33Byte') } },
  2: { code: 'P2SH', name: 'Pay-to-Script-Hash', get desc() { return i18n.t('ergo.theFirst24BytesOfBlake2b256') } },
  3: { code: 'P2S', name: 'Pay-to-Script', get desc() { return i18n.t('ergo.theContentIsTheEntireSerialized') } },
}

/**
 * Split an Ergo address into prefix | content | checksum and verify it.
 * address bytes = prefix(1) ‖ content ‖ blake2b256(prefix ‖ content)[0..4]
 */
export function decodeAddress(address) {
  const raw = base58Decode(address.trim())
  if (raw.length < 6) throw new Error(i18n.t('ergo.addressIsTooShort'))
  const prefix = raw[0]
  const content = raw.slice(1, -4)
  const checksum = raw.slice(-4)
  const expected = blake2b256(raw.slice(0, -4)).slice(0, 4)
  const network = prefix & 0xf0
  const type = prefix & 0x0f
  let ergoTree = null
  if (type === 1) ergoTree = '0008cd' + bytesToHex(content)
  if (type === 3) ergoTree = bytesToHex(content)
  return {
    raw,
    prefix,
    network,
    networkName: NETWORKS[network] ?? i18n.t('common.unknown'),
    type,
    typeInfo: ADDRESS_TYPES[type] ?? null,
    content,
    checksum,
    expectedChecksum: expected,
    valid: bytesToHex(checksum) === bytesToHex(expected),
    ergoTree,
  }
}

/** Build a P2PK address from a 33-byte compressed public key (hex). */
export function p2pkAddress(pubKeyHex, network = 0x00) {
  const content = hexToBytes(pubKeyHex)
  const body = Uint8Array.from([network | 1, ...content])
  const cs = blake2b256(body).slice(0, 4)
  return base58Encode(Uint8Array.from([...body, ...cs]))
}

// ---------- Emission schedule (EmissionRules + EIP-27) ----------
export const BLOCK_TIME_SEC = 120
export const FIXED_RATE_PERIOD = 525_600 // ~2 years at 2 min/block
export const FIXED_RATE = 75 // ERG per block
export const EPOCH_LENGTH = 64_800 // ~3 months
export const EPOCH_REDUCTION = 3 // ERG
export const FOUNDERS_INITIAL = 7.5
export const EIP27_ACTIVATION = 777_217
export const REEMISSION_START = 2_080_800
export const REEMISSION_PER_BLOCK = 3
export const MAX_SUPPLY = 97_739_925 // ERG, all blocks summed

/** Total new ERG created at a height (miners + treasury). */
export function emissionAt(h) {
  if (h < 1) return 0
  if (h < FIXED_RATE_PERIOD) return FIXED_RATE
  const epoch = 1 + Math.floor((h - FIXED_RATE_PERIOD) / EPOCH_LENGTH)
  return Math.max(FIXED_RATE - EPOCH_REDUCTION * epoch, 0)
}

/** Part of the emission that went to the treasury (founders) in the early years. */
export function treasuryAt(h) {
  if (h < 1) return 0
  if (h < FIXED_RATE_PERIOD) return FOUNDERS_INITIAL
  if (h < FIXED_RATE_PERIOD + 2 * EPOCH_LENGTH) return emissionAt(h) - (FIXED_RATE - FOUNDERS_INITIAL)
  return 0
}

/** EIP-27: portion of the emission locked into the re-emission contract. */
export function reemissionLockAt(h) {
  if (h < EIP27_ACTIVATION) return 0
  const e = emissionAt(h) - treasuryAt(h)
  if (e >= 15) return 12
  return Math.max(e - 3, 0)
}

/** What the block's miner actually receives (excluding fees). */
export function minerRewardAt(h) {
  if (h >= REEMISSION_START) return REEMISSION_PER_BLOCK
  return emissionAt(h) - treasuryAt(h) - reemissionLockAt(h)
}

/** Cumulative ERG emitted up to and including height h (closed form, piecewise). */
export function emittedUpTo(h) {
  if (h < 1) return 0
  if (h < FIXED_RATE_PERIOD) return h * FIXED_RATE
  let total = (FIXED_RATE_PERIOD - 1) * FIXED_RATE
  let from = FIXED_RATE_PERIOD
  while (from <= h) {
    const rate = emissionAt(from)
    if (rate === 0) break
    const epochEnd = FIXED_RATE_PERIOD + Math.floor((from - FIXED_RATE_PERIOD) / EPOCH_LENGTH + 1) * EPOCH_LENGTH - 1
    const to = Math.min(h, epochEnd)
    total += (to - from + 1) * rate
    from = to + 1
  }
  return total
}

export const heightToDate = (h, ref = { height: 1, time: Date.UTC(2019, 6, 1) }) =>
  new Date(ref.time + (h - ref.height) * BLOCK_TIME_SEC * 1000)

// ---------- Storage rent ----------
export const STORAGE_PERIOD = 1_051_200 // blocks ≈ 4 years
export const STORAGE_FEE_FACTOR = 1_250_000 // nanoERG per byte per period (default, votable)
export const MIN_VALUE_PER_BYTE = 360 // nanoERG (default, votable)

/** The P2PK ErgoTree prefix: header 0x00, constant of type SigmaProp (0x08), ProveDlog (0xcd). */
export const P2PK_TREE_PREFIX = '0008cd'
