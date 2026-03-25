import { NextRequest, NextResponse } from "next/server"
import { GOOGLE_API_KEY, apiKeyError, NEARBY_FIELD_MASK } from "../_shared"

// Per the docs, using includedPrimaryTypes with a general type like "restaurant"
// automatically includes all subtypes (chinese_restaurant, seafood_restaurant, etc.)
// We split into 3 groups for parallel requests (max 20 results each = up to 60 total).
//
// Group 1: All restaurants via includedPrimaryTypes (catches every cuisine subtype)
// Group 2: Cafes, bakeries, dessert & casual spots via includedTypes
// Group 3: Bars, pubs & drink-focused venues via includedTypes

interface TypeGroup {
  includedTypes?: string[]
  includedPrimaryTypes?: string[]
}

const FOOD_TYPE_GROUPS: TypeGroup[] = [
  // Group 1: All restaurants — includedPrimaryTypes "restaurant" matches every subtype
  // (turkish_restaurant, kebab_shop, fast_food_restaurant, fine_dining_restaurant, etc.)
  {
    includedPrimaryTypes: ["restaurant"],
  },
  // Group 2: Cafes, bakeries, dessert & casual food spots
  {
    includedTypes: [
      "cafe",
      "coffee_shop",
      "bakery",
      "pastry_shop",
      "ice_cream_shop",
      "dessert_shop",
      "tea_house",
      "sandwich_shop",
      "deli",
      "food_court",
      "meal_delivery",
      "meal_takeaway",
      "snack_bar",
    ],
  },
  // Group 3: Bars, pubs & drink-focused dining
  {
    includedTypes: [
      "bar",
      "pub",
      "bar_and_grill",
      "gastropub",
      "brewpub",
      "beer_garden",
      "wine_bar",
      "cocktail_bar",
      "sports_bar",
      "lounge_bar",
    ],
  },
]

async function fetchNearbyGroup(
  typeGroup: TypeGroup,
  latitude: number,
  longitude: number,
  radius: number,
  languageCode: string,
  rankPreference: string
) {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY!,
        "X-Goog-FieldMask": NEARBY_FIELD_MASK,
      },
      body: JSON.stringify({
        ...typeGroup,
        maxResultCount: 20,
        rankPreference,
        languageCode,
        regionCode: "TR",
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius,
          },
        },
      }),
    }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.places || []
}

export async function POST(request: NextRequest) {
  if (!GOOGLE_API_KEY) return apiKeyError()

  const body = await request.json()
  const {
    latitude,
    longitude,
    radius = 3000,
    languageCode = "tr",
    rankPreference = "POPULARITY",
  } = body

  // Fetch all groups in parallel (up to 60 results total)
  const results = await Promise.all(
    FOOD_TYPE_GROUPS.map((typeGroup) =>
      fetchNearbyGroup(
        typeGroup,
        latitude,
        longitude,
        radius,
        languageCode,
        rankPreference
      )
    )
  )

  // Merge and deduplicate by place ID
  const seen = new Set<string>()
  const places = []
  for (const group of results) {
    for (const place of group) {
      if (!seen.has(place.id)) {
        seen.add(place.id)
        places.push(place)
      }
    }
  }

  return NextResponse.json({ places })
}
