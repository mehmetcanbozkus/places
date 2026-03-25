# Header Redesign & nuqs URL State Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all URL state to nuqs, add place detail URL persistence, redesign header to be compact with sticky quick filters.

**Architecture:** Replace manual `router.replace()` URL sync with nuqs `useQueryStates`. Restructure header into single row with location badge. Move quick filters outside `<main>` to enable sticky positioning.

**Tech Stack:** nuqs, Next.js 16, React 19, shadcn/ui, motion, tailwindcss 4

**Spec:** `docs/superpowers/specs/2026-03-25-header-url-state-redesign.md`

**Notes:**
- Line number references are for the *original* source files. After each task, line numbers shift — search by content patterns, not exact line numbers.
- The spec defines `createSearchParamsCache` for potential future SSR use. This plan omits it since the app is fully client-rendered. Add it later if SSR is introduced.
- The `Suspense` wrapper around `PlacesExplorerInner` can remain after removing `useSearchParams` — it's harmless and provides a loading fallback.
- Boolean serialization uses a two-layer approach: the custom parser serializes `false` as `""`, but setter helpers always pass `null` for falsy booleans to remove the param from URL entirely.

---

### Task 1: Install nuqs and create search params

**Files:**
- Create: `lib/search-params.ts`
- Modify: `package.json`

- [ ] **Step 1: Install nuqs**

```bash
npm install nuqs
```

- [ ] **Step 2: Create `lib/search-params.ts`**

```ts
import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  createParser,
} from "nuqs"

const sortOptions = ["rating", "reviewCount", "distance"] as const

// Custom boolean parser: accepts "1"/"true" on read, writes "1" for backward compat
export const parseAsLegacyBoolean = createParser({
  parse: (value: string) => value === "1" || value === "true",
  serialize: (value: boolean) => (value ? "1" : ""),
  eq: (a, b) => a === b,
})

// Custom parser for PriceLevel[] <-> comma-separated string
export const parseAsPriceLevels = createParser({
  parse: (value: string) => value.split(",").filter(Boolean),
  serialize: (value: string[]) => value.join(","),
  eq: (a, b) => a.join(",") === b.join(","),
})

export const searchParamsParsers = {
  // Location
  lat: parseAsFloat,
  lng: parseAsFloat,
  q: parseAsString,

  // Search/sort
  s: parseAsStringLiteral(sortOptions).withDefault("rating"),
  r: parseAsInteger.withDefault(3000),

  // Filters
  mr: parseAsFloat.withDefault(0),
  mrc: parseAsInteger.withDefault(0),
  pl: parseAsPriceLevels,
  on: parseAsLegacyBoolean,
  del: parseAsLegacyBoolean,
  din: parseAsLegacyBoolean,
  to: parseAsLegacyBoolean,                  // takeout (URL key is "to", maps to FilterState.takeout)
  veg: parseAsLegacyBoolean,
  out: parseAsLegacyBoolean,
  res: parseAsLegacyBoolean,
  grp: parseAsLegacyBoolean,
  mus: parseAsLegacyBoolean,
  ckl: parseAsLegacyBoolean,
  bf: parseAsLegacyBoolean,
  lu: parseAsLegacyBoolean,
  dn: parseAsLegacyBoolean,
  br: parseAsLegacyBoolean,
  alc: parseAsLegacyBoolean,

  // Place detail
  place: parseAsString,
}
```

**Important:** The URL param keys must match exactly what's currently used in `lib/url-state.ts` FILTER_KEYS. The key `to` is used for takeout (not `takeout`). Double-check against the existing `buildUrlParams` function.

- [ ] **Step 3: Verify the file compiles**

```bash
npx tsc --noEmit lib/search-params.ts 2>&1 | head -20
```

Expected: no errors (or only unrelated errors from other files)

- [ ] **Step 4: Commit**

```bash
git add lib/search-params.ts package.json package-lock.json
git commit -m "feat: add nuqs and create search params parsers"
```

---

### Task 2: Add NuqsAdapter to layout

**Files:**
- Modify: `app/layout.tsx:31-33`

