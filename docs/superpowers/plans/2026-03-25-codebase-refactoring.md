# Codebase Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Places app for maintainability without changing user-facing behavior.

**Architecture:** Bottom-up approach — split shared utilities first (types.ts, localStorage hooks, API helpers), then deduplicate component code, then decompose the god component last. Each task produces a buildable, identical-behavior codebase.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript 6, bun, nuqs, motion, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-25-codebase-refactoring-design.md`

**Verification after every task:** `bun run build && bun run typecheck`

---

## Task Dependency Graph

```
Task 1 (split types.ts) ──┐
Task 2 (localStorage)     ├── Task 4 (deduplicate components) ──┐
Task 3 (API routes)       │                                      ├── Task 5-7 (split places-explorer)
                          └──────────────────────────────────────┘
```

Tasks 1, 2, 3 are independent and can run in parallel.
Task 4 depends on Task 1 (imports from new lib files).
Tasks 5-7 depend on Task 4 and must run sequentially (all modify places-explorer.tsx).

---

### Task 1: Split `types.ts` into focused modules

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/lib/place-utils.ts`
- Create: `src/lib/geo.ts`
- Modify: `src/lib/types.ts` (remove runtime code, keep only types/interfaces)
- Modify: All consumers (update imports)

The current `src/lib/types.ts` (425 lines) mixes pure types with runtime functions and constants. Split it into 4 files. Then update every import across the codebase.

- [ ] **Step 1: Create `src/lib/geo.ts`**

Move `haversineDistance` and `formatDistance` from `types.ts` (lines 322-341):

```ts
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}
```

- [ ] **Step 2: Create `src/lib/constants.ts`**

Move constants from `types.ts` (lines 188-265). Import the types they reference:

```ts
import type { PriceLevel, FilterState } from "./types"

export const PRICE_LEVEL_MAP: Record<PriceLevel, string> = { ... }
export const PRICE_LEVEL_SYMBOL: Record<PriceLevel, string> = { ... }
export const DEFAULT_FILTERS: FilterState = { ... }
export const RESTAURANT_TYPES = new Set([ ... ])
export const CAFE_TYPES = new Set([ ... ])
export const BAR_TYPES = new Set([ ... ])
export const PASTRY_TYPES = new Set([ ... ])
```

Copy the exact values from `types.ts` lines 188-265.

- [ ] **Step 3: Create `src/lib/place-utils.ts`**

Move all runtime functions from `types.ts` (lines 225-425) that aren't geo-related. Import types, constants, and geo functions they need:

```ts
import type { Place, PriceLevel, FilterState, CategoryColor } from "./types"
import { PRICE_LEVEL_MAP, RESTAURANT_TYPES, CAFE_TYPES, BAR_TYPES, PASTRY_TYPES } from "./constants"
import { formatDistance } from "./geo"

export function getRatingColor(rating: number): { text: string; fill: string } { ... }
export function getCategoryColor(primaryType?: string, types?: string[]): CategoryColor { ... }
export function getRatingGlow(rating: number): string { ... }
export function getPhotoUrl(photoName: string, maxWidthPx: number = 400): string { ... }
export function formatReviewCount(count: number): string { ... }
export function buildPlaceUrl(place: Place): string { ... }
export async function sharePlace(place: Place): Promise<"shared" | "copied" | "failed"> { ... }
export function countActiveFilters(filters: FilterState): number { ... }
```

Copy function bodies exactly from `types.ts`.

- [ ] **Step 4: Strip `types.ts` to types-only**

Remove all runtime code from `types.ts`. Keep only lines 1-186 (interfaces, type aliases) plus the `CategoryColor` interface (lines 267-271). The file should contain zero `function` or `const` declarations — only `export interface`, `export type`.

**Important:** Steps 4 and 5 must be completed together before building. Stripping types.ts without updating imports will break the build.

- [ ] **Step 5: Update all imports across the codebase**

Search the entire `src/` directory for imports from `@/lib/types`. For each file, update imports to point to the correct new module. Key mappings:

