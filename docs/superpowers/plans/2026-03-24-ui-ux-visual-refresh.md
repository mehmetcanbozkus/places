# UI/UX Visual Refresh + Favorites System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Places app with a vibrant neon color system, micro-animations via Motion, and a localStorage-backed favorites system.

**Architecture:** Layered approach — foundational utilities first (color mapping, CSS variables, favorites hook), then visual upgrades to existing components, then favorites integration into the UI. Tasks 1-3 (utilities) and Tasks 8-13 (independent components) each produce buildable states. Tasks 4-7 form an atomic group: new props are added as optional with defaults in Tasks 4-6, and wired together in Task 7.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4 (oklch), Motion (motion/react), shadcn/ui, Lucide React, localStorage

**Spec:** `docs/superpowers/specs/2026-03-24-ui-ux-visual-refresh-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `hooks/use-favorites.ts` | localStorage-backed favorites hook with toggle/query API |

### Modified Files
| File | Changes |
|------|---------|
| `lib/types.ts` | Add `getCategoryColor()`, `getRatingGlow()` functions |
| `app/globals.css` | Add neon category CSS variables, glow utility classes |
| `components/place-card.tsx` | Neon category border, enhanced hover/entry animations, gradient overlay, favorite button, neon glow badges |
| `components/place-list-item.tsx` | Neon accent, favorite button, enhanced animations |
| `components/quick-filters.tsx` | Icons on chips, neon gradient active state, favorites chip, spring animations |
| `components/places-explorer.tsx` | Favorites state integration, showFavoritesOnly filter, header favorites counter, enhanced empty states, skeleton improvements |
| `components/filters-panel.tsx` | Collapse/expand animations, gradient slider track, pulse badge |
| `components/place-detail-sheet.tsx` | Photo index dots, neon feature badges, today highlight, favorite button |
| `components/blur-image.tsx` | Neon shimmer gradient |
| `components/scroll-to-top.tsx` | Neon gradient background, glow hover |
| `components/location-search.tsx` | Stagger dropdown animation, focus glow |
| `components/rating-breakdown.tsx` | Neon glow on rating display |

---

## Task 1: Category Color Mapping + Rating Glow Utilities

**Files:**
- Modify: `lib/types.ts:191-199` (after existing `getRatingColor`)

- [ ] **Step 1: Add `getCategoryColor` function to `lib/types.ts`**

Add after the existing `getRatingColor` function (line 199):

```typescript
const RESTAURANT_TYPES = new Set([
  "restaurant", "turkish_restaurant", "italian_restaurant", "chinese_restaurant",
  "japanese_restaurant", "mexican_restaurant", "thai_restaurant", "indian_restaurant",
  "seafood_restaurant", "steak_house", "pizza_restaurant", "hamburger_restaurant",
  "kebab_shop", "fast_food_restaurant", "meal_takeaway",
])
const CAFE_TYPES = new Set(["cafe", "coffee_shop", "tea_house", "bakery"])
const BAR_TYPES = new Set(["bar", "night_club", "pub", "wine_bar", "cocktail_bar"])
const PASTRY_TYPES = new Set(["pastry_shop", "dessert_shop", "ice_cream_shop", "confectionery"])

export interface CategoryColor {
  dark: string
  light: string
  category: string
}

export function getCategoryColor(primaryType?: string, types?: string[]): CategoryColor {
  const type = primaryType || types?.[0] || ""
  if (RESTAURANT_TYPES.has(type)) return { dark: "oklch(0.75 0.2 45)", light: "oklch(0.55 0.2 45)", category: "restaurant" }
  if (CAFE_TYPES.has(type)) return { dark: "oklch(0.75 0.2 145)", light: "oklch(0.45 0.18 145)", category: "cafe" }
  if (BAR_TYPES.has(type)) return { dark: "oklch(0.7 0.25 310)", light: "oklch(0.5 0.22 310)", category: "bar" }
  if (PASTRY_TYPES.has(type)) return { dark: "oklch(0.75 0.22 350)", light: "oklch(0.55 0.2 350)", category: "pastry" }
  return { dark: "oklch(0.75 0.18 230)", light: "oklch(0.5 0.18 230)", category: "other" }
}
```

- [ ] **Step 2: Add `getRatingGlow` function to `lib/types.ts`**

Add after `getCategoryColor`:

```typescript
export function getRatingGlow(rating: number): string {
  if (rating >= 4.5) return "0 0 12px oklch(0.7 0.2 145 / 0.4)"
  if (rating >= 3.5) return "0 0 12px oklch(0.7 0.15 85 / 0.4)"
  return "0 0 12px oklch(0.6 0.2 25 / 0.4)"
}
```

- [ ] **Step 3: Verify the app still builds**

Run: `cd /Users/elegant_it/projects/llm/places && npx next build 2>&1 | tail -5`
Expected: Build succeeds (new functions are exported but not yet consumed)

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add category color mapping and rating glow utilities"
```

