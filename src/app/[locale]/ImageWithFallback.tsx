'use client'

import { useState, useEffect, useRef } from 'react'

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  className?: string
  fallbackSrc?: string
}

// 直接读取 Next.js 内部注入的 basePath（与 <Image>、<Link> 使用同一来源）
// 无需在 next.config.js 中额外配置 env，值来自 next.config.js 的 basePath 字段
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''

function resolvePublicPath(path: string): string {
  // 仅对以 / 开头的相对路径拼接 basePath，绝对 URL 不处理
  if (path.startsWith('/') && !path.startsWith('//')) {
    return `${BASE_PATH}${path}`
  }
  return path
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className,
  fallbackSrc = `/images/default-cover.svg`
}: ImageWithFallbackProps) {
  // 验证URL是否有效（应该以 http/https 或 / 开头）
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false
    const trimmed = url.trim()
    return trimmed.startsWith('http://') || 
           trimmed.startsWith('https://') || 
           trimmed.startsWith('/')
  }

  const resolvedFallback = resolvePublicPath(fallbackSrc)
  const getResolved = (s: string | null | undefined) => {
    if (!isValidUrl(s)) return resolvedFallback
    const v = s!.trim()
    // 绝对URL不拼 basePath
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    return resolvePublicPath(v)
  }

  const [imgSrc, setImgSrc] = useState(() => getResolved(src))
  const errorFiredRef = useRef(false)

  // 当 src prop 变化时重置状态
  useEffect(() => {
    errorFiredRef.current = false
    setImgSrc(getResolved(src))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fallbackSrc])

  const handleError = () => {
    if (!errorFiredRef.current) {
      errorFiredRef.current = true
      setImgSrc(resolvedFallback)
    }
  }

  // 使用原生 <img> 以确保 onError 可靠触发（unoptimized: true 已全局设置，无 Next.js Image 优化）
  // fill 效果：position absolute + inset 0，父容器需有 position: relative
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
}
