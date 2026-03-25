"use client"

import { memo } from "react"
import { motion, useReducedMotion } from "motion/react"
import {
  MessageSquare,
  MapPin,
  ShoppingBag,
  Star,
  Truck,
  UtensilsCrossed,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "./favorite-button"
import { BlurImage } from "./blur-image"
import { OpenStatusBadge } from "./open-status-badge"
import { ShareButton } from "./share-button"
import { usePlaceDisplay } from "@/hooks/use-place-display"
import type { Place } from "@/lib/types"
import { formatDistance } from "@/lib/geo"
import { formatReviewCount, getPhotoUrl } from "@/lib/place-utils"

interface PlaceCardProps {
  place: Place
  userLocation?: { lat: number; lng: number } | null
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: (placeId: string) => void
}

export const PlaceCard = memo(function PlaceCard({
  place,
  userLocation,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: PlaceCardProps) {
  const photoUrl = place.photos?.[0]
    ? getPhotoUrl(place.photos[0].name, 600)
    : null

  const {
    distance,
    priceSymbol,
    isOpen,
    ratingColor,
    ratingGlow,
    categoryColor,
  } = usePlaceDisplay(place, userLocation)

  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 160, damping: 20 },
        },
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onClick}
      className="place-card-item group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg"
      style={{
        borderTopWidth: "3px",
        borderTopColor: `var(--neon-${categoryColor.category})`,
      }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {photoUrl ? (
          <motion.div
            className="h-full w-full"
            whileHover={reducedMotion ? undefined : { scale: 1.08 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
              duration: 0.5,
            }}
          >
            <BlurImage
              src={photoUrl}
              placeholderSrc={
                place.photos?.[0]
                  ? getPhotoUrl(place.photos[0].name, 32)
                  : undefined
              }
              alt={place.displayName.text}
              className="h-full w-full"
            />
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {isOpen !== undefined && (
          <div className="absolute top-3 left-3">
            <OpenStatusBadge isOpen={isOpen} />
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {distance !== null && (
            <Badge
              variant="secondary"
              className="bg-black/50 text-white backdrop-blur-sm hover:bg-black/50"
            >
              <MapPin className="mr-1 h-3 w-3" />
              {formatDistance(distance)}
            </Badge>
          )}
          <ShareButton
            place={place}
            className="rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:bg-black/70"
            iconClassName="text-white"
          />
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={() => onToggleFavorite?.(place.id)}
            className={`backdrop-blur-sm ${
              isFavorite
                ? "bg-pink-500/80 text-white shadow-[0_0_12px_oklch(0.7_0.22_350_/_0.5)]"
                : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70"
            }`}
          />
        </div>

        <div className="absolute right-3 bottom-2 left-3">
          <h3
            className="truncate text-sm font-semibold text-white"
            style={{
              textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)",
            }}
          >
            {place.displayName.text}
          </h3>
        </div>
      </div>

      <div className="p-4">
        {place.primaryTypeDisplayName && (
          <p className="truncate text-sm text-muted-foreground">
            {place.primaryTypeDisplayName.text}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-sm">
          {place.rating !== undefined && ratingColor && (
            <div
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5"
              style={{ boxShadow: ratingGlow }}
            >
              <Star
                className={`h-4 w-4 ${ratingColor.fill} ${ratingColor.text}`}
              />
              <span className={`font-semibold ${ratingColor.text}`}>
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}
          {place.userRatingCount !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{formatReviewCount(place.userRatingCount)}</span>
            </div>
          )}
          {priceSymbol && (
            <span className="font-medium text-muted-foreground">
              {priceSymbol}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {place.delivery && (
            <Badge variant="outline" className="text-xs font-normal">
              <Truck className="mr-1 h-3 w-3" />
              Paket
            </Badge>
          )}
          {place.dineIn && (
            <Badge variant="outline" className="text-xs font-normal">
              <UtensilsCrossed className="mr-1 h-3 w-3" />
              Restoran
            </Badge>
          )}
          {place.takeout && (
            <Badge variant="outline" className="text-xs font-normal">
              <ShoppingBag className="mr-1 h-3 w-3" />
              Gel-al
            </Badge>
          )}
        </div>

        {place.shortFormattedAddress && (
          <p className="mt-2.5 truncate text-xs text-muted-foreground">
            {place.shortFormattedAddress}
          </p>
        )}
      </div>
    </motion.div>
  )
})
