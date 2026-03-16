import { NextRequest, NextResponse } from "next/server"

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

const FIELD_MASK = [
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
  "regularOpeningHours",
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
  "menuForChildren",
  "restroom",
  "goodForWatchingSports",
  "parkingOptions",
  "paymentOptions",
  "accessibilityOptions",
  "websiteUri",
  "googleMapsUri",
  "internationalPhoneNumber",
  "reviews",
].join(",")

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    )
  }

  const { id } = await params
  const languageCode =
    request.nextUrl.searchParams.get("languageCode") || "tr"

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${id}?languageCode=${languageCode}&regionCode=TR`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
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
