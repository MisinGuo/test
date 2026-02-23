import Link from 'next/link'
import { FileText, Eye, Clock, ChevronRight, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ImageWithFallback from '@/app/[locale]/ImageWithFallback'
import type { ArticleListItem } from '@/lib/api-types'

interface GameGuidesProps {
  gameName: string
  gameId: number
  guides: ArticleListItem[]
  categorySlug?: string
  locale: string
  defaultLocale: string
  subSiteUrl?: string
}

export default function GameGuides({ 
  gameName, 
  gameId, 
  guides, 
  categorySlug,
  locale, 
  defaultLocale,
  subSiteUrl 
}: GameGuidesProps) {
  const getArticleLink = (articleId: number | string) => {
    return locale === defaultLocale ? `/strategy/${articleId}` : `/${locale}/strategy/${articleId}`
  }

  const getStrategyLink = () => {
    return locale === defaultLocale ? `/strategy?game=${gameId}` : `/${locale}/strategy?game=${gameId}`
  }

  if (!guides || guides.length === 0) {
    return (
      <section className="game-guides mb-12">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <FileText className="inline h-7 w-7 text-green-500 mr-2" />
            游戏攻略
          </h2>
        </div>
        
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">暂无攻略，敬请期待</p>
            {subSiteUrl && (
              <a href={subSiteUrl} target="_blank" rel="nofollow">
                <Button variant="outline">
                  前往攻略专站查看更多
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="game-guides mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <FileText className="inline h-7 w-7 text-green-500 mr-2" />
            {gameName} 游戏攻略
          </h2>
          <p className="text-sm text-muted-foreground">新手入门、进阶技巧、养成攻略</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {guides.slice(0, 6).map((guide) => (
          <Link key={guide.id} href={getArticleLink(guide.id)}>
            <Card className="overflow-hidden hover:shadow-md transition-all h-full group">
              {guide.coverImage && (
                <div className="aspect-video overflow-hidden">
                  <ImageWithFallback
                    src={guide.coverImage}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {guide.title}
                </h3>
                
                {guide.categoryName && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {guide.categoryName}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {guide.viewCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{guide.viewCount}</span>
                    </div>
                  )}
                  {guide.readingTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{guide.readingTime}分钟</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 查看更多按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {guides.length > 6 && (
          <Link href={getStrategyLink()}>
            <Button variant="outline">
              查看站内更多攻略
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
        
        {subSiteUrl && (
          <a href={`${subSiteUrl}?game=${gameId}`} target="_blank" rel="nofollow">
            <Button variant="ghost">
              前往攻略专站查看深度攻略
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        )}
      </div>
    </section>
  )
}