- [ ] **Step 1: Add NuqsAdapter wrapper**

In `app/layout.tsx`, add `import { NuqsAdapter } from 'nuqs/adapters/next/app'` at the top, then wrap the body contents:

```tsx
<body>
  <NuqsAdapter>
    <ThemeProvider>{children}</ThemeProvider>
    <Toaster position="bottom-center" />
  </NuqsAdapter>
</body>
```

`NuqsAdapter` must wrap `ThemeProvider` — it's the outermost provider.

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Open browser, verify page loads without errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add NuqsAdapter to root layout"
```

---

### Task 3: Migrate PlacesExplorer URL state to nuqs

This is the largest task. Replace the manual debounced `router.replace()` sync with `useQueryStates`.

**Files:**
- Modify: `components/places-explorer.tsx`

**Reference for current state locations:**
- Lines 57: `import { parseUrlState, buildUrlParams } from "@/lib/url-state"` — REMOVE
- Lines 67-68: `useSearchParams()` and `useRouter()` — REMOVE
- Lines 69-70: `urlParsed` and `urlState` refs — REMOVE
- Lines 72-96: Individual `useState` for location/sort/radius/filters initialized from urlState — CHANGE to derive from nuqs
- Lines 165-191: Debounced URL sync effect — REMOVE entirely

- [ ] **Step 1: Replace imports and add nuqs hook**

Remove:
```ts
import { useSearchParams, useRouter } from "next/navigation"
import { parseUrlState, buildUrlParams } from "@/lib/url-state"
```

Add:
```ts
import { useQueryStates } from "nuqs"
import { searchParamsParsers } from "@/lib/search-params"
```

- [ ] **Step 2: Replace state initialization**

Remove the `urlParsed`, `urlState` refs and all individual `useState` calls for `location`, `locationSource`, `locationLabel`, `locationStatus`, `filters`, `sort`, `radius`.

Replace with:

```ts
const [searchParams, setSearchParams] = useQueryStates(searchParamsParsers)

// Derive location from URL params
const urlHasLocation = searchParams.lat !== null && searchParams.lng !== null

// Local state that is NOT in URL
const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
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
```

- [ ] **Step 3: Create derived values and helper setters**

```ts
// Derive current location (from URL for search, from GPS state for GPS)
const location = useMemo(() => {
  if (locationSource === "search" && searchParams.lat !== null && searchParams.lng !== null) {
    return { lat: searchParams.lat, lng: searchParams.lng }
  }
  return gpsLocation
}, [locationSource, searchParams.lat, searchParams.lng, gpsLocation])

const locationLabel = searchParams.q ?? (locationSource === "gps" ? "Mevcut Konum" : "")

// Derive FilterState from URL params
const filters: FilterState = useMemo(() => ({
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
}), [searchParams])

const sort = searchParams.s
const radius = searchParams.r
```

- [ ] **Step 4: Create setter helpers that write to nuqs**

```ts
const setFilters = useCallback((newFilters: FilterState) => {
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
}, [setSearchParams])

const setSort = useCallback((newSort: SortOption) => {
  setSearchParams({ s: newSort })
}, [setSearchParams])

const setRadius = useCallback((newRadius: number) => {
  setSearchParams({ r: newRadius })
}, [setSearchParams])
```

- [ ] **Step 5: Remove the debounced URL sync effect**

Delete the entire `useEffect` block at lines 167-191 (the one with `syncTimer` and `buildUrlParams`).
Also delete the `syncTimer` ref at line 166.

- [ ] **Step 6: Update `handlePlaceSelect` to write location to URL and close mobile search**

In the `handlePlaceSelect` callback, after getting coordinates, replace the `setLocation`/`setLocationSource`/`setLocationLabel` calls with:

```ts
if (data.location) {
  setSearchParams({
    lat: data.location.latitude,
    lng: data.location.longitude,
    q: label,
  })
  setLocationSource("search")
  setMobileSearchOpen(false) // Close mobile search overlay after selection
  if (locationStatus !== "granted") {
    setLocationStatus("granted")
  }
}
```

Also update `useMyLocation` (Step 7) and `handleRecentSelect` to close mobile search:
```ts
// In useMyLocation:
setMobileSearchOpen(false)

