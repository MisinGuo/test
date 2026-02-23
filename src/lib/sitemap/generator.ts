import { supportedLocales, defaultLocale } from '@/config/site/locales'
import { sitemapConfig } from '@/config/sitemap/config'
import type { SitemapUrl, ContentType } from './types'

/**
 * 生成主 sitemap 索引
 * 包含所有语言的 sitemap 链接
 */
export function generateSitemapIndex(hostname: string): string {
  const lastmod = new Date().toISOString()
  
  const localesSitemaps = supportedLocales
    .map(
      (locale) => `  <sitemap>
    <loc>${hostname}/sitemap-${locale}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${localesSitemaps}
</sitemapindex>`
}

/**
 * 生成语言索引
 * 包含某个语言下所有内容类型的 sitemap 链接
 */
export function generateLocaleIndex(locale: string, hostname: string): string {
  const lastmod = new Date().toISOString()
  const contentTypes: ContentType[] = ['static', 'games', 'boxes', 'guides', 'news']
  
  const typeSitemaps = contentTypes
    .map(
      (type) => `  <sitemap>
    <loc>${hostname}/sitemap-${locale}-${type}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${typeSitemaps}
</sitemapindex>`
}

/**
 * 生成内容类型 sitemap
 * 包含某个语言下某个内容类型的所有 URL
 */
export function generateContentSitemap(
  urls: SitemapUrl[],
  locale: string,
  type: ContentType
): string {
  const urlsXml = urls.map((url) => formatSitemapUrl(url)).join('\n')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}
</urlset>`
}

/**
 * 格式化单个 URL 为 XML
 */
function formatSitemapUrl(url: SitemapUrl): string {
  const alternates =
    url.alternates
      ?.map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt.locale}" href="${alt.href}"/>`
      )
      .join('\n') || ''
  
  return `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''}${url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : ''}${alternates ? `\n${alternates}` : ''}
  </url>`
}

/**
 * 生成多语言 URL 变体
 * 为指定路径生成所有语言的 URL
 */
export function generateAlternateUrls(
  path: string,
  hostname: string
): { locale: string; href: string }[] {
  return supportedLocales.map((locale) => {
    const localePrefix = locale === defaultLocale ? '' : `/${locale}`
    return {
      locale,
      href: `${hostname}${localePrefix}${path}`,
    }
  })
}
