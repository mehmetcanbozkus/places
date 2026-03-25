# Codebase Refactoring Design

**Goal:** Refactor the Places app codebase for maintainability without changing any user-facing behavior or logic.

**Constraint:** Every refactoring must be behavior-preserving. No new features, no altered logic, no UI changes. The app must look and work identically before and after.

**Verification:** `bun run build && bun run typecheck` must pass after each change. Manual smoke test: load the app, search a location, browse places, open a detail sheet, toggle favorites, switch view mode, toggle theme.

---

## Area 1: Split `places-explorer.tsx` (1136 → ~300 lines)

### Problem

`PlacesExplorerInner` is a 1136-line god component with 20+ `useState` calls handling 8 distinct responsibilities: URL state, geolocation, data fetching, filtering/sorting, theme toggling, pull-to-refresh, UI chrome, and detail sheet orchestration.

### Solution

Extract 3 custom hooks and 2 sub-components. The orchestrator keeps the wiring.

#### New files

**`src/hooks/use-location-state.ts`**
Encapsulates:
- GPS acquisition via `navigator.geolocation`
- `gpsLocation`, `locationSource`, `locationStatus` state
- `useMyLocation` callback
- Reads `searchParams.lat/lng/q` from nuqs to determine if URL has a location
- Returns: `{ location, locationLabel, locationSource, locationStatus, gpsLocation, useMyLocation }`

**`src/hooks/use-places.ts`**
Encapsulates:
- `places`, `loading` state
- `fetchPlaces(location, radius)` callback
- The `useEffect` that triggers fetch when location/radius changes
- Returns: `{ places, loading, fetchPlaces }`

**`src/hooks/use-place-detail.ts`**
Encapsulates:
- `detailPlace`, `detailOpen`, `detailLoading` state
- `openDetail(place)` — fetches detail, pushes URL param
- `closeDetail()` — clears state, removes URL param
- `handleDetailOpenChange(open)` — for Sheet's onOpenChange
- The URL-restoration `useEffect` (cold start / browser back)
- Takes `setSearchParams` from nuqs as a parameter
- Returns: `{ detailPlace, detailOpen, detailLoading, openDetail, closeDetail, handleDetailOpenChange }`

**`src/components/places-header.tsx`**
Extracts the entire `<header>` section (lines 628-862) including:
- Logo, location badge
- Desktop/mobile search (receives `searchComponent` as prop or children)
- View mode toggle
- Theme toggle (with View Transition API logic)
- Favorites counter button
- Mobile filter sheet trigger

Props: `locationLabel`, `locationSource`, `gpsLocation`, `useMyLocation`, `viewMode`, `setViewMode`, `showFavoritesOnly`, `setShowFavoritesOnly`, `favoritesCount`, `filters`, `setFilters`, `sort`, `setSort`, `radius`, `setRadius`, `places`, `filteredPlaces`, `searchComponent`, `placeSearch`, `setPlaceSearch`, `activeFilterCount`

**`src/components/places-empty-state.tsx`**
Extracts the 3 empty state screens (lines 959-1044):
- `FavoritesEmptyState` — no favorites message
- `FilterEmptyState` — no filter results message
- `NoResultsEmptyState` — no places found message

Props for each: relevant callbacks (`setShowFavoritesOnly`, `setFilters`, `fetchPlaces`)

#### What stays in `places-explorer.tsx`

