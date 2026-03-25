"use client"

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react"
import { flushSync } from "react-dom"
import { useQueryStates } from "nuqs"
import { searchParamsParsers } from "@/lib/search-params"
import { toast } from "sonner"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { PlaceCard } from "./place-card"
import { PlaceListItem } from "./place-list-item"
import { PlaceDetailSheet } from "./place-detail-sheet"
import { FiltersPanel } from "./filters-panel"
import { LocationSearch } from "./location-search"
import { QuickFilters } from "./quick-filters"
import { ScrollToTop } from "./scroll-to-top"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  MapPin,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
  UtensilsCrossed,
  SearchX,
  Search,
  ChevronLeft,
  LocateFixed,
  LayoutGrid,
  List,
  Heart,
  Sun,
  Moon,
  X,
} from "lucide-react"
import type { Place, FilterState, SortOption, PriceLevel } from "@/lib/types"
import {
  DEFAULT_FILTERS,
  haversineDistance,
  countActiveFilters,
} from "@/lib/types"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useFavorites } from "@/hooks/use-favorites"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useTheme } from "next-themes"

type LocationSource = "gps" | "search"
type ViewMode = "grid" | "list"

function PlacesExplorerInner() {
  const [searchParams, setSearchParams] = useQueryStates(searchParamsParsers)

  // Derive location from URL params
  const urlHasLocation = searchParams.lat !== null && searchParams.lng !== null

  // Local state that is NOT in URL
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locationSource, setLocationSource] = useState<LocationSource>(
    urlHasLocation ? "search" : "gps"
  )
  const [locationStatus, setLocationStatus] = useState<
    "pending" | "granted" | "denied" | "error"
  >(urlHasLocation ? "granted" : "pending")
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [detailPlace, setDetailPlace] = useState<Place | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [placeSearch, setPlaceSearch] = useState("")
  const debouncedPlaceSearch = useDebouncedValue(placeSearch, 300)

  const {
    searches: recentSearches,
    addSearch,
    removeSearch,
    clearAll: clearRecentSearches,
  } = useRecentSearches()

  const {
    favorites,
    toggle: toggleFavorite,
    isFavorite,
    count: favoritesCount,
  } = useFavorites()
  const reducedMotion = useReducedMotion()
  const { resolvedTheme, setTheme } = useTheme()
  const themeToggleRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"

    // Fallback for browsers without View Transitions API
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme)
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    })

    // Circular reveal from button position
    transition.ready.then(() => {
      const button = themeToggleRef.current
      if (!button) return

      const { top, left, width, height } = button.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }, [resolvedTheme, setTheme])

  // Derive current location (from URL for search, from GPS state for GPS)
  const location = useMemo(() => {
    if (
      locationSource === "search" &&
      searchParams.lat !== null &&
      searchParams.lng !== null
    ) {
      return { lat: searchParams.lat, lng: searchParams.lng }
    }
    return gpsLocation
  }, [locationSource, searchParams.lat, searchParams.lng, gpsLocation])

  const locationLabel =
    searchParams.q ?? (locationSource === "gps" ? "Mevcut Konum" : "")

  // Derive FilterState from URL params
  const filters: FilterState = useMemo(
    () => ({
      minRating: searchParams.mr,
      minReviewCount: searchParams.mrc,
      priceLevels: (searchParams.pl ?? []) as PriceLevel[],
      openNow: searchParams.on ?? false,
      delivery: searchParams.del ?? false,
      dineIn: searchParams.din ?? false,
      takeout: searchParams.to ?? false,
      servesVegetarianFood: searchParams.veg ?? false,
      outdoorSeating: searchParams.out ?? false,
      reservable: searchParams.res ?? false,
      goodForGroups: searchParams.grp ?? false,
      liveMusic: searchParams.mus ?? false,
      servesCocktails: searchParams.ckl ?? false,
      servesBreakfast: searchParams.bf ?? false,
      servesLunch: searchParams.lu ?? false,
      servesDinner: searchParams.dn ?? false,
      servesBrunch: searchParams.br ?? false,
      servesAlcohol: searchParams.alc ?? false,
    }),
    [searchParams]
  )

  const sort = searchParams.s
  const radius = searchParams.r

  // Setter helpers that write to nuqs
  const setFilters = useCallback(
    (newFilters: FilterState) => {
      setSearchParams({
        mr: newFilters.minRating,
        mrc: newFilters.minReviewCount,
        pl: newFilters.priceLevels.length > 0 ? newFilters.priceLevels : null,
        on: newFilters.openNow || null,
        del: newFilters.delivery || null,
        din: newFilters.dineIn || null,
        to: newFilters.takeout || null,
        veg: newFilters.servesVegetarianFood || null,
        out: newFilters.outdoorSeating || null,
        res: newFilters.reservable || null,
        grp: newFilters.goodForGroups || null,
        mus: newFilters.liveMusic || null,
        ckl: newFilters.servesCocktails || null,
        bf: newFilters.servesBreakfast || null,
        lu: newFilters.servesLunch || null,
        dn: newFilters.servesDinner || null,
        br: newFilters.servesBrunch || null,
        alc: newFilters.servesAlcohol || null,
      })
    },
    [setSearchParams]
  )

  const setSort = useCallback(
    (newSort: SortOption) => {
      setSearchParams({ s: newSort })
    },
    [setSearchParams]
  )

  const setRadius = useCallback(
    (newRadius: number) => {
      setSearchParams({ r: newRadius })
    },
    [setSearchParams]
  )

  // Request geolocation (skip if URL already had location)
  useEffect(() => {
    if (urlHasLocation) return
    if (!("geolocation" in navigator)) {
      setLocationStatus("error")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setGpsLocation(loc)
        if (!urlHasLocation) {
          setLocationSource("gps")
        }
        setLocationStatus("granted")
      },
      (error) => {
        if (!urlHasLocation) {
          setLocationStatus(error.code === 1 ? "denied" : "error")
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch nearby places
  const fetchPlaces = useCallback(async () => {
    if (!location) return
    setLoading(true)
    try {
      const response = await fetch("/api/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          radius,
        }),
      })
      const data = await response.json()
      setPlaces(data.places || [])
    } catch {
      console.error("Failed to fetch places")
    } finally {
      setLoading(false)
    }
  }, [location, radius])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  // Pull to refresh
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: fetchPlaces,
  })

  // Handle autocomplete selection
  const handlePlaceSelect = useCallback(
    async (placeId: string, label: string) => {
      addSearch(placeId, label)
      try {
        const response = await fetch(`/api/places/${placeId}`)
        if (!response.ok) return
        const data = await response.json()
        if (data.location) {
          setSearchParams({
            lat: data.location.latitude,
            lng: data.location.longitude,
            q: label,
          })
          setLocationSource("search")
          setMobileSearchOpen(false)
          if (locationStatus !== "granted") {
            setLocationStatus("granted")
          }
        }
      } catch {
        // Silently fail
      }
    },
    [locationStatus, addSearch, setSearchParams]
  )

  // Handle recent search selection
  const handleRecentSelect = useCallback(
    (placeId: string, label: string) => {
      handlePlaceSelect(placeId, label)
    },
    [handlePlaceSelect]
  )

  // Switch back to GPS location
  const useMyLocation = useCallback(() => {
    if (gpsLocation) {
      setSearchParams({ lat: null, lng: null, q: null })
      setLocationSource("gps")
      setMobileSearchOpen(false)
    }
  }, [gpsLocation, setSearchParams])

  // Fetch place details
  const openDetail = useCallback(
    async (place: Place) => {
      setDetailPlace(place)
      setDetailOpen(true)
      setDetailLoading(true)
      setSearchParams({ place: place.id }, { history: "push" })
      try {
        const response = await fetch(`/api/places/${place.id}`)
        if (response.ok) {
          const data = await response.json()
          setDetailPlace(data)
        }
      } catch {
        // Keep basic place info as fallback
      } finally {
        setDetailLoading(false)
      }
    },
    [setSearchParams]
  )

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailPlace(null)
    setSearchParams({ place: null }, { history: "push" })
  }, [setSearchParams])

  const handleDetailOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDetail()
      }
    },
    [closeDetail]
  )

  // Restore place detail from URL param (cold start or browser back)
  useEffect(() => {
    const placeId = searchParams.place
    if (placeId && !detailOpen) {
      setDetailOpen(true)
      setDetailLoading(true)
      fetch(`/api/places/${placeId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found")
          return res.json()
        })
        .then((data) => {
          setDetailPlace(data)
        })
        .catch(() => {
          toast.error("Mekan bulunamadı")
          setSearchParams({ place: null })
          setDetailOpen(false)
        })
        .finally(() => {
          setDetailLoading(false)
        })
    } else if (!placeId && detailOpen) {
      setDetailOpen(false)
      setDetailPlace(null)
    }
  }, [searchParams.place]) // eslint-disable-line -- intentionally minimal deps

  // Filter and sort
  const filteredPlaces = useMemo(() => {
    const searchLower = debouncedPlaceSearch.trim().toLowerCase()
    const result = places.filter((place) => {
      // Text search filter — always applies
      if (searchLower) {
        const name = place.displayName.text.toLowerCase()
        const type = place.primaryTypeDisplayName?.text?.toLowerCase() || ""
        const address = place.shortFormattedAddress?.toLowerCase() || ""
        if (
          !name.includes(searchLower) &&
          !type.includes(searchLower) &&
          !address.includes(searchLower)
        )
          return false
      }

      // When showing favorites only, skip ALL other filters — show every favorited place
      if (showFavoritesOnly) {
        return favorites.includes(place.id)
      }

      if (filters.minRating > 0 && (place.rating || 0) < filters.minRating)
        return false
      if (
        filters.minReviewCount > 0 &&
        (place.userRatingCount || 0) < filters.minReviewCount
      )
        return false
      if (
        filters.priceLevels.length > 0 &&
        place.priceLevel &&
        !filters.priceLevels.includes(place.priceLevel)
      )
        return false
      if (filters.openNow && !place.currentOpeningHours?.openNow) return false
      if (filters.delivery && !place.delivery) return false
      if (filters.dineIn && !place.dineIn) return false
      if (filters.takeout && !place.takeout) return false
      if (filters.servesVegetarianFood && !place.servesVegetarianFood)
        return false
      if (filters.outdoorSeating && !place.outdoorSeating) return false
      if (filters.reservable && !place.reservable) return false
      if (filters.goodForGroups && !place.goodForGroups) return false
      if (filters.liveMusic && !place.liveMusic) return false
      if (filters.servesCocktails && !place.servesCocktails) return false
      if (filters.servesBreakfast && !place.servesBreakfast) return false
      if (filters.servesLunch && !place.servesLunch) return false
      if (filters.servesDinner && !place.servesDinner) return false
      if (filters.servesBrunch && !place.servesBrunch) return false
      if (filters.servesAlcohol && !place.servesBeer && !place.servesWine)
        return false
      return true
    })

    result.sort((a, b) => {
      switch (sort) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "reviewCount":
          return (b.userRatingCount || 0) - (a.userRatingCount || 0)
        case "distance":
          if (!location) return 0
          return (
            haversineDistance(
              location.lat,
              location.lng,
              a.location?.latitude || 0,
              a.location?.longitude || 0
            ) -
            haversineDistance(
              location.lat,
              location.lng,
              b.location?.latitude || 0,
              b.location?.longitude || 0
            )
          )
        default:
          return 0
      }
    })

    return result
  }, [
    places,
    filters,
    sort,
    location,
    showFavoritesOnly,
    favorites,
    debouncedPlaceSearch,
  ])

  const activeFilterCount = countActiveFilters(filters)

  // Shared search component
  const searchComponent = (
    <LocationSearch
      onSelect={handlePlaceSelect}
      onUseMyLocation={useMyLocation}
      hasGpsLocation={!!gpsLocation}
      isSearchLocation={locationSource === "search"}
      userLatitude={gpsLocation?.lat}
      userLongitude={gpsLocation?.lng}
      recentSearches={recentSearches}
      onRecentSelect={handleRecentSelect}
      onRecentRemove={removeSearch}
      onRecentClear={clearRecentSearches}
    />
  )

  // Location pending state
  if (locationStatus === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-md flex-col items-center gap-5 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <LocateFixed className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-xl font-semibold">Konumunuz Alınıyor</h2>
          <p className="text-sm text-muted-foreground">
            Yakınızdaki en iyi mekanları bulmak için konum iznine ihtiyacımız
            var.
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <div className="w-full pt-2">
            <p className="mb-3 text-xs text-muted-foreground">
              veya bir konum arayın
            </p>
            {searchComponent}
          </div>
        </motion.div>
      </div>
    )
  }

  // Location denied/error
  if (
    (locationStatus === "denied" || locationStatus === "error") &&
    !location
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-md flex-col items-center gap-5 text-center"
        >
          <MapPin className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Konum Bulunamadı</h2>
          <p className="text-sm text-muted-foreground">
            {locationStatus === "denied"
              ? "Konum izni reddedildi. Aşağıya bir adres girerek mekanları arayabilirsiniz."
              : "Konum alınamadı. Aşağıya bir adres girerek mekanları arayabilirsiniz."}
          </p>
          <div className="w-full">{searchComponent}</div>
        </motion.div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex min-h-screen flex-col overflow-x-clip">
        {/* Pull to refresh indicator */}
        <AnimatePresence>
          {(pullDistance > 0 || isRefreshing) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: isRefreshing ? 48 : pullDistance,
                opacity: 1,
              }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center overflow-hidden bg-muted/50"
            >
              <RefreshCw
                className={`h-5 w-5 text-muted-foreground ${
                  isRefreshing || pullDistance > 80 ? "animate-spin" : ""
                }`}
                style={{
                  transform: isRefreshing
                    ? undefined
                    : `rotate(${pullDistance * 2}deg)`,
                }}
              />
              {!isRefreshing && pullDistance > 10 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {pullDistance > 80 ? "Bırakın..." : "Yenilemek için çekin"}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header
          className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl"
          style={{
            borderBottom: "1px solid transparent",
            borderImage:
              "linear-gradient(to right, var(--primary), var(--secondary)) 1",
          }}
        >
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
            {mobileSearchOpen ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 lg:hidden"
                  onClick={() => setMobileSearchOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">{searchComponent}</div>
              </>
            ) : (
              <>
                {/* Logo */}
                <div className="flex shrink-0 items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  <h1 className="hidden text-lg font-bold tracking-tight sm:block">
                    Nerede Yesem?
                  </h1>
                </div>

                {/* Location badge */}
                {locationLabel && (
                  <button
                    onClick={
                      locationSource === "search" && gpsLocation
                        ? useMyLocation
                        : undefined
                    }
                    disabled={!(locationSource === "search" && gpsLocation)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors ${
                      locationSource === "search" && gpsLocation
                        ? "cursor-pointer hover:border-primary/50 hover:bg-muted"
                        : "cursor-default"
                    }`}
                    title={
                      locationSource === "search" && gpsLocation
                        ? "Mevcut konuma dön"
                        : undefined
                    }
                  >
                    {locationSource === "search" && gpsLocation ? (
                      <LocateFixed className="h-3 w-3 shrink-0" />
                    ) : (
                      <MapPin className="h-3 w-3 shrink-0" />
                    )}
                    <span className="max-w-[120px] truncate sm:max-w-[200px]">
                      {locationLabel}
                    </span>
                  </button>
                )}

                {/* Desktop search — hidden on mobile */}
                <div className="hidden min-w-0 flex-1 lg:flex lg:justify-center">
                  {searchComponent}
                </div>

                {/* Action buttons */}
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  {/* Mobile search trigger */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 lg:hidden"
                    onClick={() => setMobileSearchOpen(true)}
                    title="Konum ara"
                  >
                    <Search className="h-4 w-4" />
                  </Button>

                  {/* View toggle */}
                  <div className="hidden items-center rounded-lg border p-0.5 sm:flex">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "grid" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setViewMode("grid")}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Kart Görünümü</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "list" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Liste Görünümü</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Theme toggle */}
                  <Button
                    ref={themeToggleRef}
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8"
                    onClick={toggleTheme}
                    title={
                      mounted
                        ? resolvedTheme === "dark"
                          ? "Açık tema"
                          : "Koyu tema"
                        : "Tema değiştir"
                    }
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {mounted && resolvedTheme === "dark" ? (
                        <motion.span
                          key="moon"
                          initial={{ rotate: -90, scale: 0, opacity: 0 }}
                          animate={{ rotate: 0, scale: 1, opacity: 1 }}
                          exit={{ rotate: 90, scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 250,
                            damping: 20,
                            duration: 0.3,
                          }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Moon className="h-4 w-4" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="sun"
                          initial={{ rotate: 90, scale: 0, opacity: 0 }}
                          animate={{ rotate: 0, scale: 1, opacity: 1 }}
                          exit={{ rotate: -90, scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 250,
                            damping: 20,
                            duration: 0.3,
                          }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Sun className="h-4 w-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>

                  {/* Favorites counter */}
                  {favoritesCount > 0 && (
                    <motion.button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      whileTap={{ scale: 0.9 }}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 ${
                        showFavoritesOnly
                          ? "bg-[var(--neon-favorite)] text-white"
                          : "hover:bg-muted"
                      }`}
                      title="Favoriler"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={showFavoritesOnly ? "currentColor" : "none"}
                      />
                      <motion.span
                        key={favoritesCount}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white"
                      >
                        {favoritesCount}
                      </motion.span>
                    </motion.button>
                  )}

                  {/* Mobile filter toggle */}
                  <Sheet
                    open={mobileFiltersOpen}
                    onOpenChange={setMobileFiltersOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="relative lg:hidden"
                      >
                        <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                        <span className="xs:inline hidden">Filtre</span>
                        {activeFilterCount > 0 && (
                          <Badge className="ml-1.5 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-6"
                    >
                      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
                      <SheetHeader className="p-0 pb-1">
                        <SheetTitle className="text-base">Filtreler</SheetTitle>
                      </SheetHeader>
                      <div className="mt-3 pb-6">
                        <FiltersPanel
                          filters={filters}
                          onFiltersChange={setFilters}
                          sort={sort}
                          onSortChange={setSort}
                          radius={radius}
                          onRadiusChange={setRadius}
                          totalCount={places.length}
                          filteredCount={filteredPlaces.length}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Quick filters — sticky below header */}
        {!loading && places.length > 0 && (
          <QuickFilters
            filters={filters}
            onFiltersChange={setFilters}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
            favoritesCount={favoritesCount}
            rightSlot={
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                  placeholder="Filtrele..."
                  className="h-8 w-36 pr-7 pl-8 text-xs sm:w-44"
                />
                {placeSearch && (
                  <button
                    onClick={() => setPlaceSearch("")}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            }
          />
        )}

        {/* Main layout */}
        <div className="mx-auto flex w-full max-w-full flex-1 gap-0 overflow-x-clip xl:max-w-7xl">
          {/* Desktop sidebar */}
          <aside className="hidden w-72 shrink-0 border-r lg:block">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
              <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Filtreler
              </h2>
              <FiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                radius={radius}
                onRadiusChange={setRadius}
                totalCount={places.length}
                filteredCount={filteredPlaces.length}
              />
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1 p-4 lg:p-6">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={
                    viewMode === "grid"
                      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col gap-2"
                  }
                >
                  {Array.from({ length: 6 }).map((_, i) =>
                    viewMode === "grid" ? (
                      <div
                        key={i}
                        className="overflow-hidden rounded-xl border bg-card"
                      >
                        <Skeleton className="aspect-[16/10] w-full" />
                        <div className="space-y-2 p-4">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="flex gap-3 rounded-xl border bg-card p-3"
                      >
                        <Skeleton className="h-20 w-24 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    )
                  )}
                </motion.div>
              ) : filteredPlaces.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  {showFavoritesOnly ? (
                    <>
                      <motion.div
                        animate={
                          reducedMotion ? undefined : { scale: [1, 1.1, 1] }
                        }
                        transition={
                          reducedMotion
                            ? undefined
                            : { repeat: Infinity, duration: 1.5 }
                        }
                      >
                        <Heart className="h-16 w-16 text-pink-300" />
                      </motion.div>
                      <h3 className="mt-4 text-lg font-semibold">
                        Henüz Favori Mekanınız Yok
                      </h3>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Beğendiğiniz mekanlardaki kalp ikonuna tıklayarak
                        favorilerinize ekleyin.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowFavoritesOnly(false)}
                        className="mt-4"
                        size="sm"
                      >
                        Keşfetmeye Başla
                      </Button>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={
                          reducedMotion || places.length === 0
                            ? undefined
                            : { x: [-4, 4, -4] }
                        }
                        transition={
                          reducedMotion || places.length === 0
                            ? undefined
                            : { repeat: Infinity, duration: 1.5 }
                        }
                      >
                        <SearchX className="h-16 w-16 text-muted-foreground/30" />
                      </motion.div>
                      <h3 className="mt-4 text-lg font-semibold">
                        {places.length === 0
                          ? "Sonuç Bulunamadı"
                          : "Filtrelere Uygun Sonuç Yok"}
                      </h3>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {places.length === 0
                          ? "Bu alanda mekan bulunamadı. Arama yarıçapını artırmayı deneyin."
                          : "Aktif filtrelere uygun mekan bulunamadı. Filtreleri genişletmeyi deneyin."}
                      </p>
                      {places.length === 0 ? (
                        <Button
                          onClick={fetchPlaces}
                          className="mt-4"
                          size="sm"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Tekrar Ara
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setFilters(DEFAULT_FILTERS)}
                          className="mt-4"
                          size="sm"
                        >
                          Filtreleri Temizle
                        </Button>
                      )}
                    </>
                  )}
                </motion.div>
              ) : viewMode === "grid" ? (
                <motion.div
                  key="grid"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: 0.04,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                  className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      userLocation={location}
                      onClick={() => openDetail(place)}
                      isFavorite={isFavorite(place.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.03,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-2"
                >
                  {filteredPlaces.map((place) => (
                    <PlaceListItem
                      key={place.id}
                      place={place}
                      userLocation={location}
                      onClick={() => openDetail(place)}
                      isFavorite={isFavorite(place.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Detail sheet */}
        <PlaceDetailSheet
          place={detailPlace}
          open={detailOpen}
          onOpenChange={handleDetailOpenChange}
          loading={detailLoading}
          isFavorite={detailPlace ? isFavorite(detailPlace.id) : false}
          onToggleFavorite={toggleFavorite}
        />

        {/* Scroll to top */}
        <ScrollToTop />
      </div>
    </TooltipProvider>
  )
}

export function PlacesExplorer() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PlacesExplorerInner />
    </Suspense>
  )
}
