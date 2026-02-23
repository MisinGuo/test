import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, supportedLocales } from '@/config/site/locales'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 处理 sitemap 请求：重写到 API 路由
  // /sitemap-zh-TW.xml -> /api/sitemap/zh-TW
  // /sitemap-zh-TW-games.xml -> /api/sitemap/zh-TW/games
  if (pathname.startsWith('/sitemap-') && pathname.endsWith('.xml')) {
    const withoutXml = pathname.replace(/\.xml$/, '')
    // 移除 /sitemap- 前缀，得到 zh-TW 或 zh-TW-games
    const pathPart = withoutXml.replace('/sitemap-', '')
    
    // 检查是否匹配 locale-type 格式
    const validTypes = ['static', 'games', 'boxes', 'strategy']
    let newPathname: string
    
    // 尝试从末尾提取 type
    const lastDashIndex = pathPart.lastIndexOf('-')
    if (lastDashIndex > 0) {
      const possibleType = pathPart.substring(lastDashIndex + 1)
      const possibleLocale = pathPart.substring(0, lastDashIndex)
      
      if (validTypes.includes(possibleType) && supportedLocales.includes(possibleLocale as any)) {
        // 匹配 locale-type 格式
        newPathname = `/api/sitemap/${possibleLocale}/${possibleType}`
      } else if (supportedLocales.includes(pathPart as any)) {
        // 只有 locale
        newPathname = `/api/sitemap/${pathPart}`
      } else {
        // 无法识别，直接使用
        newPathname = `/api/sitemap/${pathPart}`
      }
    } else {
      // 没有连字符，直接是 locale
      newPathname = `/api/sitemap/${pathPart}`
    }
    
    console.log(`[Middleware] Rewriting ${pathname} -> ${newPathname}`)
    const newUrl = new URL(newPathname, request.url)
    return NextResponse.rewrite(newUrl)
  }
  
  // 跳过 API 和其他特殊路由以及静态文件
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.endsWith('.xsl') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next()
  }
  
  // 检查路径是否已经包含语言前缀
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  // 如果没有语言前缀，使用 rewrite 到默认语言（URL 不变，SEO 友好）
  if (!pathnameHasLocale) {
    const locale = defaultLocale
    
    // 使用 rewrite：URL 保持不变，但显示默认语言的内容
    request.nextUrl.pathname = `/${locale}${pathname}`
    return NextResponse.rewrite(request.nextUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  // 匹配所有路径，除了以下内容：
  // - api 路由
  // - _next/static (静态文件)
  // - _next/image (图片优化)
  // - favicon.ico (网站图标)
  // - robots.txt 等 SEO 文件
  // - public 文件夹中的文件（.jpg, .png, .svg, .xsl, .css, .js 等）
  // 注意：移除了 xml 和 txt 的排除，以便 middleware 可以处理 sitemap
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|svg|gif|webp|ico|xsl|css|js)).*)',
  ],
}
