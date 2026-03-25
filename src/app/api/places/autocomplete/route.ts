import { NextRequest, NextResponse } from "next/server"
import { GOOGLE_API_KEY, apiKeyError } from "../_shared"

export async function POST(request: NextRequest) {
  if (!GOOGLE_API_KEY) return apiKeyError()

  const body = await request.json()
  const { input, latitude, longitude } = body

  if (!input) {
    return NextResponse.json({ suggestions: [] })
  }

  const requestBody: Record<string, unknown> = {
    input,
    languageCode: "tr",
    regionCode: "TR",
    includedRegionCodes: ["tr"],
  }

  // Bias towards user's current location if available
  if (latitude && longitude) {
    requestBody.locationBias = {
      circle: {
        center: { latitude, longitude },
        radius: 50000.0,
      },
    }
    requestBody.origin = { latitude, longitude }
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    return NextResponse.json(
      { error: "Autocomplete failed", details: error },
      { status: response.status }
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}
