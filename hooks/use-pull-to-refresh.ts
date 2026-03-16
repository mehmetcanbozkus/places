"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPull?: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 140,
}: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return
      const diff = e.touches[0].clientY - startY.current
      if (diff < 0) {
        isPulling.current = false
        setPullDistance(0)
        return
      }
      // Diminishing returns as you pull further
      const distance = Math.min(diff * 0.5, maxPull)
      setPullDistance(distance)
    }

    const onTouchEnd = () => {
      if (!isPulling.current) return
      isPulling.current = false
      if (pullDistance >= threshold) {
        handleRefresh()
      } else {
        setPullDistance(0)
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [isRefreshing, pullDistance, threshold, maxPull, handleRefresh])

  return { pullDistance, isRefreshing }
}
