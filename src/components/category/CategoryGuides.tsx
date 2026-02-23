import Link from 'next/link'
import { FileText, Eye, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImageWithFallback from '@/app/[locale]/ImageWithFallback'
import type { ArticleListItem } from '@/lib/api-types'

interface CategoryGuidesProps {
  categoryName: string
  categorySlug: string
  commonGuides?: ArticleListItem[]
  hotGuides?: ArticleListItem[]
  latestGuides?: ArticleListItem[]
  locale: string
  defaultLocale: string
  subSiteUrl?: string
}

export default function CategoryGuides({ 
  categoryName,
  categorySlug,
  commonGuides = [],
  hotGuides = [],
  latestGuides = [],
  locale,
  defaultLocale,
  subSiteUrl
}: CategoryGuidesProps) {
  const hasGuides = commonGuides.length > 0 || hotGuides.length > 0 || latestGuides.length > 0

  if (!hasGuides) {
    return null
  }

  const getArticleLink = (articleId: number | string) => {
    return locale === defaultLocale ? `/strategy/${articleId}` : `/${locale}/strategy/${articleId}`
  }

  const getStrategyLink = () => {
    return locale === defaultLocale ? `/strategy?category=${categorySlug}` : `/${locale}/strategy?category=${categorySlug}`
  }

  const renderGuidesList = (guides: ArticleListItem[]) => {
    if (guides.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>暂无攻略</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide) => (
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
                  {guide.createTime && (
                    <span>{new Date(guide.createTime).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <section className="category-guides mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <FileText className="inline h-7 w-7 text-green-500 mr-2" />
            {categoryName}游戏攻略
          </h2>
          <p className="text-sm text-muted-foreground">新手入门、进阶技巧、阵容搭配</p>
        </div>
      </div>

      <Tabs defaultValue="hot" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          {hotGuides.length > 0 && <TabsTrigger value="hot">热门攻略</TabsTrigger>}
          {commonGuides.length > 0 && <TabsTrigger value="common">通用攻略</TabsTrigger>}
          {latestGuides.length > 0 && <TabsTrigger value="latest">最新攻略</TabsTrigger>}
        </TabsList>

        {hotGuides.length > 0 && (
          <TabsContent value="hot">
            {renderGuidesList(hotGuides)}
          </TabsContent>
        )}

        {commonGuides.length > 0 && (
          <TabsContent value="common">
            {renderGuidesList(commonGuides)}
          </TabsContent>
        )}

        {latestGuides.length > 0 && (
          <TabsContent value="latest">
            {renderGuidesList(latestGuides)}
          </TabsContent>
        )}
      </Tabs>

      {/* 查看更多按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <Link href={getStrategyLink()}>
          <Button variant="outline">
            查看站内攻略
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        
        {subSiteUrl && (
          <a href={subSiteUrl} target="_blank" rel="nofollow" className="inline-block">
            <Button variant="ghost">
              前往攻略专站查看更多深度攻略
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        )}
      </div>
    </section>
  )
}
