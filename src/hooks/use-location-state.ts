"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SetValues, Values } from "nuqs"
import { searchParamsParsers } from "@/lib/search-params"

type SearchParams = Values<typeof searchParamsParsers>
type SetSearchParams = SetValues<typeof searchParamsParsers>
type LocationSource = "gps" | "search"
type LocationStatus = "pending" | "granted" | "denied" | "error"

interface UseLocationStateOptions {
  searchParams: Pick<SearchParams, "lat" | "lng" | "q">
  setSearchParams: SetSearchParams
}

export function useLocationState({
  searchParams,
  setSearchParams,
}: UseLocationStateOptions) {
  const urlHasLocation = searchParams.lat !== null && searchParams.lng !== null

  const [gpsLocation, setGpsLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locationSource, setLocationSource] = useState<LocationSource>(
    urlHasLocation ? "search" : "gps"
  )
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    urlHasLocation ? "granted" : "pending"
  )

  const location = useMemo(() => {
    if (
      locationSource === "search" &&
      searchParams.lat !== null &&
      searchParams.lng !== null
    ) {
      return { lat: searchParams.lat, lng: searchParams.lng }
    }
    return gpsLocation
  }, [gpsLocation, locationSource, searchParams.lat, searchParams.lng])

  const locationLabel =
    searchParams.q ?? (locationSource === "gps" ? "Mevcut Konum" : "")

  useEffect(() => {
    if (urlHasLocation) return
    if (!("geolocation" in navigator)) {
      setLocationStatus("error")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setGpsLocation(loc)
        if (!urlHasLocation) {
          setLocationSource("gps")
        }
        setLocationStatus("granted")
      },
      (error) => {
        if (!urlHasLocation) {
          setLocationStatus(error.code === 1 ? "denied" : "error")
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const useMyLocation = useCallback(() => {
    if (gpsLocation) {
      setSearchParams({ lat: null, lng: null, q: null })
      setLocationSource("gps")
    }
  }, [gpsLocation, setSearchParams])

  return {
    gpsLocation,
    location,
    locationLabel,
    locationSource,
    locationStatus,
    setLocationSource,
    setLocationStatus,
    useMyLocation,
  }
}
