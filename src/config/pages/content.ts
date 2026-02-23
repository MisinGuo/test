/**
 * 内容中心配置
 * 路由: /content
 * 说明: 统一管理攻略、资讯、评测等所有内容类型
 */

import type { LocalizedString, SeoMetadata } from '../types/common'

/**
 * 内容板块枚举
 * 用于区分不同类型的内容
 */
export enum ContentSection {
  /** 新手攻略 */
  GUIDE_BEGINNER = 'guide_beginner',
  /** 进阶攻略 */
  GUIDE_ADVANCED = 'guide_advanced',
  /** PVP攻略 */
  GUIDE_PVP = 'guide_pvp',
  /** 阵容攻略 */
  GUIDE_LINEUP = 'guide_lineup',
  /** 养成攻略 */
  GUIDE_DEVELOPMENT = 'guide_development',
  /** 版本更新资讯 */
  NEWS_UPDATE = 'news_update',
  /** 活动资讯 */
  NEWS_EVENT = 'news_event',
  /** 行业动态 */
  NEWS_INDUSTRY = 'news_industry',
  /** 游戏评测 */
  REVIEW = 'review',
  /** 横向对比 */
  COMPARISON = 'comparison',
  /** 专题合集 */
  TOPIC = 'topic',
}

/**
 * 内容类型分组
 */
export const ContentGroups = {
  guides: [
    ContentSection.GUIDE_BEGINNER,
    ContentSection.GUIDE_ADVANCED,
    ContentSection.GUIDE_PVP,
    ContentSection.GUIDE_LINEUP,
    ContentSection.GUIDE_DEVELOPMENT,
  ],
  news: [
    ContentSection.NEWS_UPDATE,
    ContentSection.NEWS_EVENT,
    ContentSection.NEWS_INDUSTRY,
  ],
  reviews: [
    ContentSection.REVIEW,
    ContentSection.COMPARISON,
  ],
  topics: [
    ContentSection.TOPIC,
  ],
} as const

/**
 * 板块显示配置
 */
export const sectionConfig: Record<ContentSection, {
  label: LocalizedString
  description: LocalizedString
  icon: string
  color: string
}> = {
  [ContentSection.GUIDE_BEGINNER]: {
    label: {
      'zh-CN': '新手攻略',
      'zh-TW': '新手攻略',
      'en-US': 'Beginner Guide',
    },
    description: {
      'zh-CN': '从零开始,快速入门',
      'zh-TW': '從零開始,快速入門',
      'en-US': 'Start from scratch, quick start',
    },
    icon: '🎮',
    color: '#10b981',
  },
  [ContentSection.GUIDE_ADVANCED]: {
    label: {
      'zh-CN': '进阶攻略',
      'zh-TW': '進階攻略',
      'en-US': 'Advanced Guide',
    },
    description: {
      'zh-CN': '深度玩法,高阶技巧',
      'zh-TW': '深度玩法,高階技巧',
      'en-US': 'Deep gameplay, advanced tips',
    },
    icon: '🚀',
    color: '#3b82f6',
  },
  [ContentSection.GUIDE_PVP]: {
    label: {
      'zh-CN': 'PVP攻略',
      'zh-TW': 'PVP攻略',
      'en-US': 'PVP Guide',
    },
    description: {
      'zh-CN': '竞技对战,实战技巧',
      'zh-TW': '競技對戰,實戰技巧',
      'en-US': 'Combat tactics, practical skills',
    },
    icon: '⚔️',
    color: '#ef4444',
  },
  [ContentSection.GUIDE_LINEUP]: {
    label: {
      'zh-CN': '阵容攻略',
      'zh-TW': '陣容攻略',
      'en-US': 'Team Composition',
    },
    description: {
      'zh-CN': '最强阵容,角色搭配',
      'zh-TW': '最強陣容,角色搭配',
      'en-US': 'Best teams, character synergy',
    },
    icon: '👥',
    color: '#8b5cf6',
  },
  [ContentSection.GUIDE_DEVELOPMENT]: {
    label: {
      'zh-CN': '养成攻略',
      'zh-TW': '養成攻略',
      'en-US': 'Development Guide',
    },
    description: {
      'zh-CN': '角色培养,资源规划',
      'zh-TW': '角色培養,資源規劃',
      'en-US': 'Character development, resource planning',
    },
    icon: '📈',
    color: '#f59e0b',
  },
  [ContentSection.NEWS_UPDATE]: {
    label: {
      'zh-CN': '版本更新',
      'zh-TW': '版本更新',
      'en-US': 'Version Update',
    },
    description: {
      'zh-CN': '最新版本,更新内容',
      'zh-TW': '最新版本,更新內容',
      'en-US': 'Latest version, update notes',
    },
    icon: '🆕',
    color: '#06b6d4',
  },
  [ContentSection.NEWS_EVENT]: {
    label: {
      'zh-CN': '活动资讯',
      'zh-TW': '活動資訊',
      'en-US': 'Events',
    },
    description: {
      'zh-CN': '限时活动,福利资讯',
      'zh-TW': '限時活動,福利資訊',
      'en-US': 'Limited events, rewards',
    },
    icon: '🎉',
    color: '#ec4899',
  },
  [ContentSection.NEWS_INDUSTRY]: {
    label: {
      'zh-CN': '行业动态',
      'zh-TW': '行業動態',
      'en-US': 'Industry News',
    },
    description: {
      'zh-CN': '游戏行业,最新动态',
      'zh-TW': '遊戲行業,最新動態',
      'en-US': 'Gaming industry, latest news',
    },
    icon: '📰',
    color: '#64748b',
  },
  [ContentSection.REVIEW]: {
    label: {
      'zh-CN': '游戏评测',
      'zh-TW': '遊戲評測',
      'en-US': 'Game Review',
    },
    description: {
      'zh-CN': '深度评测,全面分析',
      'zh-TW': '深度評測,全面分析',
      'en-US': 'In-depth review, comprehensive analysis',
    },
    icon: '⭐',
    color: '#f97316',
  },
  [ContentSection.COMPARISON]: {
    label: {
      'zh-CN': '横向对比',
      'zh-TW': '橫向對比',
      'en-US': 'Comparison',
    },
    description: {
      'zh-CN': '游戏对比,优劣分析',
      'zh-TW': '遊戲對比,優劣分析',
      'en-US': 'Game comparison, pros and cons',
    },
    icon: '🔄',
    color: '#14b8a6',
  },
  [ContentSection.TOPIC]: {
    label: {
      'zh-CN': '专题合集',
      'zh-TW': '專題合集',
      'en-US': 'Special Topic',
    },
    description: {
      'zh-CN': '主题专题,精选合集',
      'zh-TW': '主題專題,精選合集',
      'en-US': 'Themed topics, featured collections',
    },
    icon: '📚',
    color: '#a855f7',
  },
}

