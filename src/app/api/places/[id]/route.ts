import { NextRequest, NextResponse } from "next/server"
import { GOOGLE_API_KEY, apiKeyError, DETAIL_FIELD_MASK } from "../_shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!GOOGLE_API_KEY) return apiKeyError()

  const { id } = await params
  const languageCode = request.nextUrl.searchParams.get("languageCode") || "tr"

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${id}?languageCode=${languageCode}&regionCode=TR`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
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
