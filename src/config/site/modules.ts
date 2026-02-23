import type { ModuleConfig, ModuleType } from '../types'

/**
 * 文档模块配置
 * 
 * 每个模块 (special, strategy) 可以有不同的：
 * - 布局和样式
 * - 功能组件 (下载入口、分类过滤器等)
 * - 侧边栏内容
 * - 列表展示方式
 */
export const modules: Record<ModuleType, ModuleConfig> = {
  /**
   * 特价游戏模块
   */
  special: {
    type: 'special',
    title: '特价游戏',
    description: '精选热门手游特价版下载，无限钻石、满V福利、超值优惠',
    // contentPath: 'src/docs/special',  // 已禁用：不再使用本地 docs
    routePrefix: '/special',
    
    theme: {
      primaryColor: 'orange',
      badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      badgeText: '特价版',
    },
    
    // 按游戏分类过滤
    categoryFilter: {
      enabled: true,
      title: '游戏分类',
      type: 'category',
      showCount: true,
    },
    
    // 显示下载入口
    downloadEntry: {
      enabled: true,
      position: 'all',
      buttonText: '立即下载',
      buttonLink: '/boxes',
      buttonStyle: 'gradient',
    },
    
    sidebar: {
      enabled: true,
      showTOC: false,  // 特价版不需要目录
      showRelated: true,
      showDownload: true,  // 显示下载入口
      components: ['DownloadBox', 'DiscountCompare'],
    },
    
    articleList: {
      pageSize: 20,
      showCover: true,
      showExcerpt: false,
      showDate: true,
      showCategory: true,
      showReadingTime: false,
      layout: 'grid',  // 网格布局展示游戏
    },
    
    articleDetail: {
      showBreadcrumb: true,
      showMeta: true,
      showTOC: false,
      showAuthor: false,
      showTags: true,
      showRelated: true,
      showComments: false,
      showShare: false,
    },
  },

  /**
   * 内容中心模块
   */
  content: {
    type: 'content',
    title: '内容中心',
    description: '游戏攻略、资讯、评测和专题',
    contentPath: 'api/articles',
    routePrefix: '/content',
    
    theme: {
      primaryColor: 'green',
      badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
      badgeText: '内容',
    },
    
    categoryFilter: {
      enabled: true,
      title: '内容分类',
      type: 'category',
      showCount: true,
    },
    
    downloadEntry: {
      enabled: true,
      position: 'sidebar',
      buttonText: '查看游戏盒子',
      buttonLink: '/boxes',
      buttonStyle: 'gradient',
    },
    
    sidebar: {
      enabled: true,
      showTOC: true,
      showRelated: true,
      showDownload: true,
      components: ['TOC', 'RelatedArticles', 'Download'],
    },
    
    articleList: {
      layout: 'grid',
      showCover: true,
      showExcerpt: true,
      pageSize: 12,
      showDate: true,
      showCategory: true,
      showReadingTime: false,
    },
    
    articleDetail: {
      showBreadcrumb: true,
      showMeta: true,
      showTOC: true,
      showAuthor: false,
      showTags: false,
      showRelated: false,
      showComments: false,
      showShare: true,
    },
  },
}

/** 获取模块配置 */
export function getModuleConfig(type: ModuleType): ModuleConfig {
  return modules[type]
}

/** 根据路径获取模块配置 */
export function getModuleFromPath(path: string): ModuleConfig | null {
  if (path.startsWith('/special')) {
    return modules.special
  }
  // 向后兼容旧的pojie路径
  if (path.startsWith('/pojie')) {
    return modules.special
  }
  if (path.startsWith('/content')) {
    return modules.content
  }
  return null
}