| Import | New source |
|--------|-----------|
| `Place`, `FilterState`, `SortOption`, `PriceLevel`, `Review`, `PlacePhoto`, `CategoryColor`, all interfaces | `@/lib/types` (stays) |
| `PRICE_LEVEL_MAP`, `PRICE_LEVEL_SYMBOL`, `DEFAULT_FILTERS` | `@/lib/constants` |
| `getRatingColor`, `getRatingGlow`, `getCategoryColor`, `getPhotoUrl`, `formatReviewCount`, `sharePlace`, `buildPlaceUrl`, `countActiveFilters` | `@/lib/place-utils` |
| `haversineDistance`, `formatDistance` | `@/lib/geo` |

Files to update (grep for `from "@/lib/types"`):
- `src/components/places-explorer.tsx`
- `src/components/place-card.tsx`
- `src/components/place-list-item.tsx`
- `src/components/place-detail-sheet.tsx`
- `src/components/filters-panel.tsx`
- `src/components/quick-filters.tsx`
- `src/components/rating-breakdown.tsx`
- `src/components/photo-lightbox.tsx`
- `src/components/location-search.tsx` — also remove its local `formatDistance` function (lines 64-68), import from `@/lib/geo` instead. Note: the local version accepts `undefined` and returns `null`, so change the call site to handle this: `formatDistance(meters) ?? null` or add a null check before calling.
- `src/lib/search-params.ts` (verify — may not import from `@/lib/types`; skip if no imports to update)

- [ ] **Step 6: Verify and commit**

Run: `bun run build && bun run typecheck`
```bash
git add src/lib/types.ts src/lib/constants.ts src/lib/place-utils.ts src/lib/geo.ts src/components/ src/hooks/ src/app/
git commit -m "refactor: split types.ts into types, constants, place-utils, and geo modules"
```

---

### Task 2: Generic localStorage hook factory

**Files:**
- Create: `src/hooks/use-local-storage-store.ts`
- Modify: `src/hooks/use-favorites.ts`
- Modify: `src/hooks/use-recent-searches.ts`

- [ ] **Step 1: Create `src/hooks/use-local-storage-store.ts`**

```ts
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
```

- [ ] **Step 2: Refactor `use-favorites.ts`**

Replace with:

```ts
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
```

- [ ] **Step 3: Refactor `use-recent-searches.ts`**

Replace with:

```ts
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
```

- [ ] **Step 4: Verify and commit**

Run: `bun run build && bun run typecheck`
```bash
git add src/hooks/use-local-storage-store.ts src/hooks/use-favorites.ts src/hooks/use-recent-searches.ts
git commit -m "refactor: create generic localStorage store factory, deduplicate hooks"
```

---

### Task 3: Consolidate API route boilerplate

**Files:**
- Create: `src/app/api/places/_shared.ts`
- Modify: `src/app/api/places/nearby/route.ts`
- Modify: `src/app/api/places/[id]/route.ts`
- Modify: `src/app/api/places/autocomplete/route.ts`
- Modify: `src/app/api/places/geocode/route.ts`
- Modify: `src/app/api/places/photo/route.ts`

- [ ] **Step 1: Create `src/app/api/places/_shared.ts`**

Extract the shared API key and field masks. Store field names unprefixed:

```ts
import { NextResponse } from "next/server"

export const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export function apiKeyError() {
  return NextResponse.json(
    { error: "API key not configured" },
    { status: 500 }
  )
}

// Unprefixed field names — shared between nearby (needs `places.` prefix) and detail routes
export const BASE_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "photos",
  "priceLevel",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "currentOpeningHours",
  "editorialSummary",
  "businessStatus",
  "delivery",
  "dineIn",
  "takeout",
  "reservable",
  "servesVegetarianFood",
  "outdoorSeating",
  "goodForGroups",
  "goodForChildren",
  "servesBeer",
  "servesWine",
  "liveMusic",
  "servesCocktails",
  "servesCoffee",
  "servesBreakfast",
  "servesLunch",
  "servesDinner",
  "servesBrunch",
  "servesDessert",
  "allowsDogs",
  "websiteUri",
  "googleMapsUri",
]

// Additional fields only fetched for detail view
export const DETAIL_ONLY_FIELDS = [
  "regularOpeningHours",
  "internationalPhoneNumber",
  "reviews",
  "menuForChildren",
  "restroom",
  "goodForWatchingSports",
  "parkingOptions",
  "paymentOptions",
  "accessibilityOptions",
  "curbsidePickup",
  "googleMapsLinks",
  "generativeSummary",
  "reviewSummary",
  "priceRange",
]

// For the nearby route: prefix each field with `places.`
export const NEARBY_FIELD_MASK = BASE_FIELDS.map((f) => `places.${f}`).join(",")

// For the [id] route: all fields unprefixed
export const DETAIL_FIELD_MASK = [...BASE_FIELDS, ...DETAIL_ONLY_FIELDS].join(",")
```

