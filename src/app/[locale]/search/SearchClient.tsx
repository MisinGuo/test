'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ApiClient from '@/lib/api'
import { searchConfig } from '@/config/pages/search'
import type { Locale } from '@/config/site/locales'

// 防抖Hook
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface Article {
  id: number
  title: string
  articleType: string
  summary?: string
  categoryName?: string
  publishTime?: string
}

interface Game {
  id: number
  name: string
  description?: string
  category?: string
}

interface SearchResult {
  type: 'article' | 'game'
  id: number
  title: string
  description?: string
  category?: string
  date?: string
  url: string
}

interface SearchClientProps {
  locale: Locale
}

export default function SearchClient({ locale }: SearchClientProps) {
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(urlQuery)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'article' | 'game'>('all')
  
  // 使用防抖避免频繁请求
  const debouncedQuery = useDebounce(query, 500)

  // 搜索函数
  const performSearch = async (keyword: string, page: number = 1) => {
    if (!keyword.trim()) {
      setResults([])
      setTotalResults(0)
      setHasMore(false)
      return
    }

    setIsLoading(true)
    try {
      // 并行搜索文章和游戏
      const [articlesRes, gamesRes] = await Promise.all([
        ApiClient.searchArticles(keyword, { pageNum: page, pageSize: 10, locale }),
        ApiClient.searchGames(keyword, { pageNum: page, pageSize: 10, locale })
      ])

      const articles: Article[] = articlesRes.rows || []
      const games: Game[] = gamesRes.rows || []

      // 转换为统一的搜索结果格式
      const articleResults: SearchResult[] = articles.map(article => ({
        type: 'article' as const,
        id: article.id,
        title: article.title,
        description: article.summary,
        category: article.categoryName || searchConfig.ui.uncategorized[locale],
        date: article.publishTime,
        url: `/strategy/${article.id}`
      }))

      const gameResults: SearchResult[] = games.map(game => ({
        type: 'game' as const,
        id: game.id,
        title: game.name,
        description: game.description,
        category: game.category || searchConfig.ui.uncategorized[locale],
        url: `/games/${game.id}`
      }))

      // 合并结果：文章优先
      const allResults = [...articleResults, ...gameResults]
      
      if (page === 1) {
        setResults(allResults)
      } else {
        setResults(prev => [...prev, ...allResults])
      }

      const total = (articlesRes.total || 0) + (gamesRes.total || 0)
      setTotalResults(total)
      setHasMore(allResults.length > 0 && results.length + allResults.length < total)
    } catch (error) {
      console.error('搜索失败:', error)
      setResults([])
      setTotalResults(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 监听搜索关键词变化
  useEffect(() => {
    setCurrentPage(1)
    performSearch(debouncedQuery, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  // 加载更多
  const loadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    performSearch(debouncedQuery, nextPage)
  }

  // 获取结果类型标签
  const getTypeBadge = (type: 'article' | 'game') => {
    if (type === 'article') {
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          {searchConfig.ui.strategies[locale]}
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
        {searchConfig.ui.games[locale]}
      </Badge>
    )
  }

  return (
    <div className="bg-slate-950 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">{searchConfig.ui.search[locale]}</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              placeholder={searchConfig.ui.searchPlaceholder[locale]}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {query && results.length > 0 && (
          <div className="mb-6 flex items-center gap-4 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                activeTab === 'all'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {searchConfig.ui.all[locale]} ({totalResults})
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('game')}
              className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                activeTab === 'game'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {searchConfig.ui.games[locale]} ({results.filter(r => r.type === 'game').length})
              {activeTab === 'game' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('article')}
              className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                activeTab === 'article'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {searchConfig.ui.strategies[locale]} ({results.filter(r => r.type === 'article').length})
              {activeTab === 'article' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && currentPage === 1 && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Results */}
        {!isLoading || currentPage > 1 ? (
          query ? (
            <div>
              {results.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {results
                      .filter(item => activeTab === 'all' || item.type === activeTab)
                      .map((item, index) => (
                        <Link key={`${item.type}-${item.id}-${index}`} href={item.url}>
                          <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-2 mb-2">
                                {getTypeBadge(item.type)}
                                {item.category && (
                                  <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                                    {item.category}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400 transition-colors">
                                {item.title}
                              </h3>
                              {item.date && (
                                <div className="text-xs text-slate-500">
                                  {new Date(item.date).toLocaleDateString('zh-CN')}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {searchConfig.ui.loading[locale]}
                          </>
                        ) : (
                          searchConfig.ui.loadMore[locale]
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-2">{searchConfig.ui.noResultsFound[locale]}</div>
                  <div className="text-sm text-slate-500">
                    {searchConfig.ui.tryOtherKeywords[locale]}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              {searchConfig.ui.startSearching[locale]}
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
