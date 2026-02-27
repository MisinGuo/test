'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  className?: string
  fallbackSrc?: string
}

const DEFAULT_FALLBACK = '/images/default-cover.svg'

export default function ImageWithFallback({ 
  src, 
  alt, 
  className,
  fallbackSrc = DEFAULT_FALLBACK
}: ImageWithFallbackProps) {
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false
    const trimmed = url.trim()
    return trimmed.startsWith('http://') || 
           trimmed.startsWith('https://') || 
           trimmed.startsWith('/')
  }

  const initialSrc = isValidUrl(src) ? src! : fallbackSrc
  const [imgSrc, setImgSrc] = useState(initialSrc)
  const [hasError, setHasError] = useState(false)

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
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={className}
      onError={handleError}
      unoptimized
    />
  )
}