- [ ] **Step 2: Update all 5 route files**

In each route file:
1. Remove `const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY`
2. Import `{ GOOGLE_API_KEY, apiKeyError }` from `./_shared`
3. Replace the `if (!GOOGLE_API_KEY)` block with `if (!GOOGLE_API_KEY) return apiKeyError()`
4. For `nearby/route.ts`: also remove its `FIELD_MASK` array (lines 5-42), import `{ NEARBY_FIELD_MASK }` from `./_shared`, use `NEARBY_FIELD_MASK` instead of `FIELD_MASK`
5. For `[id]/route.ts`: also remove its `FIELD_MASK` array (lines 5-56), import `{ DETAIL_FIELD_MASK }` from `./_shared`, use `DETAIL_FIELD_MASK` instead of `FIELD_MASK`
6. For `photo/route.ts`: import the API key. **Important:** The current code combines the API key and `name` check: `if (!name || !GOOGLE_API_KEY)`. Split into two separate checks: `if (!GOOGLE_API_KEY) return apiKeyError()` then `if (!name) return new Response("Missing parameters", { status: 400 })`

- [ ] **Step 3: Verify and commit**

Run: `bun run build && bun run typecheck`
```bash
git add src/app/api/places/
git commit -m "refactor: consolidate API route boilerplate into _shared.ts"
```

---

### Task 4: Deduplicate shared component code

**Files:**
- Create: `src/hooks/use-place-display.ts`
- Create: `src/components/favorite-button.tsx`
- Create: `src/components/share-button.tsx`
- Create: `src/components/open-status-badge.tsx`
- Create: `src/components/place-detail-sheet/opening-hours.tsx`
- Modify: `src/components/place-card.tsx`
- Modify: `src/components/place-list-item.tsx`
- Modify: `src/components/place-detail-sheet.tsx`
- Modify: `src/components/location-search.tsx`

**Depends on Task 1** (imports from `@/lib/geo`, `@/lib/place-utils`, `@/lib/constants`).

- [ ] **Step 1: Create `src/hooks/use-place-display.ts`**

```ts
import type { Place, CategoryColor } from "@/lib/types"
import {
  getRatingColor,
  getRatingGlow,
  getCategoryColor,
} from "@/lib/place-utils"
import { PRICE_LEVEL_SYMBOL } from "@/lib/constants"
import { haversineDistance } from "@/lib/geo"

export function usePlaceDisplay(
  place: Place,
  userLocation?: { lat: number; lng: number } | null
) {
  const distance =
    userLocation && place.location
      ? haversineDistance(
          userLocation.lat,
          userLocation.lng,
          place.location.latitude,
          place.location.longitude
        )
      : null

  const priceSymbol = place.priceLevel
    ? PRICE_LEVEL_SYMBOL[place.priceLevel]
    : null

  const isOpen = place.currentOpeningHours?.openNow

  const ratingColor = place.rating ? getRatingColor(place.rating) : null
  const ratingGlow = place.rating ? getRatingGlow(place.rating) : undefined
  const categoryColor = getCategoryColor(place.primaryType, place.types)

  return { distance, priceSymbol, isOpen, ratingColor, ratingGlow, categoryColor }
}
```

- [ ] **Step 2: Create `src/components/favorite-button.tsx`**

Read the favorite button JSX from `place-card.tsx` (lines 174-191) as the reference implementation. Create a shared version with `size` prop:

