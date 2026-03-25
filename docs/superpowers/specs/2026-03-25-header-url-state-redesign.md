# Header Redesign & nuqs URL State Migration

**Date:** 2026-03-25
**Status:** Approved

## Problem Statement

Three UX issues in the current places explorer:

1. **Disappearing filters on scroll:** Quick filters and location label row disappear when scrolling down, making the app feel disconnected.
2. **Location label on separate row:** The current location display sits on its own line below the header, wasting vertical space and looking awkward.
3. **Place detail not in URL:** Opening a place detail sheet doesn't update the URL. Page refresh loses the detail view, and links can't be shared.

Additionally, the current URL state management uses a manual debounced `router.replace()` approach — migrating to nuqs will provide a cleaner, type-safe, declarative solution.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scroll behavior | Header + Quick Filters both sticky | Users want persistent access to filters while browsing |
| Location placement | Badge next to logo + search input in header (single row) | Compact, no wasted vertical space |
| Mobile search | Hidden by default, icon reveals overlay | Space constraint on mobile |
| Place detail URL | Query param `?place=PLACE_ID` | Sheet overlay preserved, URL shareable, back button works |
| URL state library | nuqs (full migration) | Type-safe, declarative, replaces manual sync |
| Migration scope | All URL-persisted state migrated to nuqs | Filters, location, sort, radius, place detail. `viewMode` and `showFavoritesOnly` intentionally remain as local `useState` since they are ephemeral UI preferences, not shareable state. |

## Design

### 1. nuqs Migration & URL State

#### New file: `lib/search-params.ts`

All URL parsers defined in a single shared file:

```ts
import {
  parseAsFloat, parseAsInteger, parseAsString,
  parseAsStringLiteral, createParser,
  createSearchParamsCache
} from 'nuqs/server'

const sortOptions = ['rating', 'reviewCount', 'distance'] as const

// Custom boolean parser: accepts "1"/"true" on read, writes "1" for backward compat
const parseAsLegacyBoolean = createParser({
  parse: (value: string) => value === '1' || value === 'true',
  serialize: (value: boolean) => value ? '1' : '',
  eq: (a, b) => a === b,
})

// Custom parser for PriceLevel[] <-> comma-separated string
const parseAsPriceLevels = createParser({
  parse: (value: string) => value.split(',').filter(Boolean),
  serialize: (value: string[]) => value.join(','),
  eq: (a, b) => a.join(',') === b.join(','),
})

export const searchParamsParsers = {
  // Location
  lat: parseAsFloat,
  lng: parseAsFloat,
  q: parseAsString,                                         // location label

  // Search/sort
  s: parseAsStringLiteral(sortOptions).withDefault('rating'),
  r: parseAsInteger.withDefault(3000),                      // radius (matches current default)

  // Filters
  mr: parseAsFloat.withDefault(0),                          // minRating
  mrc: parseAsInteger.withDefault(0),                       // minReviewCount
  pl: parseAsPriceLevels,                                   // priceLevels
  on: parseAsLegacyBoolean,                                 // openNow
  del: parseAsLegacyBoolean,                                // delivery
  din: parseAsLegacyBoolean,                                // dineIn
  to: parseAsLegacyBoolean,                                 // takeout
  veg: parseAsLegacyBoolean,                                // servesVegetarianFood
  out: parseAsLegacyBoolean,                                // outdoorSeating
  res: parseAsLegacyBoolean,                                // reservable
  grp: parseAsLegacyBoolean,                                // goodForGroups
  mus: parseAsLegacyBoolean,                                // liveMusic
  ckl: parseAsLegacyBoolean,                                // servesCocktails
  bf: parseAsLegacyBoolean,                                 // servesBreakfast
  lu: parseAsLegacyBoolean,                                 // servesLunch
  dn: parseAsLegacyBoolean,                                 // servesDinner
  br: parseAsLegacyBoolean,                                 // servesBrunch
  alc: parseAsLegacyBoolean,                                // servesAlcohol

  // Place detail (NEW)
  place: parseAsString,                                     // place ID for detail sheet
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
```

#### Setup changes

