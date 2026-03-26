import { GOOGLE_API_KEY, DETAIL_FIELD_MASK } from "@/app/api/places/_shared"
import type { Place } from "./types"

export async function fetchPlaceDetail(id: string): Promise<Place | null> {
  if (!GOOGLE_API_KEY) return null

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${id}?languageCode=tr&regionCode=TR`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
      },
    }
  )

  if (!res.ok) return null
  return res.json()
}

export async function fetchPlacePhotoBuffer(
  photoName: string,
  maxWidthPx = 1200
): Promise<ArrayBuffer | null> {
  if (!GOOGLE_API_KEY) return null

  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    maxWidthPx: String(maxWidthPx),
    skipHttpRedirect: "true",
  })

  const res = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?${params}`
  )
  if (!res.ok) return null

  const data = await res.json()
  if (!data.photoUri) return null

  const imageRes = await fetch(data.photoUri)
  if (!imageRes.ok) return null

  return imageRes.arrayBuffer()
}
