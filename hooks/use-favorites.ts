"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "favorites"

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setFavorites(JSON.parse(stored))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const toggle = useCallback((placeId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore
      }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (placeId: string) => favorites.includes(placeId),
    [favorites]
  )

  return { favorites, toggle, isFavorite, count: favorites.length }
}
