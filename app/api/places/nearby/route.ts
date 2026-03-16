import { NextRequest, NextResponse } from "next/server"

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.photos",
  "places.priceLevel",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.currentOpeningHours",
  "places.editorialSummary",
  "places.businessStatus",
  "places.delivery",
  "places.dineIn",
  "places.takeout",
  "places.reservable",
  "places.servesVegetarianFood",
  "places.outdoorSeating",
  "places.goodForGroups",
  "places.goodForChildren",
  "places.servesBeer",
  "places.servesWine",
  "places.liveMusic",
  "places.servesCocktails",
  "places.servesCoffee",
  "places.servesBreakfast",
  "places.servesLunch",
  "places.servesDinner",
  "places.servesBrunch",
  "places.servesDessert",
  "places.allowsDogs",
  "places.websiteUri",
  "places.googleMapsUri",
].join(",")

export async function POST(request: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    )
  }

  const body = await request.json()
  const {
    latitude,
    longitude,
    radius = 1500,
    languageCode = "tr",
  } = body

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: ["restaurant"],
        maxResultCount: 20,
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

  if (!response.ok) {
    const error = await response.text()
    return NextResponse.json(
      { error: "Google API error", details: error },
      { status: response.status }
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}
