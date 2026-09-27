import { Link } from 'react-router-dom'
import { PackageOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSeo } from '../lib/seo'

export default function NotFound() {
  const { t } = useTranslation()
  useSeo({ path: location.pathname, title: { vi: 'Không tìm thấy trang', en: 'Page not found' }, noindex: true })
  return (
    <div className="py-20 text-center">
      <PackageOpen className="mx-auto size-12 text-stone-300" />
      <h1 className="mt-4 text-2xl font-bold">{t('notFound.thisBoxIsEmpty')}</h1>
      <p className="mt-2 text-stone-500">{t('notFound.thePageYouAreLookingFor')}</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-ergo-600 px-4 py-2 font-medium text-white hover:bg-ergo-700">
        {t('notFound.backToHome')}
      </Link>
    </div>
  )
}