/**
 * 内容页面配置
 */
export interface ContentPageConfig {
  // Hero区域
  hero: {
    title: LocalizedString
    description: LocalizedString
    badge: LocalizedString
  }
  
  // 板块导航
  sections: {
    enabled: boolean
    showAll: boolean  // 是否显示"全部"选项
  }
  
  // 筛选器
  filter: {
    enabled: boolean
    filters: Array<{
      key: string
      label: LocalizedString
      type: 'select' | 'checkbox'
      options: Array<{
        label: LocalizedString
        value: string
      }>
    }>
  }
  
  // 排序
  sort: {
    enabled: boolean
    defaultSort: string
    options: Array<{
      label: LocalizedString
      value: string
    }>
  }
  
  // 分页
  pagination: {
    pageSize: number
    showSizeChanger: boolean
    pageSizeOptions: number[]
  }

  // 卡片展示
  card: {
    showCover: boolean
    showCategory: boolean
    showSection: boolean  // 显示板块标签
    showDate: boolean
    showViews: boolean
    showReadingTime: boolean
  }

  // SEO
  seo: SeoMetadata

  // UI文本
  ui: {
    allContent: LocalizedString
    allSections: LocalizedString
    guides: LocalizedString
    news: LocalizedString
    reviews: LocalizedString
    topics: LocalizedString
    latest: LocalizedString
    contentCount: LocalizedString
    viewAll: LocalizedString
    noContent: LocalizedString
    hotLabel: LocalizedString
    viewsLabel: LocalizedString
  }
}

/**
 * 内容列表页配置
 */
