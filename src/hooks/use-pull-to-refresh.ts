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
  const pullDistanceRef = useRef(0)
  const isRefreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const handleRefresh = useCallback(async () => {
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      await onRefreshRef.current()
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
      pullDistanceRef.current = 0
      setPullDistance(0)
    }
  }, [])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshingRef.current) return
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshingRef.current) return
      const diff = e.touches[0].clientY - startY.current
      if (diff < 0) {
        isPulling.current = false
        pullDistanceRef.current = 0
        setPullDistance(0)
        return
      }
      const distance = Math.min(diff * 0.5, maxPull)
      pullDistanceRef.current = distance
      setPullDistance(distance)
    }

    const onTouchEnd = () => {
      if (!isPulling.current) return
      isPulling.current = false
      if (pullDistanceRef.current >= threshold) {
        handleRefresh()
      } else {
        pullDistanceRef.current = 0
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
  }, [threshold, maxPull, handleRefresh])

  return { pullDistance, isRefreshing }
}