- **`app/layout.tsx`**: Wrap children with `<NuqsAdapter>` from `nuqs/adapters/next/app`. Nesting order: `<html>` → `<body>` → `<NuqsAdapter>` → `<ThemeProvider>` → `{children}`. NuqsAdapter must be the outermost provider wrapping all components that use `useQueryStates`.
- **`app/page.tsx`**: Remains a client component. No `searchParamsCache.parse()` needed — `useQueryStates` handles client-side reading. The `searchParamsCache` export exists for potential future SSR use but is not required in the current architecture.
- **`lib/url-state.ts`**: DELETE this file entirely.
- **`places-explorer.tsx`**: Remove manual debounced `router.replace()` sync, use `useQueryStates(searchParamsParsers)` instead.

#### Location source handling

The current codebase distinguishes GPS vs search locations: GPS coordinates are NOT persisted to URL (they go stale), only search-selected coordinates are.

With nuqs, this distinction is maintained via conditional writes:
- **GPS location**: Stored only in local `useState` (`gpsLocation`). `lat`/`lng`/`q` URL params are NOT updated when location comes from GPS. If the user navigates via GPS, the URL has no `lat`/`lng` — on page reload, GPS is re-requested.
- **Search location**: When user selects a location from search, `setSearchParams({ lat, lng, q })` is called, persisting to URL.
- **`locationSource`** remains a local `useState` (not in URL). It's derived: if `lat`/`lng` exist in URL params on load → source is `"search"`. If absent → request GPS.

#### Place detail flow

1. Card clicked → `setSearchParams({ place: placeId })` with `{ history: 'push' }`
2. URL updates: `/?...&place=ChIJxxx`
3. `useEffect` watches `place` param — when non-null, fetches detail via `/api/places/[id]` + opens sheet
4. Sheet closed → `setSearchParams({ place: null })` → param removed from URL
5. Browser back → `place` param removed → sheet closes
6. Page refresh with `place` param → auto-fetch + open sheet

**Cold start with `?place=` param:**
- Sheet opens immediately with a loading skeleton (no `Place` object needed — the sheet shows a shimmer placeholder for photo, title, rating)
- Detail is fetched from `/api/places/[id]` — once loaded, skeleton replaces with real data
- If the place ID is invalid or API fails → sheet closes, `place` param cleared, toast error shown
- The nearby places list loads independently (from `lat`/`lng` params) — sheet opening does not depend on it
- If no `lat`/`lng` in URL either, GPS is requested first for nearby list, but the detail sheet still opens immediately from the `place` param

#### Migration details

- Boolean filters: Custom `parseAsLegacyBoolean` parser accepts both `"1"` (old format) and `"true"` on read, writes `"1"` for backward compatibility with existing bookmarked/shared URLs
- Price levels: Custom `parseAsPriceLevels` parser handles `string[]` ↔ comma-separated string conversion
- Default values: `s` defaults to `'rating'`, `r` defaults to `3000` (matching current behavior), `mr` defaults to `0`, `mrc` defaults to `0`
- `clearOnDefault: true` (nuqs default) keeps URLs clean
- Location params (`lat`, `lng`, `q`) have no defaults — null when no location selected (GPS mode)

### 2. Header Redesign

#### Desktop layout (single row)

```
┌──────────────────────────────────────────────────┐
│ 🍴 Nerede Yesem?  📍Kadıköy  [🔍 Ara..]  🔄🌙❤️ │
├──────────────────────────────────────────────────┤
│ [Favoriler] [Açık] [4.5+] [Delivery] [DineIn]...│
└──────────────────────────────────────────────────┘
```

- **Logo**: Left-aligned, UtensilsCrossed icon + "Nerede Yesem?" text
- **Location badge**: Next to logo, clickable, shows MapPin icon + location name, truncated if long
- **Search input**: After location badge, flexible width
- **Action buttons**: Right-aligned (view toggle, theme, refresh, favorites, mobile filter)

#### Mobile layout (normal state)

```
┌────────────────────────────┐
│ 🍴  📍 Kadıköy     🔍 🌙 ❤️│
└────────────────────────────┘
```

- Logo icon only (text hidden)
- Location badge (truncated)
- Search icon button (replaces full input)
- Theme toggle + favorites badge

#### Mobile layout (search active)

```
┌────────────────────────────┐
│ ← [🔍 Konum ara...]       │
│   Son aramalar...          │
│   Öneriler...              │
└────────────────────────────┘
```

