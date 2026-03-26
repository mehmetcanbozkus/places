# OpenGraph & Social Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenGraph and Twitter Card metadata with dynamic OG images for the homepage and a new `/place/[id]` route with server-rendered detail pages.

**Architecture:** File-based OG image convention (`opengraph-image.tsx`) with `ImageResponse` from `next/og` for dynamic image generation. New `/place/[id]` route with `generateMetadata` for per-place SEO. Data fetched via HTTP to existing API routes (`/api/places/[id]`, `/api/places/photo`).

**Tech Stack:** Next.js 16 file-based metadata, `ImageResponse` (Satori/Resvg), Noto Sans TTF font, Tailwind CSS v4, shadcn/ui components.

**Note:** This project has no test framework. Verification is via `bun run typecheck`, `bun run build`, and manual testing.

---

## File Structure

```
assets/fonts/
  NotoSans-Bold.ttf              # Downloaded font for OG image rendering

src/app/
  layout.tsx                      # MODIFY — add metadataBase, siteName, twitter
  opengraph-image.tsx             # CREATE — homepage OG image (branded)
  twitter-image.tsx               # CREATE — homepage Twitter image (branded)

src/app/place/[id]/
  page.tsx                        # CREATE — server-rendered detail page + generateMetadata
  og-shared.tsx                   # CREATE — shared OG image rendering logic
  opengraph-image.tsx             # CREATE — dynamic place OG image (Photo Hero)
  twitter-image.tsx               # CREATE — dynamic place Twitter image (Photo Hero)
  loading.tsx                     # CREATE — skeleton loading state
  error.tsx                       # CREATE — error boundary (Turkish)
  not-found.tsx                   # CREATE — 404 for invalid place IDs

.env.example                      # MODIFY — add NEXT_PUBLIC_BASE_URL
```

---

### Task 1: Setup — Download Font and Update Environment

**Files:**
- Create: `assets/fonts/NotoSans-Bold.ttf`
- Modify: `.env.example`

- [ ] **Step 1: Create font directory and download Noto Sans Bold**

```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/NotoSans-Bold.ttf \
  "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf"
```

If the URL fails, download manually from https://fonts.google.com/noto/specimen/Noto+Sans — select Bold (700) weight, download the TTF, and place it at `assets/fonts/NotoSans-Bold.ttf`.

Verify the file exists and is a valid font (should be ~300KB+):

```bash
ls -la assets/fonts/NotoSans-Bold.ttf
```

- [ ] **Step 2: Add NEXT_PUBLIC_BASE_URL to .env.example**

Append to `.env.example`:

```
# Base URL for OpenGraph metadata (set to your production domain)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 3: Commit**

```bash
git add assets/fonts/NotoSans-Bold.ttf .env.example
git commit -m "chore: add Noto Sans Bold font and NEXT_PUBLIC_BASE_URL env var"
```

---

### Task 2: Update Root Layout Metadata

**Files:**
- Modify: `src/app/layout.tsx:10-23`

- [ ] **Step 1: Add metadataBase, siteName, and twitter card**

In `src/app/layout.tsx`, update the `metadata` export. Preserve the existing Turkish Unicode characters. Add three things:
1. `metadataBase` at the top
2. `siteName` inside `openGraph`
3. New `twitter` section

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
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
    siteName: "Nerede Yesem?",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nerede Yesem?",
    description: "Yakınızdaki en iyi mekanları keşfedin",
  },
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add metadataBase, siteName, and Twitter card to root layout"
```

---

### Task 3: Homepage OG Images

**Files:**
- Create: `src/app/opengraph-image.tsx`
- Create: `src/app/twitter-image.tsx`

- [ ] **Step 1: Create homepage OG image**

Create `src/app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Nerede Yesem? - Yakınımdaki En İyi Mekanlar"

export default async function OGImage() {
  const fontBold = await readFile(
    join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf")
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "Noto Sans",
        }}
      >
        {/* Decorative accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "radial-gradient(circle at 30% 40%, rgba(245,158,11,0.15) 0%, transparent 50%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            Nerede Yesem?
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            Yakınızdaki en iyi mekanları keşfedin
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans",
          data: fontBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  )
}
```

- [ ] **Step 2: Create homepage Twitter image**

Create `src/app/twitter-image.tsx` — identical content to `opengraph-image.tsx` but as a separate file (re-export pattern is undocumented):

```tsx
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Nerede Yesem? - Yakınımdaki En İyi Mekanlar"

export default async function TwitterImage() {
  const fontBold = await readFile(
    join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf")
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "Noto Sans",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "radial-gradient(circle at 30% 40%, rgba(245,158,11,0.15) 0%, transparent 50%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            Nerede Yesem?
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            Yakınızdaki en iyi mekanları keşfedin
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans",
          data: fontBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  )
}
```

