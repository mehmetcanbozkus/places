"use client"

import { useState } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

interface BlurImageProps {
  src: string
  alt: string
  placeholderSrc?: string
  className?: string
  loading?: "eager" | "lazy"
  sizes?: string
}

export function BlurImage({
  src,
  alt,
  placeholderSrc,
  className = "",
  loading = "lazy",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: BlurImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholderSrc && (
        <Image
          src={placeholderSrc}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          className="scale-110 object-cover blur-xl"
        />
      )}

      {/* Skeleton placeholder while loading */}
      {!loaded && !placeholderSrc && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}

      {/* Main image */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