---

## Task 2: Neon CSS Variables + Glow Utilities in globals.css

**Files:**
- Modify: `app/globals.css:7-74` (add variables to `:root` and `.dark`)

- [ ] **Step 1: Add neon category CSS variables to `:root` block**

Add before the closing `}` of `:root` (after line 39):

```css
    --neon-restaurant: oklch(0.55 0.2 45);
    --neon-cafe: oklch(0.45 0.18 145);
    --neon-bar: oklch(0.5 0.22 310);
    --neon-pastry: oklch(0.55 0.2 350);
    --neon-other: oklch(0.5 0.18 230);
    --neon-favorite: oklch(0.55 0.22 350);
```

- [ ] **Step 2: Add neon category CSS variables to `.dark` block**

Add before the closing `}` of `.dark` (after line 73):

```css
    --neon-restaurant: oklch(0.75 0.2 45);
    --neon-cafe: oklch(0.75 0.2 145);
    --neon-bar: oklch(0.7 0.25 310);
    --neon-pastry: oklch(0.75 0.22 350);
    --neon-other: oklch(0.75 0.18 230);
    --neon-favorite: oklch(0.75 0.22 350);
```

- [ ] **Step 3: Add glow utility classes in `@layer base`**

Add after the existing `body` rule inside `@layer base` (after line 128):

```css
  .glow-sm { box-shadow: 0 0 8px var(--glow-color, var(--primary)); }
  .glow-md { box-shadow: 0 0 15px var(--glow-color, var(--primary)); }
  .glow-lg { box-shadow: 0 0 25px var(--glow-color, var(--primary)); }
```

> **Note:** In Tailwind CSS v4, using `@layer base` for utilities has lower specificity. If these classes need to be overridden by Tailwind utilities later, move them to `@layer utilities` or use the `@utility` directive. For now, `@layer base` works since they are standalone classes not combined with other utility overrides.

- [ ] **Step 4: Verify the app still builds**

Run: `cd /Users/elegant_it/projects/llm/places && npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: add neon category CSS variables and glow utility classes"
```

---

## Task 3: Favorites Hook

**Files:**
- Create: `hooks/use-favorites.ts`

- [ ] **Step 1: Create `hooks/use-favorites.ts`**

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "favorites"

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setFavorites(JSON.parse(stored))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const toggle = useCallback((placeId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore
      }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (placeId: string) => favorites.includes(placeId),
    [favorites]
  )

  return { favorites, toggle, isFavorite, count: favorites.length }
}
```

- [ ] **Step 2: Verify the app still builds**

Run: `cd /Users/elegant_it/projects/llm/places && npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add hooks/use-favorites.ts
git commit -m "feat: add useFavorites localStorage hook"
```

---

## Task 4: Enhanced PlaceCard — Neon Borders, Animations, Favorite Button

**Files:**
- Modify: `components/place-card.tsx` (full rewrite of component)

- [ ] **Step 1: Update imports in `place-card.tsx`**

Replace the existing import block (lines 1-26) with:

```tsx
"use client"

import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Star,
  MessageSquare,
  MapPin,
  Clock,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
  Share2,
  Heart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BlurImage } from "./blur-image"
import type { Place } from "@/lib/types"
import {
  getPhotoUrl,
  PRICE_LEVEL_SYMBOL,
  formatDistance,
  formatReviewCount,
  haversineDistance,
  sharePlace,
  getRatingColor,
  getCategoryColor,
  getRatingGlow,
} from "@/lib/types"
```

- [ ] **Step 2: Update `PlaceCardProps` interface and component signature**

Replace the interface and the first lines of the component (lines 28-54):

```tsx
interface PlaceCardProps {
  place: Place
  userLocation?: { lat: number; lng: number } | null
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: (placeId: string) => void
}

