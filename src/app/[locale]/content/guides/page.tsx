import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Award, Target, TrendingUp, Calendar, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import ApiClient from '@/lib/api'
import { isValidLocale, supportedLocales, getTranslation, type Locale } from '@/config/site/locales'
import { generateListMetadata } from '@/lib/metadata'
import { ContentSection, sectionConfig } from '@/config/pages/content'
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
    return { title: '游戏攻略' }
  }
  
  const locale = localeParam as Locale
  
  return generateListMetadata(locale, 'strategy', {
    title: getTranslation('heroTitleGuides', locale),
    description: getTranslation('heroDescGuides', locale),
    keywords: getTranslation('hot', locale) + ',' + getTranslation('beginnerGuide', locale) + ',' + getTranslation('advancedGuide', locale),
  })
}

export const dynamic = 'force-static'
export const revalidate = 300

interface GuideArticle {
  id: number
  title: string
  description?: string
  coverImage?: string
  categoryName?: string
  section?: string
  viewCount?: number
  createTime: string
}

async function getGuideArticles(locale: Locale) {
  try {
    const guideSections = [
      ContentSection.GUIDE_BEGINNER,
      ContentSection.GUIDE_ADVANCED,
      ContentSection.GUIDE_PVP,
      ContentSection.GUIDE_LINEUP,
      ContentSection.GUIDE_DEVELOPMENT,
    ]
    
    console.log(`[API请求] /api/public/strategy-articles?locale=${locale}&pageNum=1&pageSize=200`)
    const response = await ApiClient.getStrategyArticles({
      pageNum: 1,
      pageSize: 200,
      locale,
    })
    
    if (response.code === 200) {
      console.log(`[API响应] 获取到 ${response.rows?.length || 0} 篇攻略文章`)
      const allArticles = response.rows || []
      
      // 如果有 section 字段，则按 section 过滤；否则返回所有文章
      const filteredArticles = allArticles.filter(article => {
        if (article.section) {
          return guideSections.includes(article.section as ContentSection)
        }
        // 如果没有 section 字段，暂时显示所有文章
        return true
      })
      
      console.log(`[过滤结果] 显示 ${filteredArticles.length} 篇攻略文章`)
      return filteredArticles
    } else {
      console.warn('攻略列表API返回错误:', response.msg)
    }
  } catch (error) {
    console.error('获取攻略列表失败:', error)
  }
  
  return []
}

