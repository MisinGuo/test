import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Download, Star, Users, Shield, Gift, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isValidLocale, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'
import ApiClient from '@/lib/api'
import ImageWithFallback from '../../ImageWithFallback'

export async function generateStaticParams() {
  return supportedLocales
    .filter(locale => locale !== defaultLocale)
    .map(locale => ({ locale }))
}

export const dynamic = 'force-static'
export const revalidate = 3600

interface BoxDetailPageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: BoxDetailPageProps): Promise<Metadata> {
  const { id, locale } = await params
  
  try {
    const response = await ApiClient.getBoxDetail(Number(id), locale)
    const box = response.data
    
    return {
      title: `${box.name} - 游戏盒子详情`,
      description: box.description || `了解${box.name}游戏盒子的详细信息，包含游戏列表、折扣信息等`,
    }
  } catch {
    return {
      title: '游戏盒子详情',
      description: '游戏盒子详细信息',
    }
  }
}

export default async function BoxDetailPage({ params }: BoxDetailPageProps) {
  const { locale: localeParam, id } = await params
  
  if (!isValidLocale(localeParam)) {
    notFound()
  }
  
  const locale = localeParam as Locale

  // 获取盒子详情
  let box: any = null
  let games: any[] = []
  
  try {
    const response = await ApiClient.getBoxDetail(Number(id), locale)
    if (response.code === 200 && response.data) {
      box = response.data
      games = box.games || []
    }
  } catch (error) {
    console.error('获取盒子详情失败:', error)
    notFound()
  }

  if (!box) {
    notFound()
  }

  // 解析features
  let features: string[] = []
  if (box.features) {
    try {
      const parsed = typeof box.features === 'string' ? JSON.parse(box.features) : box.features
      features = Array.isArray(parsed) ? parsed : []
    } catch {
      features = []
    }
  }

  // 生成折扣显示
  const discountText = box.discountRate 
    ? `${(box.discountRate * 10).toFixed(1)}折` 
    : ''

  // 生成颜色
  const colors = ['bg-orange-500', 'bg-green-500', 'bg-purple-600', 'bg-blue-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500']
  const colorIndex = box.name ? box.name.charCodeAt(0) % colors.length : 0

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Breadcrumbs */}
      <nav className="container mx-auto px-4 py-4 text-sm text-slate-400 flex items-center">
        <Link href={locale === defaultLocale ? '/' : `/${locale}`} className="hover:text-white">首页</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link href={locale === defaultLocale ? '/boxes' : `/${locale}/boxes`} className="hover:text-white">游戏盒子</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-white">{box.name}</span>
      </nav>

      {/* Header Section */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            <div className={`w-24 h-24 rounded-2xl ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-4xl shadow-xl shrink-0`}>
              {box.name?.substring(0, 1) || '盒'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{box.name}</h1>
                {discountText && (
                  <Badge className="bg-orange-500 text-white text-base px-3 py-1">
                    {discountText}
                  </Badge>
                )}
              </div>

              <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                {box.description || '暂无描述'}
              </p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-white">4.5</span>
                  <span className="text-sm">评分</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Download className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-white">{box.gameCount || 0}</span>
                  <span className="text-sm">游戏</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-white">100万+</span>
                  <span className="text-sm">用户</span>
                </div>
              </div>

              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8" asChild>
                <Link href={`/boxes/${box.id}/download`}>
                  <Download className="mr-2 h-5 w-5" />
                  立即下载
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      {features.length > 0 && (
        <div className="container mx-auto px-4 py-12 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-6">特色功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Games Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">包含游戏</h2>
          <span className="text-slate-400">{games.length} 款游戏</span>
        </div>

        {games.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {games.map((game: any) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                  <div className="aspect-square bg-slate-800 relative overflow-hidden">
                    <ImageWithFallback
                      src={game.iconUrl}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                    {game.isNew === '1' && (
                      <Badge className="absolute top-2 right-2 bg-green-500 text-xs">新游</Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {game.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{game.categoryName || '未分类'}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-2">暂无游戏</div>
            <div className="text-sm text-slate-500">该盒子还没有添加游戏</div>
          </div>
        )}
      </div>

      {/* Additional Info */}
      {box.websiteUrl && (
        <div className="container mx-auto px-4 pb-12">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">更多信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-blue-400" />
                <a 
                  href={box.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  访问官方网站
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
