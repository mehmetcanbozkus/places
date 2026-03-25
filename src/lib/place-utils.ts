import type { Place, FilterState, CategoryColor } from "./types"
import { PRICE_LEVEL_MAP, RESTAURANT_TYPES, CAFE_TYPES, BAR_TYPES, PASTRY_TYPES } from "./constants"

export function getRatingColor(rating: number): {
  text: string
  fill: string
} {
  if (rating >= 4.5)
    return { text: "text-emerald-500", fill: "fill-emerald-500" }
  if (rating >= 3.5) return { text: "text-amber-400", fill: "fill-amber-400" }
  return { text: "text-red-500", fill: "fill-red-500" }
}

export function getCategoryColor(
  primaryType?: string,
  types?: string[]
): CategoryColor {
  const type = primaryType || types?.[0] || ""
  if (RESTAURANT_TYPES.has(type))
    return {
      dark: "oklch(0.75 0.2 45)",
      light: "oklch(0.55 0.2 45)",
      category: "restaurant",
    }
  if (CAFE_TYPES.has(type))
    return {
      dark: "oklch(0.75 0.2 145)",
      light: "oklch(0.45 0.18 145)",
      category: "cafe",
    }
  if (BAR_TYPES.has(type))
    return {
      dark: "oklch(0.7 0.25 310)",
      light: "oklch(0.5 0.22 310)",
      category: "bar",
    }
  if (PASTRY_TYPES.has(type))
    return {
      dark: "oklch(0.75 0.22 350)",
      light: "oklch(0.55 0.2 350)",
      category: "pastry",
    }
  return {
    dark: "oklch(0.75 0.18 230)",
    light: "oklch(0.5 0.18 230)",
    category: "other",
  }
}

export function getRatingGlow(rating: number): string {
  if (rating >= 4.5) return "0 0 12px oklch(0.7 0.2 145 / 0.4)"
  if (rating >= 3.5) return "0 0 12px oklch(0.7 0.15 85 / 0.4)"
  return "0 0 12px oklch(0.6 0.2 25 / 0.4)"
}

export function getPhotoUrl(
  photoName: string,
  maxWidthPx: number = 400
): string {
  return `/api/places/photo?name=${encodeURIComponent(photoName)}&maxWidthPx=${maxWidthPx}`
}

export function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

export function buildPlaceUrl(place: Place): string {
  const params = new URLSearchParams()
  params.set("place", place.id)
  if (place.location) {
    params.set("lat", String(place.location.latitude))
    params.set("lng", String(place.location.longitude))
  }
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/?${params.toString()}`
}

export async function sharePlace(
  place: Place
): Promise<"shared" | "copied" | "failed"> {
  const rating = place.rating ? `${place.rating.toFixed(1)}` : ""
  const reviews = place.userRatingCount
    ? `(${formatReviewCount(place.userRatingCount)} yorum)`
    : ""
  const price = place.priceLevel
    ? ` · ${PRICE_LEVEL_MAP[place.priceLevel]}`
    : ""
  const address = place.shortFormattedAddress || place.formattedAddress || ""
  const url = buildPlaceUrl(place)

  const lines = [
    place.displayName.text,
    [rating, reviews, price].filter(Boolean).join(" "),
    address,
    url,
  ].filter(Boolean)

  const text = lines.join("\n")

  // Try native share first
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: place.displayName.text,
        text: text,
        url,
      })
      return "shared"
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "failed"
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text)
    return "copied"
  } catch {
    return "failed"
  }
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0
  if (filters.minRating > 0) count++
  if (filters.minReviewCount > 0) count++
  if (filters.priceLevels.length > 0) count++
  if (filters.openNow) count++
  if (filters.delivery) count++
  if (filters.dineIn) count++
  if (filters.takeout) count++
  if (filters.servesVegetarianFood) count++
  if (filters.outdoorSeating) count++
  if (filters.reservable) count++
  if (filters.goodForGroups) count++
  if (filters.liveMusic) count++
  if (filters.servesCocktails) count++
  if (filters.servesBreakfast) count++
  if (filters.servesLunch) count++
  if (filters.servesDinner) count++
  if (filters.servesBrunch) count++
  if (filters.servesAlcohol) count++
  return count
}
