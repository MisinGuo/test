# 数据获取系统重构说明

## 📁 新的文件结构

```
src/
├── lib/
│   └── data-fetcher/
│       ├── types.ts              # 数据获取相关类型（之前在 page-data-schema.ts）
│       └── index.ts              # 数据获取引擎实现
├── config/
│   ├── schemas/
│   │   └── index.ts              # Schema 注册表
│   └── pages/
│       ├── home/
│       │   ├── types.ts          # 首页配置类型
│       │   ├── schema.ts         # 首页数据定义 ✨
│       │   └── index.ts          # 统一导出
│       ├── boxes/
│       │   └── schema.ts         # 盒子列表页数据定义 ✨
│       └── article/
│           └── schema.ts         # 文章详情页数据定义 ✨
```

## 🔄 变更说明

### 之前（❌）
```typescript
// 所有类型和 schema 定义在一个文件
// src/config/page-data-schema.ts (400+ lines)

import { homePageSchema } from '@/config/page-data-schema'
import type { PageDataSchema } from '@/config/page-data-schema'
```

**问题：**
- 类型定义和数据定义混在一起
- 文件过大，难以维护
- 与页面配置分离，查找困难

### 现在（✅）
```typescript
// 类型定义在数据获取引擎目录
// src/lib/data-fetcher/types.ts

// 每个页面的 schema 在对应页面目录
// src/config/pages/home/schema.ts

// 导入更清晰
import { homePageSchema } from '@/config/pages/home/schema'
import type { PageDataSchema } from '@/lib/data-fetcher/types'
```

**优势：**
- ✅ **就近原则** - schema 和配置在同一目录
- ✅ **职责清晰** - 类型在 lib，数据定义在 config
- ✅ **便于维护** - 修改首页只需看 `pages/home/` 目录

## 📖 使用方式

### 引入页面 Schema
```typescript
// 直接从页面目录导入
import { homePageSchema } from '@/config/pages/home/schema'

// 或从注册表导入
import { homePageSchema } from '@/config/schemas'
```

### 引入类型定义
```typescript
// 数据获取相关类型
import type { PageDataSchema, DataSource } from '@/lib/data-fetcher/types'

// 页面配置类型
import type { HomePageConfig } from '@/config/pages/home'
```

## 🎯 迁移清单

- [x] 提取类型定义到 `lib/data-fetcher/types.ts`
- [x] 拆分 schema 到各页面目录
  - [x] `pages/home/schema.ts`
  - [x] `pages/boxes/schema.ts`
  - [x] `pages/article/schema.ts`
- [x] 创建 schema 注册表 `schemas/index.ts`
- [x] 更新所有导入路径
  - [x] `app/[locale]/page.tsx`
  - [x] `lib/data-fetcher.ts`

## 📝 添加新页面 Schema

1. **创建 schema 文件**
```typescript
// src/config/pages/games/schema.ts
import type { PageDataSchema } from '@/lib/data-fetcher/types'

export const gamesPageSchema: PageDataSchema = {
  pageId: 'games',
  pageName: '游戏列表',
  dataSources: {
    // ... 数据源定义
  },
  fields: [
    // ... 字段定义
  ],
}
```

2. **注册到 registry**
```typescript
// src/config/schemas/index.ts
import { gamesPageSchema } from './pages/games/schema'

export const pageSchemaRegistry = {
  // ...
  games: gamesPageSchema,
}
```

3. **使用**
```typescript
import { gamesPageSchema } from '@/config/pages/games/schema'
// 或
import { gamesPageSchema } from '@/config/schemas'
```