- `PlacesExplorer` wrapper with `<Suspense>`
- `PlacesExplorerInner` as orchestrator:
  - Calls the 3 extracted hooks
  - Derives `filters` from nuqs (this stays because it's tightly coupled to the URL params)
  - `filteredPlaces` useMemo (stays — it's the core data pipeline)
  - Renders: header, quick filters, sidebar, main grid/list, detail sheet, scroll-to-top
  - ~300 lines

---

## Area 2: Deduplicate PlaceCard / PlaceListItem / PlaceDetailSheet

### Problem

`PlaceCard`, `PlaceListItem`, and `PlaceDetailSheet` each independently compute: distance, price symbol, rating color/glow, category color, open status. They each have near-identical share handlers, favorite handlers, and favorite/share/status badge JSX.

### Solution

#### New files

**`src/hooks/use-place-display.ts`**
```ts
export function usePlaceDisplay(
  place: Place,
  userLocation?: { lat: number; lng: number } | null
) {
  // Returns pre-computed display values:
  return {
    distance,       // number | null
    priceSymbol,    // string | null
    isOpen,         // boolean | undefined
    ratingColor,    // { text, fill } | null
    ratingGlow,     // string | undefined
    categoryColor,  // CategoryColor
  }
}
```

Used by `PlaceCard`, `PlaceListItem`, and (partially) `PlaceDetailSheet`.

**`src/components/favorite-button.tsx`**
Shared Heart icon button with `motion.button`, `whileTap` animation, `aria-label`/`aria-pressed`, conditional pink styling. Props: `isFavorite`, `onToggle`, `size?: "sm" | "md"`, `className?`.

**`src/components/share-button.tsx`**
Shared share button that calls `sharePlace(place)` and shows toast. Props: `place`, `size?: "sm" | "md"`, `className?`. Handles `e.stopPropagation()` internally.

**`src/components/open-status-badge.tsx`**
Shared Acik/Kapali badge with emerald/red styling. Props: `isOpen: boolean`, `variant?: "overlay" | "inline"`.

**`src/components/place-detail-sheet/opening-hours.tsx`**
Extracts the 75-line IIFE (lines 681-756 of `place-detail-sheet.tsx`) into a standalone component. Props: `descriptions: string[]`.

#### Changes to existing files

- `place-card.tsx`: Use `usePlaceDisplay`, `FavoriteButton`, `ShareButton`, `OpenStatusBadge`. Remove ~40 lines of duplicated code.
- `place-list-item.tsx`: Same treatment. Remove ~35 lines.
- `place-detail-sheet.tsx`: Use `FavoriteButton`, `ShareButton`, `OpenStatusBadge`, `OpeningHours`. Remove ~50 lines.
- `location-search.tsx`: Remove local `formatDistance`, import from `@/lib/geo`.

---

## Area 3: Split `types.ts` (425 → 4 files)

### Problem

`types.ts` mixes pure type definitions with runtime functions, constants, and business logic. Everything imports from `@/lib/types` regardless of what they need.

### Solution

**`src/lib/types.ts`** (~155 lines)
- All interfaces: `Place`, `LocalizedText`, `LatLng`, `PlacePhoto`, `Review`, `OpeningHours`, `Period`, `TimePoint`, `ParkingOptions`, `PaymentOptions`, `AccessibilityOptions`, `GoogleMapsLinks`, `GenerativeSummary`, `ReviewSummary`, `Money`, `PriceRange`
- Type aliases: `PriceLevel`, `FilterState`, `SortOption`, `CategoryColor`

**`src/lib/constants.ts`** (~70 lines)
- `PRICE_LEVEL_MAP`, `PRICE_LEVEL_SYMBOL`
- `DEFAULT_FILTERS`
- `RESTAURANT_TYPES`, `CAFE_TYPES`, `BAR_TYPES`, `PASTRY_TYPES` Sets

**`src/lib/place-utils.ts`** (~100 lines)
- `getRatingColor`, `getRatingGlow`, `getCategoryColor`
- `getPhotoUrl`
- `formatReviewCount`
- `sharePlace`, `buildPlaceUrl`
- `countActiveFilters`

**`src/lib/geo.ts`** (~15 lines)
- `haversineDistance`
- `formatDistance`

All existing imports from `@/lib/types` will be updated to import from the correct new module. Re-exports from `types.ts` are NOT used — each consumer imports from the right file.

---

## Area 4: Generic localStorage hook

### Problem

`use-favorites.ts` and `use-recent-searches.ts` duplicate ~50 lines of identical `useSyncExternalStore` boilerplate: module-level `listeners`, `cachedRaw`, `cachedParsed`, `getSnapshot`, `getServerSnapshot`, `subscribe`, `emitChange`.

### Solution

**`src/hooks/use-local-storage-store.ts`**

A factory function that creates a typed localStorage store:

```ts
export function createLocalStorageStore<T>(key: string, defaultValue: T) {
  // Module-level cache per key
  let listeners: (() => void)[] = []
  let cachedRaw: string | null = null
  let cachedParsed: T = defaultValue

  function getSnapshot(): T { ... }
  function getServerSnapshot(): T { return defaultValue }
  function subscribe(cb: () => void) { ... }
  function emitChange() { ... }
  function set(value: T) { ... }

  return { getSnapshot, getServerSnapshot, subscribe, set }
}
```

Then `use-favorites.ts` becomes ~25 lines:
```ts
const store = createLocalStorageStore<string[]>("favorites", [])

export function useFavorites() {
  const favorites = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  const favoritesSet = useMemo(() => new Set(favorites), [favorites])
  const toggle = useCallback((id: string) => {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id]
    store.set(next)
  }, [favorites])
  const isFavorite = useCallback((id: string) => favoritesSet.has(id), [favoritesSet])
  return { favorites, toggle, isFavorite, count: favorites.length }
}
```

`use-recent-searches.ts` similarly shrinks to ~30 lines.

---

## Area 5: API route consolidation

### Problem

All 5 API routes (`nearby`, `[id]`, `autocomplete`, `geocode`, `photo`) repeat `const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY` and early-return checks. The `nearby` and `[id]` routes have overlapping field mask arrays.

### Solution

**`src/app/api/places/_shared.ts`**

```ts
export const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export function requireApiKey() {
  if (!GOOGLE_API_KEY) {
    return new Response("API key not configured", { status: 500 })
  }
  return null
}

export const BASE_FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress", ...
]

export const DETAIL_FIELD_MASK = [
  ...BASE_FIELD_MASK,
  "places.reviews", "places.internationalPhoneNumber", ...
]
```

Each route imports from `_shared.ts` instead of redeclaring. The underscore prefix signals this is a shared module, not a route.

---

## File Impact Summary

| Action | File |
|--------|------|
| Create | `src/hooks/use-location-state.ts` |
| Create | `src/hooks/use-places.ts` |
| Create | `src/hooks/use-place-detail.ts` |
| Create | `src/hooks/use-place-display.ts` |
| Create | `src/hooks/use-local-storage-store.ts` |
| Create | `src/components/places-header.tsx` |
| Create | `src/components/places-empty-state.tsx` |
| Create | `src/components/favorite-button.tsx` |
| Create | `src/components/share-button.tsx` |
| Create | `src/components/open-status-badge.tsx` |
| Create | `src/components/place-detail-sheet/opening-hours.tsx` |
| Create | `src/lib/constants.ts` |
| Create | `src/lib/place-utils.ts` |
| Create | `src/lib/geo.ts` |
| Create | `src/app/api/places/_shared.ts` |
| Modify | `src/components/places-explorer.tsx` (1136 → ~300 lines) |
| Modify | `src/components/place-detail-sheet.tsx` (863 → ~700 lines) |
| Modify | `src/components/place-card.tsx` (275 → ~200 lines) |
| Modify | `src/components/place-list-item.tsx` (205 → ~140 lines) |
| Modify | `src/components/location-search.tsx` (remove dup formatDistance) |
| Modify | `src/hooks/use-favorites.ts` (70 → ~25 lines) |
| Modify | `src/hooks/use-recent-searches.ts` (85 → ~30 lines) |
| Modify | `src/lib/types.ts` (425 → ~155 lines) |
| Modify | `src/components/filters-panel.tsx` (update imports) |
| Modify | `src/components/quick-filters.tsx` (update imports) |
| Modify | `src/components/rating-breakdown.tsx` (update imports) |
| Modify | `src/components/scroll-to-top.tsx` (no change needed) |
| Modify | All 5 API routes (use _shared.ts) |
