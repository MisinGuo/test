import { NextResponse } from 'next/server'
import { generateSitemapIndex } from '@/lib/sitemap/generator'
import { getSecureHostname } from '@/lib/sitemap/security'

/**
 * 主 sitemap 索引
 * 路由: /sitemap.xml
 * 包含所有语言的 sitemap 链接
 */

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1小时重新生成

export async function GET(request: Request) {
  try {
    // 验证并获取安全的 hostname（防止内容被盗用）
    const hostname = getSecureHostname(request)
    
    console.log('[Sitemap] 生成主索引 sitemap.xml')
    const xml = generateSitemapIndex(hostname)
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('生成主 sitemap 索引失败:', error)
    return new NextResponse('生成 sitemap 失败', { status: 500 })
  }
}