```tsx
"use client"

import { motion } from "motion/react"
import { Heart } from "lucide-react"

interface FavoriteButtonProps {
  isFavorite: boolean
  onToggle: () => void
  size?: "sm" | "md"
  className?: string
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = "sm",
  className = "",
}: FavoriteButtonProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"
  const padding = size === "sm" ? "p-1.5" : "p-2"

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 1.3 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={`shrink-0 rounded-full transition-opacity ${padding} ${
        isFavorite ? "text-pink-500" : "text-muted-foreground"
      } ${className}`}
      aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={isFavorite}
    >
      <Heart
        className={iconSize}
        fill={isFavorite ? "currentColor" : "none"}
      />
    </motion.button>
  )
}
```

- [ ] **Step 3: Create `src/components/share-button.tsx`**

```tsx
"use client"

import { toast } from "sonner"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Place } from "@/lib/types"
import { sharePlace } from "@/lib/place-utils"

interface ShareButtonProps {
  place: Place
  size?: "sm" | "md"
  className?: string
  stopPropagation?: boolean
  variant?: "icon" | "outline"
}

export function ShareButton({
  place,
  size = "sm",
  className = "",
  stopPropagation = true,
  variant = "icon",
}: ShareButtonProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"

  const handleShare = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    const result = await sharePlace(place)
    if (result === "copied") toast.success("Panoya kopyalandı")
    else if (result === "failed") toast.error("Paylaşılamadı")
  }

  if (variant === "outline") {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`h-9 w-9 ${className}`}
        onClick={handleShare}
        title="Paylaş"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <button
      onClick={handleShare}
      className={`shrink-0 rounded-full p-1 transition-opacity hover:bg-muted ${className}`}
      title="Paylaş"
    >
      <Share2 className={`${iconSize} text-muted-foreground`} />
    </button>
  )
}
```

- [ ] **Step 4: Create `src/components/open-status-badge.tsx`**

Read all 3 existing badge variants from the source. Build a shared component with `variant` prop:

```tsx
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface OpenStatusBadgeProps {
  isOpen: boolean
  variant?: "overlay" | "inline" | "plain"
}

export function OpenStatusBadge({
  isOpen,
  variant = "overlay",
}: OpenStatusBadgeProps) {
  if (variant === "inline") {
    return (
      <Badge
        variant="secondary"
        className={`h-5 px-1.5 text-[10px] ${
          isOpen
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/15 text-red-600 dark:text-red-400"
        }`}
      >
        <Clock className="mr-0.5 h-2.5 w-2.5" />
        {isOpen ? "Açık" : "Kapalı"}
      </Badge>
    )
  }

  if (variant === "plain") {
    return (
      <Badge
        variant={isOpen ? "default" : "secondary"}
        className={
          isOpen
            ? "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
            : "bg-red-500/90 text-white hover:bg-red-500/90"
        }
      >
        {isOpen ? "Açık" : "Kapalı"}
      </Badge>
    )
  }

  // overlay (default)
  return (
    <Badge
      variant={isOpen ? "default" : "secondary"}
      className={
        isOpen
          ? "bg-emerald-500/90 text-white shadow-[0_0_10px_oklch(0.7_0.2_145_/_0.4)] backdrop-blur-sm hover:bg-emerald-500/90"
          : "bg-red-500/90 text-white shadow-[0_0_10px_oklch(0.6_0.2_25_/_0.4)] backdrop-blur-sm hover:bg-red-500/90"
      }
    >
      <Clock className="mr-1 h-3 w-3" />
      {isOpen ? "Açık" : "Kapalı"}
    </Badge>
  )
}
```

- [ ] **Step 5: Create `src/components/place-detail-sheet/opening-hours.tsx`**

Extract the IIFE from `place-detail-sheet.tsx` lines 681-756 into its own component:

