import { NextResponse } from "next/server"

export const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export function apiKeyError() {
  return NextResponse.json(
    { error: "API key not configured" },
    { status: 500 }
  )
}

// Unprefixed field names — shared between nearby (needs `places.` prefix) and detail routes
export const BASE_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "photos",
  "priceLevel",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "currentOpeningHours",
  "editorialSummary",
  "businessStatus",
  "delivery",
  "dineIn",
  "takeout",
  "reservable",
  "servesVegetarianFood",
  "outdoorSeating",
  "goodForGroups",
  "goodForChildren",
  "servesBeer",
  "servesWine",
  "liveMusic",
  "servesCocktails",
  "servesCoffee",
  "servesBreakfast",
  "servesLunch",
  "servesDinner",
  "servesBrunch",
  "servesDessert",
  "allowsDogs",
  "websiteUri",
  "googleMapsUri",
]

// Additional fields only fetched for detail view
export const DETAIL_ONLY_FIELDS = [
  "regularOpeningHours",
  "internationalPhoneNumber",
  "reviews",
  "menuForChildren",
  "restroom",
  "goodForWatchingSports",
  "parkingOptions",
  "paymentOptions",
  "accessibilityOptions",
  "curbsidePickup",
  "googleMapsLinks",
  "generativeSummary",
  "reviewSummary",
  "priceRange",
]

// For the nearby route: prefix each field with `places.`
export const NEARBY_FIELD_MASK = BASE_FIELDS.map((f) => `places.${f}`).join(",")

// For the [id] route: all fields unprefixed
export const DETAIL_FIELD_MASK = [...BASE_FIELDS, ...DETAIL_ONLY_FIELDS].join(",")