- [ ] **Step 3: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/app/opengraph-image.tsx src/app/twitter-image.tsx
git commit -m "feat: add homepage OG and Twitter images"
```

---

### Task 4: Place OG Image Shared Helper

**Files:**
- Create: `src/app/place/[id]/og-shared.tsx`

This shared module contains all the data-fetching and rendering logic. Both `opengraph-image.tsx` and `twitter-image.tsx` call this.

- [ ] **Step 1: Create the shared OG helper**

Create `src/app/place/[id]/og-shared.tsx`:

```tsx
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { PRICE_LEVEL_SYMBOL } from "@/lib/constants"

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = "image/png"

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
}

async function fetchPlaceData(id: string) {
  const res = await fetch(`${getBaseUrl()}/api/places/${id}`)
  if (!res.ok) return null
  return res.json()
}

async function fetchPhotoBase64(photoName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/places/photo?name=${encodeURIComponent(photoName)}&maxWidthPx=1200`
    )
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`
  } catch {
    return null
  }
}

export async function renderPlaceOGImage(id: string) {
  const place = await fetchPlaceData(id)

  const photoName = place?.photos?.[0]?.name
  const photoSrc = photoName ? await fetchPhotoBase64(photoName) : null

  const fontBold = await readFile(
    join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf")
  )

  const name = place?.displayName?.text ?? "Mekan"
  const rating = place?.rating ? place.rating.toFixed(1) : null
  const type = place?.primaryTypeDisplayName?.text ?? ""
  const address =
    place?.shortFormattedAddress ?? place?.formattedAddress ?? ""
  const price = place?.priceLevel
    ? PRICE_LEVEL_SYMBOL[place.priceLevel as PriceLevel] ?? ""
    : ""
  const subtitle = [type, price].filter(Boolean).join(" · ")

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0f172a",
          fontFamily: "Noto Sans",
        }}
      >
        {/* Photo background or gradient fallback */}
        {photoSrc ? (
          <img
            src={photoSrc}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              background:
                "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)",
          }}
        />

        {/* Branding top-right */}
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 32,
            color: "rgba(255,255,255,0.6)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Nerede Yesem?
        </div>

        {/* Content bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "32px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Rating + Type */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {rating && (
              <div
                style={{
                  background: "#f59e0b",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: 18,
                  padding: "4px 12px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {rating} ★
              </div>
            )}
            {subtitle && (
              <span style={{ color: "#94a3b8", fontSize: 16 }}>
                {subtitle}
              </span>
            )}
          </div>

          {/* Place name */}
          <div
            style={{
              color: "#fff",
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            {name}
          </div>

          {/* Address */}
          {address && (
            <div style={{ color: "#94a3b8", fontSize: 18 }}>{address}</div>
          )}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        {
          name: "Noto Sans",
          data: fontBold,
          style: "normal" as const,
          weight: 700,
        },
      ],
    }
  )
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/place/\[id\]/og-shared.tsx
git commit -m "feat: add shared OG image renderer for place pages"
```

---

### Task 5: Place OG and Twitter Images

**Files:**
- Create: `src/app/place/[id]/opengraph-image.tsx`
- Create: `src/app/place/[id]/twitter-image.tsx`

- [ ] **Step 1: Create place OG image**

Create `src/app/place/[id]/opengraph-image.tsx`:

```tsx
import {
  ogSize,
  ogContentType,
  renderPlaceOGImage,
} from "./og-shared"

export const size = ogSize
export const contentType = ogContentType
export const alt = "Mekan detayı"

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return renderPlaceOGImage(id)
}
```

- [ ] **Step 2: Create place Twitter image**

Create `src/app/place/[id]/twitter-image.tsx`:

```tsx
import {
  ogSize,
  ogContentType,
  renderPlaceOGImage,
} from "./og-shared"

export const size = ogSize
export const contentType = ogContentType
export const alt = "Mekan detayı"

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return renderPlaceOGImage(id)
}
```

- [ ] **Step 3: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/app/place/\[id\]/opengraph-image.tsx src/app/place/\[id\]/twitter-image.tsx
git commit -m "feat: add dynamic OG and Twitter images for place pages"
```

---

### Task 6: Place Detail Page

**Files:**
- Create: `src/app/place/[id]/page.tsx`

**Reference:** Read `src/components/place-detail-sheet.tsx` for data field usage and `src/app/api/places/[id]/route.ts` for the API response shape. Read Next.js docs at `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` for `generateMetadata` API.

- [ ] **Step 1: Create the place detail page with generateMetadata**

Create `src/app/place/[id]/page.tsx`:

```tsx
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Navigation,
  Star,
  Clock,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OpenStatusBadge } from "@/components/open-status-badge"
import type { Place, PriceLevel, Review } from "@/lib/types"
import { PRICE_LEVEL_MAP } from "@/lib/constants"
import { getPhotoUrl, getRatingColor, formatReviewCount } from "@/lib/place-utils"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

async function fetchPlace(id: string): Promise<Place | null> {
  const res = await fetch(`${BASE_URL}/api/places/${id}`)
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const place = await fetchPlace(id)

  if (!place) {
    return { title: "Mekan Bulunamadı" }
  }

  const title = place.displayName?.text ?? "Mekan"
  const description = [
    title,
    place.formattedAddress,
    place.rating ? `Puan: ${place.rating}/5` : null,
  ]
    .filter(Boolean)
    .join(" — ")

  return {
    title,
    description,
    openGraph: {
      title,
      description: [
        place.formattedAddress,
        place.rating ? `${place.rating} ★` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      type: "website",
      locale: "tr_TR",
      siteName: "Nerede Yesem?",
    },
    twitter: {
      card: "summary_large_image",
    },
  }
}

function RatingStars({ rating }: { rating: number }) {
  const colors = getRatingColor(rating)
  return (
    <div className="flex items-center gap-1.5">
      <Star className={`h-5 w-5 ${colors.fill} ${colors.text}`} />
      <span className={`text-lg font-bold ${colors.text}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

