import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, BookOpen, Newspaper, Star, FolderOpen, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { isValidLocale, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'
import { generateListMetadata } from '@/lib/metadata'

export async function generateStaticParams() {
  return supportedLocales
    .filter(locale => locale !== defaultLocale)
    .map(locale => ({ locale }))
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    return {
      title: '内容中心',
      description: '游戏攻略、资讯、评测',
    }
  }
  
  const locale = localeParam as Locale
  
  return generateListMetadata(locale, 'strategy', {
    title: locale === 'zh-CN' ? '内容中心 - 游戏攻略资讯评测' : locale === 'zh-TW' ? '內容中心 - 遊戲攻略資訊評測' : 'Content Center',
    description: locale === 'zh-CN' ? '精选游戏攻略、最新资讯、专业评测和深度专题' : locale === 'zh-TW' ? '精選遊戲攻略、最新資訊、專業評測和深度專題' : 'Game guides, news, reviews and topics',
    keywords: '游戏攻略,游戏资讯,游戏评测,游戏专题',
  })
}

export const dynamic = 'force-static'
export const revalidate = 300

export default async function ContentCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    return null
  }
  
  const locale = localeParam as Locale
  
  const t = (key: string) => {
    const translations: Record<string, Record<Locale, string>> = {
      home: { 'zh-CN': '首页', 'zh-TW': '首頁', 'en-US': 'Home' },
      content: { 'zh-CN': '内容中心', 'zh-TW': '內容中心', 'en-US': 'Content Center' },
      heroTitle: { 'zh-CN': '内容中心', 'zh-TW': '內容中心', 'en-US': 'Content Center' },
      heroDesc: { 'zh-CN': '游戏攻略、资讯、评测、专题 - 一站式游戏内容平台', 'zh-TW': '遊戲攻略、資訊、評測、專題 - 一站式遊戲內容平台', 'en-US': 'Guides, News, Reviews, Topics - Your Game Content Hub' },
      guidesTitle: { 'zh-CN': '游戏攻略', 'zh-TW': '遊戲攻略', 'en-US': 'Game Guides' },
      guidesDesc: { 'zh-CN': '从新手到高手，全方位提升游戏技巧', 'zh-TW': '從新手到高手，全方位提升遊戲技巧', 'en-US': 'From beginner to pro gamer' },
      newsTitle: { 'zh-CN': '游戏资讯', 'zh-TW': '遊戲資訊', 'en-US': 'Game News' },
      newsDesc: { 'zh-CN': '最新更新、活动资讯和行业动态', 'zh-TW': '最新更新、活動資訊和行業動態', 'en-US': 'Latest updates and industry news' },
      reviewsTitle: { 'zh-CN': '游戏评测', 'zh-TW': '遊戲評測', 'en-US': 'Game Reviews' },
      reviewsDesc: { 'zh-CN': '专业评测和深度对比分析', 'zh-TW': '專業評測和深度對比分析', 'en-US': 'Professional reviews and comparisons' },
      topicsTitle: { 'zh-CN': '专题内容', 'zh-TW': '專題內容', 'en-US': 'Featured Topics' },
      topicsDesc: { 'zh-CN': '精选专题合集和深度内容', 'zh-TW': '精選專題合集和深度內容', 'en-US': 'Curated topics and in-depth content' },
      viewAll: { 'zh-CN': '查看全部', 'zh-TW': '查看全部', 'en-US': 'View All' },
    }
    return translations[key]?.[locale] || key
  }

  const categories = [
    {
      title: t('guidesTitle'),
      description: t('guidesDesc'),
      icon: '🎮',
      color: 'from-green-500 to-emerald-500',
      href: `/${locale === 'zh-CN' ? '' : locale + '/'}content/guides`,
      gradient: 'from-green-500/10 to-emerald-500/10',
      border: 'hover:border-green-500/50',
      bgClass: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
    },
    {
      title: t('newsTitle'),
      description: t('newsDesc'),
      icon: '📰',
      color: 'from-blue-500 to-cyan-500',
      href: `/${locale === 'zh-CN' ? '' : locale + '/'}content/news`,
      gradient: 'from-blue-500/10 to-cyan-500/10',
      border: 'hover:border-blue-500/50',
      bgClass: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
    },
    {
      title: t('reviewsTitle'),
      description: t('reviewsDesc'),
      icon: '⭐',
      color: 'from-purple-500 to-pink-500',
      href: `/${locale === 'zh-CN' ? '' : locale + '/'}content/reviews`,
      gradient: 'from-purple-500/10 to-pink-500/10',
      border: 'hover:border-purple-500/50',
      bgClass: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
    },
    {
      title: t('topicsTitle'),
      description: t('topicsDesc'),
      icon: '📚',
      color: 'from-amber-500 to-orange-500',
      href: `/${locale === 'zh-CN' ? '' : locale + '/'}content/topics`,
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'hover:border-amber-500/50',
      bgClass: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* 面包屑 */}
      <div className="container py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={locale === 'zh-CN' ? '/' : `/${locale}`} className="hover:text-foreground transition-colors">
            {t('home')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{t('content')}</span>
        </div>
      </div>

      {/* Hero区 */}
      <section className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container py-16">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="secondary" className="text-sm">
              {locale === 'zh-CN' ? '精选内容' : locale === 'zh-TW' ? '精選內容' : 'Featured Content'}
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight">{t('heroTitle')}</h1>
            <p className="text-xl text-muted-foreground">{t('heroDesc')}</p>
          </div>
        </div>
      </section>

      {/* 内容分类卡片 */}
      <section className="container py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((category) => (
            <Link key={category.href} href={category.href} className="group">
              <Card className={`h-full hover:shadow-2xl transition-all duration-300 ${category.border} overflow-hidden relative`}>
                <div className={`absolute inset-0 ${category.bgClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <CardHeader className="relative space-y-4 p-8">
                  <div className="flex items-start justify-between">
                    <div className={`h-16 w-16 rounded-2xl ${category.bgClass} flex items-center justify-center text-4xl`}>
                      {category.icon}
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-3xl bg-clip-text text-transparent bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                      <span className="text-foreground group-hover:opacity-80 transition-opacity">
                        {category.title}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-base">{category.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium pt-4 text-primary group-hover:text-primary/80">
                    {t('viewAll')}
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
