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
| Migration scope | All URL state at once | Single consistent system, no hybrid state |

## Design

### 1. nuqs Migration & URL State

#### New file: `lib/search-params.ts`

All URL parsers defined in a single shared file:

```ts
import {
  parseAsFloat, parseAsInteger, parseAsString,
  parseAsBoolean, parseAsStringLiteral,
  createSearchParamsCache
} from 'nuqs/server'

const sortOptions = ['rating', 'reviewCount', 'distance'] as const

export const searchParamsParsers = {
  // Location
  lat: parseAsFloat,
  lng: parseAsFloat,
  q: parseAsString,                                         // location label

  // Search/sort
  s: parseAsStringLiteral(sortOptions).withDefault('rating'),
  r: parseAsInteger.withDefault(1500),                      // radius

  // Filters
  mr: parseAsFloat,                                         // minRating
  mrc: parseAsInteger,                                      // minReviewCount
  pl: parseAsString,                                        // priceLevels (comma-separated)
  on: parseAsBoolean,                                       // openNow
  del: parseAsBoolean,                                      // delivery
  din: parseAsBoolean,                                      // dineIn
  to: parseAsBoolean,                                       // takeout
  veg: parseAsBoolean,                                      // servesVegetarianFood
  out: parseAsBoolean,                                      // outdoorSeating
  res: parseAsBoolean,                                      // reservable
  grp: parseAsBoolean,                                      // goodForGroups
  mus: parseAsBoolean,                                      // liveMusic
  ckl: parseAsBoolean,                                      // servesCocktails
  bf: parseAsBoolean,                                       // servesBreakfast
  lu: parseAsBoolean,                                       // servesLunch
  dn: parseAsBoolean,                                       // servesDinner
  br: parseAsBoolean,                                       // servesBrunch
  alc: parseAsBoolean,                                      // servesAlcohol

  // Place detail (NEW)
  place: parseAsString,                                     // place ID for detail sheet
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
```

#### Setup changes

- **`app/layout.tsx`**: Wrap children with `<NuqsAdapter>` from `nuqs/adapters/next/app`
- **`lib/url-state.ts`**: DELETE this file entirely
- **`places-explorer.tsx`**: Remove manual debounced `router.replace()` sync, use `useQueryStates(searchParamsParsers)` instead

#### Place detail flow

1. Card clicked → `setSearchParams({ place: placeId })` with `{ history: 'push' }`
2. URL updates: `/?...&place=ChIJxxx`
3. `useEffect` watches `place` param — when non-null, fetches detail + opens sheet
4. Sheet closed → `setSearchParams({ place: null })` → param removed from URL
5. Browser back → `place` param removed → sheet closes
6. Page refresh with `place` param → auto-fetch + open sheet

#### Migration details

- Boolean filters: `parseAsBoolean` (URL shows `?on=true` or absent)
- Price levels: kept as `parseAsString` with comma-separated values for backward compat
- Default values: `s` defaults to `'rating'`, `r` defaults to `1500` — matching current behavior
- `clearOnDefault: true` (nuqs default) keeps URLs clean
- Location params (`lat`, `lng`, `q`) have no defaults — null when no location selected

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
- Desktop sidebar remains `sticky top-14` unchanged

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `nuqs` dependency |
| `app/layout.tsx` | Add `NuqsAdapter` wrapper |
| `app/page.tsx` | Pass searchParams to cache if needed |
| `lib/search-params.ts` | **NEW** — all URL parsers |
| `lib/url-state.ts` | **DELETE** |
| `components/places-explorer.tsx` | Replace manual URL sync with `useQueryStates`, add place detail URL logic, restructure header layout, make quick filters sticky |
| `components/location-search.tsx` | Adapt for new header layout (mobile search overlay mode) |
| `components/quick-filters.tsx` | Add sticky positioning and frosted glass background |
| `components/place-detail-sheet.tsx` | Accept onClose callback that clears `place` param |
| `components/filters-panel.tsx` | Receive filter state from nuqs instead of props (or keep props, driven by nuqs in parent) |

## Testing Criteria

- [ ] All existing filter URL params work as before (backward compatible URLs)
- [ ] Place detail opens via URL param and persists across refresh
- [ ] Browser back button closes place detail sheet
- [ ] Shared URLs with `?place=...` open the detail correctly
- [ ] Header stays visible on scroll (desktop & mobile)
- [ ] Quick filters stay visible on scroll (desktop & mobile)
- [ ] Mobile search overlay opens/closes correctly
- [ ] Location badge shows current location name
- [ ] Desktop sidebar filters still work
- [ ] Theme toggle, favorites, view mode toggle still work
- [ ] Pull-to-refresh still works
