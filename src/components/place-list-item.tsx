"use client"

import { memo } from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Star,
  MessageSquare,
  MapPin,
  Clock,
  Share2,
  UtensilsCrossed,
  Heart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Place } from "@/lib/types"
import {
  getPhotoUrl,
  PRICE_LEVEL_SYMBOL,
  formatDistance,
  formatReviewCount,
  haversineDistance,
  sharePlace,
  getRatingColor,
  getCategoryColor,
  getRatingGlow,
} from "@/lib/types"

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

  const distance =
    userLocation && place.location
      ? haversineDistance(
          userLocation.lat,
          userLocation.lng,
          place.location.latitude,
          place.location.longitude
        )
      : null

  const priceSymbol = place.priceLevel
    ? PRICE_LEVEL_SYMBOL[place.priceLevel]
    : null

  const isOpen = place.currentOpeningHours?.openNow
  const ratingColor = place.rating ? getRatingColor(place.rating) : null
  const ratingGlow = place.rating ? getRatingGlow(place.rating) : undefined
  const categoryColor = getCategoryColor(place.primaryType, place.types)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(place.id)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await sharePlace(place)
    if (result === "copied") toast.success("Panoya kopyalandı")
    else if (result === "failed") toast.error("Paylaşılamadı")
  }

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
      {/* Thumbnail */}
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

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm leading-tight font-semibold">
            {place.displayName.text}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={handleShare}
              className="shrink-0 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
            >
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <motion.button
              onClick={handleFavorite}
              whileTap={{ scale: 1.3 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className={`shrink-0 rounded-full p-1 transition-opacity ${
                isFavorite
                  ? "text-pink-500"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted"
              }`}
              aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              aria-pressed={isFavorite}
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={isFavorite ? "currentColor" : "none"}
              />
            </motion.button>
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
            <Badge
              variant="secondary"
              className={`h-5 px-1.5 text-[10px] ${
                isOpen
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
              }`}
            >
              <Clock className="mr-0.5 h-2.5 w-2.5" />
              {isOpen ? "Açık" : "Kapalı"}
            </Badge>
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
