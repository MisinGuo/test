import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ApiClient from '@/lib/api'
import { ArticleLayout } from '@/components/content/ArticleLayout'
import { getModuleConfig } from '@/config'
import { isValidLocale, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'

// ISR: 静态生成 + 按需生成 + 3分钟缓存（资讯更新更频繁）
export const dynamic = 'force-static'
export const dynamicParams = true
export const revalidate = 180

// 预生成最热门/最新的资讯文章
export async function generateStaticParams() {
  const locales = supportedLocales.filter(locale => locale !== defaultLocale)
  const allParams: { locale: string; slug: string }[] = []
  
  for (const locale of locales) {
    try {
      const response = await ApiClient.getStrategyArticles({
        pageNum: 1,
        pageSize: 50,
        locale,
      })
      
      if (response.code === 200 && response.rows) {
        const params = response.rows.map((article: any) => ({
          locale,
          slug: String(article.id),
        }))
        allParams.push(...params)
      }
    } catch (error) {
      console.warn(`预构建 ${locale} 资讯失败:`, error)
    }
  }
  
  return allParams
}

// 获取模块配置（使用内容中心模块配置）
const moduleConfig = getModuleConfig('content')

// 资讯文章详情数据类型
interface NewsDetail {
  id: number
  title: string
  description?: string
  content: string
  coverImage?: string
  categoryName?: string
  categoryId?: number
  author?: string
  createTime: string
  updateTime?: string
  viewCount?: number
  likeCount?: number
  tags?: string[]
  section?: string
}

// 获取资讯详情
async function getNewsDetail(id: string, locale: Locale): Promise<NewsDetail | null> {
  try {
    console.log(`[API请求] 获取资讯详情 ID: ${id}, Locale: ${locale}`)
    const response = await ApiClient.getArticleDetail(parseInt(id, 10), locale)
    
    if (response.code === 200 && response.data) {
      console.log(`[API响应] 成功获取资讯: ${response.data.title}`)
      return response.data
    } else {
      console.warn(`[API响应] 获取资讯失败: ${response.msg}`)
    }
  } catch (error) {
    console.error(`获取资讯 ${id} 失败:`, error)
  }
  
  return null
}

// 生成 Metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; slug: string }> 
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await params
  
  if (!isValidLocale(localeParam)) {
    return {}
  }
  
  const locale = localeParam as Locale
  const news = await getNewsDetail(slug, locale)
  
  if (!news) {
    return {
      title: '资讯未找到'
    }
  }

  const newsUrl = locale === defaultLocale 
    ? `/content/news/${slug}` 
    : `/${locale}/content/news/${slug}`
  const description = news.description || news.title
  const imageUrl = news.coverImage || '/default-og-image.jpg'

  return {
    title: `${news.title} | 游戏资讯`,
    description,
    keywords: news.tags?.join(', '),
    authors: news.author ? [{ name: news.author }] : undefined,
    openGraph: {
      title: news.title,
      description,
      url: newsUrl,
      siteName: '游戏资讯',
      locale,
      type: 'article',
      publishedTime: news.createTime,
      modifiedTime: news.updateTime,
      authors: news.author ? [news.author] : undefined,
      tags: news.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: news.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: newsUrl,
    },
  }
}

export default async function NewsDetailPage({ 
  params 
}: { 
  params: Promise<{ locale: string; slug: string }> 
}) {
  const { locale: localeParam, slug } = await params
  
  if (!isValidLocale(localeParam)) {
    notFound()
  }
  
  const locale = localeParam as Locale
  const news = await getNewsDetail(slug, locale)

  if (!news) {
    notFound()
  }

  return (
    <ArticleLayout
      config={moduleConfig}
      frontmatter={{
        title: news.title,
        description: news.description,
        date: news.createTime,
        author: news.author,
        tags: news.tags,
        category: news.categoryName || '资讯',
      }}
      content={news.content}
      readingTime={Math.ceil(news.content.length / 500)}
      toc={[]}
    />
  )
}
