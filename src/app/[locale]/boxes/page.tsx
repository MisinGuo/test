import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BoxCard } from '@/components/common/BoxCard'
import { BoxesFilterSheet } from './BoxesFilterSheet'
import { isValidLocale, supportedLocales, defaultLocale, type Locale } from '@/config/site/locales'
import { fallbackMetadata } from '@/config/fallback-metadata'
import { generateListMetadata } from '@/lib/metadata'
import { boxesListConfig } from '@/config/pages/boxes'
import ApiClient from '@/lib/api'

export async function generateStaticParams() {
  return supportedLocales
    .filter(locale => locale !== defaultLocale)
    .map(locale => ({ locale }))
}

// SSG: 静态生成
export const dynamic = 'force-static'
export const revalidate = 86400

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    return {
      title: 'Game Boxes',
      description: 'Discover premium game boxes',
    }
  }
  
  const locale = localeParam as Locale
  const fallback = fallbackMetadata.boxes
  
  return generateListMetadata(locale, 'boxes', {
    title: fallback.title[locale],
    description: fallback.description[locale],
    keywords: fallback.keywords?.[locale],
  })
}

export default async function LocalizedBoxesPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale: localeParam } = await params
  
  if (!isValidLocale(localeParam)) {
    notFound()
  }
  
  const locale = localeParam as Locale

  // 从后端获取游戏盒子数据
  let boxes: any[] = []
  let totalBoxes = 0
  let stats = {
    totalBoxes: 0,
    lowestDiscount: '0.1折',
    totalGames: 0,
    totalUsers: '100万+'
  }

  try {
    const response = await ApiClient.getBoxes({
      locale,
      pageNum: 1,
      pageSize: 50,
    })

    console.log('[Boxes页面] API响应:', { code: response.code, total: response.total, rowsLength: response.rows?.length })

    if (response.code === 200) {
      boxes = response.rows || []
      totalBoxes = response.total || 0
      
      console.log('[Boxes页面] 数据加载成功:', { boxesCount: boxes.length, totalBoxes })
      
      // 计算统计数据
      stats.totalBoxes = totalBoxes
      if (boxes.length > 0) {
        const totalGameCount = boxes.reduce((sum, box) => sum + (box.gameCount || 0), 0)
        stats.totalGames = totalGameCount
      }
    } else {
      console.warn('[Boxes页面] API返回非200状态:', response)
    }
  } catch (error) {
    console.error('[Boxes页面] 获取游戏盒子数据失败:', error)
    // 如果API调用失败，使用空数组，不影响页面渲染
  }

  return (
    <div className="bg-slate-950 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">{boxesListConfig.hero.title[locale]}</h1>
          <p className="text-slate-400 text-lg">
            {boxesListConfig.hero.description[locale]}
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder={boxesListConfig.ui.searchPlaceholder[locale]}
              className="pl-9 bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <BoxesFilterSheet />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <div className="text-2xl font-bold text-white mb-1">{stats.totalBoxes}+</div>
            <div className="text-sm text-slate-400">{boxesListConfig.ui.statsBoxes[locale]}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <div className="text-2xl font-bold text-white mb-1">{stats.lowestDiscount}</div>
            <div className="text-sm text-slate-400">{boxesListConfig.ui.statsBestDiscount[locale]}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <div className="text-2xl font-bold text-white mb-1">{stats.totalGames}+</div>
            <div className="text-sm text-slate-400">{boxesListConfig.ui.statsGames[locale]}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <div className="text-2xl font-bold text-white mb-1">{stats.totalUsers}</div>
            <div className="text-sm text-slate-400">{boxesListConfig.ui.statsUsers[locale]}</div>
          </div>
        </div>

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.length > 0 ? (
            boxes.map((box) => {
              // 解析features为tags数组
              let tags: string[] = []
              if (box.features) {
                try {
                  const parsed = typeof box.features === 'string' ? JSON.parse(box.features) : box.features
                  tags = Array.isArray(parsed) ? parsed : []
                } catch {
                  tags = []
                }
              }
              
              // 生成折扣显示文本
              const discountText = box.discountRate 
                ? `${(box.discountRate * 10).toFixed(1)}折` 
                : ''
              
              // 生成颜色（基于盒子名称哈希）
              const colors = ['bg-orange-500', 'bg-green-500', 'bg-purple-600', 'bg-blue-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500']
              const colorIndex = box.name ? box.name.charCodeAt(0) % colors.length : 0
              
              return (
                <BoxCard 
                  key={box.id}
                  id={box.id}
                  name={box.name}
                  logoColor={colors[colorIndex]}
                  logoText={box.name?.substring(0, 1) || boxesListConfig.ui.defaultLogoText[locale]}
                  description={box.description || ''}
                  tags={tags}
                  gameCount={box.gameCount || 0}
                  rating={4.5}
                  discount={discountText}
                />
              )
            })
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400">
              {boxesListConfig.ui.noCategoryBoxes[locale]}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