export function PlaceCard({
  place,
  userLocation,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: PlaceCardProps) {
  const photoUrl = place.photos?.[0]
    ? getPhotoUrl(place.photos[0].name, 600)
    : null

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
```

- [ ] **Step 3: Add favorite and share handlers**

Replace the existing `handleShare` (lines 56-64) with:

```tsx
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await sharePlace(place)
    if (result === "copied") {
      toast.success("Panoya kopyalandı")
    } else if (result === "failed") {
      toast.error("Paylaşılamadı")
    }
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(place.id)
  }
```

- [ ] **Step 4: Replace the entire JSX return with enhanced card**

Replace everything from `return (` (line 66) to the end of the component:

```tsx
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { type: "spring", stiffness: 200, damping: 20 },
        },
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
      style={{
        borderTopWidth: "3px",
        borderTopColor: `var(--neon-${categoryColor.category})`,
      }}
    >
      {/* Photo */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {photoUrl ? (
          <BlurImage
            src={photoUrl}
            placeholderSrc={
              place.photos?.[0]
                ? getPhotoUrl(place.photos[0].name, 32)
                : undefined
            }
            alt={place.displayName.text}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.08]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay on photo */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Open/Closed badge with neon glow */}
        {isOpen !== undefined && (
          <div className="absolute top-3 left-3">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={
                isOpen
                  ? "bg-emerald-500/90 text-white backdrop-blur-sm hover:bg-emerald-500/90 shadow-[0_0_10px_oklch(0.7_0.2_145_/_0.4)]"
                  : "bg-red-500/90 text-white backdrop-blur-sm hover:bg-red-500/90 shadow-[0_0_10px_oklch(0.6_0.2_25_/_0.4)]"
              }
            >
              <Clock className="mr-1 h-3 w-3" />
              {isOpen ? "Açık" : "Kapalı"}
            </Badge>
          </div>
        )}

        {/* Top right: distance + share + favorite */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {distance !== null && (
            <Badge
              variant="secondary"
              className="bg-black/50 text-white backdrop-blur-sm hover:bg-black/50"
            >
              <MapPin className="mr-1 h-3 w-3" />
              {formatDistance(distance)}
            </Badge>
          )}
          <button
            onClick={handleShare}
            className="rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-black/70"
            title="Paylaş"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <motion.button
            onClick={handleFavorite}
            whileTap={{ scale: 1.3 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={`rounded-full p-1.5 backdrop-blur-sm transition-all ${
              isFavorite
                ? "bg-pink-500/80 text-white shadow-[0_0_12px_oklch(0.7_0.22_350_/_0.5)]"
                : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70"
            }`}
            aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={isFavorite}
          >
            <Heart
              className="h-3.5 w-3.5"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </motion.button>
        </div>

        {/* Place name overlay on photo */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="truncate text-sm font-semibold text-white drop-shadow-md">
            {place.displayName.text}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Type */}
        {place.primaryTypeDisplayName && (
          <p className="truncate text-sm text-muted-foreground">
            {place.primaryTypeDisplayName.text}
          </p>
        )}

        {/* Rating, reviews, price */}
        <div className="mt-2 flex items-center gap-3 text-sm">
          {place.rating !== undefined && ratingColor && (
            <div
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5"
              style={{ boxShadow: ratingGlow }}
            >
              <Star
                className={`h-4 w-4 ${ratingColor.fill} ${ratingColor.text}`}
              />
              <span className={`font-semibold ${ratingColor.text}`}>
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}
          {place.userRatingCount !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{formatReviewCount(place.userRatingCount)}</span>
            </div>
          )}
          {priceSymbol && (
            <span className="font-medium text-muted-foreground">
              {priceSymbol}
            </span>
          )}
        </div>

        {/* Feature tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {place.delivery && (
            <Badge variant="outline" className="text-xs font-normal">
              <Truck className="mr-1 h-3 w-3" />
              Paket
            </Badge>
          )}
          {place.dineIn && (
            <Badge variant="outline" className="text-xs font-normal">
              <UtensilsCrossed className="mr-1 h-3 w-3" />
              Restoran
            </Badge>
          )}
          {place.takeout && (
            <Badge variant="outline" className="text-xs font-normal">
              <ShoppingBag className="mr-1 h-3 w-3" />
              Gel-al
            </Badge>
          )}
        </div>

        {/* Address */}
        {place.shortFormattedAddress && (
          <p className="mt-2.5 truncate text-xs text-muted-foreground">
            {place.shortFormattedAddress}
          </p>
        )}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 5: Verify the app still builds**

Run: `cd /Users/elegant_it/projects/llm/places && npx next build 2>&1 | tail -5`
Expected: Build succeeds — `isFavorite` and `onToggleFavorite` are optional props with defaults, so existing callers work without changes.

- [ ] **Step 6: Commit**

```bash
git add components/place-card.tsx
git commit -m "feat: enhance PlaceCard with neon borders, animations, and favorite button"
```

---

## Task 5: Enhanced PlaceListItem — Neon Accent + Favorite Button

**Files:**
- Modify: `components/place-list-item.tsx`

- [ ] **Step 1: Update imports**

Add to the import from lucide-react (line 12): `Heart`
Add new imports after existing `@/lib/types` imports:

```tsx
import { getCategoryColor, getRatingGlow } from "@/lib/types"
```

- [ ] **Step 2: Update `PlaceListItemProps` interface**

Replace the interface (lines 25-29):

```tsx
interface PlaceListItemProps {
  place: Place
  userLocation?: { lat: number; lng: number } | null
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: (placeId: string) => void
}
```

- [ ] **Step 3: Update component signature and add new variables**

Update the destructuring (line 31-35) to include the new props:

```tsx
export function PlaceListItem({
  place,
  userLocation,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: PlaceListItemProps) {
```

Add after `const ratingColor` (line 55):

```tsx
  const ratingGlow = place.rating ? getRatingGlow(place.rating) : undefined
  const categoryColor = getCategoryColor(place.primaryType, place.types)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(place.id)
  }
```

- [ ] **Step 4: Update the motion.div wrapper styling**

Replace the `className` on the outer `motion.div` (after the `transition` prop) and add a new `style` attribute. Both the `className` and the new `style` prop go on the same `<motion.div>` element:

Replace the `className` on the outer `motion.div` (line 73):

```tsx
      className="group flex cursor-pointer gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: `var(--neon-${categoryColor.category})`,
      }}
```

- [ ] **Step 5: Add favorite button next to share button**

After the share `<button>` closing tag (line 102), add:

```tsx
          <motion.button
            onClick={handleFavorite}
            whileTap={{ scale: 1.3 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={`shrink-0 rounded-full p-1 transition-all ${
              isFavorite
                ? "text-pink-500"
                : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted"
            }`}
            aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={isFavorite}
          >
            <Heart
              className="h-3.5 w-3.5"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </motion.button>
```

- [ ] **Step 6: Add rating glow to the rating display**

Wrap the rating `div` (around line 113) with a style for glow:

```tsx
            <div
              className="flex items-center gap-0.5"
              style={{ textShadow: ratingGlow }}
            >
```

- [ ] **Step 7: Commit**

```bash
git add components/place-list-item.tsx
git commit -m "feat: enhance PlaceListItem with neon accent and favorite button"
```

---

## Task 6: Enhanced QuickFilters — Icons, Neon Styling, Favorites Chip

**Files:**
- Modify: `components/quick-filters.tsx`

- [ ] **Step 1: Update imports**

Replace imports (lines 1-17):

```tsx
"use client"

import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Star,
  Truck,
  ShoppingBag,
  Leaf,
  TreePine,
  Users,
  CalendarCheck,
  Music,
  Wine,
  UtensilsCrossed,
  Heart,
} from "lucide-react"
import type { FilterState } from "@/lib/types"
```

- [ ] **Step 2: Update `QuickFiltersProps` to accept favorites**

Replace the interface (lines 19-22):

```tsx
interface QuickFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  showFavoritesOnly?: boolean
  onToggleFavorites?: () => void
  favoritesCount?: number
}
```

- [ ] **Step 3: Update the component signature and JSX**

Replace the component function (from line 113):

```tsx
export function QuickFilters({
  filters,
  onFiltersChange,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoritesCount = 0,
}: QuickFiltersProps) {
  return (
    <div
      className="scrollbar-hide flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Favorites chip — separate from FilterState */}
      {favoritesCount > 0 && (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Badge
            variant={showFavoritesOnly ? "default" : "outline"}
            className={`shrink-0 cursor-pointer gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
              showFavoritesOnly
                ? "bg-[var(--neon-favorite)] text-white shadow-[0_0_12px_var(--neon-favorite)] hover:bg-[var(--neon-favorite)]"
                : "hover:shadow-sm"
            }`}
            onClick={onToggleFavorites}
          >
            <Heart className="h-3 w-3" fill={showFavoritesOnly ? "currentColor" : "none"} />
            Favoriler ({favoritesCount})
          </Badge>
        </motion.div>
      )}

      {CHIPS.map((chip) => {
        const active = chip.isActive(filters)
        const Icon = chip.icon
        return (
          <motion.div key={chip.key} whileTap={{ scale: 0.95 }}>
            <Badge
              variant={active ? "default" : "outline"}
              className={`shrink-0 cursor-pointer gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "shadow-[0_0_10px_var(--primary)] hover:shadow-[0_0_14px_var(--primary)]"
                  : "hover:shadow-sm"
              }`}
              onClick={() => onFiltersChange(chip.toggle(filters))}
            >
              <Icon className="h-3 w-3" />
              {chip.label}
            </Badge>
          </motion.div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/quick-filters.tsx
git commit -m "feat: enhance QuickFilters with neon styling, icons, and favorites chip"
```

---

## Task 7: PlacesExplorer Integration — Favorites State, Enhanced Empty States, Skeletons

**Files:**
- Modify: `components/places-explorer.tsx`

This is the largest task. We wire favorites into the main component, add the favorites counter to the header, update empty states, and fix skeleton view mode.

- [ ] **Step 1: Add favorites hook import**

Add after the `usePullToRefresh` import (line 55):

```tsx
import { useFavorites } from "@/hooks/use-favorites"
```

- [ ] **Step 2: Add favorites state inside `PlacesExplorerInner`**

Add after `useRecentSearches()` call (after line 99):

```tsx
  const { favorites, toggle: toggleFavorite, isFavorite, count: favoritesCount } = useFavorites()
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
```

- [ ] **Step 3: Update `filteredPlaces` to include favorites filter**

In the `filteredPlaces` useMemo (line 253), add at the start of the filter callback, before the first `if`:

```tsx
      if (showFavoritesOnly && !favorites.includes(place.id)) return false
```

Update the useMemo dependency array (line 316) to include the new deps:

```tsx
  }, [places, filters, sort, location, showFavoritesOnly, favorites])
```

- [ ] **Step 4: Add favorites counter badge to header**

In the header, after the refresh `<Button>` (after line 484) and before the mobile filter toggle `<Sheet>`, add:

```tsx
              {/* Favorites counter */}
              {favoritesCount > 0 && (
                <motion.button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
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
```

Also add `Heart` to the lucide-react import (line 38-46).

- [ ] **Step 5: Update QuickFilters call to pass favorites props**

Replace the `<QuickFilters>` usage (line 568):

```tsx
                <QuickFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  showFavoritesOnly={showFavoritesOnly}
                  onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  favoritesCount={favoritesCount}
                />
```

- [ ] **Step 6: Update PlaceCard calls to pass favorite props**

Replace the `<PlaceCard>` in the grid (line 645-650):

```tsx
                    <PlaceCard
                      key={place.id}
                      place={place}
                      userLocation={location}
                      onClick={() => openDetail(place)}
                      isFavorite={isFavorite(place.id)}
                      onToggleFavorite={toggleFavorite}
                    />
```

- [ ] **Step 7: Update PlaceListItem calls to pass favorite props**

Replace the `<PlaceListItem>` in the list (line 668-673):

```tsx
                    <PlaceListItem
                      key={place.id}
                      place={place}
                      userLocation={location}
                      onClick={() => openDetail(place)}
                      isFavorite={isFavorite(place.id)}
                      onToggleFavorite={toggleFavorite}
                    />
```

- [ ] **Step 8: Enhance empty state for favorites**

In the empty state section (lines 595-629), add a case for favorites. Replace the entire empty state block with:

```tsx
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
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Heart className="h-16 w-16 text-pink-300" />
                      </motion.div>
                      <h3 className="mt-4 text-lg font-semibold">
                        Henüz Favori Mekanınız Yok
                      </h3>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Beğendiğiniz mekanlardaki kalp ikonuna tıklayarak favorilerinize ekleyin.
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
                        animate={places.length === 0 ? undefined : { x: [-4, 4, -4] }}
                        transition={places.length === 0 ? undefined : { repeat: Infinity, duration: 1.5 }}
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
                        <Button onClick={fetchPlaces} className="mt-4" size="sm">
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
```

- [ ] **Step 9: Fix skeleton to respect viewMode**

Replace the loading skeleton block (lines 573-594) with view-mode-aware skeletons:

```tsx
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
```

- [ ] **Step 10: Add header gradient border-bottom**

Update the `<header>` tag (line 428). Replace:

```tsx
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
```

with:

```tsx
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl" style={{ borderBottom: "1px solid transparent", borderImage: "linear-gradient(to right, var(--primary), var(--secondary)) 1" }}>
```

- [ ] **Step 11: Verify the app builds**

Run: `cd /Users/elegant_it/projects/llm/places && npx next build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 12: Commit**

```bash
git add components/places-explorer.tsx
git commit -m "feat: integrate favorites, enhance empty states, skeletons, and header gradient"
```

---

## Task 8: Enhanced ScrollToTop — Neon Gradient

**Files:**
- Modify: `components/scroll-to-top.tsx`

- [ ] **Step 1: Update the button className**

Replace the className on `motion.button` (line 25):

```tsx
          className="fixed right-5 bottom-5 z-30 rounded-full p-3 text-white shadow-lg transition-all hover:shadow-[0_0_20px_var(--primary)]"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--neon-restaurant))" }}
```

- [ ] **Step 2: Commit**

```bash
git add components/scroll-to-top.tsx
git commit -m "feat: enhance ScrollToTop with neon gradient and glow hover"
```

---

## Task 9: Enhanced BlurImage — Neon Shimmer

**Files:**
- Modify: `components/blur-image.tsx`

- [ ] **Step 1: Update the shimmer gradient**

Replace the shimmer div (line 35-37):

```tsx
      {!loaded && !placeholderSrc && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-[var(--primary)]/5 to-muted" />
      )}
