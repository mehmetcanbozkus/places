"use client"

import { memo } from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { MapPin, MessageSquare, Star, UtensilsCrossed } from "lucide-react"
import { FavoriteButton } from "./favorite-button"
import { OpenStatusBadge } from "./open-status-badge"
import { ShareButton } from "./share-button"
import { usePlaceDisplay } from "@/hooks/use-place-display"
import type { Place } from "@/lib/types"
import { formatDistance } from "@/lib/geo"
import { formatReviewCount, getPhotoUrl } from "@/lib/place-utils"

interface PlaceListItemProps {
  place: Place
  userLocation?: { lat: number; lng: number } | null
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: (placeId: string) => void
}

export const PlaceListItem = memo(function PlaceListItem({
  place,
  userLocation,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: PlaceListItemProps) {
  const photoUrl = place.photos?.[0]
    ? getPhotoUrl(place.photos[0].name, 200)
    : null

  const {
    distance,
    priceSymbol,
    isOpen,
    ratingColor,
    ratingGlow,
    categoryColor,
  } = usePlaceDisplay(place, userLocation)

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -16 },
        show: { opacity: 1, x: 0 },
      }}
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={onClick}
      className="place-list-item group flex cursor-pointer gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: `var(--neon-${categoryColor.category})`,
      }}
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={place.displayName.text}
            fill
            sizes="96px"
            loading="lazy"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm leading-tight font-semibold">
            {place.displayName.text}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5">
            <ShareButton
              place={place}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted"
            />
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={() => onToggleFavorite?.(place.id)}
              className={`p-1 ${
                isFavorite
                  ? "text-pink-500"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted"
              }`}
            />
          </div>
        </div>

        {place.primaryTypeDisplayName && (
          <p className="truncate text-xs text-muted-foreground">
            {place.primaryTypeDisplayName.text}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          {place.rating !== undefined && ratingColor && (
            <div
              className="flex items-center gap-0.5"
              style={{ textShadow: ratingGlow }}
            >
              <Star
                className={`h-3.5 w-3.5 ${ratingColor.fill} ${ratingColor.text}`}
              />
              <span className={`font-semibold ${ratingColor.text}`}>
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}
          {place.userRatingCount !== undefined && (
            <span className="text-muted-foreground">
              <MessageSquare className="mr-0.5 inline h-3 w-3" />
              {formatReviewCount(place.userRatingCount)}
            </span>
          )}
          {priceSymbol && (
            <span className="text-muted-foreground">{priceSymbol}</span>
          )}
          {distance !== null && (
            <span className="text-muted-foreground">
              <MapPin className="mr-0.5 inline h-3 w-3" />
              {formatDistance(distance)}
            </span>
          )}
          {isOpen !== undefined && (
            <OpenStatusBadge isOpen={isOpen} variant="inline" />
          )}
        </div>

        {place.shortFormattedAddress && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {place.shortFormattedAddress}
          </p>
        )}
      </div>
    </motion.div>
  )
})