- Back arrow closes search mode
- Full-width search input with autocomplete dropdown
- All other header elements hidden during search

#### Current location label row

The separate border-top location label row below the header is **removed entirely**. Location info moves to the header badge.

### 3. Sticky Quick Filters

#### DOM restructuring required

Quick filters are currently rendered inside `<main>` which has `overflow-x-hidden`. CSS `sticky` does not work inside an `overflow: hidden` ancestor. Quick filters must be moved **outside** the flex `<main>` container, placed between the header and main content at the top level of the component tree.

#### New DOM structure

```
<div> (min-h-screen flex flex-col)
  ├── Pull-to-refresh indicator
  ├── Header (sticky top-0 z-40)
  ├── Quick Filters (sticky top-[56px] z-30)  ← MOVED OUT of <main>
  ├── Main layout (flex)
  │   ├── Desktop sidebar (FiltersPanel)
  │   └── Main content (flex-1)
  │       └── Grid/List view
  ├── PlaceDetailSheet
  └── ScrollToTop
</div>
```

#### Sticky stack

```
z-40  │ Header        │ sticky top-0       (h-14 = 56px)
z-30  │ Quick Filters │ sticky top-[56px]
      │               │
      │ Content       │ scrollable
```

- Quick filters get `sticky top-[56px] z-30`
- Background: `bg-background/80 backdrop-blur-xl` (matching header frosted glass)
- Subtle bottom border/shadow when scrolled
- Hidden when loading or no places (current behavior preserved)

#### Desktop sidebar adjustment

The desktop sidebar (`FiltersPanel`) remains `sticky top-14`. Since quick filters are now a sibling element above `<main>` (not inside it), the sidebar's sticky positioning relative to the header is unchanged. The sidebar height `h-[calc(100vh-3.5rem)]` remains correct because it only accounts for the header — the quick filters scroll naturally as a separate sticky element and don't affect the sidebar's viewport calculation.

#### Pull-to-refresh interaction

The pull-to-refresh indicator renders above the header as a `motion.div` that expands. With the new sticky stack, pulling down pushes both the header and quick filters down together, maintaining their relative positions. No special handling needed — the sticky elements follow their scroll container naturally.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `nuqs` dependency |
| `app/layout.tsx` | Add `NuqsAdapter` wrapper (outside ThemeProvider) |
| `lib/search-params.ts` | **NEW** — all URL parsers with custom boolean/price parsers |
| `lib/url-state.ts` | **DELETE** |
| `components/places-explorer.tsx` | Replace manual URL sync with `useQueryStates`, add place detail URL logic, restructure header layout, move quick filters out of `<main>`, adjust DOM structure |
| `components/location-search.tsx` | Adapt for new header layout (mobile search overlay mode) |
| `components/quick-filters.tsx` | Add sticky positioning, frosted glass background |
| `components/place-detail-sheet.tsx` | Add loading skeleton for cold start, accept onClose callback that clears `place` param |
| `components/filters-panel.tsx` | Receive filter state from nuqs-driven props in parent |

## Testing Criteria

- [ ] Existing bookmarked URLs with `?on=1&del=1` format still work (backward compat)
- [ ] New URLs serialize booleans as `"1"` (backward compat)
- [ ] Default radius is 3000 (not changed from current behavior)
- [ ] Place detail opens via URL param and persists across refresh
- [ ] Cold start with `?place=ChIJxxx` shows loading skeleton then detail
- [ ] Invalid place ID in URL shows error toast and clears param
- [ ] Browser back button closes place detail sheet
- [ ] Shared URLs with `?place=...` open the detail correctly
- [ ] GPS location is NOT persisted to URL (only search locations)
- [ ] Page reload without lat/lng triggers GPS request
- [ ] Header stays visible on scroll (desktop & mobile)
- [ ] Quick filters stay visible on scroll (desktop & mobile)
- [ ] Mobile search overlay opens/closes correctly
- [ ] Location badge shows current location name
- [ ] Desktop sidebar filters still work
- [ ] Theme toggle, favorites, view mode toggle still work
- [ ] Pull-to-refresh still works with sticky stack
- [ ] `viewMode` and `showFavoritesOnly` remain local state (not in URL)
