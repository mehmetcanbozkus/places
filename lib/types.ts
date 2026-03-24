export interface Place {
  id: string
  name: string
  displayName: LocalizedText
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: LatLng
  rating?: number
  userRatingCount?: number
  priceLevel?: PriceLevel
  primaryType?: string
  primaryTypeDisplayName?: LocalizedText
  types?: string[]
  photos?: PlacePhoto[]
  currentOpeningHours?: OpeningHours
  regularOpeningHours?: OpeningHours
  editorialSummary?: LocalizedText
  reviews?: Review[]
  websiteUri?: string
  googleMapsUri?: string
  internationalPhoneNumber?: string
  businessStatus?: string
  delivery?: boolean
  dineIn?: boolean
  takeout?: boolean
  reservable?: boolean
  servesVegetarianFood?: boolean
  outdoorSeating?: boolean
  goodForGroups?: boolean
  goodForChildren?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  liveMusic?: boolean
  servesCocktails?: boolean
  servesCoffee?: boolean
  servesBreakfast?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
  servesBrunch?: boolean
  servesDessert?: boolean
  allowsDogs?: boolean
  menuForChildren?: boolean
  restroom?: boolean
  goodForWatchingSports?: boolean
  parkingOptions?: ParkingOptions
  paymentOptions?: PaymentOptions
  accessibilityOptions?: AccessibilityOptions
}

export interface LocalizedText {
  text: string
  languageCode?: string
}

export interface LatLng {
  latitude: number
  longitude: number
}

export interface PlacePhoto {
  name: string
  widthPx: number
  heightPx: number
  authorAttributions?: AuthorAttribution[]
}

export interface AuthorAttribution {
  displayName: string
  uri: string
  photoUri: string
}

export interface Review {
  name: string
  relativePublishTimeDescription: string
  text?: LocalizedText
  originalText?: LocalizedText
  rating: number
  authorAttribution: AuthorAttribution
  publishTime: string
}

export interface OpeningHours {
  openNow?: boolean
  weekdayDescriptions?: string[]
  periods?: Period[]
}

export interface Period {
  open: TimePoint
  close?: TimePoint
}

export interface TimePoint {
  day: number
  hour: number
  minute: number
}

export interface ParkingOptions {
  freeParkingLot?: boolean
  paidParkingLot?: boolean
  freeStreetParking?: boolean
  paidStreetParking?: boolean
  valetParking?: boolean
  freeGarageParking?: boolean
  paidGarageParking?: boolean
}

export interface PaymentOptions {
  acceptsCreditCards?: boolean
  acceptsDebitCards?: boolean
  acceptsCashOnly?: boolean
  acceptsNfc?: boolean
}

export interface AccessibilityOptions {
  wheelchairAccessibleParking?: boolean
  wheelchairAccessibleEntrance?: boolean
  wheelchairAccessibleRestroom?: boolean
  wheelchairAccessibleSeating?: boolean
}

export type PriceLevel =
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE"

export interface FilterState {
  minRating: number
  minReviewCount: number
  priceLevels: PriceLevel[]
  openNow: boolean
  delivery: boolean
  dineIn: boolean
  takeout: boolean
  servesVegetarianFood: boolean
  outdoorSeating: boolean
  reservable: boolean
  goodForGroups: boolean
  liveMusic: boolean
  servesCocktails: boolean
  servesBreakfast: boolean
  servesLunch: boolean
  servesDinner: boolean
  servesBrunch: boolean
  servesAlcohol: boolean
}

export type SortOption = "rating" | "reviewCount" | "distance"

export const PRICE_LEVEL_MAP: Record<PriceLevel, string> = {
  PRICE_LEVEL_FREE: "Ücretsiz",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}

export const PRICE_LEVEL_SYMBOL: Record<PriceLevel, string> = {
  PRICE_LEVEL_FREE: "",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}

export const DEFAULT_FILTERS: FilterState = {
  minRating: 0,
  minReviewCount: 0,
  priceLevels: [],
  openNow: false,
  delivery: false,
  dineIn: false,
  takeout: false,
  servesVegetarianFood: false,
  outdoorSeating: false,
  reservable: false,
  goodForGroups: false,
  liveMusic: false,
  servesCocktails: false,
  servesBreakfast: false,
  servesLunch: false,
  servesDinner: false,
  servesBrunch: false,
  servesAlcohol: false,
}

export function getRatingColor(rating: number): {
  text: string
  fill: string
} {
  if (rating >= 4.5)
    return { text: "text-emerald-500", fill: "fill-emerald-500" }
  if (rating >= 3.5) return { text: "text-amber-400", fill: "fill-amber-400" }
  return { text: "text-red-500", fill: "fill-red-500" }
}

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

export function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
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

  const lines = [
    place.displayName.text,
    [rating, reviews, price].filter(Boolean).join(" "),
    address,
    place.googleMapsUri || "",
  ].filter(Boolean)

  const text = lines.join("\n")

  // Try native share first
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: place.displayName.text,
        text: text,
        url: place.googleMapsUri || undefined,
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
