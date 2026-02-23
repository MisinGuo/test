import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, ArrowLeft, Grid3x3, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ImageWithFallback from '../../../ImageWithFallback'
import { backendConfig } from '@/config/api/backend'
import { defaultLocale, isValidLocale, getTranslation, type Locale } from '@/config/site/locales'
import ApiClient from '@/lib/api'
import CategoryIntroduction from '@/components/category/CategoryIntroduction'
import CategoryTopGames from '@/components/category/CategoryTopGames'
import CategoryGifts from '@/components/category/CategoryGifts'
import CategoryGuides from '@/components/category/CategoryGuides'
import RelatedCategories from '@/components/category/RelatedCategories'

// 游戏类型
interface Game {
  id: number
  name: string
  description?: string
  categoryName?: string
  iconUrl?: string
  status?: string
}

// 分类类型
interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ source?: string }>
}

// 获取分类信息（回退方案）
async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const url = `${backendConfig.baseURL}/api/public/categories?siteId=${backendConfig.siteId}&categoryType=game`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Site-Id': String(backendConfig.siteId),
      },
      next: { revalidate: 86400 }
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    
    if (result.code !== 200 || !result.data) {
      return null
    }
    
    const categories = result.data
    const category = categories.find((cat: any) => cat.slug === slug)
    
    return category ? {
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon || '🎮',
      description: category.description
    } : null
  } catch (error) {
    console.error('[获取分类失败]', error)
    return null
  }
}

// 获取品类增强详情（使用新API，失败时回退）
async function getCategoryDetail(slug: string, locale: string, source?: string) {
  try {
    const response = await ApiClient.getCategoryDetail(slug, {
      locale: locale as any,
      source,
    })
    
    if (response.code !== 200 || !response.data) {
      // 回退到旧方案
      console.log('[品类详情API不可用，使用回退方案]')
      return await getCategoryDetailFallback(slug, locale)
    }
    
    return response.data
  } catch (error) {
    console.error('[获取品类详情失败，使用回退方案]', error)
    return await getCategoryDetailFallback(slug, locale)
  }
}

// 回退方案：使用旧的API组合数据
async function getCategoryDetailFallback(slug: string, locale: string) {
  const category = await getCategoryBySlug(slug)
  if (!category) return null
  
  // 获取游戏列表
  const games = await getAllCategoryGames(category.id, locale)
  
  // 静态礼包数据（示例）
  const mockGifts = games.slice(0, 6).map((game, index) => ({
    id: index + 1,
    name: `${game.name}新手礼包`,
    content: `金币×10000、钻石×500、稀有装备×1、经验药水×10`,
    gameId: game.id,
    gameName: game.name,
    gameIcon: game.iconUrl,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    receiveCount: Math.floor(Math.random() * 500),
    totalCount: 1000,
    status: 'active',
  }))
  
  // 静态攻略数据（示例）
  const mockGuides = games.slice(0, 8).map((game, index) => ({
    id: `guide-${index + 1}`,
    title: `${game.name}${['新手入门攻略', '进阶养成指南', '阵容搭配推荐', '零氪通关攻略'][index % 4]}`,
    slug: `guide-${index + 1}`,
    coverImage: game.iconUrl,
    categoryName: category.name,
    viewCount: Math.floor(Math.random() * 5000) + 1000,
    createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    readingTime: Math.floor(Math.random() * 10) + 5,
  }))
  
  // 获取所有分类作为相关品类（排除当前分类）
  let relatedCategories: any[] = []
  try {
    const response = await ApiClient.getCategories({
      locale: locale as any,
      categoryType: 'game',
    })
    if (response.code === 200 && response.data) {
      relatedCategories = response.data
        .filter((cat: any) => cat.slug !== slug)
        .slice(0, 4)
        .map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon || '🎮',
          gamesCount: Math.floor(Math.random() * 50) + 10,
        }))
    }
  } catch (error) {
    console.error('[获取相关分类失败]', error)
  }
  
  // 构造简化的响应格式
  return {
    category: {
      ...category,
      longDescription: category.description || `${category.name}游戏是深受玩家喜爱的游戏品类，包含多款精品游戏。本专区为您精选了最热门的${category.name}手游，提供详细的游戏介绍、新手攻略、礼包领取等服务。\n\n【品类特点】\n• 游戏品质：精选优质游戏，品质保证\n• 玩法丰富：多样化的游戏体验\n• 福利丰厚：独家礼包，限时领取\n• 攻略齐全：新手到进阶，全程指导\n\n【本站优势】\n我们为每款游戏提供详细攻略、专属礼包码、快速下载通道，帮助玩家快速上手，享受游戏乐趣。`,
      tags: ['热门推荐', '精品游戏', '福利丰厚', '新手友好'],
      bannerUrl: games[0]?.iconUrl,
    },
    topGames: games.slice(0, 10),
    commonGuides: mockGuides.filter((_, i) => i % 3 === 0),
    hotGuides: mockGuides.filter((_, i) => i % 3 === 1),
    latestGuides: mockGuides.filter((_, i) => i % 3 === 2),
    gifts: mockGifts,
    relatedCategories,
    stats: {
      gamesCount: games.length,
      guidesCount: mockGuides.length,
      giftsCount: mockGifts.length,
    },
    fromSubSite: false,
  }
}

