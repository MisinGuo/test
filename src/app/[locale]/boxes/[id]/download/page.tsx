import { notFound } from 'next/navigation'
import { isValidLocale, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'
import ApiClient from '@/lib/api'
import DownloadClient from './DownloadClient'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return supportedLocales
    .filter(locale => locale !== defaultLocale)
    .map(locale => ({ locale }))
}

export const dynamic = 'force-dynamic'

interface DownloadPageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: DownloadPageProps): Promise<Metadata> {
  const { id, locale } = await params
  
  try {
    const response = await ApiClient.getBoxDetail(Number(id), locale)
    const box = response.data
    
    return {
      title: `下载 ${box.name}`,
      description: `下载${box.name}游戏盒子`,
    }
  } catch {
    return {
      title: '下载游戏盒子',
      description: '下载游戏盒子',
    }
  }
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { locale: localeParam, id } = await params
  
  if (!isValidLocale(localeParam)) {
    notFound()
  }
  
  const locale = localeParam as Locale

  // 获取盒子详情
  let boxData: any = null
  
  try {
    const response = await ApiClient.getBoxDetail(Number(id), locale)
    if (response.code === 200 && response.data) {
      boxData = response.data
    }
  } catch (error) {
    console.error('获取盒子详情失败:', error)
    notFound()
  }

  if (!boxData) {
    notFound()
  }

  return <DownloadClient boxData={boxData} locale={locale} />
}
