import ApiClient from '@/lib/api'
import type { SitemapUrl, ContentType } from './types'
import { sitemapConfig } from '@/config/sitemap/config'
import { generateAlternateUrls } from './generator'
import { defaultLocale } from '@/config/site/locales'

const { contentTypes } = sitemapConfig

/**
 * 获取静态页面 URLs
 */
export async function fetchStaticUrls(locale: string, hostname: string): Promise<SitemapUrl[]> {
  const staticPaths = [
    '/',
    '/games',
    '/boxes',
    '/content/guides',
    '/content/news',
    '/search',
  ]
  
  const config = contentTypes.static
  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  
  return staticPaths.map((path) => ({
    loc: `${hostname}${localePrefix}${path}`,
    lastmod: new Date().toISOString(),
    changefreq: config.changefreq as any,
    priority: config.priority,
    alternates: generateAlternateUrls(path, hostname),
  }))
}

/**
 * 获取游戏 URLs
 */
export async function fetchGameUrls(locale: string, hostname: string): Promise<SitemapUrl[]> {
  try {
    console.log('[Sitemap] 开始获取游戏列表...')
    
    // 从 API 获取所有游戏
    // 使用关联模式查询：自有游戏 + 默认配置游戏（未排除的） + 跨站共享游戏（已include的）
    const response = await ApiClient.getGames({
      locale: locale as any,
      pageNum: 1,
      pageSize: 10000, // 获取所有
    })
    
    console.log('[Sitemap] 游戏API响应:', {
      code: response.code,
      total: response.total,
      rowsLength: response.rows?.length,
      hasRows: !!response.rows,
      firstGame: response.rows?.[0] ? { id: response.rows[0].id, name: response.rows[0].name } : null
    })
    
    const games = response.rows || []
    console.log('[Sitemap] 解析游戏数组，长度:', games.length)
    const config = contentTypes.games
    const localePrefix = locale === defaultLocale ? '' : `/${locale}`
    
    const urls: SitemapUrl[] = []
    
    // 游戏详情页
    for (const game of games) {
      const path = `/games/${game.id}`
      urls.push({
        loc: `${hostname}${localePrefix}${path}`,
        lastmod: game.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: config.priority,
        alternates: generateAlternateUrls(path, hostname),
      })
    }
    
    console.log('[Sitemap] 生成了 %d 个游戏详情页URL', urls.length)
    
    // 游戏分类页
    try {
      const categoriesResponse = await ApiClient.getCategories({ 
        categoryType: 'game',
        locale: locale as any,
      })
      
      const categories = categoriesResponse.data || []
      for (const category of categories) {
        // 使用 slug 而不是 id，因为路由是 /games/category/[slug]
        const slug = category.slug || category.id
        const path = `/games/category/${slug}`
        urls.push({
          loc: `${hostname}${localePrefix}${path}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly' as any,
          priority: 0.7,
          alternates: generateAlternateUrls(path, hostname),
        })
      }
    } catch (error) {
      console.warn('获取游戏分类失败:', error)
    }
    
    return urls
  } catch (error) {
    console.error('Error fetching game URLs:', error)
    return []
  }
}

/**
 * 获取盒子 URLs
 */
export async function fetchBoxUrls(locale: string, hostname: string): Promise<SitemapUrl[]> {
  try {
    const response = await ApiClient.getBoxes({
      locale: locale as any,
      pageNum: 1,
      pageSize: 10000,
    })
    
    const boxes = response.rows || []
    const config = contentTypes.boxes
    const localePrefix = locale === defaultLocale ? '' : `/${locale}`
    
    const urls: SitemapUrl[] = []
    
    for (const box of boxes) {
      // 盒子详情页
      const detailPath = `/boxes/${box.id}`
      urls.push({
        loc: `${hostname}${localePrefix}${detailPath}`,
        lastmod: box.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: config.priority,
        alternates: generateAlternateUrls(detailPath, hostname),
      })
      
      // 盒子下载页
      const downloadPath = `/boxes/${box.id}/download`
      urls.push({
        loc: `${hostname}${localePrefix}${downloadPath}`,
        lastmod: box.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: 0.7,
        alternates: generateAlternateUrls(downloadPath, hostname),
      })
    }
    
    return urls
  } catch (error) {
    console.error('Error fetching box URLs:', error)
    return []
  }
}

/**
 * 获取攻略文章 URLs
 */
export async function fetchGuidesUrls(locale: string, hostname: string): Promise<SitemapUrl[]> {
  try {
    const response = await ApiClient.getStrategyArticles({
      locale: locale as any,
      pageNum: 1,
      pageSize: 10000,
      section: 'guide', // 只获取攻略类型
    })
    
    const articles = response.rows || []
    const config = contentTypes.guides
    const localePrefix = locale === defaultLocale ? '' : `/${locale}`
    
    return articles.map((article: any) => {
      const path = `/content/guides/${article.id}`
      return {
        loc: `${hostname}${localePrefix}${path}`,
        lastmod: article.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: config.priority,
        alternates: generateAlternateUrls(path, hostname),
      }
    })
  } catch (error) {
    console.error('Error fetching guides URLs:', error)
    return []
  }
}

/**
 * 获取资讯文章 URLs
 */
export async function fetchNewsUrls(locale: string, hostname: string): Promise<SitemapUrl[]> {
  try {
    const response = await ApiClient.getStrategyArticles({
      locale: locale as any,
      pageNum: 1,
      pageSize: 10000,
      section: 'news', // 只获取资讯类型
    })
    
    const articles = response.rows || []
    const config = contentTypes.news
    const localePrefix = locale === defaultLocale ? '' : `/${locale}`
    
    return articles.map((article: any) => {
      const path = `/content/news/${article.id}`
      return {
        loc: `${hostname}${localePrefix}${path}`,
        lastmod: article.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: config.priority,
        alternates: generateAlternateUrls(path, hostname),
      }
    })
  } catch (error) {
    console.error('Error fetching news URLs:', error)
    return []
  }
}

/**
 * 根据类型获取 URLs
 */
export async function fetchUrlsByType(
  locale: string,
  type: ContentType,
  hostname: string
): Promise<SitemapUrl[]> {
  console.log(`[Sitemap] 获取 ${locale} 的 ${type} URLs...`)
  
  switch (type) {
    case 'static':
      return fetchStaticUrls(locale, hostname)
    case 'games':
      return fetchGameUrls(locale, hostname)
    case 'boxes':
      return fetchBoxUrls(locale, hostname)
    case 'guides':
      return fetchGuidesUrls(locale, hostname)
    case 'news':
      return fetchNewsUrls(locale, hostname)
    default:
      return []
  }
}
