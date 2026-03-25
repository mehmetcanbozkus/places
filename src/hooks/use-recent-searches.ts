"use client"

import { useCallback, useSyncExternalStore } from "react"
import { createLocalStorageStore } from "./use-local-storage-store"

export interface RecentSearch {
  placeId: string
  label: string
  timestamp: number
}

const MAX_ITEMS = 6
const store = createLocalStorageStore<RecentSearch[]>("recent-searches", [])

export function useRecentSearches() {
  const searches = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )

  const addSearch = useCallback((placeId: string, label: string) => {
    const current = store.getSnapshot()
    const filtered = current.filter((s) => s.placeId !== placeId)
    const next = [
      { placeId, label, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS)
    store.set(next)
  }, [])

  const removeSearch = useCallback((placeId: string) => {
    const current = store.getSnapshot()
    store.set(current.filter((s) => s.placeId !== placeId))
  }, [])

  const clearAll = useCallback(() => {
    store.set([])
  }, [])

  return { searches, addSearch, removeSearch, clearAll }
}
