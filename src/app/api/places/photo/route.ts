import { NextRequest } from "next/server"
import { GOOGLE_API_KEY } from "../_shared"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const name = searchParams.get("name")
  const maxWidthPx = searchParams.get("maxWidthPx") || "400"
  const maxHeightPx = searchParams.get("maxHeightPx")

  if (!GOOGLE_API_KEY) {
    return new Response("API key not configured", { status: 500 })
  }
  if (!name) {
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
    const imageResponse = await fetch(data.photoUri)
    if (!imageResponse.ok) {
      return new Response("Photo not found", { status: 404 })
    }

    return new Response(imageResponse.body, {
      headers: {
        "Content-Type":
          imageResponse.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  }

  return new Response("Photo not found", { status: 404 })
}
