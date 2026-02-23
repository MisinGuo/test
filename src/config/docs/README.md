# 游戏盒子推广站 - 前端项目文档

> **项目定位**：游戏盒子聚合推广网站前端项目（边缘部署）
> 
> **部署方式**：Cloudflare Pages/Workers
> 
> **技术栈**：Next.js 14 + React 18 + Tailwind CSS

---

## 项目简介

本项目是一个基于 Next.js 构建的游戏盒子聚合推广网站，通过 AI 生成的高质量游戏内容获取搜索引擎流量，引导用户对比并选择合适的游戏盒子下载。

### 核心特点

- **SEO 优化**：支持 SSG/ISR 静态生成，确保搜索引擎完整抓取
- **边缘部署**：部署在 Cloudflare 边缘网络，全球加速
- **内容丰富**：支持游戏攻略、破解版、资讯等多类型内容
- **响应式设计**：完美支持 PC 端和移动端 H5

---

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
```

---

## 部署指南

### Cloudflare Pages 部署

1. **连接 Git 仓库**
   - 登录 Cloudflare Dashboard
   - 进入 Pages 页面
   - 点击「Create a project」
   - 选择你的 Git 仓库

2. **配置构建设置**
   ```
   Build command: pnpm build
   Build output directory: .next
   Framework preset: Next.js
   Node version: 18
   ```

3. **环境变量配置**（如需要）
   ```
   NEXT_PUBLIC_API_URL=https://your-api.com
   ```

4. **部署**
   - 点击「Save and Deploy」
   - 等待构建完成

### Cloudflare Workers 部署（使用 OpenNext）

```bash
# 安装 OpenNext
pnpm add -D @opennextjs/cloudflare

# 构建
pnpm build

# 部署
pnpm run deploy
```

---

## 项目结构

```
game-box-web/
├── src/
│   ├── app/              # Next.js App Router 页面
│   │   ├── article/      # 文章详情页
│   │   ├── articles/     # 文章列表页
│   │   ├── boxes/        # 盒子大全
│   │   ├── games/        # 游戏库
│   │   ├── pojie/        # 破解版内容
│   │   ├── strategy/     # 攻略内容
│   │   └── search/       # 搜索页
│   ├── components/       # React 组件
│   ├── config/           # 配置文件
│   ├── docs/             # Markdown 内容文档
│   └── lib/              # 工具函数
├── public/               # 静态资源
└── docs/                 # 项目文档
```

---

## 内容管理

### Markdown 文档

所有内容文档存放在 `src/docs/` 目录下：

- `src/docs/pojie/` - 破解版游戏内容
- `src/docs/strategy/` - 游戏攻略内容
- `src/docs/zh-CN/` - 中文内容

### 文档格式

```markdown
---
title: 文章标题
description: 文章描述
date: 2025-01-01
tags: [标签1, 标签2]
---

# 文章标题

文章内容...
```

---

## 配置说明

### 站点配置

编辑 `src/config/site.ts` 配置站点信息：

```typescript
export const siteConfig = {
  name: "游戏盒子大全",
  description: "游戏盒子推广站",
  url: "https://your-domain.com",
  // ...
}
```

### 模块配置

编辑 `src/config/modules.ts` 配置内容模块。

---

## 技术栈

- **框架**：Next.js 14 (App Router)
- **UI 库**：React 18
- **样式**：Tailwind CSS
- **组件库**：shadcn/ui
- **Markdown**：gray-matter + react-markdown
- **部署**：Cloudflare Pages/Workers

---

## 性能优化

- ✅ 图片懒加载和 Next.js Image 优化
- ✅ 静态生成 (SSG) 和增量静态生成 (ISR)
- ✅ 代码分割和动态导入
- ✅ 边缘网络 CDN 加速

---

## 常见问题

### 如何添加新内容？

在 `src/docs/` 对应目录下创建 Markdown 文件即可。

### 如何修改样式？

修改 `tailwind.config.js` 或组件的 className。

### 如何接入后端 API？

在 `src/lib/` 中创建 API 调用函数，配置 API 地址在环境变量中。

---

## 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
