# 构建模式配置说明

## 渲染模式

### SSG (全静态生成)
- **适用场景**: 文章数量少（< 1000篇）
- **优点**: 完全静态，SEO最佳，无需后端
- **缺点**: 构建时间长，更新需要重新构建

**使用方法:**
```bash
# 方式1: 使用脚本
pnpm build:ssg

# 方式2: 环境变量
RENDER_MODE=ssg pnpm build

# 方式3: 修改 build.config.js
renderMode: 'ssg'
```

### ISR (增量静态再生)
- **适用场景**: 文章数量多（> 1000篇）
- **优点**: 构建快，按需生成，可定时更新
- **缺点**: 首次访问慢，需要 Node.js 环境

**使用方法:**
```bash
# 方式1: 使用脚本（默认）
pnpm build:isr

# 方式2: 环境变量
RENDER_MODE=isr pnpm build

# 方式3: 修改 build.config.js
renderMode: 'isr'
```

## 配置文件说明

### build.config.js

```javascript
module.exports = {
  // 渲染模式: 'ssg' | 'isr'
  renderMode: 'isr',

  // SSG 配置
  ssg: {
    generateAllPages: true,    // 生成所有页面
    pageThreshold: 1000,       // 页面阈值
  },

  // ISR 配置
  isr: {
    revalidate: 1800,          // 重新验证时间（30分钟）
    preGeneratePaths: [        // 预生成的路径
      '/',
      '/pojie',
      '/strategy',
    ],
  },

  // 静态资源
  static: {
    generateSitemap: true,     // 生成 sitemap
    generateStats: true,       // 生成统计数据
  },

  // API 配置
  api: {
    baseUrl: 'http://localhost:8080',
    timeout: 10000,
  },
}
```

## 环境变量

### .env.local
```bash
# 渲染模式
RENDER_MODE=isr

# API 地址（构建时使用）
NEXT_PUBLIC_API_URL=http://localhost:8080

# 统计接口（可选）
ANALYTICS_URL=https://analytics.example.com/api/track
```

## 构建产物

### SSG 模式
```
out/
├── index.html           # 首页
├── pojie.html          # 破解版列表
├── pojie/
│   └── [slug].html     # 每篇文章的静态页面
├── strategy.html       # 攻略列表
├── _next/              # Next.js 资源
└── sitemap.xml         # 站点地图
```

### ISR 模式
```
.next/
├── server/
│   └── pages/          # 服务端页面
├── static/             # 静态资源
└── cache/              # ISR 缓存
```

## 部署方式

### SSG - 静态托管
```bash
# 构建
pnpm build:ssg

# 部署到静态托管（Vercel/Netlify/GitHub Pages）
# 上传 out/ 目录即可
```

### ISR - Node.js 环境
```bash
# 构建
pnpm build:isr

# 启动服务器
pnpm start

# 或使用 PM2
pm2 start "pnpm start" --name game-box
```

## 定时构建

### GitHub Actions 示例

```yaml
name: 定时构建

on:
  schedule:
    - cron: '0 0 * * *'  # 每天0点
  workflow_dispatch:      # 手动触发

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build:ssg  # 或 build:isr
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

## 切换模式

### 从 ISR 切换到 SSG
1. 修改 `build.config.js`: `renderMode: 'ssg'`
2. 运行 `pnpm build:ssg`
3. 部署 `out/` 目录到静态托管

### 从 SSG 切换到 ISR
1. 修改 `build.config.js`: `renderMode: 'isr'`
2. 运行 `pnpm build:isr`
3. 运行 `pnpm start` 启动服务器

## 注意事项

1. **SSG 模式**
   - 需要在构建时访问后端 API
   - 不支持动态路由（需要预先知道所有路径）
   - 更新内容需要重新构建

2. **ISR 模式**
   - 首次访问会生成页面（较慢）
   - 需要 Node.js 运行环境
   - 支持动态路由和按需生成

3. **统计接口**
   - 失败时会自动忽略
   - 不影响页面正常显示
   - 建议使用异步加载
