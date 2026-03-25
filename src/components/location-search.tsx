"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatDistance } from "@/lib/geo"
import { motion, AnimatePresence } from "motion/react"
import { Input } from "@/components/ui/input"
import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  Building2,
  Map,
  Clock,
  X,
  Trash2,
} from "lucide-react"
import type { RecentSearch } from "@/hooks/use-recent-searches"

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
  distanceMeters?: number
  fullText: string
  types?: string[]
}

interface LocationSearchProps {
  onSelect: (placeId: string, label: string) => void
  onUseMyLocation?: () => void
  hasGpsLocation: boolean
  isSearchLocation: boolean
  userLatitude?: number
  userLongitude?: number
  recentSearches?: RecentSearch[]
  onRecentSelect?: (placeId: string, label: string) => void
  onRecentRemove?: (placeId: string) => void
  onRecentClear?: () => void
}

function getPlaceIcon(types?: string[]) {
  if (!types) return MapPin
  if (
    types.some((t) =>
      [
        "locality",
        "administrative_area_level_1",
        "country",
        "neighborhood",
      ].includes(t)
    )
  )
    return Map
  if (
    types.some((t) =>
      ["restaurant", "store", "establishment", "point_of_interest"].includes(t)
    )
  )
    return Building2
  return MapPin
}

export function LocationSearch({
  onSelect,
  onUseMyLocation,
  hasGpsLocation,
  isSearchLocation,
  userLatitude,
  userLongitude,
  recentSearches = [],
  onRecentSelect,
  onRecentRemove,
  onRecentClear,
}: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, 300)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (input.trim().length < 2) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input,
            latitude: userLatitude,
            longitude: userLongitude,
          }),
        })

        if (!response.ok) {
          setSuggestions([])
          return
        }

        const data = await response.json()
        const mapped: Suggestion[] = (data.suggestions || [])
          .filter((s: Record<string, unknown>) => s.placePrediction)
          .map(
            (s: {
              placePrediction: {
                placeId: string
                text: { text: string }
                structuredFormat?: {
                  mainText: { text: string }
                  secondaryText?: { text: string }
                }
                distanceMeters?: number
                types?: string[]
              }
            }) => {
              const p = s.placePrediction
              return {
                placeId: p.placeId,
                mainText: p.structuredFormat?.mainText?.text || p.text.text,
                secondaryText: p.structuredFormat?.secondaryText?.text || "",
                distanceMeters: p.distanceMeters,
                fullText: p.text.text,
                types: p.types,
              }
            }
          )
        setSuggestions(mapped)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    },
    [userLatitude, userLongitude]
  )

  // Debounced search
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      return
    }
    fetchSuggestions(debouncedQuery)
  }, [debouncedQuery, fetchSuggestions])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.mainText)
    setOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
    onSelect(suggestion.placeId, suggestion.fullText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems =
      suggestions.length + (hasGpsLocation && isSearchLocation ? 1 : 0)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex === -1) return

      // "My location" is the last item
      if (
        hasGpsLocation &&
        isSearchLocation &&
        selectedIndex === suggestions.length
      ) {
        onUseMyLocation?.()
        setQuery("")
        setOpen(false)
        return
      }

      if (suggestions[selectedIndex]) {
        selectSuggestion(suggestions[selectedIndex])
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showRecents = query.trim().length < 2 && recentSearches.length > 0
  const showDropdown =
    open &&
    (suggestions.length > 0 ||
      loading ||
      (hasGpsLocation && isSearchLocation) ||
      showRecents)

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => {
            if (
              query.trim().length >= 2 ||
              (hasGpsLocation && isSearchLocation) ||
              recentSearches.length > 0
            )
              setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Konum veya adres ara..."
          className="pr-9 pl-9 focus:shadow-[0_0_15px_var(--primary)] focus:ring-2 focus:ring-primary/50"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border bg-popover shadow-lg"
          >
            <motion.div
              className="max-h-72 overflow-y-auto py-1"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.03 } },
              }}
            >
              {/* Recent searches (when no query) */}
              {showRecents && (
                <>
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Son Aramalar
                    </span>
                    {onRecentClear && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRecentClear()
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                        Temizle
                      </button>
                    )}
                  </div>
                  {recentSearches.map((recent) => (
                    <motion.div
                      key={recent.placeId}
                      variants={{
                        hidden: { opacity: 0, y: -4 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      <button
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                        onClick={() => {
                          setQuery(recent.label.split(",")[0])
                          setOpen(false)
                          onRecentSelect?.(recent.placeId, recent.label)
                        }}
                      >
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {recent.label}
                        </span>
                        {onRecentRemove && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              onRecentRemove(recent.placeId)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation()
                                onRecentRemove(recent.placeId)
                              }
                            }}
                            className="shrink-0 rounded p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </button>
                    </motion.div>
                  ))}
                  {suggestions.length > 0 && (
                    <div className="mx-3 my-1 border-t" />
                  )}
                </>
              )}

              {suggestions.map((suggestion, i) => {
                const Icon = getPlaceIcon(suggestion.types)
                const dist = suggestion.distanceMeters
                  ? formatDistance(suggestion.distanceMeters)
                  : null
                const isActive = selectedIndex === i

                return (
                  <motion.div
                    key={suggestion.placeId}
                    variants={{
                      hidden: { opacity: 0, y: -4 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <button
                      className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                        isActive ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {suggestion.mainText}
                        </p>
                        {suggestion.secondaryText && (
                          <p className="truncate text-xs text-muted-foreground">
                            {suggestion.secondaryText}
                          </p>
                        )}
                      </div>
                      {dist && (
                        <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">
                          {dist}
                        </span>
                      )}
                    </button>
                  </motion.div>
                )
              })}

              {/* Use my location option */}
              {hasGpsLocation && isSearchLocation && (
                <>
                  {suggestions.length > 0 && <div className="mx-3 border-t" />}
                  <button
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      selectedIndex === suggestions.length
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => {
                      onUseMyLocation?.()
                      setQuery("")
                      setOpen(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(suggestions.length)}
                  >
                    <Navigation className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Mevcut konumumu kullan
                    </span>
                  </button>
                </>
              )}

              {/* Loading state */}
              {loading && suggestions.length === 0 && (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aranıyor...
                </div>
              )}

              {/* No results */}
              {!loading &&
                query.trim().length >= 2 &&
                suggestions.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Sonuç bulunamadı
                  </div>
                )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
