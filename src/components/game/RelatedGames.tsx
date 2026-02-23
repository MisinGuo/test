import Link from 'next/link'
import { Gamepad2, Star, Download, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ImageWithFallback from '@/app/[locale]/ImageWithFallback'
import type { GameListItem } from '@/lib/api-types'

interface RelatedGamesProps {
  categoryName?: string
  categorySlug?: string
  games: GameListItem[]
  locale: string
  defaultLocale: string
}

export default function RelatedGames({ 
  categoryName, 
  categorySlug,
  games, 
  locale, 
  defaultLocale 
}: RelatedGamesProps) {
  if (!games || games.length === 0) {
    return null
  }

  const getGameLink = (gameId: number) => {
    return locale === defaultLocale ? `/games/${gameId}` : `/${locale}/games/${gameId}`
  }

  const getCategoryLink = () => {
    if (!categorySlug) return null
    return locale === defaultLocale ? `/games/category/${categorySlug}` : `/${locale}/games/category/${categorySlug}`
  }

  return (
    <section className="related-games mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <Gamepad2 className="inline h-7 w-7 text-blue-500 mr-2" />
            {categoryName ? `更多${categoryName}游戏` : '相关游戏推荐'}
          </h2>
          <p className="text-sm text-muted-foreground">探索同类型精选游戏</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {games.slice(0, 10).map((game) => (
          <Link key={game.id} href={getGameLink(game.id)}>
            <Card className="overflow-hidden hover:shadow-lg hover:scale-105 transition-all h-full group">
              <CardContent className="p-4">
                {/* 游戏图标 */}
                <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                  {(game.iconUrl || game.coverImage) ? (
                    <ImageWithFallback
                      src={game.iconUrl || game.coverImage || ''}
                      alt={game.name || game.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* 评分标记 */}
                  {game.rating && (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-white">
                        {game.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* 新游标记 */}
                  {game.isNew && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="default" className="text-xs">新游</Badge>
                    </div>
                  )}
                </div>
                
                {/* 游戏名称 */}
                <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {game.name || game.title}
                </h3>
                
                {/* 下载量 */}
                {game.downloadCount && game.downloadCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="h-3 w-3" />
                    <span>{game.downloadCount.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 查看更多 */}
      {categorySlug && games.length > 10 && (
        <div className="text-center mt-6">
          <Link href={getCategoryLink() || '#'}>
            <Button variant="outline">
              查看全部{categoryName}游戏
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </section>
  )
}