```tsx
interface OpeningHoursProps {
  descriptions: string[]
}

export function OpeningHours({ descriptions }: OpeningHoursProps) {
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      {descriptions.map((desc, i) => {
        const colonIndex = desc.indexOf(":")
        const dayName =
          colonIndex > -1 ? desc.slice(0, colonIndex).trim() : desc
        const hours =
          colonIndex > -1 ? desc.slice(colonIndex + 1).trim() : ""
        const isToday = i === todayIndex
        const isClosed =
          hours.toLowerCase().includes("kapalı") ||
          hours.toLowerCase().includes("closed")

        return (
          <div
            key={i}
            className={`flex items-center px-3 py-2.5 ${
              isToday
                ? "border-l-2 border-emerald-500 bg-primary/5"
                : "border-l-2 border-transparent"
            }`}
          >
            <div
              className={`mr-3 h-1.5 w-1.5 shrink-0 rounded-full ${
                isToday
                  ? "bg-emerald-500"
                  : isClosed
                    ? "bg-destructive"
                    : "bg-muted-foreground/30"
              }`}
              style={
                isToday
                  ? { boxShadow: "0 0 6px rgb(16 185 129 / 0.6)" }
                  : undefined
              }
            />
            <span
              className={`w-24 text-sm ${
                isToday
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {dayName}
            </span>
            <span
              className={`ml-auto text-sm ${
                isToday
                  ? "font-medium text-foreground"
                  : isClosed
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {hours}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Update `place-card.tsx`, `place-list-item.tsx`, `place-detail-sheet.tsx`**

For each component:
1. Import `usePlaceDisplay` from `@/hooks/use-place-display`
2. Import shared `FavoriteButton`, `ShareButton`, `OpenStatusBadge` as needed
3. Replace the inline distance/price/rating/category computations with `const { distance, priceSymbol, isOpen, ratingColor, ratingGlow, categoryColor } = usePlaceDisplay(place, userLocation)`
4. Replace inline share handler with `<ShareButton place={place} />`
5. Replace inline favorite button JSX with `<FavoriteButton isFavorite={isFavorite} onToggle={() => onToggleFavorite?.(place.id)} />`
6. Replace inline open/closed badge with `<OpenStatusBadge isOpen={isOpen} variant="..." />`
7. Remove now-unused imports (`haversineDistance`, `PRICE_LEVEL_SYMBOL`, `getRatingColor`, `getRatingGlow`, `getCategoryColor`, `sharePlace`, `toast`, `Share2`, `Heart` — only if no longer used directly)

For `place-detail-sheet.tsx` specifically:
- Import `OpeningHours` from `./place-detail-sheet/opening-hours`
- Replace the IIFE block (lines 681-756) with `<OpeningHours descriptions={descriptions} />` where `descriptions` is `place.regularOpeningHours?.weekdayDescriptions || place.currentOpeningHours?.weekdayDescriptions || []`
- Use `ShareButton` with `variant="outline"` and `stopPropagation={false}`
- Use `FavoriteButton` with `size="md"`
- Use `OpenStatusBadge` with `variant="plain"`

- [ ] **Step 7: Remove duplicate `formatDistance` from `location-search.tsx`**

In `src/components/location-search.tsx`:
1. Remove the local `formatDistance` function (lines 64-68)
2. Import `{ formatDistance } from "@/lib/geo"` (already imported if Task 1 was done)
3. Update the call site — the local version accepts `undefined`, so wrap: `meters ? formatDistance(meters) : null`

- [ ] **Step 8: Verify and commit**

Run: `bun run build && bun run typecheck`
```bash
git add src/hooks/use-place-display.ts src/components/favorite-button.tsx src/components/share-button.tsx src/components/open-status-badge.tsx src/components/place-detail-sheet/ src/components/place-card.tsx src/components/place-list-item.tsx src/components/place-detail-sheet.tsx src/components/location-search.tsx
git commit -m "refactor: deduplicate shared display logic across card/list/detail components"
```

---

### Task 5: Extract hooks from `places-explorer.tsx`

**Files:**
- Create: `src/hooks/use-location-state.ts`
- Create: `src/hooks/use-places.ts`
- Create: `src/hooks/use-place-detail.ts`
- Modify: `src/components/places-explorer.tsx`

**Depends on Tasks 1 and 4.**

Read `src/components/places-explorer.tsx` completely before starting. The current file is ~1137 lines. Extract 3 hooks, keeping the orchestrator intact.

- [ ] **Step 1: Create `src/hooks/use-location-state.ts`**

Extract from `places-explorer.tsx`:
- Lines 79-89: `gpsLocation`, `locationSource`, `locationStatus` state
- Lines 168-181: `location` useMemo, `locationLabel` derivation
- Lines 252-278: geolocation `useEffect`
- Lines 348-354: `useMyLocation` callback

The hook takes nuqs `searchParams` and `setSearchParams` as parameters (to read/write lat/lng/q):

```ts
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"

type LocationSource = "gps" | "search"
type LocationStatus = "pending" | "granted" | "denied" | "error"

interface UseLocationStateOptions {
  searchParams: { lat: number | null; lng: number | null; q: string | null }
  setSearchParams: (params: Record<string, unknown>) => void
}

export function useLocationState({
  searchParams,
  setSearchParams,
}: UseLocationStateOptions) {
  const urlHasLocation =
    searchParams.lat !== null && searchParams.lng !== null

  const [gpsLocation, setGpsLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locationSource, setLocationSource] = useState<LocationSource>(
    urlHasLocation ? "search" : "gps"
  )
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    urlHasLocation ? "granted" : "pending"
  )

  // Derive current location
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

  // Request geolocation
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

  // Switch back to GPS
  const useMyLocation = useCallback(() => {
    if (gpsLocation) {
      setSearchParams({ lat: null, lng: null, q: null })
      setLocationSource("gps")
    }
  }, [gpsLocation, setSearchParams])

  return {
    location,
    locationLabel,
    locationSource,
    locationStatus,
    gpsLocation,
    setLocationSource,
    setLocationStatus,
    useMyLocation,
  }
}
```

- [ ] **Step 2: Create `src/hooks/use-places.ts`**

Extract from `places-explorer.tsx`:
- Lines 93-94: `places`, `loading` state
- Lines 281-305: `fetchPlaces` callback and its `useEffect`

```ts
"use client"

import { useState, useEffect, useCallback } from "react"
import type { Place } from "@/lib/types"

export function usePlaces(
  location: { lat: number; lng: number } | null,
  radius: number
) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)

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

  return { places, loading, fetchPlaces }
}
```

- [ ] **Step 3: Create `src/hooks/use-place-detail.ts`**

Extract from `places-explorer.tsx`:
- Lines 95-97: `detailPlace`, `detailOpen`, `detailLoading` state
- Lines 357-419: `openDetail`, `closeDetail`, `handleDetailOpenChange`, and the URL-restoration `useEffect`

```ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { Place } from "@/lib/types"

