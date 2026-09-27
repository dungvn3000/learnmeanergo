import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import {
  BLOCK_TIME_SEC, EIP27_ACTIVATION, FIXED_RATE_PERIOD, MAX_SUPPLY, REEMISSION_START,
  emissionAt, emittedUpTo, minerRewardAt, reemissionLockAt, treasuryAt,
} from '../lib/ergo'
import { num } from '../lib/format'
import { Badge, Callout, Card, Field } from '../components/ui'
import { locale, t } from '../lib/i18n'

const MAX_H = 2_500_000

function phaseOf(h) {
  if (h < FIXED_RATE_PERIOD) return {
      tone: 'green',
      label: t('Giai đoạn cố định', 'Fixed-rate period'),
      desc: t('75 ERG mỗi block trong ~2 năm đầu (525,600 block).', '75 ERG per block for the first ~2 years (525,600 blocks).'),
    }
  if (h >= REEMISSION_START) return {
      tone: 'violet',
      label: t('Tái phát hành', 'Re-emission'),
      desc: t(
        'Phát hành chính đã hết; thợ đào nhận 3 ERG/block từ hợp đồng tái phát hành (EIP-27).',
        'Main emission is over; miners receive 3 ERG/block from the re-emission contract (EIP-27).',
      ),
    }
  if (h >= EIP27_ACTIVATION) return {
      tone: 'sky',
      label: t('Giảm dần + EIP-27', 'Declining + EIP-27'),
      desc: t(
        'Mỗi 64,800 block (~3 tháng) giảm 3 ERG; một phần bị khoá vào hợp đồng tái phát hành.',
        'Drops by 3 ERG every 64,800 blocks (~3 months); part of it is locked into the re-emission contract.',
      ),
    }
  return {
    tone: 'ergo',
    label: t('Giảm dần', 'Declining'),
    desc: t('Mỗi 64,800 block (~3 tháng) phần thưởng giảm 3 ERG.', 'The reward drops by 3 ERG every 64,800 blocks (~3 months).'),
  }
}

const fmtDate = (d) => d.toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' })

