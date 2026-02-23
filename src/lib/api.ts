/**
 * 统一API客户端
 * 封装所有后端请求，自动处理认证、错误、多语言等
 */

import { backendConfig, apiEndpoints, getApiUrl, getHeaders } from '@/config'
import type {
  LocaleRequestParams,
  ArticleListParams,
  ArticleDetailParams,
  SearchParams,
  CategoryListParams,
  CategoryTreeParams,
  BoxListParams,
  BoxDetailParams,
  GameListParams,
  GameDetailParams,
  SiteConfigParams,
  StatisticsParams,
} from './api-types'
import { getCurrentLocale, formatLocaleForBackend } from './api-types'

/** API响应格式 */
export interface ApiResponse<T = any> {
  rows?: any[]
  code: number
  msg: string
  data: T
  total?: number
}

/** 请求配置 */
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
  cache?: RequestCache
}

/**
 * 基础请求函数
 */
async function request<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', params, body, headers: customHeaders, next, cache } = config

  // 构建URL
  let url = getApiUrl(endpoint)
  
  // 添加查询参数
  if (params && method === 'GET') {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  // 打印API请求日志
  console.log(`[API请求] ${url}`)

  // 构建请求配置
  const fetchConfig: RequestInit = {
    method,
    headers: {
      ...getHeaders(),
      ...customHeaders,
    },
  }

  // 添加 Next.js 缓存配置
  if (next) {
    (fetchConfig as any).next = next
  }
  if (cache) {
    fetchConfig.cache = cache
  }

  // 添加请求体
  if (body && method !== 'GET') {
    fetchConfig.body = JSON.stringify(body)
  }

  try {
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), backendConfig.timeout)
    
    const response = await fetch(url, {
      ...fetchConfig,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // 打印API响应日志 - 简化版本
    let dataInfo = 'unknown'
    if (Array.isArray(data.rows)) {
      dataInfo = `${data.rows.length} 条记录`
    } else if (Array.isArray(data.data)) {
      dataInfo = `${data.data.length} 条记录`
    } else if (data.data && typeof data.data === 'object') {
      const fieldCount = Object.keys(data.data).length
      dataInfo = `${fieldCount} fields`
    }
    console.log(`[API响应] ${endpoint} - 数据长度: ${dataInfo}`)
    
    return data
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

/**
 * 准备请求参数（自动添加siteId和格式化locale）
 */
function prepareParams<T extends LocaleRequestParams>(params: T): Record<string, any> {
  const prepared: Record<string, any> = {
    ...params,
    siteId: params.siteId || backendConfig.siteId,
  }
  
  // 格式化locale
  if (prepared.locale) {
    prepared.locale = formatLocaleForBackend(prepared.locale as any)
  }
  
  return prepared
}

/**
 * API客户端类
 * 所有方法都支持多语言参数
 */
export class ApiClient {
  /** 获取攻略文章列表（直接调用后端攻略接口，支持section筛选） */
  static async getStrategyArticles(params: ArticleListParams = {}) {
    return request(apiEndpoints.strategies, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale),
        ...params,
      }),
    })
  }

  /** 获取文章详情（用于攻略详情） */
  static async getArticleDetail(id: number, locale?: string) {
    return request(`${apiEndpoints.articleDetail}/${id}`, {
      method: 'GET',
      params: prepareParams({ 
        locale: getCurrentLocale(locale as any),
      }),
    })
  }

  /** 获取攻略文章详情（用于内容中心详情页） */
  static async getStrategyArticleDetail(id: number, locale?: string) {
    return request(`${apiEndpoints.strategies}/${id}`, {
      method: 'GET',
      params: prepareParams({ 
        locale: getCurrentLocale(locale as any),
      }),
      next: { revalidate: 600 }, // 10分钟重新验证
    })
  }

  /** 获取游戏盒子列表 */
  static async getBoxes(params: BoxListParams = {}) {
    return request(apiEndpoints.boxes, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale),
        ...params,
      }),
    })
  }

  /** 获取游戏盒子详情 */
  static async getBoxDetail(id: number, locale?: string) {
    return request(`${apiEndpoints.boxDetail}/${id}`, {
      method: 'GET',
      params: prepareParams({ 
        locale: getCurrentLocale(locale as any),
      }),
    })
  }

  /** 获取游戏列表 */
  static async getGames(params: GameListParams = {}) {
    return request(apiEndpoints.games, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale),
        ...params,
      }),
    })
  }

  /** 获取游戏详情 */
  static async getGameDetail(id: number, locale?: string) {
    return request(`${apiEndpoints.gameDetail}/${id}`, {
      method: 'GET',
      params: prepareParams({ 
        locale: getCurrentLocale(locale as any),
      }),
      next: { revalidate: 300 }, // 5分钟重新验证
    })
  }

  /** 获取分类列表 */
  static async getCategories(params: CategoryListParams = {}) {
    return request(apiEndpoints.categories, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale),
        ...params,
      }),
    })
  }

  /** 获取分类下的游戏列表 */
  static async getCategoryGames(categoryId: number, params: GameListParams = {}) {
    return request(`${apiEndpoints.categories}/${categoryId}/games`, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale),
        ...params,
      }),
      next: { revalidate: 300 }, // 5分钟重新验证
    })
  }

  /** 获取品类增强详情（包含TOP游戏、礼包、攻略等） */
  static async getCategoryDetail(slug: string, params: { locale?: string; source?: string } = {}) {
    return request(`${apiEndpoints.categories}/${slug}/detail`, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale as any),
        source: params.source,
      }),
      next: { revalidate: 300 }, // 5分钟重新验证
    })
  }

  /** 获取游戏增强详情（包含礼包、攻略、相关游戏等） */
  static async getGameDetailEnhanced(id: number, locale?: string) {
    return request(`${apiEndpoints.gameDetail}/${id}/enhanced`, {
      method: 'GET',
      params: prepareParams({ 
        locale: getCurrentLocale(locale as any),
      }),
      next: { revalidate: 300 }, // 5分钟重新验证
    })
  }

  /** 获取游戏礼包列表 */
  static async getGameGifts(gameId: number, params: { locale?: string } = {}) {
    return request(`/api/public/games/${gameId}/gifts`, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale as any),
      }),
      next: { revalidate: 300 },
    })
  }

  /** 获取游戏攻略列表 */
  static async getGameGuides(gameId: number, params: { pageNum?: number; pageSize?: number; locale?: string } = {}) {
    return request(`/api/public/games/${gameId}/guides`, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale as any),
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10,
      }),
      next: { revalidate: 300 },
    })
  }

  /** 获取品类礼包列表 */
  static async getCategoryGifts(categoryId: number, params: { pageNum?: number; pageSize?: number; locale?: string } = {}) {
    return request(`/api/public/categories/${categoryId}/gifts`, {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale as any),
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 20,
      }),
      next: { revalidate: 300 },
    })
  }

  /** 搜索文章 */
  static async searchArticles(keyword: string, params: { pageNum?: number; pageSize?: number; locale?: string } = {}) {
    return request(apiEndpoints.searchArticles, {
      method: 'GET',
      params: prepareParams({
        keyword,
        locale: getCurrentLocale(params.locale as any),
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 20,
      }),
    })
  }

  /** 搜索游戏 */
  static async searchGames(keyword: string, params: { pageNum?: number; pageSize?: number; locale?: string } = {}) {
    return request(apiEndpoints.searchGames, {
      method: 'GET',
      params: prepareParams({
        keyword,
        locale: getCurrentLocale(params.locale as any),
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 20,
      }),
    })
  }

  /** 获取网站配置信息（所有页面共用，支持CDN缓存） */
  static async getSiteConfig(params: { locale?: string } = {}) {
    return request('/api/public/site-config', {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale as any),
      }),
      // 前端也可以缓存，减少请求
      next: { revalidate: 300 } // 5分钟缓存
    })
  }

  /** 获取首页数据（统一接口） */
  static async getHomeData(params: { 
    locale?: string
    strategyCount?: number
    hotGamesCount?: number
    articleCount?: number
  } = {}) {
    return request('/api/public/home', {
      method: 'GET',
      params: prepareParams({
        locale: getCurrentLocale(params.locale as any),
        strategyCount: params.strategyCount || 6,
        hotGamesCount: params.hotGamesCount || 6,
        articleCount: params.articleCount || 6,
      }),
    })
  }
}

export default ApiClient
