"use client"

import { useCallback, useEffect, useState } from "react"
import type { SetValues, Values } from "nuqs"
import { toast } from "sonner"
import { searchParamsParsers } from "@/lib/search-params"
import type { Place } from "@/lib/types"

type SearchParams = Values<typeof searchParamsParsers>
type SetSearchParams = SetValues<typeof searchParamsParsers>

export function usePlaceDetail(
  searchParams: Pick<SearchParams, "place">,
  setSearchParams: SetSearchParams
) {
  const [detailPlace, setDetailPlace] = useState<Place | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const openDetail = useCallback(
    async (place: Place) => {
      setDetailPlace(place)
      setDetailOpen(true)
      setDetailLoading(true)
      setSearchParams({ place: place.id }, { history: "push" })

      try {
        const response = await fetch(`/api/places/${place.id}`)
        if (response.ok) {
          const data = await response.json()
          setDetailPlace(data)
        }
      } catch {
        // Keep basic place info as fallback
      } finally {
        setDetailLoading(false)
      }
    },
    [setSearchParams]
  )

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailPlace(null)
    setSearchParams({ place: null }, { history: "push" })
  }, [setSearchParams])

  const handleDetailOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDetail()
      }
    },
    [closeDetail]
  )

  useEffect(() => {
    const placeId = searchParams.place

    if (placeId && !detailOpen) {
      setDetailOpen(true)
      setDetailLoading(true)
      fetch(`/api/places/${placeId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found")
          return res.json()
        })
        .then((data) => {
          setDetailPlace(data)
        })
        .catch(() => {
          toast.error("Mekan bulunamadı")
          setSearchParams({ place: null })
          setDetailOpen(false)
        })
        .finally(() => {
          setDetailLoading(false)
        })
    } else if (!placeId && detailOpen) {
      setDetailOpen(false)
      setDetailPlace(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.place])

  return {
    closeDetail,
    detailLoading,
    detailOpen,
    detailPlace,
    handleDetailOpenChange,
    openDetail,
  }
}