export function usePlaceDetail(
  searchParams: { place: string | null },
  setSearchParams: (params: Record<string, unknown>, options?: Record<string, unknown>) => void
) {
  const [detailPlace, setDetailPlace] = useState<Place | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

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

  return {
    detailPlace,
    detailOpen,
    detailLoading,
    openDetail,
    closeDetail,
    handleDetailOpenChange,
  }
}
```

- [ ] **Step 4: Update `places-explorer.tsx` to use the 3 hooks**

1. Import the 3 new hooks
2. Remove the extracted state declarations, callbacks, and effects
3. Wire the hooks into the orchestrator:

```ts
const {
  location, locationLabel, locationSource, locationStatus,
  gpsLocation, setLocationSource, setLocationStatus, useMyLocation,
} = useLocationState({ searchParams, setSearchParams })

const { places, loading, fetchPlaces } = usePlaces(location, radius)

const {
  detailPlace, detailOpen, detailLoading,
  openDetail, closeDetail, handleDetailOpenChange,
} = usePlaceDetail(searchParams, setSearchParams)
```

4. Keep `handlePlaceSelect`, `handleRecentSelect`, `filteredPlaces`, and all rendering in the orchestrator
5. Update `handlePlaceSelect` to use `setLocationSource` and `setLocationStatus` from the hook
6. **Important:** The hook's `useMyLocation` only handles location state. The original also called `setMobileSearchOpen(false)`. In the orchestrator, wrap the call site: either call `useMyLocation()` + `setMobileSearchOpen(false)` together, or create a local wrapper. Same applies to `handlePlaceSelect` which also closes mobile search.
7. `place-detail-sheet.tsx` still needs a direct import of `PRICE_LEVEL_MAP` from `@/lib/constants` (used for displaying price level text at line 389) — this is separate from the `priceSymbol` returned by `usePlaceDisplay`

- [ ] **Step 5: Verify and commit**

Run: `bun run build && bun run typecheck`
```bash
git add src/hooks/use-location-state.ts src/hooks/use-places.ts src/hooks/use-place-detail.ts src/components/places-explorer.tsx
git commit -m "refactor: extract use-location-state, use-places, use-place-detail hooks"
```

---

### Task 6: Extract `PlacesHeader` component

**Files:**
- Create: `src/components/places-header.tsx`
- Modify: `src/components/places-explorer.tsx`

**Depends on Task 5.**

- [ ] **Step 1: Create `src/components/places-header.tsx`**

Read `places-explorer.tsx` and extract the entire `<header>` block (currently the block from the `<header>` tag through the closing `</header>`, plus the mobile search conditional, the view toggle, theme toggle, favorites button, and mobile filter sheet). Include all the supporting state and logic (theme toggle with View Transition API, mounted state for theme).

The component receives props for everything it needs from the parent. Read the current source to get the exact JSX and className strings.

Key imports this component needs: `useState`, `useEffect`, `useCallback`, `useRef` from React, `flushSync` from `react-dom`, `motion`, `AnimatePresence` from `motion/react`, `useTheme` from `next-themes`, all the lucide icons used in the header, UI components (`Button`, `Input`, `Badge`, `Tooltip*`, `Sheet*`), `FiltersPanel`, `QuickFilters`.

- [ ] **Step 2: Update `places-explorer.tsx`**

Replace the header JSX block with `<PlacesHeader ...props />`. Remove all header-specific imports that are no longer used in the orchestrator (theme-related, view-toggle icons, etc.).

Also extract the QuickFilters bar rendering into the header component or keep it in the orchestrator — follow whichever produces cleaner code.

- [ ] **Step 3: Verify and commit**

Run: `bun run build && bun run typecheck`
```bash
git add src/components/places-header.tsx src/components/places-explorer.tsx
git commit -m "refactor: extract PlacesHeader component from places-explorer"
```

---

### Task 7: Extract empty state components

**Files:**
- Create: `src/components/places-empty-state.tsx`
- Modify: `src/components/places-explorer.tsx`

**Depends on Task 6.**

- [ ] **Step 1: Create `src/components/places-empty-state.tsx`**

Read `places-explorer.tsx` and extract the 3 empty state screens into a single file with exported components:

```tsx
"use client"

