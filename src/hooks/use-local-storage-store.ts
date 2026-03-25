export function createLocalStorageStore<T>(key: string, defaultValue: T) {
  let listeners: (() => void)[] = []
  let cachedRaw: string | null = null
  let cachedParsed: T = defaultValue

  function getSnapshot(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== cachedRaw) {
        cachedRaw = raw
        cachedParsed = raw ? JSON.parse(raw) : defaultValue
      }
      return cachedParsed
    } catch {
      return defaultValue
    }
  }

  function getServerSnapshot(): T {
    return defaultValue
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

  function set(value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore
    }
    emitChange()
  }

  return { getSnapshot, getServerSnapshot, subscribe, set }
}