```

- [ ] **Step 2: Commit**

```bash
git add components/blur-image.tsx
git commit -m "feat: neon-tinted shimmer gradient on BlurImage loading"
```

---

## Task 10: Location Search — Focus Glow + Dropdown Animation

**Files:**
- Modify: `components/location-search.tsx`

- [ ] **Step 1: Read the current file to identify the input element**

Read `/Users/elegant_it/projects/llm/places/components/location-search.tsx` and locate:
1. The `<input>` or `<Input>` element for the search field
2. The dropdown/results list container

- [ ] **Step 2: Add focus glow to the search input**

Find the search input and add to its className:

```
focus:ring-2 focus:ring-primary/50 focus:shadow-[0_0_15px_var(--primary)/30%]
```

- [ ] **Step 3: Wrap dropdown items with motion for stagger**

If the dropdown renders a list of items, wrap the container with:

```tsx
<motion.div
  initial="hidden"
  animate="show"
  variants={{
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.03 } },
  }}
>
```

And each item with:

```tsx
<motion.div variants={{ hidden: { opacity: 0, y: -4 }, show: { opacity: 1, y: 0 } }}>
```

- [ ] **Step 4: Commit**

```bash
git add components/location-search.tsx
git commit -m "feat: add focus glow and stagger animations to LocationSearch"
```

---

## Task 11: Filters Panel — Collapse Animation + Gradient Slider

**Files:**
- Modify: `components/filters-panel.tsx`

- [ ] **Step 1: Read the current file**

Read `/Users/elegant_it/projects/llm/places/components/filters-panel.tsx` to understand the filter group structure.

- [ ] **Step 2: Add `motion` and `AnimatePresence` imports**

Add to the top:

```tsx
import { motion, AnimatePresence } from "motion/react"
```

- [ ] **Step 3: Add gradient track to the rating slider**

Find the rating `<Slider>` and add a custom style for the track. After the slider, add a visual gradient bar:

```tsx
<div
  className="mt-1 h-1 rounded-full"
  style={{
    background: "linear-gradient(to right, oklch(0.6 0.2 25), oklch(0.7 0.15 85), oklch(0.7 0.2 145))",
    opacity: 0.5,
  }}