// 获取分类下的所有游戏列表（用于全部游戏展示）
async function getAllCategoryGames(categoryId: number, locale: string): Promise<Game[]> {
  try {
    const response = await ApiClient.getCategoryGames(categoryId, {
      locale: locale as any,
      pageSize: 9999,
      pageNum: 1,
    })
    
    if (response.code !== 200 || !response.rows) {
      return []
    }
    
    return response.rows
  } catch (error) {
    console.error('[获取游戏列表失败]', error)
    return []
  }
}

// 生成元数据
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const { source } = await searchParams
  
  const categoryDetail = await getCategoryDetail(slug, locale, source)
  
  if (!categoryDetail) {
    return {
      title: getTranslation('noData', locale as Locale),
    }
  }
  
  const { category, stats } = categoryDetail
  const localeTyped = locale as Locale
  
  // 获取品类的前几个游戏名称用于描述
  const topGamesNames = categoryDetail.topGames
    ?.slice(0, 3)
    .map((g: any) => g.name || g.title)
    .join('、') || ''
  
  return {
    title: `${category.name}游戏推荐_2026最新${category.name}手游排行榜-游戏盒子`,
    description: category.longDescription || 
      `精选${stats.gamesCount}款${category.name}手游${topGamesNames ? `，包含${topGamesNames}等热门作品` : ''}。提供详细攻略、礼包领取、注册下载等服务。`,
    keywords: [
      `${category.name}游戏`,
      `${category.name}手游`,
      `${category.name}推荐`,
      `${category.name}排行榜`,
      `${category.name}攻略`,
    ].join(','),
  }
}

// SSG + ISR
export const dynamic = 'force-static'
export const revalidate = 3600

export default async function GameCategoryPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params
  const { source } = await searchParams
  
  // 验证语言
  if (!isValidLocale(locale)) {
    notFound()
  }
  
  const localeTyped = locale as Locale
  
  // 获取品类增强详情
  const categoryDetail = await getCategoryDetail(slug, locale, source)
  
  if (!categoryDetail) {
    notFound()
  }
  
  const {
    category,
    topGames = [],
    commonGuides = [],
    hotGuides = [],
    latestGuides = [],
    gifts = [],
    relatedCategories = [],
    stats,
    subSiteUrl,
    fromSubSite = false,
  } = categoryDetail
  
  // 获取全部游戏列表（用于"全部游戏"区块）
  const allGames = await getAllCategoryGames(category.id, locale)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 面包屑导航 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={localeTyped === defaultLocale ? '/' : `/${localeTyped}`} className="hover:text-foreground transition-colors">
              {getTranslation('home', localeTyped)}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={localeTyped === defaultLocale ? '/games' : `/${localeTyped}/games`} className="hover:text-foreground transition-colors">
              {getTranslation('gameLibrary', localeTyped)}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{category.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link href={localeTyped === defaultLocale ? '/games' : `/${localeTyped}/games`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getTranslation('gameLibrary', localeTyped)}
          </Button>
        </Link>

        {/* 1. 品类介绍区 */}
        <CategoryIntroduction
          category={category}
          stats={stats}
          fromSubSite={fromSubSite}
        />

        {/* 2. TOP游戏推荐区 */}
        <CategoryTopGames
          categoryName={category.name}
          topGames={topGames}
          locale={locale}
          defaultLocale={defaultLocale}
        />

        {/* 3. 品类礼包区 */}
        <CategoryGifts
          categoryName={category.name}
          categorySlug={category.slug}
          gifts={gifts}
          locale={locale}
          defaultLocale={defaultLocale}
        />

        {/* 4. 品类攻略区 */}
        <CategoryGuides
          categoryName={category.name}
          categorySlug={category.slug}
          commonGuides={commonGuides}
          hotGuides={hotGuides}
          latestGuides={latestGuides}
          locale={locale}
          defaultLocale={defaultLocale}
          subSiteUrl={subSiteUrl}
        />

        {/* 5. 全部游戏列表 */}
        <section className="all-games mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                <Grid3x3 className="inline h-7 w-7 text-blue-500 mr-2" />
                全部{category.name}游戏
              </h2>
              <p className="text-sm text-muted-foreground">共{allGames.length}款游戏</p>
            </div>
          </div>

          {allGames.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Grid3x3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{getTranslation('noCategoryGames', localeTyped)}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {allGames.map((game) => {
                const gameLink = localeTyped === defaultLocale ? `/games/${game.id}` : `/${localeTyped}/games/${game.id}`
                return (
                  <Link
                    key={game.id}
                    href={gameLink}
                    className="group"
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:scale-105">
                      <CardContent className="p-4">
                        {/* 游戏图标 */}
                        <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                          {game.iconUrl ? (
                            <ImageWithFallback
                              src={game.iconUrl}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gamepad2 className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* 游戏名称 */}
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {game.name}
                        </h3>
                        
                        {/* 游戏描述 */}
                        {game.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {game.description}
                          </p>
                        )}
                        
                        {/* 状态标签 */}
                        {game.status && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {game.status}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* 6. 其他品类推荐 */}
        <RelatedCategories
          categories={relatedCategories}
          locale={locale}
          defaultLocale={defaultLocale}
        />
      </div>
    </div>
  )
}
