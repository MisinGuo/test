import { NextResponse } from 'next/server'
import { supportedLocales } from '@/config/site/locales'
import { generateLocaleIndex, generateContentSitemap } from '@/lib/sitemap/generator'
import { fetchUrlsByType } from '@/lib/sitemap/fetchers'
import { getSecureHostname } from '@/lib/sitemap/security'
import type { ContentType } from '@/lib/sitemap/types'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const validTypes: ContentType[] = ['static', 'games', 'boxes', 'guides', 'news']

export async function GET(
  request: Request,
  { params }: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await params
  
  // 验证并获取安全的 hostname（防止内容被盗用）
  const hostname = getSecureHostname(request)
  
  console.log('[API Sitemap] segments:', segments)
  
  // /api/sitemap/zh-TW -> ['zh-TW']
  if (segments.length === 1) {
    const locale = segments[0]
    
    if (!supportedLocales.includes(locale as any)) {
      return new NextResponse('不支持的语言', { status: 404 })
    }
    
    try {
      const xml = generateLocaleIndex(locale, hostname)
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      })
    } catch (error) {
      console.error('生成语言索引失败:', error)
      return new NextResponse('生成 sitemap 失败', { status: 500 })
    }
  }
  
  // /api/sitemap/zh-TW/games -> ['zh-TW', 'games']
  if (segments.length === 2) {
    const [locale, type] = segments
    
    if (!supportedLocales.includes(locale as any)) {
      return new NextResponse('不支持的语言', { status: 404 })
    }
    if (!validTypes.includes(type as ContentType)) {
      return new NextResponse('不支持的内容类型', { status: 404 })
    }
    
    try {
      const urls = await fetchUrlsByType(locale, type as ContentType, hostname)
      const xml = generateContentSitemap(urls, locale, type as ContentType)
      
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      })
    } catch (error) {
      console.error('生成内容 sitemap 失败:', error)
      return new NextResponse('生成 sitemap 失败', { status: 500 })
    }
  }
  
  return new NextResponse('Not Found', { status: 404 })
}
