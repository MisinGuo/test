import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Download, Star, Users, Calendar, Tag, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ImageWithFallback from '../../ImageWithFallback'
import ApiClient from '@/lib/api'
import GameGifts from '@/components/game/GameGifts'
import GameGuides from '@/components/game/GameGuides'
import RelatedGames from '@/components/game/RelatedGames'

// 游戏类型定义
interface Game {
  id: number
  name: string
  subtitle?: string | null
  description: string
  iconUrl: string
  coverUrl?: string | null
  screenshots?: string | null  // JSON 字符串数组
  videoUrl?: string | null
  downloadUrl?: string | null
  androidUrl?: string | null
  iosUrl?: string | null
  downloadCount: number
  rating?: number | null
  categoryName?: string | null
  categoryIcon?: string | null
  categoryId?: number | null
  version?: string | null
  size?: string | null
  launchTime?: string | null
  developer?: string | null
  publisher?: string | null
  tags?: string | null  // JSON 字符串或逗号分隔
  features?: string | null
  deviceSupport?: string | null
  isNew?: string
  isHot?: string
  isRecommend?: string
  status?: string
}

interface PageProps {
  params: {
    locale: string
    id: string
  }
}

// 获取游戏数据（使用 ApiClient）
async function getGameData(id: string, locale: string) {
  try {
    // 获取游戏详情
    const gameResult = await ApiClient.getGameDetail(Number(id), locale)
    
    if (gameResult.code !== 200 || !gameResult.data) {
      return null
    }
    
    const rawGame = gameResult.data
    
    // 解析 screenshots（如果是 JSON 字符串，需要解析）
    let screenshotUrls: string[] = []
    if (rawGame.screenshots) {
      try {
        screenshotUrls = typeof rawGame.screenshots === 'string' 
          ? JSON.parse(rawGame.screenshots) 
          : rawGame.screenshots
      } catch (e) {
        console.error('Failed to parse screenshots:', e)
      }
    }
    
    // 解析 tags（如果是 JSON 字符串或逗号分隔，需要解析）
    let tagList: string[] = []
    if (rawGame.tags) {
      try {
        if (typeof rawGame.tags === 'string') {
          // 尝试 JSON 解析
          try {
            tagList = JSON.parse(rawGame.tags)
          } catch {
            // 如果不是 JSON，尝试逗号分隔
            tagList = rawGame.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          }
        } else if (Array.isArray(rawGame.tags)) {
          tagList = rawGame.tags
        }
      } catch (e) {
        console.error('Failed to parse tags:', e)
      }
    }
    
    // 组装游戏数据
    const game = {
      ...rawGame,
      screenshotUrls,
      tagList,
    }
    
    // 获取相关游戏
    let relatedGames: Game[] = []
    if (game.categoryId) {
      const relatedResult = await ApiClient.getCategoryGames(game.categoryId, {
        locale: locale as any,
        pageNum: 1,
        pageSize: 9999,
      })
      
      if (relatedResult.code === 200 && relatedResult.data?.rows) {
        relatedGames = relatedResult.data.rows.filter(
          (g: Game) => g.id !== game.id
        )
      }
    }
    
    // 获取游戏礼包
    let gifts: any[] = []
    try {
      const giftsResult = await ApiClient.getGameGifts(game.id, { locale })
      if (giftsResult.code === 200 && giftsResult.data) {
        gifts = Array.isArray(giftsResult.data) ? giftsResult.data : giftsResult.data.rows || []
      }
    } catch (error) {
      console.error('Failed to fetch gifts:', error)
    }
    
    // 获取游戏攻略
    let guides: any[] = []
    try {
      const guidesResult = await ApiClient.getGameGuides(game.id, { 
        locale,
        pageNum: 1,
        pageSize: 6,
      })
      if (guidesResult.code === 200 && guidesResult.data) {
        guides = Array.isArray(guidesResult.data) ? guidesResult.data : guidesResult.data.rows || []
      }
    } catch (error) {
      console.error('Failed to fetch guides:', error)
    }
    
    return { game, relatedGames, screenshotUrls, tagList, gifts, guides }
  } catch (error) {
    console.error('Error fetching game:', error)
    return null
  }
}

// 生成元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getGameData(params.id, params.locale)
  
  if (!data) {
    return {
      title: '游戏不存在',
      description: '您访问的游戏不存在或已被删除',
    }
  }
  
  const { game } = data
  
  return {
    title: `${game.name} - 游戏详情`,
    description: game.description || `下载 ${game.name}，查看游戏详情、评分和玩家评价`,
  }
}

