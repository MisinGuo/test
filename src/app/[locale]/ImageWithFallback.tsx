'use client'

import { useState, useEffect } from 'react'

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  className?: string
  fallbackSrc?: string
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className,
  fallbackSrc = '/images/default-cover.svg'
}: ImageWithFallbackProps) {
  // 验证URL是否有效（应该以 http/https 或 / 开头）
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false
    const trimmed = url.trim()
    return trimmed.startsWith('http://') || 
           trimmed.startsWith('https://') || 
           trimmed.startsWith('/')
  }
  
  // 如果 src 无效，直接使用默认图片
  const initialSrc = isValidUrl(src) ? src! : fallbackSrc
  const [imgSrc, setImgSrc] = useState(initialSrc)
  const [hasError, setHasError] = useState(false)

  // 当 src prop 变化时更新图片源
  useEffect(() => {
    const newSrc = isValidUrl(src) ? src! : fallbackSrc
    setImgSrc(newSrc)
    setHasError(false)
  }, [src, fallbackSrc])

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    }
  }

  return (
    <img 
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  )
}