// handleRecentSelect already delegates to handlePlaceSelect, so it's covered.
```

- [ ] **Step 7: Update `useMyLocation` to clear URL location**

```ts
const useMyLocation = useCallback(() => {
  if (gpsLocation) {
    setSearchParams({ lat: null, lng: null, q: null })
    setLocationSource("gps")
  }
}, [gpsLocation, setSearchParams])
```

- [ ] **Step 8: Update geolocation effect**

The GPS effect should check `urlHasLocation` instead of `urlState.current.location`:

```ts
useEffect(() => {
  if (urlHasLocation) return
  // ... rest of geolocation logic stays the same
  // In the success callback, set gpsLocation but DON'T call setSearchParams
}, []) // eslint-disable-line -- run once on mount
```

Note: `urlHasLocation` is computed at render time, so the initial value is captured in the closure. This is fine for a mount-only effect.

- [ ] **Step 9: Update `fetchPlaces` to use derived `location`**

The `fetchPlaces` callback already uses `location` and `radius` — since these are now derived from nuqs/state, the dependency array must include the correct values. `location` is a `useMemo` so it's stable. `radius` comes from `searchParams.r`. Verify the `useCallback` dependencies.

- [ ] **Step 10: Verify the app works**

```bash
npm run dev
```

Manual checks:
- Change filters → URL updates
- Change sort → URL updates
- Change radius → URL updates
- Search for a location → lat/lng/q appear in URL
- Use GPS → lat/lng/q removed from URL
- Refresh page with filter URL → filters restored
- Test backward compat: manually type `?on=1&del=1` → filters activate

- [ ] **Step 11: Commit**

```bash
git add components/places-explorer.tsx
git commit -m "feat: migrate URL state management to nuqs"
```

---

### Task 4: Add place detail URL state

**Files:**
- Modify: `components/places-explorer.tsx`
- Modify: `components/place-detail-sheet.tsx`

- [ ] **Step 1: Update `openDetail` to set URL param**

In `places-explorer.tsx`, modify the `openDetail` callback:

```ts
const openDetail = useCallback(async (place: Place) => {
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
}, [setSearchParams])
```

- [ ] **Step 2: Handle sheet close — clear URL param**

Update the `onOpenChange` handler for the detail sheet. Replace the direct `setDetailOpen` with a wrapper:

```ts
const closeDetail = useCallback(() => {
  setDetailOpen(false)
  setDetailPlace(null)
  setSearchParams({ place: null }, { history: "push" })
}, [setSearchParams])

const handleDetailOpenChange = useCallback((open: boolean) => {
  if (!open) {
    closeDetail()
  }
}, [closeDetail])
```

Then in JSX, change `onOpenChange={setDetailOpen}` to `onOpenChange={handleDetailOpenChange}`.

- [ ] **Step 3: Add `toast` import and effect to restore detail from URL on mount/back**

First, add the toast import at the top of `places-explorer.tsx`:
```ts
import { toast } from "sonner"
```

Then add the restoration effect:

```ts
// Restore place detail from URL param (cold start or browser back)
useEffect(() => {
  const placeId = searchParams.place
  if (placeId && !detailOpen) {
    // Open sheet with loading skeleton
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
    // URL param removed (browser back) — close sheet
    setDetailOpen(false)
    setDetailPlace(null)
  }
}, [searchParams.place]) // eslint-disable-line -- intentionally minimal deps
```

- [ ] **Step 4: Update PlaceDetailSheet to show skeleton without a place object**

In `components/place-detail-sheet.tsx`, the current logic shows skeleton only when `loading` is true. For cold start, `place` is null AND `loading` is true. Update the condition:

```tsx
<AnimatePresence mode="wait">
  {loading && !place ? (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <DetailSkeleton />
    </motion.div>
  ) : place ? (
    // ... existing content render
  ) : null}
