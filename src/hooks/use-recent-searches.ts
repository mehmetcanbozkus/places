"use client"

import { useCallback, useSyncExternalStore } from "react"

export interface RecentSearch {
  placeId: string
  label: string
  timestamp: number
}

const STORAGE_KEY = "recent-searches"
const MAX_ITEMS = 6
const EMPTY: RecentSearch[] = []

let listeners: (() => void)[] = []
let cachedRaw: string | null = null
let cachedParsed: RecentSearch[] = EMPTY

function getSnapshot(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== cachedRaw) {
      cachedRaw = raw
      cachedParsed = raw ? JSON.parse(raw) : EMPTY
    }
    return cachedParsed
  } catch {
    return EMPTY
  }
}

function getServerSnapshot(): RecentSearch[] {
  return EMPTY
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.push(onStoreChange)
  return () => {
    listeners = listeners.filter((l) => l !== onStoreChange)
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function persist(items: RecentSearch[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore
  }
  emitChange()
}

export function useRecentSearches() {
  const searches = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const addSearch = useCallback((placeId: string, label: string) => {
    const current = getSnapshot()
    const filtered = current.filter((s) => s.placeId !== placeId)
    const next = [{ placeId, label, timestamp: Date.now() }, ...filtered].slice(
      0,
      MAX_ITEMS
    )
    persist(next)
  }, [])

  const removeSearch = useCallback((placeId: string) => {
    const current = getSnapshot()
    persist(current.filter((s) => s.placeId !== placeId))
  }, [])

  const clearAll = useCallback(() => {
    persist(EMPTY)
  }, [])

  return { searches, addSearch, removeSearch, clearAll }
}
