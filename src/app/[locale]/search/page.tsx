import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SearchPageClient from './SearchClient'
import { isValidLocale, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'
import { fallbackMetadata } from '@/config/fallback-metadata'
import { generatePageMetadata } from '@/lib/metadata'

export async function generateStaticParams() {
  return supportedLocales
    .filter(locale => locale !== defaultLocale)
    .map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    return {
      title: 'Search',
      description: 'Search for games and content',
    }
  }
  
  const locale = localeParam as Locale
  const fallback = fallbackMetadata.search
  
  return generatePageMetadata(locale, {
    title: fallback.title[locale],
    description: fallback.description[locale],
  }, {
    titleTemplate: (siteTitle) => `${fallback.title[locale]} - ${siteTitle}`,
  })
}

// 动态渲染，使用客户端搜索
export const dynamic = 'force-static'
export const revalidate = 3600

export default async function LocalizedSearchPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    notFound()
  }
  
  const locale = localeParam as Locale
  
  return <SearchPageClient locale={locale} />
}
