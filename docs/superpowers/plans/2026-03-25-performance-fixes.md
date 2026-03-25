# Performance Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 10 identified performance issues across the Places app to reduce bundle size, eliminate unnecessary re-renders, enable image optimization, and improve UX resilience.

**Architecture:** Each task is independent and touches a distinct set of files, enabling parallel execution. No task depends on another task's output. All tasks are backward-compatible refactors — no API changes, no new features.

**Tech Stack:** Next.js 16.2.1, React 19, Tailwind CSS 4, motion (Framer Motion), nuqs, bun

**Verification:** Run `bun run build && bun run typecheck` after each task. There are no tests in this project.

---

## File Structure

No new source directories. Changes are in-place refactors:

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/api/places/photo/route.ts` | Modify | Stream image instead of 302 redirect |
| `src/components/blur-image.tsx` | Modify | Remove `unoptimized`, fix `sizes` |
| `src/components/place-detail-sheet.tsx` | Modify | Remove `unoptimized` from images |
| `src/components/place-list-item.tsx` | Modify | Remove `unoptimized` from image |
| `src/components/photo-lightbox.tsx` | Modify | Remove `unoptimized` from images |
| `src/hooks/use-pull-to-refresh.ts` | Modify | Fix listener churn via refs |
| `src/app/globals.css` | Modify | Add `content-visibility` utility |
| `src/components/place-card.tsx` | Modify | Add content-visibility class, wrap in memo |
| `src/components/places-explorer.tsx` | Modify | Pre-compute distances, dynamic imports |
| `src/app/layout.tsx` | Modify | Add metadata export |
| `src/app/loading.tsx` | Create | Route-level loading state |
| `src/app/error.tsx` | Create | Route-level error boundary |
| `src/app/not-found.tsx` | Create | 404 page |
| `src/hooks/use-favorites.ts` | Modify | Use Set for O(1) lookups |
| `package.json` | Modify | Move eslint-plugin-react to devDependencies |

---

### Task 1: Stream photos instead of 302 redirect + remove `unoptimized`

**Files:**
- Modify: `src/app/api/places/photo/route.ts`
- Modify: `src/components/blur-image.tsx`
- Modify: `src/components/place-detail-sheet.tsx:103-110,155-163`
- Modify: `src/components/place-list-item.tsx:97-104`
- Modify: `src/components/photo-lightbox.tsx:177-186,227-234`

This is the highest-impact fix. Currently the photo route returns a 302 redirect to Google's CDN, which forces every `<Image>` to use `unoptimized` (Next.js optimizer can't follow redirects). By streaming the image through our route, Next.js can apply WebP/AVIF conversion and responsive srcset generation.

- [ ] **Step 1: Update photo route to stream the image**

Replace the 302 redirect with a piped response in `src/app/api/places/photo/route.ts`:

```ts
import { NextRequest } from "next/server"

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const name = searchParams.get("name")
  const maxWidthPx = searchParams.get("maxWidthPx") || "400"
  const maxHeightPx = searchParams.get("maxHeightPx")

  if (!name || !GOOGLE_API_KEY) {
    return new Response("Missing parameters", { status: 400 })
  }

  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    maxWidthPx,
    skipHttpRedirect: "true",
  })
  if (maxHeightPx) params.set("maxHeightPx", maxHeightPx)

  const response = await fetch(
    `https://places.googleapis.com/v1/${name}/media?${params}`
  )

  if (!response.ok) {
    return new Response("Photo not found", { status: 404 })
  }

  const data = await response.json()

  if (data.photoUri) {
    const imageResponse = await fetch(data.photoUri)
    if (!imageResponse.ok) {
      return new Response("Photo not found", { status: 404 })
    }

    // Trade-off: This makes two outbound requests (JSON + image stream) instead of
    // one 302 redirect, adding ~50-100ms server-side latency. The trade-off is worth it
    // because Next.js Image optimizer can now convert to WebP/AVIF, generate srcset,
    // and apply responsive sizing — reducing client-side bandwidth by 30-60%.
    // Browser-level caching (max-age=86400) ensures repeat requests are instant.
    return new Response(imageResponse.body, {
      headers: {
        "Content-Type":
          imageResponse.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  }

  return new Response("Photo not found", { status: 404 })
}
```

- [ ] **Step 2: Remove `unoptimized` from blur-image.tsx and fix `sizes`**

In `src/components/blur-image.tsx`, remove both `unoptimized` props and change `sizes="100%"` to accept a `sizes` prop with a sensible default:

```tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

interface BlurImageProps {
  src: string
  alt: string
  placeholderSrc?: string
  className?: string
  loading?: "eager" | "lazy"
  sizes?: string
}

export function BlurImage({
  src,
  alt,
  placeholderSrc,
  className = "",
  loading = "lazy",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: BlurImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholderSrc && (
        <Image
          src={placeholderSrc}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          className="scale-110 object-cover blur-xl"
        />
      )}

      {/* Skeleton placeholder while loading */}
      {!loaded && !placeholderSrc && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}

      {/* Main image */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
```

- [ ] **Step 3: Remove `unoptimized` from place-detail-sheet.tsx**

In `src/components/place-detail-sheet.tsx`, remove `unoptimized` from line 110 and line 163. The images at lines 103-110 already have correct `sizes` props.

- [ ] **Step 4: Remove `unoptimized` from place-list-item.tsx**

In `src/components/place-list-item.tsx`, remove `unoptimized` from line 104.

- [ ] **Step 5: Remove `unoptimized` from photo-lightbox.tsx**

In `src/components/photo-lightbox.tsx`, remove `unoptimized` from line 186 and line 234.

- [ ] **Step 6: Verify build**

Run: `bun run build && bun run typecheck`
Expected: Clean build, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/places/photo/route.ts src/components/blur-image.tsx src/components/place-detail-sheet.tsx src/components/place-list-item.tsx src/components/photo-lightbox.tsx
git commit -m "perf: stream photos instead of 302 redirect, enable Next.js image optimization"
```

---

### Task 2: Fix `usePullToRefresh` listener churn

**Files:**
- Modify: `src/hooks/use-pull-to-refresh.ts`

The `useEffect` dependency array includes `pullDistance`, causing event listeners to be torn down and reattached on every pixel of drag. Fix by using refs for all values read inside handlers.

- [ ] **Step 1: Refactor usePullToRefresh to use refs**

Replace entire file:

```ts
"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPull?: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 140,
}: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const isRefreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const handleRefresh = useCallback(async () => {
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      await onRefreshRef.current()
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
      pullDistanceRef.current = 0
      setPullDistance(0)
    }
  }, [])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshingRef.current) return
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshingRef.current) return
      const diff = e.touches[0].clientY - startY.current
      if (diff < 0) {
        isPulling.current = false
        pullDistanceRef.current = 0
        setPullDistance(0)
        return
      }
      const distance = Math.min(diff * 0.5, maxPull)
      pullDistanceRef.current = distance
      setPullDistance(distance)
    }

    const onTouchEnd = () => {
      if (!isPulling.current) return
      isPulling.current = false
      if (pullDistanceRef.current >= threshold) {
        handleRefresh()
      } else {
        pullDistanceRef.current = 0
        setPullDistance(0)
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [threshold, maxPull, handleRefresh])

  return { pullDistance, isRefreshing }
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build && bun run typecheck`
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-pull-to-refresh.ts
git commit -m "perf: fix usePullToRefresh re-registering listeners on every pixel"
```

---

### Task 3: Add `content-visibility` for place cards

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/place-card.tsx:100`
- Modify: `src/components/place-list-item.tsx:88`

With up to 60 cards rendered, off-screen cards should skip layout/paint via `content-visibility: auto`.

- [ ] **Step 1: Add utility class to globals.css**

Add at the end of `src/app/globals.css`, before the closing comment or at the end:

```css
/* Performance: skip layout/paint for off-screen cards.
   contain-intrinsic-size values are approximate — tune if layout jumps occur. */
.place-card-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px;
}

.place-list-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 100px;
}
```

- [ ] **Step 2: Add class to PlaceCard**

In `src/components/place-card.tsx` at line 100, add `place-card-item` to the className string:

Change:
```tsx
className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg"
```
To:
```tsx
className="place-card-item group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg"
```

- [ ] **Step 3: Add class to PlaceListItem**

In `src/components/place-list-item.tsx` at line 88, add `place-list-item` to the className string:

Change:
```tsx
className="group flex cursor-pointer gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
```
To:
```tsx
className="place-list-item group flex cursor-pointer gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
```

- [ ] **Step 4: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/place-card.tsx src/components/place-list-item.tsx
git commit -m "perf: add content-visibility for off-screen place cards"
```

---

### Task 4: Add metadata exports

**Files:**
- Modify: `src/app/layout.tsx`

Add proper metadata for SEO and mobile viewport.

- [ ] **Step 1: Add metadata export to layout.tsx**

Add the metadata export at the top of the file (after imports, before the font declarations):

```ts
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: {
    default: "Nerede Yesem? - Yakınımdaki En İyi Mekanlar",
    template: "%s | Nerede Yesem?",
  },
  description:
    "Yakınızdaki en iyi restoranları, kafeleri ve barları keşfedin. Puanlar, yorumlar ve filtrelerle size en uygun mekanı bulun.",
  openGraph: {
    title: "Nerede Yesem?",
    description: "Yakınızdaki en iyi mekanları keşfedin",
    type: "website",
    locale: "tr_TR",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "perf: add metadata and viewport exports for SEO and mobile"
```

---

### Task 5: Add `loading.tsx`, `error.tsx`, `not-found.tsx`

**Files:**
- Create: `src/app/loading.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`

Add Next.js route-level loading/error handling for resilience and streaming SSR.

- [ ] **Step 1: Create loading.tsx**

```tsx
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
```

- [ ] **Step 2: Create error.tsx**

Note: Next.js 16.2 uses `unstable_retry` (not `reset`) per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.

```tsx
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-semibold">Bir hata olustu</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Beklenmeyen bir hata meydana geldi. Sayfayi yeniden yuklemeyi deneyin.
      </p>
      <Button onClick={() => unstable_retry()} variant="outline">
        Tekrar Dene
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create not-found.tsx**

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-semibold">Sayfa Bulunamadi</h2>
      <p className="text-sm text-muted-foreground">
        Aradiginiz sayfa mevcut degil.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Ana Sayfaya Don</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 5: Commit**

```bash
git add src/app/loading.tsx src/app/error.tsx src/app/not-found.tsx
git commit -m "perf: add loading, error boundary, and 404 pages"
```

---

### Task 6: Use Set for O(1) lookups in useFavorites

**Files:**
- Modify: `src/hooks/use-favorites.ts`

Change `isFavorite` from `Array.includes()` (O(n)) to `Set.has()` (O(1)), and make the returned `isFavorite` function stable via a ref-based lookup.

- [ ] **Step 1: Refactor useFavorites**

```ts
"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

const STORAGE_KEY = "favorites"
const EMPTY: string[] = []

let listeners: (() => void)[] = []
let cachedRaw: string | null = null
let cachedParsed: string[] = EMPTY

function getSnapshot(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== cachedRaw) {
      cachedRaw = raw
      cachedParsed = raw ? JSON.parse(raw) : EMPTY
    }
    return cachedParsed
  } catch {
    return EMPTY
  }
}

function getServerSnapshot(): string[] {
  return EMPTY
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

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const favoritesSet = useMemo(() => new Set(favorites), [favorites])

  const toggle = useCallback((placeId: string) => {
    const current = getSnapshot()
    const next = current.includes(placeId)
      ? current.filter((id) => id !== placeId)
      : [...current, placeId]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore
    }
    emitChange()
  }, [])

  const isFavorite = useCallback(
    (placeId: string) => favoritesSet.has(placeId),
    [favoritesSet]
  )

  return { favorites, toggle, isFavorite, count: favorites.length }
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-favorites.ts
git commit -m "perf: use Set for O(1) favorite lookups"
```

---

### Task 7: Pre-compute haversine distances in sort

**Files:**
- Modify: `src/components/places-explorer.tsx:476-501`

The sort comparator calls `haversineDistance()` for every pairwise comparison. Pre-compute distances into a Map once, then use the map in the sort comparator.

- [ ] **Step 1: Update filteredPlaces useMemo**

In `src/components/places-explorer.tsx`, replace the `result.sort(...)` block (lines 476-501, everything between `return result` and the end of filtering) with the following. Keep the `return result` on line 503 and `useMemo` closing unchanged:

```ts
    // Pre-compute distances if sorting by distance
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
```

- [ ] **Step 2: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/components/places-explorer.tsx
git commit -m "perf: pre-compute haversine distances for sort"
```

---

### Task 8: Wrap PlaceCard and PlaceListItem in React.memo

**Files:**
- Modify: `src/components/place-card.tsx`
- Modify: `src/components/place-list-item.tsx`

These components re-render whenever the parent re-renders. Wrapping in `React.memo` prevents unnecessary re-renders when props haven't changed. Note: The `variants` objects are defined inline as object literals, which creates new references each render. However, `React.memo` still helps because the common re-render triggers (typing in search, toggling filters, theme changes) don't change the PlaceCard/PlaceListItem props at all — memo short-circuits the entire subtree.

- [ ] **Step 1: Wrap PlaceCard in memo**

In `src/components/place-card.tsx`, add `memo` to the import and wrap the export:

Change the import:
```tsx
import { memo } from "react"
```
(Add `memo` — no other react imports needed since the component doesn't use hooks directly from react, it uses motion/react hooks)

Wait, the component uses `useReducedMotion` from motion/react. No react imports at all currently. Add:

At top of file, add the import:
```tsx
import { memo } from "react"
```

Change the export from:
```tsx
export function PlaceCard({
```
To:
```tsx
export const PlaceCard = memo(function PlaceCard({
```

And close the component with:
```tsx
})
```
(Add closing paren after the final `}` of the function body)

- [ ] **Step 2: Wrap PlaceListItem in memo**

Same pattern in `src/components/place-list-item.tsx`:

Add import:
```tsx
import { memo } from "react"
```

Change:
```tsx
export function PlaceListItem({
```
To:
```tsx
export const PlaceListItem = memo(function PlaceListItem({
```

Close with `})` after the function body.

- [ ] **Step 3: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/components/place-card.tsx src/components/place-list-item.tsx
git commit -m "perf: wrap PlaceCard and PlaceListItem in React.memo"
```

---

### Task 9: Dynamic import PlaceDetailSheet and PhotoLightbox

**Files:**
- Modify: `src/components/places-explorer.tsx:18-19`

These heavy components (34KB + 10KB) are only shown on interaction. Dynamic importing them reduces the initial JS bundle.

- [ ] **Step 1: Replace static imports with dynamic imports**

In `src/components/places-explorer.tsx`, replace lines 18-19:

```tsx
import { PlaceDetailSheet } from "./place-detail-sheet"
```

With:

```tsx
import dynamic from "next/dynamic"

const PlaceDetailSheet = dynamic(() =>
  import("./place-detail-sheet").then((m) => m.PlaceDetailSheet)
)
```

Note: `PhotoLightbox` is imported inside `PlaceDetailSheet`, not in `places-explorer.tsx`, so it will be automatically code-split as part of the detail sheet chunk.

**Trade-off:** The first time a user opens a place detail, there will be a brief delay while the chunk loads. This is acceptable since the sheet already shows a loading skeleton while fetching place details from the API.

- [ ] **Step 2: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/components/places-explorer.tsx
git commit -m "perf: dynamic import PlaceDetailSheet to reduce initial bundle"
```

---

### Task 10: Move eslint-plugin-react to devDependencies

**Files:**
- Modify: `package.json`

`eslint-plugin-react` is a dev tool, not a runtime dependency.

- [ ] **Step 1: Move the dependency**

Run:
```bash
cd /Users/elegant_it/projects/llm/places
bun remove eslint-plugin-react && bun add -d eslint-plugin-react
```

- [ ] **Step 2: Verify build**

Run: `bun run build && bun run typecheck`

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: move eslint-plugin-react to devDependencies"
```

---

## Execution Order

All 10 tasks are independent and can run in parallel. If running sequentially, recommended order by impact:

1. Task 1 (photo streaming) — highest impact
2. Task 9 (dynamic imports) — bundle size
3. Task 8 (React.memo) — re-renders
4. Task 7 (distance pre-compute) — CPU
5. Task 2 (pull-to-refresh fix) — listener churn
6. Task 6 (Set for favorites) — O(1) lookups
7. Task 3 (content-visibility) — rendering
8. Task 4 (metadata) — SEO
9. Task 5 (loading/error pages) — resilience
10. Task 10 (devDependencies) — cleanup
