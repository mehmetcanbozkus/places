import { NextRequest } from "next/server"

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const name = searchParams.get("name")
  const maxWidthPx = searchParams.get("maxWidthPx") || "400"
  const maxHeightPx = searchParams.get("maxHeightPx")

  if (!name || !GOOGLE_API_KEY) {
    return new Response("Missing parameters", { status: 400 })
  }

  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    maxWidthPx,
    skipHttpRedirect: "true",
  })
  if (maxHeightPx) params.set("maxHeightPx", maxHeightPx)

  const response = await fetch(
    `https://places.googleapis.com/v1/${name}/media?${params}`
  )

  if (!response.ok) {
    return new Response("Photo not found", { status: 404 })
  }

  const data = await response.json()

  if (data.photoUri) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: data.photoUri,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  }

  return new Response("Photo not found", { status: 404 })
}
