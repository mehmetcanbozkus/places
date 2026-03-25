"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"
import { createLocalStorageStore } from "./use-local-storage-store"

const store = createLocalStorageStore<string[]>("favorites", [])

export function useFavorites() {
  const favorites = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )

  const favoritesSet = useMemo(() => new Set(favorites), [favorites])

  const toggle = useCallback((placeId: string) => {
    const current = store.getSnapshot()
    const next = current.includes(placeId)
      ? current.filter((id) => id !== placeId)
      : [...current, placeId]
    store.set(next)
  }, [])

  const isFavorite = useCallback(
    (placeId: string) => favoritesSet.has(placeId),
    [favoritesSet]
  )

  return { favorites, toggle, isFavorite, count: favorites.length }
}