export const contentListConfig: ContentPageConfig = {
  hero: {
    title: {
      'zh-CN': '内容中心',
      'zh-TW': '內容中心',
      'en-US': 'Content Center'
    },
    description: {
      'zh-CN': '游戏攻略、资讯评测，助你成为游戏高手',
      'zh-TW': '遊戲攻略、資訊評測，助你成為遊戲高手',
      'en-US': 'Game guides, news and reviews to help you become a gaming expert'
    },
    badge: {
      'zh-CN': '精选内容',
      'zh-TW': '精選內容',
      'en-US': 'Featured'
    }
  },

  sections: {
    enabled: true,
    showAll: true,
  },

  filter: {
    enabled: true,
    filters: [
      {
        key: 'category',
        label: {
          'zh-CN': '游戏品类',
          'zh-TW': '遊戲品類',
          'en-US': 'Category'
        },
        type: 'select',
        options: []  // 动态从API获取
      },
      {
        key: 'difficulty',
        label: {
          'zh-CN': '难度',
          'zh-TW': '難度',
          'en-US': 'Difficulty'
        },
        type: 'select',
        options: [
          {
            label: { 'zh-CN': '新手', 'zh-TW': '新手', 'en-US': 'Beginner' },
            value: 'beginner'
          },
          {
            label: { 'zh-CN': '进阶', 'zh-TW': '進階', 'en-US': 'Advanced' },
            value: 'advanced'
          },
          {
            label: { 'zh-CN': '专家', 'zh-TW': '專家', 'en-US': 'Expert' },
            value: 'expert'
          }
        ]
      }
    ]
  },

  sort: {
    enabled: true,
    defaultSort: 'latest',
    options: [
      {
        label: { 'zh-CN': '最新发布', 'zh-TW': '最新發布', 'en-US': 'Latest' },
        value: 'latest'
      },
      {
        label: { 'zh-CN': '最多浏览', 'zh-TW': '最多瀏覽', 'en-US': 'Most Viewed' },
        value: 'views'
      },
      {
        label: { 'zh-CN': '最多收藏', 'zh-TW': '最多收藏', 'en-US': 'Most Favorited' },
        value: 'favorites'
      }
    ]
  },

  pagination: {
    pageSize: 24,
    showSizeChanger: false,
    pageSizeOptions: [12, 24, 48]
  },

  card: {
    showCover: true,
    showCategory: true,
    showSection: true,
    showDate: true,
    showViews: true,
    showReadingTime: true,
  },

  seo: {
    title: {
      'zh-CN': '内容中心 - 游戏攻略资讯评测',
      'zh-TW': '內容中心 - 遊戲攻略資訊評測',
      'en-US': 'Content Center - Game Guides News Reviews'
    },
    description: {
      'zh-CN': '提供全面的游戏攻略、资讯、评测和专题内容，助你成为游戏高手',
      'zh-TW': '提供全面的遊戲攻略、資訊、評測和專題內容，助你成為遊戲高手',
      'en-US': 'Comprehensive game guides, news, reviews and featured content to help you become a gaming expert'
    },
    keywords: {
      'zh-CN': ['游戏攻略', '游戏资讯', '游戏评测', '新手攻略', '进阶攻略', '游戏新闻'],
      'zh-TW': ['遊戲攻略', '遊戲資訊', '遊戲評測', '新手攻略', '進階攻略', '遊戲新聞'],
      'en-US': ['game guide', 'game news', 'game review', 'beginner guide', 'advanced guide', 'gaming news']
    }
  },

  ui: {
    allContent: {
      'zh-CN': '全部内容',
      'zh-TW': '全部內容',
      'en-US': 'All Content'
    },
    allSections: {
      'zh-CN': '全部板块',
      'zh-TW': '全部板塊',
      'en-US': 'All Sections'
    },
    guides: {
      'zh-CN': '攻略',
      'zh-TW': '攻略',
      'en-US': 'Guides'
    },
    news: {
      'zh-CN': '资讯',
      'zh-TW': '資訊',
      'en-US': 'News'
    },
    reviews: {
      'zh-CN': '评测',
      'zh-TW': '評測',
      'en-US': 'Reviews'
    },
    topics: {
      'zh-CN': '专题',
      'zh-TW': '專題',
      'en-US': 'Topics'
    },
    latest: {
      'zh-CN': '最新内容',
      'zh-TW': '最新內容',
      'en-US': 'Latest Content'
    },
    contentCount: {
      'zh-CN': '篇内容',
      'zh-TW': '篇內容',
      'en-US': 'items'
    },
    viewAll: {
      'zh-CN': '查看全部',
      'zh-TW': '查看全部',
      'en-US': 'View All'
    },
    noContent: {
      'zh-CN': '暂无内容',
      'zh-TW': '暫無內容',
      'en-US': 'No content available'
    },
    hotLabel: {
      'zh-CN': 'HOT',
      'zh-TW': 'HOT',
      'en-US': 'HOT'
    },
    viewsLabel: {
      'zh-CN': '次浏览',
      'zh-TW': '次瀏覽',
      'en-US': 'views'
    }
  }
}
