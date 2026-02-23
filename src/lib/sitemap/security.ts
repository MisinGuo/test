import { sitemapConfig } from '@/config/sitemap/config'

/**
 * 验证请求的 hostname 是否在白名单中
 * 防止内容被盗用（恶意域名解析到我们的服务器）
 */
export function validateHostname(requestUrl: string): string {
  const url = new URL(requestUrl)
  const host = url.host // 包含端口号，如 localhost:3000
  
  // 检查是否在白名单中
  const isAllowed = sitemapConfig.allowedHosts.some(allowedHost => {
    // 精确匹配
    if (host === allowedHost) return true
    
    // 支持通配符子域名（例如 *.example.com）
    if (allowedHost.startsWith('*.')) {
      const domain = allowedHost.slice(2)
      return host.endsWith(domain)
    }
    
    return false
  })
  
  if (!isAllowed) {
    console.warn(`[Security] 未授权的域名访问: ${host}，使用默认域名`)
    return sitemapConfig.defaultHostname
  }
  
  // 返回完整的协议+主机名
  return `${url.protocol}//${url.host}`
}

/**
 * 验证并获取安全的 hostname
 * 这是一个便捷方法，直接从 Request 对象中提取和验证
 */
export function getSecureHostname(request: Request): string {
  return validateHostname(request.url)
}
