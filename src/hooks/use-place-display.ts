import type { Place } from "@/lib/types"
import {
  getRatingColor,
  getRatingGlow,
  getCategoryColor,
} from "@/lib/place-utils"
import { PRICE_LEVEL_SYMBOL } from "@/lib/constants"
import { haversineDistance } from "@/lib/geo"

export function usePlaceDisplay(
  place: Place | null,
  userLocation?: { lat: number; lng: number } | null
) {
  const distance =
    place && userLocation && place.location
      ? haversineDistance(
          userLocation.lat,
          userLocation.lng,
          place.location.latitude,
          place.location.longitude
        )
      : null

  const priceSymbol = place?.priceLevel
    ? PRICE_LEVEL_SYMBOL[place.priceLevel]
    : null

  const isOpen = place?.currentOpeningHours?.openNow

  const ratingColor = place?.rating ? getRatingColor(place.rating) : null
  const ratingGlow = place?.rating ? getRatingGlow(place.rating) : undefined
  const categoryColor = getCategoryColor(place?.primaryType, place?.types)

  return {
    distance,
    priceSymbol,
    isOpen,
    ratingColor,
    ratingGlow,
    categoryColor,
  }
}
