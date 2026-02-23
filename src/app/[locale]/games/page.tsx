import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Gamepad2, Flame, TrendingUp, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { isValidLocale, getTranslation, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'
import { backendConfig } from '@/config/api/backend'
import { fallbackMetadata } from '@/config/fallback-metadata'
import { generateListMetadata } from '@/lib/metadata'
import { gamesListConfig } from '@/config/pages/games'
import ApiClient from '@/lib/api'

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
      title: 'Game Library',
      description: 'Discover hot games',
    }
  }
  
  const locale = localeParam as Locale
  const fallback = fallbackMetadata.games
  
  return generateListMetadata(locale, 'games', {
    title: fallback.title[locale],
    description: fallback.description[locale],
    keywords: fallback.keywords?.[locale],
  })
}

// SSG + ISR
export const dynamic = 'force-static'
export const revalidate = 86400

// 分类图标映射（已废弃，使用后端返回的图标）
// 默认图标: 🎮
/*
const categoryIcons: Record<string, string> = {
  '传奇': '⚔️',
  '二次元': '🎭',
  '仙侠': '🌙',
  '三国': '🏯',
  '卡牌': '🃏',
  '回合': '♻️',
  '放置': '💤',
  '策略': '🎯',
  '模拟': '🏗️',
  '竞技': '🏆',
  '体育': '⚽',
  '武侠': '🥋',
  '养成': '🌱',
  '塔防': '🏰',
  '休闲': '🎮',
  '魔幻': '🔮',
  '消除': '💎',
  '宫斗': '👑',
  '女性向': '💖',
  'SLG': '🗺️',
}
*/

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
  icon?: string  // 添加图标字段
  count: number
}

// 获取游戏分类列表（支持多语言）
async function getGameCategories(locale: string): Promise<Category[]> {
  try {
    const response = await ApiClient.getCategories({
      locale: locale as any,
      categoryType: 'game',
    })
    
    if (response.code !== 200 || !response.data) {
      console.error('[分类列表API错误]', response.msg)
      return []
    }
    
    const categories = response.data
    
    // 直接使用后端返回的 relatedDataCount 作为游戏数量
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || cat.name,
      icon: cat.icon || '🎮',
      count: cat.relatedDataCount || 0  // 使用后端返回的数量
    }))
  } catch (error) {
    console.error('[获取游戏分类失败]', error)
    return []
  }
}

// 获取分类下的游戏数量
async function getGameCountByCategory(locale: string, categoryId: number): Promise<number> {
  try {
    const url = `${backendConfig.baseURL}/api/public/categories/${categoryId}/games?siteId=${backendConfig.siteId}&pageSize=1&pageNum=1`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Site-Id': String(backendConfig.siteId),
      },
      next: { revalidate: 86400 }
    })

    if (!response.ok) {
      return 0
    }

    const result = await response.json()
    // TableDataInfo格式: { code, msg, rows, total }
    return result.total || 0
  } catch (error) {
    return 0
  }
}

// 通过分类获取游戏列表
// 获取指定分类下的游戏列表（支持多语言）
async function getGamesByCategory(locale: string, categoryId: number, pageSize: number = 50): Promise<Game[]> {
  try {
    const response = await ApiClient.getCategoryGames(categoryId, {
      locale: locale as any,
      pageSize,
      pageNum: 1,
    })
    
    if (response.code !== 200 || !response.rows) {
      console.error('[游戏列表API错误]', response.msg)
      return []
    }
    
    return response.rows
  } catch (error) {
    console.error('[获取游戏列表失败]', error)
    return []
  }
}

// 获取所有游戏列表（支持多语言）
async function getGames(locale: string, limit: number = 50): Promise<Game[]> {
  try {
    const response = await ApiClient.getGames({
      locale: locale as any,
      pageSize: limit,
      pageNum: 1,
    })
    
    if (response.code !== 200 || !response.rows) {
      console.error('[游戏列表API错误]', response.msg)
      return []
    }
    
    return response.rows
  } catch (error) {
    console.error('[获取游戏列表失败]', error)
    return []
  }
}

export default async function LocalizedGamesPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale: localeParam } = await params
  
  // 验证locale参数
  if (!isValidLocale(localeParam)) {
    notFound()
  }
  
  const locale = localeParam as Locale
  
  // 获取所有分类数据（已包含 relatedDataCount）
  const categories = await getGameCategories(locale)
  
  // 按游戏数量排序，显示所有分类
  const sortedCategories = categories.sort((a, b) => b.count - a.count)
  
  // 只请求前3个有游戏的分类的游戏数据进行展示
  const topCategories = sortedCategories.filter(cat => cat.count > 0).slice(0, 3)
  const categoryPreviews = await Promise.all(
    topCategories.map(async (cat) => {
      const games = await getGamesByCategory(locale, cat.id, 8)
      return {
        ...cat,
        games: games
      }
    })
  )

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Breadcrumbs */}
      <nav className="container mx-auto px-4 py-4 text-sm text-slate-400 flex items-center">
        <Link href={locale === defaultLocale ? '/' : `/${locale}`} className="hover:text-white">{getTranslation('home', locale)}</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-white">{getTranslation('gamesTitle', locale)}</span>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
          <Gamepad2 className="h-5 w-5 text-purple-500" />
          <span className="text-purple-500 font-medium">{gamesListConfig.hero.badge[locale]}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {gamesListConfig.hero.title[locale]}
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          {gamesListConfig.hero.description[locale]}
        </p>
      </div>

      {/* Categories Grid */}
      {sortedCategories.length > 0 ? (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-500" />
            {gamesListConfig.ui.gameCategories[locale]}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {sortedCategories.map((category) => (
              <Link
                key={category.id}
                href={locale === defaultLocale ? `/games/category/${category.slug}` : `/${locale}/games/category/${category.slug}`}
                className="group"
              >
                <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon || '🎮'}</div>
                    <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{category.count} {gamesListConfig.ui.gamesCount[locale]}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-16 text-center">
          <Gamepad2 className="h-16 w-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">{gamesListConfig.ui.noCategories[locale]}</p>
        </div>
      )}

      {/* Featured Games by Category */}
      {categoryPreviews.length > 0 && categoryPreviews.map((categoryData) => (
        <div key={categoryData.id} className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">{categoryData.icon || '🎮'}</span>
              {categoryData.name}
              <span className="text-slate-500 text-base ml-2">({categoryData.count} {gamesListConfig.ui.gamesCount[locale]})</span>
            </h2>
            <Link
              href={locale === defaultLocale ? `/games/category/${categoryData.slug}` : `/${locale}/games/category/${categoryData.slug}`}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
            >
              {gamesListConfig.ui.viewAll[locale]} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          {categoryData.games.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryData.games.slice(0, 4).map((game) => (
                <Link
                  key={game.id}
                  href={locale === defaultLocale ? `/games/${game.id}` : `/${locale}/games/${game.id}`}
                  className="group"
                >
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                    <CardHeader className="p-4">
                      {game.iconUrl && (
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-slate-800">
                          <img 
                            src={game.iconUrl} 
                            alt={game.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          {categoryData.name}
                        </Badge>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-xs">{gamesListConfig.ui.hotLabel[locale]}</span>
                        </div>
                      </div>
                      <CardTitle className="text-white text-base group-hover:text-purple-400 transition-colors line-clamp-2">
                        {game.name}
                      </CardTitle>
                      <CardDescription className="text-slate-500 text-sm line-clamp-2 mt-2">
                        {game.description || game.name}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gamepad2 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">{gamesListConfig.ui.noCategoryGames[locale]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
