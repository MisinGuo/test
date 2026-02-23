# 配置快速入门指南

## 🚀 5分钟快速配置

### 第一步：修改站点基本信息

打开 `config/site.ts`，修改以下内容：

```typescript
export const siteConfig: SiteConfig = {
  // 1. 修改网站名称
  name: 'GameBox',  // 👈 改成你的网站名称
  
  // 2. 修改网站描述
  description: '汇集 50+ 主流游戏盒子...',  // 👈 改成你的网站描述
  
  // 3. 修改域名
  hostname: 'https://gamebox.example.com',  // 👈 改成你的域名
  
  // 4. 修改Logo和Favicon
  logo: '/logo.svg',  // 👈 放置你的logo文件到 public 目录
  favicon: '/favicon.ico',  // 👈 放置你的favicon文件到 public 目录
}
```

### 第二步：配置后端API地址

打开 `config/backend.ts`，修改API地址：

```typescript
export const backendConfig: BackendConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',  // 👈 改成你的后端地址
}
```

或者在 `.env.local` 中配置：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 第三步：修改首页内容

打开 `config/pages/home.ts`，修改首页配置：

```typescript
export const homeConfig: HomePageConfig = {
  hero: {
    badge: '2025 全网游戏盒子聚合平台',  // 👈 改成你的徽章文本
    title: '发现最划算的',  // 👈 改成你的主标题
    highlightText: '游戏折扣',  // 👈 改成高亮文本
    description: [
      '汇集 50+ 主流游戏盒子，一键对比首充续充折扣。',  // 👈 第一行描述
      '不花冤枉钱，玩转最强福利版。',  // 👈 第二行描述
    ],
    primaryButton: {
      text: '浏览盒子大全',  // 👈 主按钮文本
      href: '/boxes',  // 👈 主按钮链接
    },
  },
  
  // 修改统计数据
  stats: [
    { label: '收录盒子', value: '50+', icon: 'Download' },  // 👈 修改数值
    { label: '覆盖游戏', value: '10W+', icon: 'Flame' },
    { label: '日更攻略', value: '200+', icon: 'BookOpen' },
    { label: '累计省钱', value: '¥5000W', icon: 'Gift' },
  ],
}
```

### 第四步：启动项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 打开浏览器访问
# http://localhost:3000
```

## 📋 完整配置清单

### 必须修改的配置

- [x] `config/site.ts` - 网站名称、域名、Logo
- [x] `config/backend.ts` - API地址
- [x] `config/pages/home.ts` - 首页内容

### 可选修改的配置

- [ ] `config/pages/strategy.ts` - 攻略页配置
- [ ] `config/pages/special.ts` - 特惠游戏页配置
- [ ] `config/pages/games.ts` - 游戏列表页配置
- [ ] `config/pages/boxes.ts` - 盒子列表页配置
- [ ] `config/theme.ts` - 主题颜色配置

## 🎨 常见配置场景

### 场景1：修改网站主题色

打开 `config/theme.ts`：

```typescript
colors: {
  light: {
    primary: '#3b82f6',  // 👈 改成你喜欢的主色
  },
}
```

### 场景2：修改首页统计数字

打开 `config/pages/home.ts`：

```typescript
stats: [
  { label: '收录盒子', value: '100+', icon: 'Download' },  // 👈 修改这里
]
```

### 场景3：修改导航菜单

打开 `config/site.ts`：

```typescript
nav: [
  { text: '首页', link: '/' },
  { text: '游戏', link: '/games' },  // 👈 添加或修改导航项
]
```

### 场景4：修改页面筛选选项

打开 `config/pages/strategy.ts`：

```typescript
filter: {
  enabled: true,
  filters: [
    {
      key: 'category',
      label: '游戏分类',
      type: 'select',
      options: [
        { label: '全部', value: 'all' },
        { label: 'RPG', value: 'rpg' },  // 👈 添加或修改选项
      ],
    },
  ],
}
```

## 🔧 环境变量配置

创建 `.env.local` 文件：

```bash
# 后端API地址
NEXT_PUBLIC_API_URL=http://localhost:8080

# 站点域名
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 其他配置...
```

## 📱 配置验证

修改配置后，检查以下内容：

1. ✅ 页面正常显示
2. ✅ 没有TypeScript类型错误
3. ✅ 没有控制台错误
4. ✅ 链接可以正常跳转
5. ✅ API请求正常

## 🐛 常见问题

### Q: 修改配置后页面没变化？

**解决方案：**
1. 保存文件
2. 等待热更新（几秒钟）
3. 刷新浏览器
4. 如果还不行，重启开发服务器

### Q: TypeScript报错？

**解决方案：**
1. 检查配置项名称是否正确
2. 查看 `config/pages/types.ts` 中的类型定义
3. 确保所有必填字段都有值
4. 运行 `pnpm type-check` 查看详细错误

### Q: 图标不显示？

**解决方案：**
图标名称必须是 [Lucide Icons](https://lucide.dev/) 支持的图标名称：
- `Download` ✅
- `Flame` ✅
- `BookOpen` ✅
- `Gift` ✅

### Q: 页面404？

**解决方案：**
检查 href 链接是否正确：
- `/strategy` ✅
- `/games` ✅
- `strategy` ❌ (缺少开头的 `/`)

## 📚 进阶配置

### 1. 从后端API加载配置

修改 `config/pages/index.ts` 中的函数：

```typescript
export async function getHomePageConfig(): Promise<HomePageConfig> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/config/homepage`,
      { next: { revalidate: 1800 } }
    )
    
    if (response.ok) {
      const result = await response.json()
      return { ...homeConfig, ...result.data }
    }
    
    return homeConfig
  } catch (error) {
    return homeConfig
  }
}
```

### 2. 多语言支持

参考 `config/locales.ts` 配置多语言。

### 3. 主题切换

参考 `config/theme.ts` 配置深色/浅色主题。

## 📞 获取帮助

- 📖 查看详细文档：[config/README.md](./README.md)
- 📖 查看页面配置：[config/pages/README.md](./pages/README.md)
- 📖 完整项目文档：运行 `pnpm docs:dev` 查看 VitePress 文档站点
- 🐛 遇到问题？提交Issue或联系技术支持

## ✨ 配置模板

### 游戏类网站模板

```typescript
// config/pages/home.ts
hero: {
  badge: '2025 最新游戏推荐',
  title: '发现好玩的',
  highlightText: '手机游戏',
  description: ['精选优质手游', '天天都有新发现'],
}
```

### 折扣类网站模板

```typescript
// config/pages/home.ts
hero: {
  badge: '全网最低价',
  title: '省钱就上',
  highlightText: 'GameBox',
  description: ['汇集各大平台折扣', '一站式比价平台'],
}
```

### 攻略类网站模板

```typescript
// config/pages/home.ts
hero: {
  badge: '专业游戏攻略',
  title: '快速通关',
  highlightText: '从这里开始',
  description: ['海量游戏攻略', '助你成为游戏高手'],
}
```

---

**祝你配置顺利！🎉**
