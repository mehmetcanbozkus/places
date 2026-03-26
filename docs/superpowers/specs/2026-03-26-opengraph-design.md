# OpenGraph & Social Sharing

## Overview

Add OpenGraph and Twitter Card metadata so the app produces rich social previews when shared. Two scenarios: a static branded image for the homepage, and dynamic per-place images with server-rendered detail pages at `/place/[id]`.

## Decisions

| Topic | Decision |
|-------|----------|
| Sharing scenarios | Homepage URL + individual places |
| Place URL strategy | New `/place/[id]` route |
| OG image (places) | Photo Hero — full-bleed Google photo, gradient overlay, rating/name/location |
| OG image (homepage) | Static PNG asset (1200x630) |
| Place page rendering | Full server-rendered detail page |
| Data fetching | HTTP fetch to own API routes (`/api/places/[id]`, `/api/places/photo`) |
| Domain / metadataBase | `NEXT_PUBLIC_BASE_URL` env var with `http://localhost:3000` fallback |

## 1. Root Layout Metadata

Update `src/app/layout.tsx` to complete the existing metadata export:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Nerede Yesem? - Yakinimdaki En Iyi Mekanlar",
    template: "%s | Nerede Yesem?",
  },
  description:
    "Yakininizdaki en iyi restoranlari, kafeleri ve barlari kesfedin. Puanlar, yorumlar ve filtrelerle size en uygun mekani bulun.",
  openGraph: {
    title: "Nerede Yesem?",
    description: "Yakininizdaki en iyi mekanlari kesfedin",
    type: "website",
    locale: "tr_TR",
    siteName: "Nerede Yesem?",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nerede Yesem?",
    description: "Yakininizdaki en iyi mekanlari kesfedin",
  },
}
```

Add `NEXT_PUBLIC_BASE_URL` to `.env.example`.

## 2. Static Homepage OG Image

Place a designed `opengraph-image.png` (1200x630) in `src/app/`. Next.js file-based metadata convention auto-wires the `<meta>` tags. Also place `twitter-image.png` (same image, under 5MB limit).

Content: app name "Nerede Yesem?" with tagline and branded visual. This is a one-time design asset.

## 3. Place Route Structure

```
src/app/place/[id]/
  page.tsx              -- Server-rendered detail page + generateMetadata
  opengraph-image.tsx   -- Dynamic Photo Hero OG image via ImageResponse
  twitter-image.tsx     -- Separate file, same logic as opengraph-image
  loading.tsx           -- Skeleton UI
  error.tsx             -- Error boundary ("use client", Turkish messages)
  not-found.tsx         -- 404 for invalid place IDs
```

## 4. Dynamic OG Image Generation

File: `src/app/place/[id]/opengraph-image.tsx`

```ts
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

  // Fetch place data via own API route
  const place = await fetch(`${baseUrl}/api/places/${id}`).then((r) =>
    r.json()
  )

  // Fetch place photo as buffer via own proxy
  const photoName = place.photos?.[0]?.name
  const photoSrc = photoName
    ? await fetch(
        `${baseUrl}/api/places/photo?name=${photoName}&maxWidth=1200`
      )
        .then((r) => r.arrayBuffer())
        .then((buf) => {
          const base64 = Buffer.from(buf).toString("base64")
          return `data:image/jpeg;base64,${base64}`
        })
    : null

  // Load custom font (Noto Sans) for consistent rendering
  const fontData = await readFile(
    join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf")
  )

  // Render Photo Hero layout using ImageResponse
  // - Full-bleed photo background (or branded gradient fallback)
  // - Dark gradient overlay at bottom
  // - Rating badge, place type, price level
  // - Place name (large, bold)
  // - Neighborhood/city
  // - "Nerede Yesem?" branding top-right
  return new ImageResponse(/* JSX */, {
    ...size,
    fonts: [{ name: "Noto Sans", data: fontData, style: "normal", weight: 700 }],
  })
}
```

Key details:
- `params` is a Promise (Next.js 16)
- Photo fetched through own `/api/places/photo` proxy, converted to base64 data URI
- Graceful fallback: branded gradient background when no photo available
- Font: Noto Sans Bold `.ttf` stored in `assets/fonts/`
- Flexbox only (ImageResponse/Satori limitation)

`twitter-image.tsx` is a separate file with the same logic. It cannot be a re-export since that pattern is undocumented.

## 5. Place Detail Page

File: `src/app/place/[id]/page.tsx`

### generateMetadata

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  const place = await fetch(`${baseUrl}/api/places/${id}`).then((r) =>
    r.json()
  )

  return {
    title: place.displayName?.text,
    description: `${place.displayName?.text} - ${place.formattedAddress}. Puan: ${place.rating}/5`,
    openGraph: {
      title: place.displayName?.text,
      description: `${place.formattedAddress} - ${place.rating} ★`,
      type: "website",
      locale: "tr_TR",
      siteName: "Nerede Yesem?",
    },
    twitter: {
      card: "summary_large_image",
    },
  }
}
```

### Page component

Server-rendered detail view:

- Hero photo section (place photos)
- Place name, rating (stars + count), price level, place type
- Open/closed status with business hours
- Address with link to Google Maps
- User reviews section
- CTA button linking to `/?placeId={id}` to explore in the SPA

Reusable existing components where possible: `BlurImage`, `OpenStatusBadge`. The page has its own layout — not a replica of the sheet overlay.

## 6. Loading, Error, and Not-Found States

**`loading.tsx`** — Skeleton matching the detail page layout using shadcn `Skeleton` component. Photo placeholder, shimmer lines for name/rating/address.

**`error.tsx`** — `"use client"` component. Turkish error message "Mekan bilgileri yuklenemedi" with `unstable_retry` button (Next.js 16.2 convention).

**`not-found.tsx`** — Rendered when API returns 404 for invalid place ID. Turkish message "Mekan bulunamadi" with link back to homepage.

**API route consideration:** Verify that `GET /api/places/[id]` returns appropriate HTTP status codes. The page component calls `notFound()` from `next/navigation` when the API returns 404.

## 7. New Assets

- `assets/fonts/NotoSans-Bold.ttf` — downloaded Noto Sans Bold for OG image rendering
- `src/app/opengraph-image.png` — static 1200x630 branded homepage OG image
- `src/app/twitter-image.png` — same as homepage OG image (under 5MB)

## 8. Env Changes

Add to `.env.example`:

```
# Base URL for OpenGraph metadata (set to your production domain)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Out of Scope

- `robots.txt` or `sitemap.xml` generation
- JSON-LD structured data
- Changes to the existing SPA or sheet overlay
- New shared data-fetching utilities
- `generateImageMetadata` (multiple OG images per route)
