import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Newspaper, Clock, TrendingUp, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ApiClient from '@/lib/api'
import { isValidLocale, supportedLocales, getTranslation, type Locale } from '@/config/site/locales'
import { generateListMetadata } from '@/lib/metadata'
import { ContentSection } from '@/config/pages/content'
import ImageWithFallback from '../../ImageWithFallback'

export async function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }))
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    return { title: '游戏资讯' }
  }
  
  const locale = localeParam as Locale
  
  return generateListMetadata(locale, 'article', {
    title: getTranslation('heroTitleNews', locale),
    description: getTranslation('heroDescNews', locale),
    keywords: getTranslation('versionUpdate', locale) + ',' + getTranslation('eventNews', locale) + ',' + getTranslation('industryNews', locale),
  })
}

export const dynamic = 'force-static'
export const revalidate = 180 // 资讯3分钟更新

interface NewsArticle {
  id: number
  title: string
  description?: string
  coverImage?: string
  categoryName?: string
  section?: string
  viewCount?: number
  createTime: string
}

async function getNewsArticles(locale: Locale) {
  try {
    const newsSections = [
      ContentSection.NEWS_UPDATE,
      ContentSection.NEWS_EVENT,
      ContentSection.NEWS_INDUSTRY,
    ]
    
    console.log(`[API请求] /api/public/strategy-articles?locale=${locale}&pageNum=1&pageSize=200`)
    const response = await ApiClient.getStrategyArticles({
      pageNum: 1,
      pageSize: 200,
      locale,
    })
    
    if (response.code === 200) {
      console.log(`[API响应] 获取到 ${response.rows?.length || 0} 篇资讯文章`)
      const allArticles = response.rows || []
      
      // 如果有 section 字段，则按 section 过滤；否则返回所有文章
      const filteredArticles = allArticles.filter(article => {
        if (article.section) {
          return newsSections.includes(article.section as ContentSection)
        }
        // 如果没有 section 字段，暂时显示所有文章
        return true
      }).sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      
      console.log(`[过滤结果] 显示 ${filteredArticles.length} 篇资讯文章`)
      return filteredArticles
    } else {
      console.warn('资讯列表API返回错误:', response.msg)
    }
  } catch (error) {
    console.error('获取资讯列表失败:', error)
  }
  
  return []
}

function formatDate(dateString: string, locale: Locale): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return locale === 'zh-CN' ? `${diffMins}分钟前` : locale === 'zh-TW' ? `${diffMins}分鐘前` : `${diffMins} mins ago`
    }
    if (diffHours < 24) {
      return locale === 'zh-CN' ? `${diffHours}小时前` : locale === 'zh-TW' ? `${diffHours}小時前` : `${diffHours} hours ago`
    }
    
    if (locale === 'en-US') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  } catch {
    return dateString.substring(0, 10)
  }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    return null
  }
  
  const locale = localeParam as Locale
  const articles = await getNewsArticles(locale)
  
  const t = (key: string) => getTranslation(key, locale)

  // 分组
  const groupedArticles = {
    updates: articles.filter(a => a.section === ContentSection.NEWS_UPDATE),
    events: articles.filter(a => a.section === ContentSection.NEWS_EVENT),
    industry: articles.filter(a => a.section === ContentSection.NEWS_INDUSTRY),
  }

  const latestArticles = articles

  return (
    <div className="min-h-screen bg-background">
      {/* 面包屑 */}
      <div className="container py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={locale === 'zh-CN' ? '/' : `/${locale}`} className="hover:text-foreground transition-colors">
            {t('home')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={locale === 'zh-CN' ? '/content' : `/${locale}/content`} className="hover:text-foreground transition-colors">
            {t('content')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{t('news')}</span>
        </div>
      </div>

      {/* Hero区 - 新闻资讯风格 */}
      <section className="border-b bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
        <div className="container py-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 animate-pulse">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">{t('hot')} · {articles.length} {t('articlesCount')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                {t('heroTitleNews')}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('heroDescNews')}
            </p>
          </div>
        </div>
      </section>

      {/* 最新资讯 - 时间轴样式 */}
      <section className="container py-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {latestArticles.map((article, index) => (
            <Link key={article.id} href={locale === 'zh-CN' ? `/content/news/${article.id}` : `/${locale}/content/news/${article.id}`} className="group block">
              <Card className="hover:shadow-lg transition-all hover:border-blue-500/50 border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {index < 3 && (
                          <Badge className="bg-red-500 text-white">HOT</Badge>
                        )}
                        {article.section === ContentSection.NEWS_UPDATE && (
                          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            📋 {t('versionUpdate')}
                          </Badge>
                        )}
                        {article.section === ContentSection.NEWS_EVENT && (
                          <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
                            🎉 {t('eventNews')}
                          </Badge>
                        )}
                        {article.section === ContentSection.NEWS_INDUSTRY && (
                          <Badge className="bg-slate-500/20 text-slate-700 dark:text-slate-300">
                            💼 {t('industryNews')}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {formatDate(article.createTime, locale)}
                        </span>
                      </div>
                      <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article.title}
                      </CardTitle>
                      {article.description && (
                        <CardDescription className="line-clamp-2">
                          {article.description}
                        </CardDescription>
                      )}
                      {article.viewCount !== undefined && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground pt-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{article.viewCount} {t('views')}</span>
                        </div>
                      )}
                    </div>
                    {article.coverImage && (
                      <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-blue-500/10">
                        <ImageWithFallback
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