</AnimatePresence>
```

This already matches the existing code structure at lines 279-290 — verify the condition `loading` shows skeleton correctly when `place` is null.

- [ ] **Step 5: Verify place detail URL flow**

```bash
npm run dev
```

Manual checks:
- Click a place card → URL gets `?place=ChIJxxx`
- Close sheet → `place` param removed from URL
- Open a place, then press browser back → sheet closes
- Copy URL with `?place=...`, open in new tab → sheet opens with skeleton, then shows detail
- Enter invalid place ID in URL → error toast, param cleared

- [ ] **Step 6: Commit**

```bash
git add components/places-explorer.tsx components/place-detail-sheet.tsx
git commit -m "feat: add place detail URL state with browser back support"
```

---

### Task 5: Redesign header — compact single row with location badge

**Files:**
- Modify: `components/places-explorer.tsx:497-689` (header section)
- Modify: `components/location-search.tsx`

- [ ] **Step 1: Verify mobile search state exists**

`mobileSearchOpen` state was already declared in Task 3 Step 2. Verify it exists before proceeding.

- [ ] **Step 2: Add `Search` icon import**

Add `Search` to the lucide-react imports in `places-explorer.tsx` (if not already imported).

- [ ] **Step 3: Rewrite the header JSX**

Replace the entire `<header>` block (lines 497-689) with the new layout:

```tsx
<header
  className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl"
  style={{
    borderBottom: "1px solid transparent",
    borderImage:
      "linear-gradient(to right, var(--primary), var(--secondary)) 1",
  }}
>
  <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
    {/* Mobile search overlay */}
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
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="max-w-[120px] truncate sm:max-w-[200px]">
              {locationLabel}
            </span>
          </div>
        )}

        {/* Desktop search — hidden on mobile */}
        <div className="hidden min-w-0 flex-1 lg:flex lg:justify-center">
          {searchComponent}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1.5 ml-auto">
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

          {/* View toggle — hidden on mobile */}
          <div className="hidden items-center rounded-lg border p-0.5 sm:flex">
            {/* ... existing view toggle buttons unchanged ... */}
          </div>

          {/* Theme toggle — existing code unchanged */}

          {/* Refresh — existing code unchanged */}

          {/* Favorites counter — existing code unchanged */}

          {/* Mobile filter toggle — existing code unchanged */}
        </div>
      </>
    )}
  </div>
</header>
```

Key changes:
- **Removed** the location label sub-row (lines 680-688)
- **Added** location badge pill next to logo
- **Added** mobile search overlay mode (ChevronLeft + full-width search)
- **Added** Search icon button for mobile (triggers overlay)
- **Moved** search to desktop-only visibility (`hidden lg:flex`)

- [ ] **Step 4: Import `ChevronLeft` and `Search` from lucide-react**

Add to imports at top if not already present:
```ts
import { ..., ChevronLeft, Search } from "lucide-react"
```

Note: `ChevronLeft` may not be imported in places-explorer.tsx — check and add.

- [ ] **Step 5: Verify header layout**

```bash
npm run dev
```

Manual checks:
- Desktop: Logo + location badge + search input + action buttons all on one line
- Mobile: Logo + location badge + search icon + action buttons
- Mobile: Tap search icon → overlay with back arrow + full-width search
- Mobile: Tap back arrow → normal header restored
- Location badge shows current location name, truncated if long
- Old location label sub-row is gone

- [ ] **Step 6: Commit**

```bash
git add components/places-explorer.tsx
git commit -m "feat: redesign header to compact single row with location badge"
```

---

### Task 6: Make quick filters sticky

**Files:**
- Modify: `components/places-explorer.tsx` (DOM restructure)
- Modify: `components/quick-filters.tsx` (add sticky styles)

- [ ] **Step 1: Move QuickFilters outside `<main>` in PlacesExplorer**

Currently quick filters are inside `<main>` at line 714-727. Move them to be a sibling element ABOVE the flex `<main>` container.

The new DOM structure in the main return:

```tsx
{/* Header (already sticky) */}
<header>...</header>