/>
```

- [ ] **Step 4: Add pulse animation to active filter count**

If there's a filter count display, wrap it with:

```tsx
<motion.span
  key={count}
  initial={{ scale: 1.3 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 300, damping: 15 }}
>
```

- [ ] **Step 5: Commit**

```bash
git add components/filters-panel.tsx
git commit -m "feat: add gradient slider and pulse animation to FiltersPanel"
```

---

## Task 12: Place Detail Sheet — Photo Dots, Neon Badges, Favorite Button

**Files:**
- Modify: `components/place-detail-sheet.tsx`

- [ ] **Step 1: Read the full file**

Read `/Users/elegant_it/projects/llm/places/components/place-detail-sheet.tsx` to understand the photo gallery and feature badge structure.

- [ ] **Step 2: Update `PlaceDetailSheetProps` to include favorites**

Add to the interface:

```tsx
  isFavorite: boolean
  onToggleFavorite: (placeId: string) => void
```

- [ ] **Step 3: Add photo index dots to PhotoGallery**

In the `PhotoGallery` component, add a scroll position tracker and render dot indicators below the gallery:

```tsx
{/* Photo index dots */}
<div className="mt-2 flex justify-center gap-1.5">
  {photos.map((_, i) => (
    <button
      key={i}
      onClick={() => onPhotoClick(i)}
      className={`h-2 w-2 rounded-full transition-all ${
        i === currentIndex
          ? "bg-[var(--primary)] shadow-[0_0_6px_var(--primary)]"
          : "bg-muted-foreground/30"
      }`}
    />
  ))}
