"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useQueryStates } from "nuqs"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  FilterEmptyState,
  FavoritesEmptyState,
  NoResultsEmptyState,
} from "./places-empty-state"
import { FiltersPanel } from "./filters-panel"
import { LocationSearch } from "./location-search"
import { PlaceCard } from "./place-card"
import { PlaceListItem } from "./place-list-item"
import { PlacesHeader } from "./places-header"
import { QuickFilters } from "./quick-filters"
import { ScrollToTop } from "./scroll-to-top"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DEFAULT_FILTERS } from "@/lib/constants"
import { haversineDistance } from "@/lib/geo"
import { countActiveFilters } from "@/lib/place-utils"
import { searchParamsParsers } from "@/lib/search-params"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useFavorites } from "@/hooks/use-favorites"
import { useLocationState } from "@/hooks/use-location-state"
import { usePlaceDetail } from "@/hooks/use-place-detail"
import { usePlaces } from "@/hooks/use-places"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import type { FilterState, PriceLevel, SortOption } from "@/lib/types"
import {
  Loader2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

const PlaceDetailSheet = dynamic(() =>
  import("./place-detail-sheet").then((m) => m.PlaceDetailSheet)
)

type ViewMode = "grid" | "list"

function PlacesExplorerInner() {
  const [searchParams, setSearchParams] = useQueryStates(searchParamsParsers)
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

  const {
    gpsLocation,
    location,
    locationLabel,
    locationSource,
    locationStatus,
    setLocationSource,
    setLocationStatus,
    useMyLocation: switchToGpsLocation,
  } = useLocationState({ searchParams, setSearchParams })

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

  const { places, loading, fetchPlaces } = usePlaces(location, radius)
  const {
    detailPlace,
    detailOpen,
    detailLoading,
    handleDetailOpenChange,
    openDetail,
  } = usePlaceDetail(searchParams, setSearchParams)

  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: fetchPlaces,
  })

  const handleUseMyLocation = useCallback(() => {
    switchToGpsLocation()
    setMobileSearchOpen(false)
  }, [switchToGpsLocation])

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
    [
      addSearch,
      locationStatus,
      setLocationSource,
      setLocationStatus,
      setSearchParams,
    ]
  )

  const handleRecentSelect = useCallback(
    (placeId: string, label: string) => {
      handlePlaceSelect(placeId, label)
    },
    [handlePlaceSelect]
  )

  const filteredPlaces = useMemo(() => {
    const searchLower = debouncedPlaceSearch.trim().toLowerCase()
    const result = places.filter((place) => {
      if (searchLower) {
        const name = place.displayName.text.toLowerCase()
        const type = place.primaryTypeDisplayName?.text?.toLowerCase() || ""
        const address = place.shortFormattedAddress?.toLowerCase() || ""

        if (
          !name.includes(searchLower) &&
          !type.includes(searchLower) &&
          !address.includes(searchLower)
        ) {
          return false
        }
      }

      if (showFavoritesOnly) {
        return favorites.includes(place.id)
      }

      if (filters.minRating > 0 && (place.rating || 0) < filters.minRating) {
        return false
      }
      if (
        filters.minReviewCount > 0 &&
        (place.userRatingCount || 0) < filters.minReviewCount
      ) {
        return false
      }
      if (
        filters.priceLevels.length > 0 &&
        place.priceLevel &&
        !filters.priceLevels.includes(place.priceLevel)
      ) {
        return false
      }
      if (filters.openNow && !place.currentOpeningHours?.openNow) return false
      if (filters.delivery && !place.delivery) return false
      if (filters.dineIn && !place.dineIn) return false
      if (filters.takeout && !place.takeout) return false
      if (filters.servesVegetarianFood && !place.servesVegetarianFood) {
        return false
      }
      if (filters.outdoorSeating && !place.outdoorSeating) return false
      if (filters.reservable && !place.reservable) return false
      if (filters.goodForGroups && !place.goodForGroups) return false
      if (filters.liveMusic && !place.liveMusic) return false
      if (filters.servesCocktails && !place.servesCocktails) return false
      if (filters.servesBreakfast && !place.servesBreakfast) return false
      if (filters.servesLunch && !place.servesLunch) return false
      if (filters.servesDinner && !place.servesDinner) return false
      if (filters.servesBrunch && !place.servesBrunch) return false
      if (filters.servesAlcohol && !place.servesBeer && !place.servesWine) {
        return false
      }

      return true
    })

    if (sort === "distance" && location) {
      const distanceMap = new Map<string, number>()
      for (const place of result) {
        distanceMap.set(
          place.id,
          haversineDistance(
            location.lat,
            location.lng,
            place.location?.latitude || 0,
            place.location?.longitude || 0
          )
        )
      }
      result.sort((a, b) => distanceMap.get(a.id)! - distanceMap.get(b.id)!)
    } else {
      result.sort((a, b) => {
        switch (sort) {
          case "rating":
            return (b.rating || 0) - (a.rating || 0)
          case "reviewCount":
            return (b.userRatingCount || 0) - (a.userRatingCount || 0)
          default:
            return 0
        }
      })
    }

    return result
  }, [
    debouncedPlaceSearch,
    favorites,
    filters,
    location,
    places,
    showFavoritesOnly,
    sort,
  ])

  const activeFilterCount = countActiveFilters(filters)

  const searchComponent = (
    <LocationSearch
      onSelect={handlePlaceSelect}
      onUseMyLocation={handleUseMyLocation}
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

        <PlacesHeader
          activeFilterCount={activeFilterCount}
          canUseMyLocation={locationSource === "search" && !!gpsLocation}
          filteredCount={filteredPlaces.length}
          filters={filters}
          favoritesCount={favoritesCount}
          locationLabel={locationLabel}
          mobileFiltersOpen={mobileFiltersOpen}
          mobileSearchOpen={mobileSearchOpen}
          onFiltersChange={setFilters}
          onMobileFiltersOpenChange={setMobileFiltersOpen}
          onMobileSearchOpenChange={setMobileSearchOpen}
          onRadiusChange={setRadius}
          onSortChange={setSort}
          onToggleFavorites={() => setShowFavoritesOnly((value) => !value)}
          onUseMyLocation={handleUseMyLocation}
          onViewModeChange={setViewMode}
          radius={radius}
          searchComponent={searchComponent}
          showFavoritesOnly={showFavoritesOnly}
          sort={sort}
          totalCount={places.length}
          viewMode={viewMode}
        />

        {!loading && places.length > 0 && (
          <QuickFilters
            filters={filters}
            onFiltersChange={setFilters}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavorites={() => setShowFavoritesOnly((value) => !value)}
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

        <div className="mx-auto flex w-full max-w-full flex-1 gap-0 overflow-x-clip xl:max-w-7xl">
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
                    <FavoritesEmptyState
                      onShowAll={() => setShowFavoritesOnly(false)}
                      reducedMotion={reducedMotion}
                    />
                  ) : places.length === 0 ? (
                    <NoResultsEmptyState onRetry={fetchPlaces} />
                  ) : (
                    <FilterEmptyState
                      onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                      reducedMotion={reducedMotion}
                    />
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

        <PlaceDetailSheet
          place={detailPlace}
          open={detailOpen}
          onOpenChange={handleDetailOpenChange}
          loading={detailLoading}
          isFavorite={detailPlace ? isFavorite(detailPlace.id) : false}
          onToggleFavorite={toggleFavorite}
        />

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
