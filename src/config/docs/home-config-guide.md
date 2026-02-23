# 首页配置系统使用指南

## 概述

首页配置系统实现了UI与数据的分离，允许通过配置文件或API动态调整首页内容，无需修改代码。

## 架构设计

### 1. 配置层 (`lib/home-config.ts`)
- 定义首页UI配置的TypeScript类型
- 提供默认配置
- 支持从后端API动态加载配置

### 2. 数据层 (`lib/home-data.ts`)
- 从后端API获取文章、游戏等实际内容数据
- 与配置层分离，专注于数据获取
- 支持可配置的数据数量

### 3. 展示层 (`app/page.tsx`)
- 消费配置和数据
- 纯展示组件，不包含硬编码内容

## 配置项说明

### Hero区域配置 (`HeroConfig`)

```typescript
{
  badge: string              // 顶部徽章文本
  title: string              // 主标题
  highlightText: string      // 高亮词（渐变色）
  description: string[]      // 描述文本（数组支持多行）
  primaryButton: {           // 主按钮
    text: string
    href: string
  }
  secondaryButton: {         // 次要按钮
    text: string
    href: string
  }
}
```

**示例：**
```typescript
hero: {
  badge: '2025 全网游戏盒子聚合平台',
  title: '发现最划算的',
  highlightText: '游戏折扣',
  description: [
    '汇集 50+ 主流游戏盒子，一键对比首充续充折扣。',
    '不花冤枉钱，玩转最强福利版。',
  ],
  primaryButton: {
    text: '浏览盒子大全',
    href: '/boxes',
  },
  secondaryButton: {
    text: '查看游戏攻略',
    href: '/strategy',
  },
}
```

### 统计数据配置 (`StatItem[]`)

```typescript
{
  label: string    // 标签文本
  value: string    // 数值显示
  icon: string     // 图标名称（Lucide图标）
}
```

**支持的图标：**
- `Download` - 下载图标
- `Flame` - 火焰图标
- `BookOpen` - 书本图标
- `Gift` - 礼物图标

**示例：**
```typescript
stats: [
  { label: '收录盒子', value: '50+', icon: 'Download' },
  { label: '覆盖游戏', value: '10W+', icon: 'Flame' },
  { label: '日更攻略', value: '200+', icon: 'BookOpen' },
  { label: '累计省钱', value: '¥5000W', icon: 'Gift' },
]
```

### 内容区块配置 (`SectionConfig`)

```typescript
{
  title: string              // 区块标题
  description: string        // 区块描述
  moreLink?: {              // 可选的"查看更多"链接
    text: string
    href: string
  }
  badge?: string            // 卡片徽章文本
  layout?: string           // 布局类型
}
```

**示例：**
```typescript
sections: {
  strategy: {
    title: '最新游戏攻略',
    description: '深度的游戏解析，帮你快速上手',
    moreLink: {
      text: '全部攻略',
      href: '/strategy',
    },
    badge: '攻略',
    layout: 'grid-3',
  },
  pojie: {
    title: '热门破解游戏',
    description: '超低折扣，限时福利版本',
    moreLink: {
      text: '更多游戏',
      href: '/games',
    },
    badge: '0.1折',
    layout: 'grid-6',
  },
}
```

### 元数据配置

```typescript
{
  title: string        // 页面SEO标题
  description: string  // 页面SEO描述
}
```

## 使用方式

### 方式一：修改默认配置（本地）

编辑 `lib/home-config.ts` 中的 `DEFAULT_HOME_CONFIG`：

```typescript
export const DEFAULT_HOME_CONFIG: HomePageConfig = {
  hero: {
    badge: '你的徽章文本',
    title: '你的标题',
    // ... 其他配置
  },
  // ...
}
```

### 方式二：通过后端API动态加载（推荐）

1. **创建后端API接口：**

在后端实现 `/api/config/homepage` 接口，返回配置JSON：

```json
{
  "hero": {
    "badge": "2025 全网游戏盒子聚合平台",
    "title": "发现最划算的",
    "highlightText": "游戏折扣",
    "description": [
      "汇集 50+ 主流游戏盒子，一键对比首充续充折扣。",
      "不花冤枉钱，玩转最强福利版。"
    ],
    "primaryButton": {
      "text": "浏览盒子大全",
      "href": "/boxes"
    },
    "secondaryButton": {
      "text": "查看游戏攻略",
      "href": "/strategy"
    }
  },
  "stats": [
    { "label": "收录盒子", "value": "50+", "icon": "Download" }
  ],
  "sections": {
    "strategy": {
      "title": "最新游戏攻略",
      "description": "深度的游戏解析，帮你快速上手",
      "moreLink": { "text": "全部攻略", "href": "/strategy" },
      "badge": "攻略",
      "layout": "grid-3"
    }
  }
}
```

2. **修改 `getHomePageConfig` 函数：**

```typescript
export async function getHomePageConfig(): Promise<HomePageConfig> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/config/homepage`, {
      next: { revalidate: 3600 } // 1小时缓存
    })
    
    if (response.ok) {
      const config = await response.json()
      // 合并后端配置和默认配置
      return { ...DEFAULT_HOME_CONFIG, ...config }
    }
    
    return DEFAULT_HOME_CONFIG
  } catch (error) {
    console.error('获取首页配置失败，使用默认配置:', error)
    return DEFAULT_HOME_CONFIG
  }
}
```

## 数据获取配置

在 `page.tsx` 中，可以配置每个区块显示的数据数量：

```typescript
const [config, { strategyArticles, pojieGames, articles }] = await Promise.all([
  getHomePageConfig(),
  getHomeData({
    strategyCount: 6,    // 攻略文章数量
    pojieCount: 6,       // 破解游戏数量
    articleCount: 6,     // 资讯文章数量
  }),
])
```

## 优势

1. **数据与UI分离：** 配置和内容数据分别管理
2. **类型安全：** 完整的TypeScript类型定义
3. **灵活配置：** 支持本地配置和远程API
4. **易于维护：** 修改文案无需改动UI代码
5. **SEO友好：** 支持动态生成metadata
6. **缓存优化：** 支持ISR增量静态再生成

## 扩展建议

### 1. 添加更多配置项

在 `HomePageConfig` 中添加新的配置字段：

```typescript
export interface HomePageConfig {
  // ... 现有配置
  footer?: FooterConfig
  announcement?: AnnouncementConfig
}
```

### 2. 多语言支持

```typescript
export async function getHomePageConfig(locale: string = 'zh-CN'): Promise<HomePageConfig> {
  const response = await fetch(`/api/config/homepage?locale=${locale}`)
  // ...
}
```

### 3. A/B测试

```typescript
export async function getHomePageConfig(variant?: string): Promise<HomePageConfig> {
  const response = await fetch(`/api/config/homepage?variant=${variant}`)
  // ...
}
```

## 注意事项

1. 修改配置后，Next.js会在下次revalidate时自动更新
2. 图标名称必须是Lucide支持的图标
3. 所有链接href需要是有效的路由
4. 描述文本支持数组，每个元素会换行显示
5. Badge文本应该简短，避免过长
