"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface BlurImageProps {
  src: string
  alt: string
  placeholderSrc?: string
  className?: string
  loading?: "eager" | "lazy"
}

export function BlurImage({
  src,
  alt,
  placeholderSrc,
  className = "",
  loading = "lazy",
}: BlurImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
        />
      )}

      {/* Skeleton placeholder while loading */}
      {!loaded && !placeholderSrc && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}

      {/* Main image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={`relative h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
