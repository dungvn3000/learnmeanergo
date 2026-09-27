import { Link } from 'react-router-dom'
import { Check, Database, Globe, HardDrive, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSeo } from '../lib/seo'
import { Callout, Card, PageHeader } from '../components/ui'

const UPDATED = '2026-09-27'

export default function Privacy() {
  const { t } = useTranslation()
  useSeo({
    path: '/privacy',
    image: '/og/privacy.png',
    title: { vi: 'Quyền riêng tư', en: 'Privacy' },
    description: {
      vi: 'Learn Me An Ergo không theo dõi bạn: không cookie, không analytics, không tài khoản, không script bên thứ ba.',
      en: 'Learn Me An Ergo does not track you: no cookies, no analytics, no accounts, no third-party scripts.',
    },
  })

  const none = [
    t('privacy.noCookies'),
    t('privacy.noAnalyticsOrMeasurement'),
    t('privacy.noTrackingPixelsNoAds'),
    t('privacy.noAccountsNoEmailCollection'),
    t('privacy.noThirdPartyScripts'),
    t('privacy.noEmbeddedSocialMediaContent'),
  ]

  return (
    <div className="max-w-3xl">
      <PageHeader icon={ShieldCheck} kicker={t('privacy.privacy')} title={t('privacy.weDonTTrackAnything')}>
        {t('privacy.thisSiteIsAFreeLearning')}
      </PageHeader>

      <div className="prose-ergo">
        <div className="not-prose my-6 grid gap-2 sm:grid-cols-2">
          {none.map((x) => (
            <div key={x} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-surface px-3 py-2 text-sm dark:border-stone-800 dark:bg-stone-900">
              <Check className="size-4 shrink-0 text-emerald-500" /> {x}
            </div>
          ))}
        </div>

        <h2 id="tren-may-ban">{t('privacy.whatIsStoredOnYourDevice')}</h2>
        <p>
          {t('privacy.theSiteWritesJustTwoPreferences')}
        </p>

        <h2 id="ket-noi">{t('privacy.outboundConnections')}</h2>
        <p>
          {t('privacy.toShowRealNumbersYourBrowser')}
        </p>
        <div className="not-prose my-6 grid gap-3">
          <Card className="flex gap-3 p-4">
            <Database className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div className="text-sm">
              <div className="font-semibold text-stone-900 dark:text-white">explorer.erg.vn</div>
              <p className="mt-1 text-stone-500">
                {t('privacy.blocksTransactionsAddressesTokensChartsUsed')}
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 p-4">
            <Globe className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div className="text-sm">
              <div className="font-semibold text-stone-900 dark:text-white">sv1.erg.vn / sv2.erg.vn</div>
              <p className="mt-1 text-stone-500">
                {t('privacy.publicErgoNodesOnlyThe')}
                <Link to="/learn/nipopow" className="text-ergo-600 hover:underline dark:text-ergo-400">
                  NiPoPoW
                </Link>
                {t('privacy.pageCallsThemToFetchA')}
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 p-4">
            <HardDrive className="mt-0.5 size-5 shrink-0 text-ergo-500" />
            <div className="text-sm">
              <div className="font-semibold text-stone-900 dark:text-white">{t('privacy.fonts')}</div>
              <p className="mt-1 text-stone-500">
                {t('privacy.fontsAreServedFromThisDomain')}
              </p>
            </div>
          </Card>
        </div>

        <h2 id="may-chu">{t('privacy.hosting')}</h2>
        <p>
          {t('privacy.theSiteIsASetOf')}
        </p>

        <h2 id="link-ngoai">{t('privacy.externalLinks')}</h2>
        <p>
          {t('privacy.articlesLinkToOutsideMaterialDocs')}
        </p>

        <Callout type="tip" title={t('privacy.checkForYourself')}>
          {t('privacy.openYourBrowserSDeveloperTools')}
        </Callout>

        <p className="text-sm text-stone-500">{t('privacy.lastUpdated')} {UPDATED}</p>
      </div>
    </div>
  )
}
