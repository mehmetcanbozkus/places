"use client"

import { useCallback, useEffect, useState } from "react"
import type { Place } from "@/lib/types"

export function usePlaces(
  location: { lat: number; lng: number } | null,
  radius: number
) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPlaces = useCallback(async () => {
    if (!location) return

    setLoading(true)
    try {
      const response = await fetch("/api/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          radius,
        }),
      })
      const data = await response.json()
      setPlaces(data.places || [])
    } catch {
      console.error("Failed to fetch places")
    } finally {
      setLoading(false)
    }
  }, [location, radius])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  return { fetchPlaces, loading, places }
}
