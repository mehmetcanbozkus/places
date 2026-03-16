"use client"

import { useState, useEffect, useCallback } from "react"

export interface RecentSearch {
  placeId: string
  label: string
  timestamp: number
}

const STORAGE_KEY = "recent-searches"
const MAX_ITEMS = 6

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSearches(JSON.parse(stored))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const persist = useCallback((items: RecentSearch[]) => {
    setSearches(items)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore
    }
  }, [])

  const addSearch = useCallback(
    (placeId: string, label: string) => {
      const filtered = searches.filter((s) => s.placeId !== placeId)
      const next = [
        { placeId, label, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS)
      persist(next)
    },
    [searches, persist]
  )

  const removeSearch = useCallback(
    (placeId: string) => {
      persist(searches.filter((s) => s.placeId !== placeId))
    },
    [searches, persist]
  )

  const clearAll = useCallback(() => {
    persist([])
  }, [persist])

  return { searches, addSearch, removeSearch, clearAll }
}
