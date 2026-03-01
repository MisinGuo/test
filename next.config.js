/** @type {import('next').NextConfig} */

// 自动检测构建环境
const isCloudflareWorkers = process.env.CLOUDFLARE_WORKERS === 'true'
const isWindows = process.platform === 'win32'
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  // 构建模式：智能选择
  // - Cloudflare Workers: 不使用 standalone（由 opennextjs-cloudflare 处理）
  // - 其他环境: 使用 standalone 支持 ISR
  ...(!isCloudflareWorkers && { output: 'standalone' }),

  // 通过环境变量支持反向代理路径前缀（由管理平台代码预览功能注入）
  // 本地开发直接 pnpm dev 时不设置此变量，行为与之前完全一致
  basePath: process.env.NEXT_BASE_PATH || '',
  
  // 文件跟踪：Cloudflare 模式下必须显式设为 false
  // （Next.js 默认值为 true，spread 省略写法无效，必须显式覆盖）
  // Cloudflare 模式下 standalone 写入会在 Windows 尝试创建 symlink 报 EPERM
  outputFileTracing: !isCloudflareWorkers,
  
  // 图片优化配置
  images: {
    unoptimized: true,
  },
  
  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