</div>
```

Note: You'll need to track `currentIndex` via an IntersectionObserver or scroll position on the gallery.

- [ ] **Step 4: Add favorite button near the share button**

Find the share button in the detail header area and add a favorite button next to it:

```tsx
<motion.button
  onClick={() => onToggleFavorite(place.id)}
  whileTap={{ scale: 1.3 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
  className={`rounded-full p-2 transition-all ${
    isFavorite
      ? "text-pink-500"
      : "text-muted-foreground hover:bg-muted"
  }`}
  aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
  aria-pressed={isFavorite}
>
  <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
</motion.button>
```

- [ ] **Step 5: Highlight today's opening hours**

In the opening hours section, find where weekday descriptions are rendered. Add a highlight to today's entry:

```tsx
const today = new Date().getDay()
// Google's weekday order: Monday=0 ... Sunday=6
// JS getDay(): Sunday=0 ... Saturday=6
const todayIndex = today === 0 ? 6 : today - 1

// When rendering weekdayDescriptions:
<div
  className={
    i === todayIndex
      ? "rounded-md bg-[var(--primary)]/10 px-2 py-1 font-medium"
      : ""
  }
>
```

- [ ] **Step 6: Update PlaceDetailSheet call in places-explorer.tsx**

Update the `<PlaceDetailSheet>` usage in `places-explorer.tsx` (line 682-687):

```tsx
        <PlaceDetailSheet
          place={detailPlace}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          loading={detailLoading}
          isFavorite={detailPlace ? isFavorite(detailPlace.id) : false}
          onToggleFavorite={toggleFavorite}
        />
```

- [ ] **Step 7: Commit**

```bash
git add components/place-detail-sheet.tsx components/places-explorer.tsx
git commit -m "feat: enhance detail sheet with photo dots, favorite button, and today highlight"
```

---

## Task 13: Rating Breakdown — Neon Glow

**Files:**
- Modify: `components/rating-breakdown.tsx`

- [ ] **Step 1: Read the current file**

Read `/Users/elegant_it/projects/llm/places/components/rating-breakdown.tsx` to understand the rating display.

- [ ] **Step 2: Add neon glow to overall rating display**

Import `getRatingGlow` from `@/lib/types`. Find the element that displays the overall rating number and add a `style={{ textShadow: getRatingGlow(rating) }}` to give it a neon glow effect matching the rating color tier.

- [ ] **Step 3: Commit**

```bash
git add components/rating-breakdown.tsx
git commit -m "feat: add neon glow to rating breakdown display"
```

---

## Task 14: Reduced Motion Accessibility

**Files:**
- Modify: `components/place-card.tsx`
- Modify: `components/place-list-item.tsx`
- Modify: `components/places-explorer.tsx`
- Modify: `components/quick-filters.tsx`

This task adds `prefers-reduced-motion` support. Motion library respects this automatically for its own animations, but we need to handle custom animated effects (pulse, stagger delays, glow animations).

- [ ] **Step 1: Add a CSS reduced-motion rule in `globals.css`**

Add at the end of `@layer base`:

```css
  @media (prefers-reduced-motion: reduce) {
    .glow-sm, .glow-md, .glow-lg {
      transition: none !important;
    }
  }
```

Note: Motion library automatically respects `prefers-reduced-motion` for `animate`, `whileHover`, `whileTap`, `whileInView`, and variant-driven animations. Spring animations become instant transitions. This means most of our changes are already handled. The CSS rule above handles the custom glow class transitions.

- [ ] **Step 2: Guard the heartbeat/pulse animations in places-explorer.tsx**

In the favorites empty state heartbeat animation (the `animate={{ scale: [1, 1.1, 1] }}` on the Heart icon), add a `useReducedMotion` check:

```tsx
import { useReducedMotion } from "motion/react"

// Inside the component:
const reducedMotion = useReducedMotion()

// Then in the empty state:
<motion.div
  animate={reducedMotion ? undefined : { scale: [1, 1.1, 1] }}
  transition={reducedMotion ? undefined : { repeat: Infinity, duration: 1.5 }}
>
```

Apply the same pattern to the search icon shake animation (`animate: { x: [-4, 4, -4] }`).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css components/places-explorer.tsx
git commit -m "feat: add prefers-reduced-motion accessibility support"
```

---

## Task 15: Deferred Spec Items (Lower Priority)

The following spec items are deferred to a follow-up iteration. They are nice-to-have polish that can be added after the core visual refresh lands:

- **Star fill animation** (Spec 2.3): Animated star fill with stagger 0.1s — requires custom SVG animation component, low ROI for initial release
- **`layoutId` on filter chips** (Spec 3.1): Smooth active indicator transition — subtle UX improvement, can be added later
- **"Filtreleri Temizle" sweep animation** (Spec 3.2): Button sweep effect — purely decorative
- **Detail sheet custom open animation** (Spec 5.3): Override shadcn Sheet's default animation — requires careful testing with Sheet internals
- **Review card stagger in detail sheet** (Spec 5.3): Stagger entrance for review cards — small polish item

These are explicitly deferred, not forgotten. They can be picked up in a follow-up plan.

---

## Task 16: Final Build Verification + Manual Testing

- [ ] **Step 1: Run the full build**

Run: `cd /Users/elegant_it/projects/llm/places && npx next build 2>&1 | tail -20`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 2: Start dev server and visually verify**

Run: `cd /Users/elegant_it/projects/llm/places && npx next dev`

Manually check:
- Cards show neon category top border
- Hover shows glow + lift animation
- Favorite heart button toggles with animation
- Quick filter chips have neon glow when active
- Favorites chip appears when count > 0
- Header shows favorites counter badge
- Empty state shows heartbeat animation when filtering by favorites
- ScrollToTop has gradient background
- Detail sheet has favorite button and today's hours highlighted
- Dark mode: neon colors are brighter
- Light mode: neon colors are darker/more saturated

- [ ] **Step 3: Verify localStorage persistence**

- Favorite a place, refresh the page — favorite should persist
- Open a new tab — favorites should be present

- [ ] **Step 4: Verify reduced motion**

In browser DevTools, enable `prefers-reduced-motion: reduce` and verify animations are instant/disabled.

- [ ] **Step 5: Verify reduced motion is working**

In browser DevTools, enable `prefers-reduced-motion: reduce`. Verify:
- Card hover/entry animations are instant (no spring)
- Heartbeat/pulse animations are disabled
- Static glow shadows still visible (these are style, not animation)

- [ ] **Step 6: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address visual issues found during manual testing"
```
