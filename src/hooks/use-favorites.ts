"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "favorites"
const EMPTY: string[] = []

let listeners: (() => void)[] = []
let cachedRaw: string | null = null
let cachedParsed: string[] = EMPTY

function getSnapshot(): string[] {
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

function getServerSnapshot(): string[] {
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

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const toggle = useCallback((placeId: string) => {
    const current = getSnapshot()
    const next = current.includes(placeId)
      ? current.filter((id) => id !== placeId)
      : [...current, placeId]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore
    }
    emitChange()
  }, [])

  const isFavorite = useCallback(
    (placeId: string) => favorites.includes(placeId),
    [favorites]
  )

  return { favorites, toggle, isFavorite, count: favorites.length }
}
