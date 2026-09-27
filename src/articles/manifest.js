// Plain metadata for every guide page — no React, no icons — so it can be
// imported from Node (scripts/generate-seo.mjs) as well as from the app.
// `section` decides where it is listed; the order inside a section is the
// suggested reading order. Text fields are { vi, en }.
const FOUNDATIONS = { vi: 'Nền tảng', en: 'Foundations' }
const DATA = { vi: 'Cấu trúc dữ liệu', en: 'Data structures' }
const SCRIPT = { vi: 'Script & địa chỉ', en: 'Scripts & addresses' }
const MINING = { vi: 'Đào & kinh tế', en: 'Mining & economics' }

export const ARTICLES = [
  // ---- Beginners ----
  { slug: 'what-is-ergo', section: 'beginners', icon: 'Compass', file: 'WhatIsErgo',
    title: { vi: 'Ergo là gì?', en: 'What is Ergo?' },
    summary: { vi: 'Một blockchain Proof-of-Work cho hợp đồng thông minh an toàn, dành cho người dùng bình thường.', en: 'A Proof-of-Work blockchain for safe smart contracts, built for ordinary people.' } },
  { slug: 'manifesto', section: 'beginners', icon: 'Megaphone', file: 'Manifesto',
    title: { vi: 'Tuyên ngôn Ergo', en: 'The Ergo Manifesto' },
    summary: { vi: 'Vì sao Ergo tồn tại: gốc rễ cypherpunk, quyền riêng tư và năm nguyên tắc cơ bản.', en: 'Why Ergo exists: cypherpunk roots, privacy and five basic principles.' } },
  { slug: 'how-it-works', section: 'beginners', icon: 'Layers', file: 'HowItWorks',
    title: { vi: 'Blockchain Ergo hoạt động thế nào?', en: 'How does the Ergo blockchain work?' },
    summary: { vi: 'Node, thợ đào, block và giao dịch — bức tranh toàn cảnh trong 10 phút.', en: 'Nodes, miners, blocks and transactions — the big picture in 10 minutes.' } },
  { slug: 'boxes', section: 'beginners', icon: 'Boxes', file: 'BeginnerBoxes',
    title: { vi: 'Box: những chiếc hộp giữ tiền', en: 'Boxes: where the money lives' },
    summary: { vi: 'Ergo không có “số dư tài khoản”. Thay vào đó là những chiếc hộp có khoá.', en: 'Ergo has no “account balances”. Instead, there are locked boxes.' } },
  { slug: 'erg', section: 'beginners', icon: 'Coins', file: 'Erg',
    title: { vi: 'ERG và nguồn cung', en: 'ERG and its supply' },
    summary: { vi: 'Bao nhiêu ERG tồn tại, ai tạo ra chúng và khi nào đồng cuối cùng được đào.', en: 'How many ERG exist, who creates them, and when the last one gets mined.' } },
  { slug: 'wallets', section: 'beginners', icon: 'Wallet', file: 'Wallets',
    title: { vi: 'Ví, khoá và địa chỉ', en: 'Wallets, keys and addresses' },
    summary: { vi: 'Seed phrase, khoá bí mật và vì sao địa chỉ Ergo bắt đầu bằng số 9.', en: 'Seed phrases, private keys, and why Ergo addresses start with a 9.' } },
  { slug: 'mining-basics', section: 'beginners', icon: 'Pickaxe', file: 'MiningBasics',
    title: { vi: 'Đào Ergo', en: 'Mining Ergo' },
    summary: { vi: 'Thợ đào làm gì, được trả bao nhiêu và vì sao GPU vẫn đào được.', en: 'What miners do, how they get paid, and why GPUs can still mine.' } },

  // ---- Technical: foundations ----
  { slug: 'whitepaper', section: 'technical', group: FOUNDATIONS, icon: 'FileText', file: 'Whitepaper',
    title: { vi: 'Whitepaper Ergo', en: 'The Ergo whitepaper' },
    summary: { vi: '“A Resilient Platform For Contractual Money” (2019), từng phần một — và những gì đã thay đổi.', en: '“A Resilient Platform For Contractual Money” (2019), section by section — and what has changed since.' } },

  // ---- Technical: data structures ----
  { slug: 'block', section: 'technical', group: DATA, icon: 'Blocks', file: 'Block',
    title: { vi: 'Block & header', en: 'Blocks & headers' },
    summary: { vi: 'Từng trường trong header, giải thích trên một block thật.', en: 'Every header field, explained on a real block.' } },
  { slug: 'transaction', section: 'technical', group: DATA, icon: 'ScrollText', file: 'Transaction',
    title: { vi: 'Giao dịch', en: 'Transactions' },
    summary: { vi: 'Inputs, data inputs, outputs, phí và cách tính transaction id.', en: 'Inputs, data inputs, outputs, fees and how the transaction id is computed.' } },
  { slug: 'box', section: 'technical', group: DATA, icon: 'Boxes', file: 'Box',
    title: { vi: 'Box & registers', en: 'Boxes & registers' },
    summary: { vi: 'Mô hình eUTXO: R0–R9, boxId và giá trị tối thiểu.', en: 'The eUTXO model: R0–R9, box ids and the minimum value.' } },
  { slug: 'tokens', section: 'technical', group: DATA, icon: 'Shapes', file: 'Tokens',
    title: { vi: 'Token (EIP-4)', en: 'Tokens (EIP-4)' },
    summary: { vi: 'Token là công dân hạng nhất: phát hành, token id và metadata.', en: 'Tokens as first-class citizens: issuance, token ids and metadata.' } },

  // ---- Technical: scripts ----
  { slug: 'ergotree', section: 'technical', group: SCRIPT, icon: 'FileCode2', file: 'ErgoTree',
    title: { vi: 'ErgoScript, guard script & ErgoTree', en: 'ErgoScript, guard scripts & ErgoTree' },
    summary: { vi: 'Ngôn ngữ hợp đồng, guard script khoá mỗi box, và dạng bytecode mà box mang theo.', en: 'The contract language, the guard script locking every box, and the bytecode boxes carry.' } },
  { slug: 'sigma', section: 'technical', group: SCRIPT, icon: 'Sigma', file: 'SigmaProtocols',
    title: { vi: 'Sigma protocols', en: 'Sigma protocols' },
    summary: { vi: 'Chữ ký Schnorr, AND/OR/threshold và chữ ký vòng — nền tảng mật mã của ErgoScript.', en: 'Schnorr signatures, AND/OR/threshold and ring signatures — the cryptography behind ErgoScript.' } },
  { slug: 'address', section: 'technical', group: SCRIPT, icon: 'KeyRound', file: 'Address',
    title: { vi: 'Địa chỉ', en: 'Addresses' },
    summary: { vi: 'P2PK, P2SH, P2S: prefix, Base58 và checksum blake2b256.', en: 'P2PK, P2SH, P2S: the prefix byte, Base58 and the blake2b256 checksum.' } },
  { slug: 'oracle', section: 'technical', group: SCRIPT, icon: 'RadioTower', file: 'Oracle',
    title: { vi: 'Oracle & oracle pool', en: 'Oracles & oracle pools' },
    summary: { vi: 'Cách đưa dữ liệu bên ngoài như giá ERG/USD lên chuỗi, và vì sao SigmaUSD tin được nó.', en: 'How outside data like the ERG/USD price gets on-chain, and why SigmaUSD can trust it.' } },

  // ---- Technical: mining & economics ----
  { slug: 'autolykos', section: 'technical', group: MINING, icon: 'Cpu', file: 'Autolykos',
    title: { vi: 'Autolykos v2', en: 'Autolykos v2' },
    summary: { vi: 'Thuật toán PoW memory-hard và ý nghĩa của pk, w, n, d.', en: 'The memory-hard PoW algorithm, and what pk, w, n and d mean.' } },
  { slug: 'difficulty', section: 'technical', group: MINING, icon: 'Gauge', file: 'Difficulty',
    title: { vi: 'Độ khó & nBits', en: 'Difficulty & nBits' },
    summary: { vi: 'Target, nBits, hashrate và thuật toán điều chỉnh EIP-37.', en: 'Target, nBits, hashrate and the EIP-37 adjustment algorithm.' } },
  { slug: 'nipopow', section: 'technical', group: MINING, icon: 'Link2', file: 'Nipopow',
    title: { vi: 'NiPoPoW: bằng chứng chuỗi siêu gọn', en: 'NiPoPoWs: compact proofs of the chain' },
    summary: { vi: 'Superblock, interlink và cách rút 1.8 triệu header xuống vài trăm mà vẫn tin được.', en: 'Superblocks, interlinks, and how 1.8 million headers shrink to a few hundred you can still trust.' } },
  { slug: 'emission', section: 'technical', group: MINING, icon: 'TrendingDown', file: 'Emission',
    title: { vi: 'Lịch phát hành & EIP-27', en: 'Emission schedule & EIP-27' },
    summary: { vi: '75 ERG → 3 ERG: đường cong phát hành và cơ chế tái phát hành.', en: '75 ERG → 3 ERG: the emission curve and the re-emission mechanism.' } },
  { slug: 'storage-rent', section: 'technical', group: MINING, icon: 'Hourglass', file: 'StorageRent',
    title: { vi: 'Phí lưu trữ (storage rent)', en: 'Storage rent' },
    summary: { vi: 'Vì sao box nằm yên 4 năm sẽ bị thu phí — và vì sao đó là điều tốt.', en: 'Why a box left untouched for 4 years gets charged — and why that is a good thing.' } },
]