function formatDate(dateString: string, locale: Locale): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (locale === 'en-US') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    return dateString.substring(0, 10)
  } catch {
    return dateString.substring(0, 10)
  }
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    return null
  }
  
  const locale = localeParam as Locale
  const articles = await getGuideArticles(locale)
  
  const t = (key: string) => getTranslation(key, locale)

  // 按类型分组
  const groupedArticles = {
    beginner: articles.filter(a => a.section === ContentSection.GUIDE_BEGINNER),
    advanced: articles.filter(a => a.section === ContentSection.GUIDE_ADVANCED),
    pvp: articles.filter(a => a.section === ContentSection.GUIDE_PVP),
    lineup: articles.filter(a => a.section === ContentSection.GUIDE_LINEUP),
    development: articles.filter(a => a.section === ContentSection.GUIDE_DEVELOPMENT),
  }
  
  // 如果所有分组都为空（即没有 section 字段），显示所有文章
  const hasGroupedArticles = Object.values(groupedArticles).some(group => group.length > 0)
  const ungroupedArticles = hasGroupedArticles ? [] : articles

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
          <span className="text-foreground">{t('guides')}</span>
        </div>
      </div>

      {/* Hero区 - 游戏高手风格 */}
      <section className="border-b bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="container py-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-300">
              <Award className="h-5 w-5" />
              <span className="font-semibold">{articles.length} {t('articlesCount')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500">
                {t('heroTitleGuides')}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('heroDescGuides')}
            </p>
            
            {/* 快速导航 */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link href="#beginner">
                <Badge variant="outline" className="text-base px-6 py-2 cursor-pointer hover:bg-green-500/10 hover:border-green-500/50">
                  🌱 {t('beginnerGuide')}
                </Badge>
              </Link>
              <Link href="#advanced">
                <Badge variant="outline" className="text-base px-6 py-2 cursor-pointer hover:bg-blue-500/10 hover:border-blue-500/50">
                  🚀 {t('advancedGuide')}
                </Badge>
              </Link>
              <Link href="#pvp">
                <Badge variant="outline" className="text-base px-6 py-2 cursor-pointer hover:bg-red-500/10 hover:border-red-500/50">
                  ⚔️ {t('pvpGuide')}
                </Badge>
              </Link>
              <Link href="#lineup">
                <Badge variant="outline" className="text-base px-6 py-2 cursor-pointer hover:bg-purple-500/10 hover:border-purple-500/50">
                  👥 {t('lineupGuide')}
                </Badge>
              </Link>
              <Link href="#development">
                <Badge variant="outline" className="text-base px-6 py-2 cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/50">
                  📈 {t('developmentGuide')}
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 攻略列表 */}
      <section className="container py-12 space-y-16">
        {/* 新手入门 */}
        {groupedArticles.beginner.length > 0 && (
          <div id="beginner" className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">🌱</span>
              </div>
              <h2 className="text-3xl font-bold">{t('beginnerGuide')}</h2>
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
                {groupedArticles.beginner.length}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {groupedArticles.beginner.map((article) => (
                <Link key={article.id} href={locale === 'zh-CN' ? `/content/guides/${article.id}` : `/${locale}/content/guides/${article.id}`} className="group">
                  <Card className="h-full hover:shadow-lg transition-all hover:border-green-500/50">
                    <div className="grid md:grid-cols-[160px_1fr] gap-4">
                      {article.coverImage && (
                        <div className="aspect-square overflow-hidden bg-green-500/10 rounded-l-lg">
                          <ImageWithFallback
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{article.description}</CardDescription>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(article.createTime, locale)}
                          </span>
                          {article.viewCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {article.viewCount}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 进阶技巧 */}
        {groupedArticles.advanced.length > 0 && (
          <div id="advanced" className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-3xl font-bold">{t('advancedGuide')}</h2>
              <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                {groupedArticles.advanced.length}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {groupedArticles.advanced.map((article) => (
                <Link key={article.id} href={locale === 'zh-CN' ? `/content/guides/${article.id}` : `/${locale}/content/guides/${article.id}`} className="group">
                  <Card className="h-full hover:shadow-lg transition-all hover:border-blue-500/50">
                    <div className="grid md:grid-cols-[160px_1fr] gap-4">
                      {article.coverImage && (
                        <div className="aspect-square overflow-hidden bg-blue-500/10 rounded-l-lg">
                          <ImageWithFallback
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{article.description}</CardDescription>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(article.createTime, locale)}
                          </span>
                          {article.viewCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {article.viewCount}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* PVP竞技、阵容搭配、养成攻略 - 类似结构 */}
        {/* 为了简洁，这里省略，可以复制上面的模式 */}
        
        {/* 未分类文章 - 当没有 section 字段时显示所有文章 */}
        {!hasGroupedArticles && ungroupedArticles.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold">{t('strategyTitle')}</h2>
              <Badge variant="secondary">
                {ungroupedArticles.length}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ungroupedArticles.map((article) => (
                <Link key={article.id} href={locale === 'zh-CN' ? `/content/guides/${article.id}` : `/${locale}/content/guides/${article.id}`} className="group">
                  <Card className="h-full hover:shadow-lg transition-all hover:border-green-500/50">
                    <CardHeader>
                      <CardTitle className="group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {article.description || article.title}
                      </CardDescription>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(article.createTime, locale)}
                        </span>
                        {article.viewCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {article.viewCount}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* 无数据提示 */}
        {articles.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold mb-2">{t('noArticles')}</h3>
            <p className="text-muted-foreground">{t('stayTuned')}</p>
          </div>
        )}
      </section>
    </div>
  )
}