export default function EmissionCalculator() {
  const info = useApi(() => api.latestBlocks(1), [])
  const tip = info.data?.[0]
  const [h, setH] = useState(null)
  const [draft, setText] = useState(null)

  // Until the user picks a height, follow the live tip.
  const height = h ?? tip?.height ?? 1_000_000
  const text = draft ?? String(height)
  const set = (v) => {
    const n = Math.max(1, Math.min(MAX_H, Math.trunc(Number(v)) || 1))
    setH(n)
    setText(String(n))
  }

  const r = useMemo(() => {
    const emitted = emittedUpTo(height)
    return {
      emission: emissionAt(height),
      treasury: treasuryAt(height),
      lock: reemissionLockAt(height),
      miner: minerRewardAt(height),
      emitted,
      pct: (emitted / MAX_SUPPLY) * 100,
    }
  }, [height])

  const date = tip
    ? new Date(tip.timestamp + (height - tip.height) * BLOCK_TIME_SEC * 1000)
    : new Date(Date.UTC(2019, 6, 1) + (height - 1) * BLOCK_TIME_SEC * 1000)
  const past = tip && height <= tip.height
  const phase = phaseOf(height)

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grow">
            <span className="text-sm font-semibold text-stone-900 dark:text-white">{t('Độ cao block', 'Block height')}</span>
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                const n = Number(e.target.value.replace(/[,\s]/g, ''))
                if (Number.isFinite(n) && n >= 1) setH(Math.min(MAX_H, Math.trunc(n)))
              }}
              onBlur={() => set(height)}
              inputMode="numeric"
              className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-lg tabular-nums outline-none focus:border-ergo-400 focus:ring-4 focus:ring-ergo-500/15 dark:border-stone-700 dark:bg-stone-950"
            />
          </label>
          {tip && (
            <button
              onClick={() => set(tip.height)}
              className="inline-flex items-center gap-1 rounded-full border border-ergo-200 bg-ergo-50 px-3 py-2 text-xs text-ergo-700 hover:border-ergo-400 dark:border-ergo-900 dark:bg-ergo-950/40 dark:text-ergo-300"
            >
              <Radio className="size-3" /> {t('Hiện tại', 'Current')}: {num(tip.height)}
            </button>
          )}
        </div>
        <input
          type="range"
          min={1}
          max={MAX_H}
          step={1}
          value={height}
          onChange={(e) => set(e.target.value)}
          className="mt-4 w-full accent-ergo-500"
          aria-label={t('Độ cao block', 'Block height')}
        />
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {[
            [1, 'Genesis'],
            [FIXED_RATE_PERIOD, t('Hết giai đoạn cố định', 'End of fixed rate')],
            [EIP27_ACTIVATION, t('EIP-27 kích hoạt', 'EIP-27 activation')],
            [REEMISSION_START, t('Bắt đầu tái phát hành', 'Re-emission starts')],
          ].map(([v, l]) => (
            <button key={v} onClick={() => set(v)} className="rounded-full border border-stone-200 px-3 py-1 hover:border-ergo-300 hover:text-ergo-600 dark:border-stone-700">
              {l} · {num(v)}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{t('Tổng phát hành / block', 'Total emission / block')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-stone-900 dark:text-white">{num(r.emission, 2)} ERG</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{t('Thợ đào nhận', 'Miner receives')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-ergo-600 dark:text-ergo-400">{num(r.miner, 2)} ERG</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{t('Đã phát hành', 'Emitted so far')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-stone-900 dark:text-white">{r.pct.toFixed(2)}%</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div className="h-full rounded-full bg-ergo-500" style={{ width: `${Math.min(100, r.pct)}%` }} />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <Field name={t('Giai đoạn', 'Phase')} value={<Badge tone={phase.tone}>{phase.label}</Badge>}>
          {phase.desc}
        </Field>
        <Field name={t('Ngày (ước tính)', 'Date (estimated)')} value={fmtDate(date)}>
          {past
            ? t(
                'Block này đã được đào — ngày thực tế có thể lệch vài ngày do thời gian block dao động.',
                'This block has already been mined — the actual date may differ by a few days because block times vary.',
              )
            : t('Ngoại suy từ block mới nhất với 2 phút mỗi block.', 'Extrapolated from the latest block at 2 minutes per block.')}
        </Field>
        <Field name={t('Phát hành mới', 'New emission')} value={`${num(r.emission, 2)} ERG`}>
          {t('Lượng ERG mới được tạo ra bởi hợp đồng phát hành ở block này.', 'The amount of new ERG created by the emission contract at this block.')}
        </Field>
        <Field name={t('Quỹ (treasury)', 'Treasury')} value={`${num(r.treasury, 2)} ERG`}>
          {t(
            'Phần dành cho quỹ phát triển trong khoảng 2.5 năm đầu (7.5 ERG/block, sau đó 4.5 và 1.5 ERG).',
            'The share for the development treasury during roughly the first 2.5 years (7.5 ERG/block, then 4.5 and 1.5 ERG).',
          )}
        </Field>
        <Field name={t('Khoá EIP-27', 'EIP-27 lock')} value={`${num(r.lock, 2)} ERG`}>
          {t(
            `Từ block ${num(EIP27_ACTIVATION)}, phần này được gửi vào hợp đồng tái phát hành thay vì trả ngay cho thợ đào: 12 ERG nếu phần thưởng ≥ 15 ERG, còn lại là (phần thưởng − 3).`,
            `From block ${num(EIP27_ACTIVATION)}, this part goes into the re-emission contract instead of straight to the miner: 12 ERG if the reward is ≥ 15 ERG, otherwise (reward − 3).`,
          )}
        </Field>
        <Field name={t('Thợ đào nhận', 'Miner receives')} value={`${num(r.miner, 2)} ERG + ${t('phí giao dịch', 'transaction fees')}`}>
          {height >= REEMISSION_START
            ? t('3 ERG mỗi block được trả từ hợp đồng tái phát hành cho tới khi nó cạn.', '3 ERG per block paid from the re-emission contract until it runs dry.')
            : t('Phát hành − quỹ − phần khoá EIP-27.', 'Emission − treasury − EIP-27 lock.')}
        </Field>
        <Field name={t('Tổng đã phát hành', 'Total emitted')} value={`${num(r.emitted)} / ${num(MAX_SUPPLY)} ERG`}>
          {t(
            `Cộng dồn từ block 1 tới block ${num(height)}. Nguồn cung tối đa không bao giờ vượt quá ${num(MAX_SUPPLY)} ERG.`,
            `Summed from block 1 to block ${num(height)}. The supply can never exceed ${num(MAX_SUPPLY)} ERG.`,
          )}
        </Field>
      </Card>

      <Callout type="tip">
        {t('Muốn hiểu vì sao lịch phát hành có hình bậc thang? Đọc bài', 'Want to know why the emission schedule looks like a staircase? Read')}{' '}
        <Link to="/learn/emission">{t('Lịch phát hành & EIP-27', 'Emission schedule & EIP-27')}</Link>.
      </Callout>
    </div>
  )
}