{/* Quick filters — moved outside main, now sticky */}
{!loading && places.length > 0 && (
  <QuickFilters
    filters={filters}
    onFiltersChange={setFilters}
    showFavoritesOnly={showFavoritesOnly}
    onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
    favoritesCount={favoritesCount}
  />
)}

{/* Main layout */}
<div className="mx-auto flex w-full max-w-full flex-1 gap-0 overflow-x-clip xl:max-w-7xl">
  {/* Desktop sidebar */}
  <aside>...</aside>
  {/* Content — quick filters no longer here */}
  <main className="min-w-0 flex-1 p-4 lg:p-6">
    {/* Grid/List content only */}
  </main>
</div>
```

Also change `overflow-hidden` to `overflow-x-clip` on the flex container (line 692) — `clip` prevents horizontal overflow without breaking sticky inside children (though quick filters are now outside, this is a good practice).

- [ ] **Step 2: Add sticky styles to QuickFilters component**

In `components/quick-filters.tsx`, update the root `<div>`:

```tsx
<div
  className="sticky top-[56px] z-30 bg-background/80 px-4 py-2 backdrop-blur-xl lg:px-6"
  style={{ scrollbarWidth: "none" }}
>
  <div
    className="scrollbar-hide mx-auto flex max-w-7xl gap-2 overflow-x-auto"
    style={{ scrollbarWidth: "none" }}
  >
    {/* ... existing chips ... */}
  </div>
</div>
```

Key additions:
- `sticky top-[56px]` — sticks below header (h-14 = 56px)
- `z-30` — below header (z-40) but above content
- `bg-background/80 backdrop-blur-xl` — frosted glass matching header
- `px-4 py-2 lg:px-6` — padding to match content area
- Inner div with `mx-auto max-w-7xl` to match page width

- [ ] **Step 3: Verify sticky behavior**

```bash
npm run dev
```

Manual checks:
- Scroll down → header AND quick filters both stay visible
- Quick filters have frosted glass background
- Desktop sidebar is still sticky and properly positioned
- Mobile: quick filters scroll horizontally, stay sticky vertically
- When loading or no places, quick filters are hidden

- [ ] **Step 4: Commit**

```bash
git add components/places-explorer.tsx components/quick-filters.tsx
git commit -m "feat: make quick filters sticky below header"
```

---

### Task 7: Delete old URL state file and clean up

**Files:**
- Delete: `lib/url-state.ts`
- Modify: `components/places-explorer.tsx` (verify no remaining imports)

- [ ] **Step 1: Delete `lib/url-state.ts`**

```bash
rm lib/url-state.ts
```

- [ ] **Step 2: Verify no remaining imports**

```bash
grep -r "url-state" --include="*.ts" --include="*.tsx" .
```

Expected: no results. If any file still imports from `url-state`, update it.

- [ ] **Step 3: Verify no `useRouter` or `useSearchParams` remaining in places-explorer**

```bash
grep -n "useRouter\|useSearchParams\|buildUrlParams\|parseUrlState" components/places-explorer.tsx
```

Expected: no results.

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors (or only pre-existing ones unrelated to our changes).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete old url-state.ts, clean up imports"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: successful build with no errors.

- [ ] **Step 2: Manual end-to-end verification**

Open the app and verify all testing criteria from the spec:

1. Existing bookmarked URLs with `?on=1&del=1` format still work
2. New URLs serialize booleans as `"1"`
3. Default radius is 3000
4. Place detail opens via URL param and persists across refresh
5. Cold start with `?place=ChIJxxx` shows loading skeleton then detail
6. Invalid place ID in URL shows error toast and clears param
7. Browser back button closes place detail sheet
8. GPS location is NOT persisted to URL
9. Page reload without lat/lng triggers GPS request
10. Header stays visible on scroll (desktop & mobile)
11. Quick filters stay visible on scroll (desktop & mobile)
12. Mobile search overlay opens/closes correctly
13. Location badge shows current location name
14. Desktop sidebar filters still work
15. Theme toggle, favorites, view mode toggle still work
16. Pull-to-refresh still works with sticky stack

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "fix: address issues found during final verification"
```
