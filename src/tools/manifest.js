// Plain metadata for the tools — no React, no icons — importable from Node.
export const TOOLS = [
  { slug: 'address-decoder', icon: 'ScanSearch',
    title: { vi: 'Giải mã địa chỉ', en: 'Address decoder' },
    summary: { vi: 'Tách địa chỉ thành prefix, nội dung, checksum và kiểm tra từng byte.', en: 'Split an address into prefix, content and checksum, and check every byte.' }, file: 'AddressDecoder' },
  { slug: 'pubkey-to-address', icon: 'KeyRound',
    title: { vi: 'Public key → Địa chỉ', en: 'Public key → Address' },
    summary: { vi: 'Tự tay dựng một địa chỉ P2PK từ khoá công khai 33 byte.', en: 'Build a P2PK address by hand from a 33-byte public key.' }, file: 'PubkeyToAddress' },
  { slug: 'blake2b', icon: 'Fingerprint',
    title: { vi: 'Blake2b-256', en: 'Blake2b-256' },
    summary: { vi: 'Hàm băm dùng cho block id, tx id, box id và checksum địa chỉ.', en: 'The hash function behind block ids, tx ids, box ids and address checksums.' },
    file: 'Blake2b' },
  { slug: 'units', icon: 'Hash',
    title: { vi: 'Đổi đơn vị ERG', en: 'ERG unit converter' },
    summary: { vi: 'ERG ↔ nanoERG — đơn vị mà blockchain thật sự lưu.', en: 'ERG ↔ nanoERG — the unit the blockchain actually stores.' }, file: 'Units' },
  { slug: 'emission-calculator', icon: 'Calculator',
    title: { vi: 'Máy tính phát hành', en: 'Emission calculator' },
    summary: { vi: 'Phần thưởng block, phần bị khoá EIP-27 và tổng cung ở bất kỳ độ cao nào.', en: 'Block reward, EIP-27 lock and total supply at any height.' }, file: 'EmissionCalculator' },
]
