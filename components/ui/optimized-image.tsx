'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
  placeholder,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="relative aspect-video">
      <Image
        src={src}
        alt={alt}
        width={width || 800}
        height={height || 600}
        className={`object-cover ${className}`}
        priority={priority}
        placeholder={placeholder || 'blur'}
        onLoadingComplete={() => setIsLoaded(true)}
        loading={priority ? 'eager' : 'lazy'}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}