function FeatureBadge({
  label,
  active,
}: {
  label: string
  active?: boolean
}) {
  if (!active) return null
  return <Badge variant="secondary">{label}</Badge>
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        {review.authorAttribution?.photoUri && (
          <Image
            src={review.authorAttribution.photoUri}
            alt={review.authorAttribution.displayName}
            width={32}
            height={32}
            className="rounded-full"
            unoptimized
          />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {review.authorAttribution?.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {review.relativePublishTimeDescription}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{review.rating}</span>
        </div>
      </div>
      {review.text?.text && (
        <p className="text-sm text-muted-foreground">{review.text.text}</p>
      )}
    </div>
  )
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const place = await fetchPlace(id)

  if (!place) notFound()

  const firstPhoto = place.photos?.[0]
  const isOpen = place.currentOpeningHours?.openNow
  const priceLabel = place.priceLevel
    ? PRICE_LEVEL_MAP[place.priceLevel as PriceLevel]
    : null

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background">
      {/* Hero Photo */}
      <div className="relative aspect-[16/9] w-full bg-muted">
        {firstPhoto ? (
          <Image
            src={getPhotoUrl(firstPhoto.name, 1200)}
            alt={place.displayName?.text ?? "Mekan fotoğrafı"}
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
            priority
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="space-y-6 p-6">
        {/* Name, Type, Rating */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {place.displayName?.text}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {place.primaryTypeDisplayName?.text && (
              <span>{place.primaryTypeDisplayName.text}</span>
            )}
            {place.rating && (
              <>
                <span>·</span>
                <RatingStars rating={place.rating} />
                {place.userRatingCount && (
                  <span className="text-muted-foreground">
                    ({formatReviewCount(place.userRatingCount)})
                  </span>
                )}
              </>
            )}
            {priceLabel && (
              <>
                <span>·</span>
                <span>{priceLabel}</span>
              </>
            )}
          </div>

          {isOpen !== undefined && (
            <OpenStatusBadge isOpen={isOpen} variant="plain" />
          )}
        </div>

        {/* Editorial Summary */}
        {place.editorialSummary?.text && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {place.editorialSummary.text}
          </p>
        )}

        <Separator />

        {/* Contact & Actions */}
        <div className="space-y-3">
          {place.formattedAddress && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{place.formattedAddress}</span>
            </div>
          )}
          {place.internationalPhoneNumber && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={`tel:${place.internationalPhoneNumber}`}
                className="underline-offset-4 hover:underline"
              >
                {place.internationalPhoneNumber}
              </a>
            </div>
          )}
          {place.websiteUri && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={place.websiteUri}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate underline-offset-4 hover:underline"
              >
                {new URL(place.websiteUri).hostname}
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {place.googleMapsUri && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Google Maps
                </a>
              </Button>
            )}
            {place.googleMapsLinks?.directionsUri && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={place.googleMapsLinks.directionsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="mr-1.5 h-4 w-4" />
                  Yol Tarifi
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Features */}
        {(place.dineIn ||
          place.delivery ||
          place.takeout ||
          place.reservable ||
          place.outdoorSeating ||
          place.goodForGroups ||
          place.goodForChildren ||
          place.liveMusic ||
          place.servesCocktails ||
          place.servesCoffee ||
          place.allowsDogs) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Özellikler</h2>
              <div className="flex flex-wrap gap-1.5">
                <FeatureBadge label="Restoranda Yemek" active={place.dineIn} />
                <FeatureBadge label="Paket Servis" active={place.delivery} />
                <FeatureBadge label="Gel Al" active={place.takeout} />
                <FeatureBadge label="Rezervasyon" active={place.reservable} />
                <FeatureBadge label="Açık Alan" active={place.outdoorSeating} />
                <FeatureBadge label="Gruplar" active={place.goodForGroups} />
                <FeatureBadge label="Çocuklar" active={place.goodForChildren} />
                <FeatureBadge label="Canlı Müzik" active={place.liveMusic} />
                <FeatureBadge label="Kokteyller" active={place.servesCocktails} />
                <FeatureBadge label="Kahve" active={place.servesCoffee} />
                <FeatureBadge label="Evcil Hayvan" active={place.allowsDogs} />
              </div>
            </div>
          </>
        )}

        {/* Opening Hours */}
        {place.regularOpeningHours?.weekdayDescriptions && (
          <>
            <Separator />
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                Çalışma Saatleri
              </h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {place.regularOpeningHours.weekdayDescriptions.map(
                  (day, i) => (
                    <li key={i}>{day}</li>
                  )
                )}
              </ul>
            </div>
          </>
        )}

        {/* Reviews */}
        {place.reviews && place.reviews.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Yorumlar</h2>
              {place.reviewSummary?.text?.text && (
                <p className="text-sm italic text-muted-foreground">
                  {place.reviewSummary.text.text}
                </p>
              )}
              <div className="space-y-3">
                {place.reviews.slice(0, 5).map((review) => (
                  <ReviewCard key={review.name} review={review} />
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* CTA */}
        <div className="pb-6">
          <Button asChild className="w-full">
            <Link href={`/?place=${id}`}>
              Yakındaki Mekanları Keşfet
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

Fix any type issues. The `ReviewCard` component's review type may need adjustment — use `Review` from `@/lib/types` instead of the inferred type if TypeScript complains.

- [ ] **Step 3: Commit**

```bash
git add src/app/place/\[id\]/page.tsx
git commit -m "feat: add server-rendered place detail page with generateMetadata"
```

---

### Task 7: Place Loading, Error, and Not-Found States

**Files:**
- Create: `src/app/place/[id]/loading.tsx`
- Create: `src/app/place/[id]/error.tsx`
- Create: `src/app/place/[id]/not-found.tsx`

**Reference:** Match the patterns from `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/loading.tsx`.

- [ ] **Step 1: Create loading skeleton**

Create `src/app/place/[id]/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background">
      {/* Hero skeleton */}
      <Skeleton className="aspect-[16/9] w-full rounded-none" />

      <div className="space-y-6 p-6">
        {/* Name */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-16" />
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Hours */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-48" />
          ))}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create error boundary**

Create `src/app/place/[id]/error.tsx`:

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
      <h2 className="text-xl font-semibold">Mekan bilgileri yüklenemedi</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Mekan bilgilerine ulaşırken bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <Button onClick={() => unstable_retry()} variant="outline">
        Tekrar Dene
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create not-found page**

Create `src/app/place/[id]/not-found.tsx`:

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-semibold">Mekan Bulunamadı</h2>
      <p className="text-sm text-muted-foreground">
        Aradığınız mekan mevcut değil veya kaldırılmış olabilir.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Verify typecheck passes**

```bash
bun run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/app/place/\[id\]/loading.tsx src/app/place/\[id\]/error.tsx src/app/place/\[id\]/not-found.tsx
git commit -m "feat: add loading, error, and not-found states for place page"
```

---

### Task 8: Build Verification

- [ ] **Step 1: Run full typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 2: Run lint**

```bash
bun run lint
```

Expected: no errors. Fix any lint issues.

- [ ] **Step 3: Run format**

```bash
bun run format
```

- [ ] **Step 4: Run production build**

```bash
bun run build
```

Expected: build succeeds. The `/place/[id]` route should appear as a dynamic route in the build output. The OG images in `src/app/` should be listed as static routes.

- [ ] **Step 5: Manual smoke test**

Start the dev server and test:

```bash
bun dev
```

Verify:
1. Visit `http://localhost:3000/opengraph-image` — should return a PNG with "Nerede Yesem?" branding
2. Visit `http://localhost:3000/place/{valid-place-id}` — should render the detail page (use a place ID from the app)
3. Visit `http://localhost:3000/place/{valid-place-id}/opengraph-image` — should return a PNG with the place photo
4. Visit `http://localhost:3000/place/invalid-id` — should show "Mekan Bulunamadı"
5. View page source of `/place/{id}` — confirm `<meta property="og:image">` and `<meta name="twitter:image">` tags are present

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build and lint issues"
```

Only create this commit if there were actual fixes needed.

---

## Follow-Up (Not in Scope)

- Update `sharePlace()` in `src/lib/place-utils.ts` to use `/place/{id}` URLs instead of `/?place={id}` — this would make the share button use the new OG-enabled URLs
- Add `robots.txt` and `sitemap.xml` generation
- Add JSON-LD structured data for rich search results
