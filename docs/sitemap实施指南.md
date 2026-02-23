# Sitemap 实施指南

## 📋 目录

- [概述](#概述)
- [业界最佳实践](#业界最佳实践)
- [架构设计](#架构设计)
- [实施步骤](#实施步骤)
- [代码实现](#代码实现)
- [测试验证](#测试验证)
- [提交搜索引擎](#提交搜索引擎)

---

## 概述

### 为什么需要 Sitemap

Sitemap（站点地图）是一个 XML 文件，列出网站上的所有重要页面，帮助搜索引擎更好地抓取和索引你的网站。对于多语言、大型内容网站尤为重要。

### 项目特点分析

你的 GameBox 项目具有以下特点：
- ✅ **多语言站点**：支持 zh-CN（默认）、zh-TW、en-US
- ✅ **动态内容**：游戏、盒子、攻略文章等
- ✅ **多层路由**：首页、列表页、详情页、分类页等
- ✅ **大量页面**：预计有数百到数千个页面需要索引

---

## 业界最佳实践

### 大型网站 Sitemap 策略

让我们看看业界领先企业如何构建 Sitemap：

#### 1. **Amazon/京东模式**（超大型电商）
```
sitemap.xml (索引文件)
├── sitemap-products-1.xml (商品 1-50000)
├── sitemap-products-2.xml (商品 50001-100000)
├── sitemap-categories.xml (分类页)
└── sitemap-static.xml (静态页面)
```
**特点**：按内容类型和数量分片，单个文件不超过 50000 条 URL

#### 2. **Steam/Epic Games 模式**（游戏平台）
```
sitemap.xml (索引文件)
├── sitemap-games.xml (游戏列表)
├── sitemap-dlc.xml (DLC/扩展)
├── sitemap-news.xml (新闻/攻略)
└── sitemap-pages.xml (静态页面)
```
**特点**：按业务模块划分，清晰的层级结构

#### 3. **Medium/掘金模式**（内容平台）
```
sitemap.xml (索引文件)
├── sitemap-zh-CN.xml (简体中文索引)
│   ├── sitemap-zh-CN-articles-1.xml
│   ├── sitemap-zh-CN-articles-2.xml
│   └── sitemap-zh-CN-static.xml
├── sitemap-en.xml (英文索引)
│   ├── sitemap-en-articles-1.xml
│   └── sitemap-en-static.xml
```
**特点**：按语言分层，每个语言有独立的子索引

### 关键设计原则

1. **分层架构**：主 sitemap → 语言索引 → 内容类型 → 具体 URL
2. **数量限制**：单个 sitemap 文件不超过 50,000 个 URL，大小不超过 50MB
3. **更新频率**：根据内容更新频率设置 `changefreq` 和 `priority`
4. **多语言处理**：使用 `<xhtml:link rel="alternate" hreflang="xx">` 标记
5. **动态生成**：基于数据库内容动态生成，而非静态文件

---

## 架构设计

### 针对 GameBox 的 Sitemap 架构

根据你的项目结构，推荐采用**三层架构**：

```
sitemap.xml (主索引)
├── sitemap-zh-CN.xml (简体中文索引)
│   ├── sitemap-zh-CN-static.xml (静态页面：首页、关于等)
│   ├── sitemap-zh-CN-games.xml (游戏列表和详情)
│   ├── sitemap-zh-CN-boxes.xml (盒子列表和详情)
│   └── sitemap-zh-CN-strategy.xml (攻略文章)
├── sitemap-zh-TW.xml (繁体中文索引)
│   ├── sitemap-zh-TW-static.xml
│   ├── sitemap-zh-TW-games.xml
│   ├── sitemap-zh-TW-boxes.xml
│   └── sitemap-zh-TW-strategy.xml
└── sitemap-en-US.xml (英文索引)
    ├── sitemap-en-US-static.xml
    ├── sitemap-en-US-games.xml
    ├── sitemap-en-US-boxes.xml
    └── sitemap-en-US-strategy.xml
```

### 路由映射表

| 内容类型 | 路由模式 | Sitemap 文件 | 更新频率 | 优先级 |
|---------|---------|-------------|---------|--------|
| 首页 | `/` | static | daily | 1.0 |
| 游戏列表 | `/games` | games | daily | 0.9 |
| 游戏详情 | `/games/[id]` | games | weekly | 0.8 |
| 游戏分类 | `/games/category/[id]` | games | weekly | 0.7 |
| 盒子列表 | `/boxes` | boxes | daily | 0.9 |
| 盒子详情 | `/boxes/[id]` | boxes | weekly | 0.8 |
| 盒子下载页 | `/boxes/[id]/download` | boxes | weekly | 0.7 |
| 攻略列表 | `/strategy` | strategy | daily | 0.8 |
| 攻略详情 | `/strategy/[slug]` | strategy | monthly | 0.7 |
| 搜索页 | `/search` | - | noindex | - |

### 多语言 URL 示例

```xml
<!-- 简体中文（默认，无前缀） -->
<url>
  <loc>https://gamebox.example.com/games/123</loc>
  <xhtml:link rel="alternate" hreflang="zh-CN" href="https://gamebox.example.com/games/123"/>
  <xhtml:link rel="alternate" hreflang="zh-TW" href="https://gamebox.example.com/zh-TW/games/123"/>
  <xhtml:link rel="alternate" hreflang="en-US" href="https://gamebox.example.com/en-US/games/123"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://gamebox.example.com/games/123"/>
</url>
```

---

## 实施步骤

### 第一阶段：准备工作（1小时）

#### 1. 安装依赖（可选）

虽然 Next.js 有内置的 sitemap 支持，但为了更灵活的控制，我们可以手动实现：

```bash
# 如果需要 XML 构建工具
npm install fast-xml-parser
```

#### 2. 创建配置文件

在 `src/config/sitemap/` 创建配置：

```typescript
// src/config/sitemap/config.ts
export const sitemapConfig = {
  // 基础配置
  hostname: 'https://gamebox.example.com',
  
  // 单个 sitemap 的最大 URL 数量（Google 限制 50000）
  maxUrlsPerSitemap: 45000,
  
  // 内容类型配置
  contentTypes: {
    static: {
      changefreq: 'daily',
      priority: 1.0,
    },
    games: {
      changefreq: 'weekly',
      priority: 0.8,
    },
    boxes: {
      changefreq: 'weekly',
      priority: 0.8,
    },
    strategy: {
      changefreq: 'monthly',
      priority: 0.7,
    },
  },
  
  // 排除的路由
  excludePatterns: [
    '/search',
    '/api/*',
    '/_next/*',
    '/admin/*',
  ],
}
```

### 第二阶段：实现核心逻辑（3-4小时）

#### 1. 创建 Sitemap 生成器

```
src/lib/sitemap/
├── types.ts           # 类型定义
├── generator.ts       # 核心生成逻辑
├── formatters.ts      # XML 格式化
└── fetchers.ts        # 数据获取
```

#### 2. 实现主 Sitemap

在 `src/app/` 创建路由处理器：

```
src/app/
├── sitemap.xml/
│   └── route.ts       # 主索引
├── sitemap-[locale].xml/
│   └── route.ts       # 语言索引
└── sitemap-[locale]-[type].xml/
    └── route.ts       # 内容类型 sitemap
```

### 第三阶段：数据集成（2-3小时）

#### 1. 连接 API
- 从现有 API 获取游戏、盒子、攻略数据
- 获取每个内容的 ID、slug、更新时间

#### 2. 处理多语言
- 为每个 URL 生成所有语言变体
- 添加 hreflang 标签

### 第四阶段：测试优化（1-2小时）

#### 1. 本地测试
#### 2. 验证 XML 格式
#### 3. 性能优化

---

## 代码实现

### 1. 类型定义

```typescript
// src/lib/sitemap/types.ts
export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  alternates?: {
    locale: string
    href: string
  }[]
}

export interface SitemapConfig {
  hostname: string
  maxUrlsPerSitemap: number
  contentTypes: Record<string, {
    changefreq: string
    priority: number
  }>
}

export type ContentType = 'static' | 'games' | 'boxes' | 'strategy'
```

### 2. 核心生成器

```typescript
// src/lib/sitemap/generator.ts
import { supportedLocales, defaultLocale } from '@/config'
import { sitemapConfig } from '@/config/sitemap/config'
import type { SitemapUrl, ContentType } from './types'

/**
 * 生成主 sitemap 索引
 */
export function generateSitemapIndex(): string {
  const { hostname } = sitemapConfig
  const lastmod = new Date().toISOString()
  
  const localesSitemaps = supportedLocales.map(locale => {
    const localePrefix = locale === defaultLocale ? '' : `/${locale}`
    return `
    <sitemap>
      <loc>${hostname}/sitemap-${locale}.xml</loc>
      <lastmod>${lastmod}</lastmod>
    </sitemap>`
  }).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${localesSitemaps}
</sitemapindex>`
}

/**
 * 生成语言索引
 */
export function generateLocaleIndex(locale: string): string {
  const { hostname } = sitemapConfig
  const lastmod = new Date().toISOString()
  const contentTypes: ContentType[] = ['static', 'games', 'boxes', 'strategy']
  
  const typeSitemaps = contentTypes.map(type => `
    <sitemap>
      <loc>${hostname}/sitemap-${locale}-${type}.xml</loc>
      <lastmod>${lastmod}</lastmod>
    </sitemap>`
  ).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${typeSitemaps}
</sitemapindex>`
}

/**
 * 生成内容类型 sitemap
 */
export function generateContentSitemap(
  urls: SitemapUrl[],
  locale: string,
  type: ContentType
): string {
  const urlsXml = urls.map(url => formatSitemapUrl(url)).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urlsXml}
</urlset>`
}

/**
 * 格式化单个 URL
 */
function formatSitemapUrl(url: SitemapUrl): string {
  const alternates = url.alternates?.map(alt => 
    `<xhtml:link rel="alternate" hreflang="${alt.locale}" href="${alt.href}"/>`
  ).join('\n    ') || ''
  
  return `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
    ${alternates}
  </url>`
}

/**
 * 生成多语言 URL 变体
 */
export function generateAlternateUrls(
  path: string,
  hostname: string
): { locale: string; href: string }[] {
  return supportedLocales.map(locale => {
    const localePrefix = locale === defaultLocale ? '' : `/${locale}`
    return {
      locale,
      href: `${hostname}${localePrefix}${path}`
    }
  })
}
```

### 3. 数据获取器

```typescript
// src/lib/sitemap/fetchers.ts
import { api } from '@/lib/api'
import type { SitemapUrl, ContentType } from './types'
import { sitemapConfig } from '@/config/sitemap/config'
import { generateAlternateUrls } from './generator'

const { hostname, contentTypes } = sitemapConfig

/**
 * 获取静态页面 URLs
 */
export async function fetchStaticUrls(locale: string): Promise<SitemapUrl[]> {
  const staticPaths = [
    '/',
    '/games',
    '/boxes',
    '/strategy',
  ]
  
  const config = contentTypes.static
  const localePrefix = locale === 'zh-CN' ? '' : `/${locale}`
  
  return staticPaths.map(path => ({
    loc: `${hostname}${localePrefix}${path}`,
    lastmod: new Date().toISOString(),
    changefreq: config.changefreq as any,
    priority: config.priority,
    alternates: generateAlternateUrls(path, hostname),
  }))
}

/**
 * 获取游戏 URLs
 */
export async function fetchGameUrls(locale: string): Promise<SitemapUrl[]> {
  try {
    // 从 API 获取所有游戏
    const response = await api.games.list({
      locale,
      pageNum: 1,
      pageSize: 10000, // 获取所有
    })
    
    const games = response.rows || []
    const config = contentTypes.games
    const localePrefix = locale === 'zh-CN' ? '' : `/${locale}`
    
    const urls: SitemapUrl[] = []
    
    // 游戏详情页
    for (const game of games) {
      const path = `/games/${game.id}`
      urls.push({
        loc: `${hostname}${localePrefix}${path}`,
        lastmod: game.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: config.priority,
        alternates: generateAlternateUrls(path, hostname),
      })
    }
    
    // 游戏分类页
    const categories = await api.games.categories({ locale })
    for (const category of categories.data || []) {
      const path = `/games/category/${category.id}`
      urls.push({
        loc: `${hostname}${localePrefix}${path}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly' as any,
        priority: 0.7,
        alternates: generateAlternateUrls(path, hostname),
      })
    }
    
    return urls
  } catch (error) {
    console.error('Error fetching game URLs:', error)
    return []
  }
}

/**
 * 获取盒子 URLs
 */
export async function fetchBoxUrls(locale: string): Promise<SitemapUrl[]> {
  try {
    const response = await api.boxes.list({
      locale,
      pageNum: 1,
      pageSize: 10000,
    })
    
    const boxes = response.rows || []
    const config = contentTypes.boxes
    const localePrefix = locale === 'zh-CN' ? '' : `/${locale}`
    
    const urls: SitemapUrl[] = []
    
    for (const box of boxes) {
      // 盒子详情页
      const detailPath = `/boxes/${box.id}`
      urls.push({
        loc: `${hostname}${localePrefix}${detailPath}`,
        lastmod: box.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: config.priority,
        alternates: generateAlternateUrls(detailPath, hostname),
      })
      
      // 盒子下载页
      const downloadPath = `/boxes/${box.id}/download`
      urls.push({
        loc: `${hostname}${localePrefix}${downloadPath}`,
        lastmod: box.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: 0.7,
        alternates: generateAlternateUrls(downloadPath, hostname),
      })
    }
    
    return urls
  } catch (error) {
    console.error('Error fetching box URLs:', error)
    return []
  }
}

/**
 * 获取攻略文章 URLs
 */
export async function fetchStrategyUrls(locale: string): Promise<SitemapUrl[]> {
  try {
    const response = await api.articles.list({
      locale,
      pageNum: 1,
      pageSize: 10000,
    })
    
    const articles = response.rows || []
    const config = contentTypes.strategy
    const localePrefix = locale === 'zh-CN' ? '' : `/${locale}`
    
    return articles.map(article => {
      const path = `/strategy/${article.slug || article.id}`
      return {
        loc: `${hostname}${localePrefix}${path}`,
        lastmod: article.updateTime || new Date().toISOString(),
        changefreq: config.changefreq as any,
        priority: config.priority,
        alternates: generateAlternateUrls(path, hostname),
      }
    })
  } catch (error) {
    console.error('Error fetching strategy URLs:', error)
    return []
  }
}

/**
 * 根据类型获取 URLs
 */
export async function fetchUrlsByType(
  locale: string,
  type: ContentType
): Promise<SitemapUrl[]> {
  switch (type) {
    case 'static':
      return fetchStaticUrls(locale)
    case 'games':
      return fetchGameUrls(locale)
    case 'boxes':
      return fetchBoxUrls(locale)
    case 'strategy':
      return fetchStrategyUrls(locale)
    default:
      return []
  }
}
```

### 4. 路由处理器

```typescript
// src/app/sitemap.xml/route.ts
import { NextResponse } from 'next/server'
import { generateSitemapIndex } from '@/lib/sitemap/generator'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1小时重新生成

export async function GET() {
  try {
    const xml = generateSitemapIndex()
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap index:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
```

```typescript
// src/app/sitemap-[locale].xml/route.ts
import { NextResponse } from 'next/server'
import { supportedLocales } from '@/config'
import { generateLocaleIndex } from '@/lib/sitemap/generator'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET(
  request: Request,
  { params }: { params: { locale: string } }
) {
  const { locale } = params
  
  // 验证语言
  if (!supportedLocales.includes(locale as any)) {
    return new NextResponse('Invalid locale', { status: 404 })
  }
  
  try {
    const xml = generateLocaleIndex(locale)
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating locale index:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
```

```typescript
// src/app/sitemap-[locale]-[type].xml/route.ts
import { NextResponse } from 'next/server'
import { supportedLocales } from '@/config'
import { generateContentSitemap } from '@/lib/sitemap/generator'
import { fetchUrlsByType } from '@/lib/sitemap/fetchers'
import type { ContentType } from '@/lib/sitemap/types'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const validTypes: ContentType[] = ['static', 'games', 'boxes', 'strategy']

export async function GET(
  request: Request,
  { params }: { params: { locale: string; type: string } }
) {
  const { locale, type } = params
  
  // 验证参数
  if (!supportedLocales.includes(locale as any)) {
    return new NextResponse('Invalid locale', { status: 404 })
  }
  if (!validTypes.includes(type as ContentType)) {
    return new NextResponse('Invalid content type', { status: 404 })
  }
  
  try {
    // 获取 URLs
    const urls = await fetchUrlsByType(locale, type as ContentType)
    
    // 生成 XML
    const xml = generateContentSitemap(urls, locale, type as ContentType)
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error(`Error generating sitemap for ${locale}-${type}:`, error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
```

### 5. 配置文件

```typescript
// src/config/sitemap/config.ts
import { siteConfig } from '../site/site'

export const sitemapConfig = {
  hostname: siteConfig.hostname,
  maxUrlsPerSitemap: 45000,
  
  contentTypes: {
    static: {
      changefreq: 'daily',
      priority: 1.0,
    },
    games: {
      changefreq: 'weekly',
      priority: 0.8,
    },
    boxes: {
      changefreq: 'weekly',
      priority: 0.8,
    },
    strategy: {
      changefreq: 'monthly',
      priority: 0.7,
    },
  },
  
  excludePatterns: [
    '/search',
    '/api/*',
    '/_next/*',
  ],
}
```

### 6. 更新 middleware（如需要）

```typescript
// src/middleware.ts
// 确保 sitemap 路由不被重定向
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 跳过 sitemap 文件
  if (pathname.includes('sitemap') && pathname.endsWith('.xml')) {
    return NextResponse.next()
  }
  
  // ... 其他现有逻辑
}
```

---

## 测试验证

### 1. 本地测试

启动开发服务器后，访问以下 URL 进行测试：

```bash
# 启动服务器
npm run dev

# 测试 URL
http://localhost:3000/sitemap.xml                      # 主索引
http://localhost:3000/sitemap-zh-CN.xml                # 简体中文索引
http://localhost:3000/sitemap-zh-CN-games.xml          # 简体游戏sitemap
http://localhost:3000/sitemap-zh-CN-boxes.xml          # 简体盒子sitemap
http://localhost:3000/sitemap-zh-CN-strategy.xml       # 简体攻略sitemap
http://localhost:3000/sitemap-zh-TW.xml                # 繁体中文索引
http://localhost:3000/sitemap-en-US.xml                # 英文索引
```

### 2. XML 格式验证

使用在线工具验证 XML 格式：
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Google Search Console - Sitemap Report](https://search.google.com/search-console)

### 3. 检查清单

- [ ] 所有 sitemap 文件都能正常访问
- [ ] XML 格式正确，没有语法错误
- [ ] URL 都是绝对路径（包含完整域名）
- [ ] 多语言 hreflang 标签正确
- [ ] changefreq 和 priority 设置合理
- [ ] 单个文件 URL 数量不超过 50,000
- [ ] 文件大小不超过 50MB
- [ ] lastmod 时间格式正确（ISO 8601）

### 4. 性能测试

```bash
# 测试生成时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/sitemap.xml

# curl-format.txt 内容：
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_total:  %{time_total}\n
```

目标：
- 主索引：< 1秒
- 语言索引：< 1秒
- 内容sitemap：< 5秒

---

## 提交搜索引擎

### 1. Google Search Console

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 添加网站属性（如未添加）
3. 进入 "索引" > "站点地图"
4. 提交主 sitemap：`https://yourdomain.com/sitemap.xml`
5. Google 会自动发现和抓取子 sitemap

### 2. Bing Webmaster Tools

1. 访问 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 添加网站（如未添加）
3. 进入 "站点地图"
4. 提交：`https://yourdomain.com/sitemap.xml`

### 3. 其他搜索引擎

- **Yandex**：[Yandex Webmaster](https://webmaster.yandex.com/)
- **Baidu**：[百度站长平台](https://ziyuan.baidu.com/)
- **Naver**（韩国）：[Naver Webmaster Tools](https://searchadvisor.naver.com/)

### 4. robots.txt

在 `public/robots.txt` 中添加 sitemap 引用：

```txt
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

---

## 进阶优化

### 1. 图片 Sitemap

如果游戏/盒子有大量图片，可以添加图片 sitemap：

```xml
<url>
  <loc>https://yourdomain.com/games/123</loc>
  <image:image>
    <image:loc>https://yourdomain.com/images/game-123.jpg</image:loc>
    <image:caption>游戏标题</image:caption>
  </image:image>
</url>
```

### 2. 视频 Sitemap

如果有游戏视频，可以添加视频 sitemap：

```xml
<url>
  <loc>https://yourdomain.com/games/123</loc>
  <video:video>
    <video:thumbnail_loc>https://yourdomain.com/thumb.jpg</video:thumbnail_loc>
    <video:title>游戏预告片</video:title>
    <video:description>游戏介绍视频</video:description>
  </video:video>
</url>
```

### 3. 新闻 Sitemap

如果攻略文章属于新闻类，可以使用新闻 sitemap 格式：

```xml
<url>
  <loc>https://yourdomain.com/strategy/new-game-guide</loc>
  <news:news>
    <news:publication>
      <news:name>GameBox</news:name>
      <news:language>zh-CN</news:language>
    </news:publication>
    <news:publication_date>2025-01-15T10:00:00+00:00</news:publication_date>
    <news:title>新游戏攻略</news:title>
  </news:news>
</url>
```

### 4. 增量更新

对于频繁更新的内容，可以实现增量 sitemap：

```typescript
// 生成最近更新的内容
export async function fetchRecentUpdates(days = 7): Promise<SitemapUrl[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  
  // 获取最近更新的内容
  const recentGames = await api.games.list({
    updatedSince: since.toISOString(),
  })
  
  // ... 生成 URLs
}
```

### 5. 缓存策略

使用 Redis 或其他缓存来提高性能：

```typescript
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function getCachedSitemap(key: string) {
  const cached = await redis.get(key)
  if (cached) return cached
  
  const sitemap = await generateSitemap()
  await redis.setex(key, 3600, sitemap) // 缓存1小时
  
  return sitemap
}
```

---

## 监控和维护

### 1. 定期检查

- 每周检查 Google Search Console 的索引状态
- 关注覆盖率报告和错误
- 检查 sitemap 文件的抓取情况

### 2. 性能监控

```typescript
// 添加日志
console.log(`Generated sitemap for ${locale}-${type}: ${urls.length} URLs`)
console.log(`Generation time: ${Date.now() - startTime}ms`)
```

### 3. 错误处理

```typescript
export async function generateSitemapWithFallback(
  locale: string,
  type: ContentType
) {
  try {
    return await generateContentSitemap(locale, type)
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    // 返回基础版本或缓存版本
    return getCachedSitemap(`${locale}-${type}`)
  }
}
```

### 4. 自动化测试

```typescript
// tests/sitemap.test.ts
import { describe, it, expect } from 'vitest'
import { generateSitemapIndex } from '@/lib/sitemap/generator'

describe('Sitemap Generation', () => {
  it('should generate valid sitemap index', async () => {
    const xml = generateSitemapIndex()
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<sitemapindex')
    expect(xml).toContain('sitemap-zh-CN.xml')
  })
  
  it('should include all supported locales', async () => {
    const xml = generateSitemapIndex()
    expect(xml).toContain('sitemap-zh-CN.xml')
    expect(xml).toContain('sitemap-zh-TW.xml')
    expect(xml).toContain('sitemap-en-US.xml')
  })
})
```

---

## 总结

### 实施时间估计

| 阶段 | 预计时间 | 关键任务 |
|------|---------|---------|
| 准备工作 | 1小时 | 创建配置文件、目录结构 |
| 核心逻辑 | 3-4小时 | 实现生成器、格式化器 |
| 数据集成 | 2-3小时 | 连接 API、处理多语言 |
| 测试优化 | 1-2小时 | 本地测试、格式验证 |
| **总计** | **7-10小时** | |

### 关键收益

- ✅ **SEO提升**：帮助搜索引擎快速索引所有页面
- ✅ **多语言支持**：正确标记语言变体，避免重复内容问题
- ✅ **可扩展**：模块化设计，易于添加新内容类型
- ✅ **高性能**：缓存和分片策略，确保快速响应
- ✅ **易维护**：清晰的代码结构，便于后续更新

### 下一步行动

1. **立即开始**：按照步骤创建文件和目录
2. **分阶段实施**：先实现主 sitemap，再完善细节
3. **持续优化**：根据搜索引擎反馈调整配置
4. **定期监控**：关注索引状态和性能指标

---

## 常见问题 FAQ

### Q1: 为什么要分这么多层？
**A**: 大型网站单个 sitemap 文件会非常大，分层可以：
- 提高加载速度
- 方便搜索引擎抓取
- 便于维护和调试
- 符合 Google 的最佳实践

### Q2: 多久更新一次 sitemap？
**A**: 
- 静态页面：每日更新
- 动态内容：根据更新频率，每小时到每周
- 使用 Next.js 的 revalidate 可以自动更新

### Q3: 简体中文（默认语言）的 URL 要不要加前缀？
**A**: 不需要，你的项目中 zh-CN 是默认语言，URL 无前缀（如 `/games/123`），其他语言有前缀（如 `/zh-TW/games/123`）。

### Q4: 需要为每个页面都生成 sitemap 吗？
**A**: 不需要，以下页面通常不包含在 sitemap：
- 搜索结果页
- 登录/注册页
- API 路由
- 管理后台
- 404 页面

### Q5: 如何确保 sitemap 不会太大？
**A**: 
- 单个文件限制 45,000 个 URL
- 超过时自动分片（如 sitemap-zh-CN-games-1.xml, sitemap-zh-CN-games-2.xml）
- 压缩 sitemap 文件（.xml.gz）

### Q6: 提交后多久能看到效果？
**A**: 
- Google：通常 1-7 天开始索引
- Bing：3-14 天
- 百度：1-4 周
- 可以在各搜索引擎的 Webmaster Tools 中查看索引进度

---

## 参考资源

- [Google Sitemap 协议](https://www.sitemaps.org/protocol.html)
- [Google Search Central - Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Next.js Sitemap Generation](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps)
- [Vercel SEO 最佳实践](https://vercel.com/docs/concepts/functions/edge-functions/edge-functions-seo)
- [国际化 SEO 指南](https://developers.google.com/search/docs/specialty/international/localized-versions)

---

**文档版本**: v1.0  
**创建日期**: 2025-01-18  
**适用项目**: GameBox Next.js 多语言游戏平台