import { motion } from "motion/react"
import { Heart, SearchX, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FilterState } from "@/lib/types"
import { DEFAULT_FILTERS } from "@/lib/constants"

interface FavoritesEmptyProps {
  onShowAll: () => void
  reducedMotion: boolean | null
}

export function FavoritesEmptyState({ onShowAll, reducedMotion }: FavoritesEmptyProps) {
  // Extract the "no favorites" block from places-explorer.tsx
  return ( ... )
}

interface FilterEmptyProps {
  onClearFilters: () => void
  reducedMotion: boolean | null
}

export function FilterEmptyState({ onClearFilters, reducedMotion }: FilterEmptyProps) {
  // Extract the "no filter results" block
  return ( ... )
}

interface NoResultsEmptyProps {
  onRetry: () => void
}

export function NoResultsEmptyState({ onRetry }: NoResultsEmptyProps) {
  // Extract the "no places found" block
  return ( ... )
}
```

Copy the exact JSX from the current empty state blocks in `places-explorer.tsx`.

- [ ] **Step 2: Update `places-explorer.tsx`**

Replace the inline empty state JSX with the new components. Remove any imports that are no longer used.

- [ ] **Step 3: Verify and commit**

Run: `bun run build && bun run typecheck`
```bash
git add src/components/places-empty-state.tsx src/components/places-explorer.tsx
git commit -m "refactor: extract empty state components from places-explorer"
```

---

## Final Verification

After all 7 tasks are complete, verify:
1. `bun run build && bun run typecheck` — clean
2. `places-explorer.tsx` is ~300 lines (down from 1137)
3. No imports from `@/lib/types` reference runtime functions (only types/interfaces)
4. No duplicate `formatDistance` in `location-search.tsx`
5. All 7 `unoptimized` props are still present on images