export default async function GameDetailPage({ params }: PageProps) {
  const data = await getGameData(params.id, params.locale)
  
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">游戏不存在</h1>
          <p className="text-slate-400 mb-8">您访问的游戏不存在或已被删除</p>
          <Button asChild>
            <Link href="/games">返回游戏列表</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  const { game, relatedGames, screenshotUrls, tagList, gifts = [], guides = [] } = data
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* 面包屑导航 */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              首页
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/games" className="text-slate-400 hover:text-white transition-colors">
              游戏库
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white">{game.name}</span>
          </div>
        </div>
      </div>

      {/* 游戏详情头部 */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-[300px,1fr] gap-8">
            {/* 游戏图标 */}
            <div className="flex flex-col items-center md:items-start">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl">
                <ImageWithFallback
                  src={game.iconUrl}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 下载按钮 */}
              {game.downloadUrl ? (
                <Button 
                  size="lg" 
                  className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg font-bold shadow-lg shadow-blue-500/30"
                  asChild
                >
                  <a href={game.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-5 w-5 mr-2" />
                    立即下载
                  </a>
                </Button>
              ) : game.androidUrl ? (
                <Button 
                  size="lg" 
                  className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg font-bold shadow-lg shadow-blue-500/30"
                  asChild
                >
                  <a href={game.androidUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-5 w-5 mr-2" />
                    Android下载
                  </a>
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg font-bold shadow-lg shadow-blue-500/30"
                  disabled
                >
                  <Download className="h-5 w-5 mr-2" />
                  暂无下载
                </Button>
              )}
              
              {/* iOS下载按钮（如果有） */}
              {game.iosUrl && (
                <Button 
                  size="lg" 
                  className="w-full mt-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-lg font-bold shadow-lg shadow-green-500/30"
                  asChild
                >
                  <a href={game.iosUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-5 w-5 mr-2" />
                    iOS下载
                  </a>
                </Button>
              )}
              
              <Button 
                size="lg" 
                variant="outline"
                className="w-full mt-3 border-slate-700 text-slate-300 hover:text-white"
              >
                <Share2 className="h-5 w-5 mr-2" />
                分享游戏
              </Button>
            </div>

            {/* 游戏信息 */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{game.name}</h1>
                  {game.categoryName && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {game.categoryName}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 评分和统计 */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-2xl font-bold text-white">{game.rating || 4.5}</span>
                  <span className="text-slate-400">分</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Download className="h-5 w-5" />
                  <span>{game.downloadCount ? `${(game.downloadCount / 1000).toFixed(1)}K` : '1.2K'} 下载</span>
                </div>
              </div>

              {/* 游戏描述 */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">游戏简介</h2>
                <p className="text-slate-300 leading-relaxed">
                  {game.description || '暂无游戏简介'}
                </p>
              </div>

              {/* 游戏信息 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-400 mb-1">版本</div>
                    <div className="text-white font-semibold">{game.version || 'v1.0.0'}</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-400 mb-1">大小</div>
                    <div className="text-white font-semibold">{game.size || '128 MB'}</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-400 mb-1">更新时间</div>
                    <div className="text-white font-semibold">
                      {game.launchTime ? new Date(game.launchTime).toLocaleDateString('zh-CN') : '2026-01-09'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-400 mb-1">开发商</div>
                    <div className="text-white font-semibold">{game.developer || '官方'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* 标签 */}
              {tagList && tagList.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3">游戏标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {tagList.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-slate-700 text-slate-300">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 游戏截图 */}
      <section className="py-12 px-4 bg-slate-900/30 border-y border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-white mb-6">游戏截图</h2>
          {screenshotUrls && screenshotUrls.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {screenshotUrls.slice(0, 8).map((url: string, i: number) => (
                <div key={i} className="aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                  <ImageWithFallback
                    src={url}
                    alt={`${game.name} 截图 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[game.iconUrl, game.coverUrl || game.iconUrl].filter(Boolean).map((url, i) => (
                <div key={i} className="aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                  <ImageWithFallback
                    src={url || ''}
                    alt={`${game.name} 截图 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 游戏专属礼包 */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <GameGifts
            gameName={game.name}
            gameId={game.id}
            gifts={gifts}
            locale={params.locale}
            defaultLocale="zh-CN"
          />
        </div>
      </section>

      {/* 游戏攻略 */}
      <section className="py-12 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-6xl">
          <GameGuides
            gameName={game.name}
            gameId={game.id}
            guides={guides}
            categorySlug={game.categoryIcon}
            locale={params.locale}
            defaultLocale="zh-CN"
          />
        </div>
      </section>

      {/* 相关游戏推荐 */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <RelatedGames
            categoryName={game.categoryName || undefined}
            categorySlug={game.categoryIcon}
            games={relatedGames.map((g: any) => ({
              ...g,
              title: g.name,
            }))}
            locale={params.locale}
            defaultLocale="zh-CN"
          />
        </div>
      </section>
    </div>
  )
}
