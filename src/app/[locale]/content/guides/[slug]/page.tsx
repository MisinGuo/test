import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ApiClient from '@/lib/api'
import { ArticleLayout } from '@/components/content/ArticleLayout'
import { getModuleConfig } from '@/config'
import { isValidLocale, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'

// ISR: 静态生成 + 按需生成 + 10分钟缓存
export const dynamic = 'force-static'
export const dynamicParams = true
export const revalidate = 600

// 预生成最热门/最新的攻略文章
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
      console.warn(`预构建 ${locale} 攻略失败:`, error)
    }
  }
  
  return allParams
}

// 获取模块配置（使用内容中心模块配置）
const moduleConfig = getModuleConfig('content')

// 攻略文章详情数据类型
interface GuideDetail {
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

// 获取攻略详情
async function getGuideDetail(id: string, locale: Locale): Promise<GuideDetail | null> {
  try {
    console.log(`[API请求] 获取攻略详情 ID: ${id}, Locale: ${locale}`)
    const response = await ApiClient.getArticleDetail(parseInt(id, 10), locale)
    
    if (response.code === 200 && response.data) {
      console.log(`[API响应] 成功获取攻略: ${response.data.title}`)
      return response.data
    } else {
      console.warn(`[API响应] 获取攻略失败: ${response.msg}`)
    }
  } catch (error) {
    console.error(`获取攻略 ${id} 失败:`, error)
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
  const guide = await getGuideDetail(slug, locale)
  
  if (!guide) {
    return {
      title: '攻略未找到'
    }
  }

  const guideUrl = locale === defaultLocale 
    ? `/content/guides/${slug}` 
    : `/${locale}/content/guides/${slug}`
  const description = guide.description || guide.title
  const imageUrl = guide.coverImage || '/default-og-image.jpg'

  return {
    title: `${guide.title} | 游戏攻略`,
    description,
    keywords: guide.tags?.join(', '),
    authors: guide.author ? [{ name: guide.author }] : undefined,
    openGraph: {
      title: guide.title,
      description,
      url: guideUrl,
      siteName: '游戏攻略',
      locale,
      type: 'article',
      publishedTime: guide.createTime,
      modifiedTime: guide.updateTime,
      authors: guide.author ? [guide.author] : undefined,
      tags: guide.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: guideUrl,
    },
  }
}

export default async function GuideDetailPage({ 
  params 
}: { 
  params: Promise<{ locale: string; slug: string }> 
}) {
  const { locale: localeParam, slug } = await params
  
  if (!isValidLocale(localeParam)) {
    notFound()
  }
  
  const locale = localeParam as Locale
  const guide = await getGuideDetail(slug, locale)

  if (!guide) {
    notFound()
  }

  return (
    <ArticleLayout
      config={moduleConfig}
      frontmatter={{
        title: guide.title,
        description: guide.description,
        date: guide.createTime,
        author: guide.author,
        tags: guide.tags,
        category: guide.categoryName || '攻略',
      }}
      content={guide.content}
      readingTime={Math.ceil(guide.content.length / 500)}
      toc={[]}
    />
  )
}
