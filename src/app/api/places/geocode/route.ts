import { NextRequest, NextResponse } from "next/server"
import { GOOGLE_API_KEY, apiKeyError } from "../_shared"

export async function GET(request: NextRequest) {
  if (!GOOGLE_API_KEY) return apiKeyError()

  const address = request.nextUrl.searchParams.get("address")
  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  // Use Places API Text Search to find the location
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "places.location,places.formattedAddress,places.displayName",
      },
      body: JSON.stringify({
        textQuery: address,
        languageCode: "tr",
        regionCode: "TR",
        maxResultCount: 1,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    return NextResponse.json(
      { error: "Search failed", details: error },
      { status: response.status }
    )
  }

  const data = await response.json()

  if (!data.places?.length) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 })
  }

  const place = data.places[0]
  return NextResponse.json({
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    formattedAddress:
      place.formattedAddress || place.displayName?.text || address,
  })
}
