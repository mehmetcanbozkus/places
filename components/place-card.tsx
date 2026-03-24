"use client"

import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Star,
  MessageSquare,
  MapPin,
  Clock,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
  Share2,
  Heart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BlurImage } from "./blur-image"
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

interface PlaceCardProps {
  place: Place
  userLocation?: { lat: number; lng: number } | null
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: (placeId: string) => void
}

export function PlaceCard({
  place,
  userLocation,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: PlaceCardProps) {
  const photoUrl = place.photos?.[0]
    ? getPhotoUrl(place.photos[0].name, 600)
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await sharePlace(place)
    if (result === "copied") {
      toast.success("Panoya kopyalandı")
    } else if (result === "failed") {
      toast.error("Paylaşılamadı")
    }
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(place.id)
  }

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
      className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg"
      style={{
        borderTopWidth: "3px",
        borderTopColor: `var(--neon-${categoryColor.category})`,
      }}
    >
      {/* Photo */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {photoUrl ? (
          <BlurImage
            src={photoUrl}
            placeholderSrc={
              place.photos?.[0]
                ? getPhotoUrl(place.photos[0].name, 32)
                : undefined
            }
            alt={place.displayName.text}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.08]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay on photo */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Open/Closed badge with neon glow */}
        {isOpen !== undefined && (
          <div className="absolute top-3 left-3">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={
                isOpen
                  ? "bg-emerald-500/90 text-white backdrop-blur-sm hover:bg-emerald-500/90 shadow-[0_0_10px_oklch(0.7_0.2_145_/_0.4)]"
                  : "bg-red-500/90 text-white backdrop-blur-sm hover:bg-red-500/90 shadow-[0_0_10px_oklch(0.6_0.2_25_/_0.4)]"
              }
            >
              <Clock className="mr-1 h-3 w-3" />
              {isOpen ? "Açık" : "Kapalı"}
            </Badge>
          </div>
        )}

        {/* Top right: distance + share + favorite */}
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
          <button
            onClick={handleShare}
            className="rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/70"
            title="Paylaş"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <motion.button
            onClick={handleFavorite}
            whileTap={{ scale: 1.3 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={`rounded-full p-1.5 backdrop-blur-sm transition-opacity ${
              isFavorite
                ? "bg-pink-500/80 text-white shadow-[0_0_12px_oklch(0.7_0.22_350_/_0.5)]"
                : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70"
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

        {/* Place name overlay on photo */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="truncate text-sm font-semibold text-white drop-shadow-md">
            {place.displayName.text}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Type */}
        {place.primaryTypeDisplayName && (
          <p className="truncate text-sm text-muted-foreground">
            {place.primaryTypeDisplayName.text}
          </p>
        )}

        {/* Rating, reviews, price */}
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

        {/* Feature tags */}
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

        {/* Address */}
        {place.shortFormattedAddress && (
          <p className="mt-2.5 truncate text-xs text-muted-foreground">
            {place.shortFormattedAddress}
          </p>
        )}
      </div>
    </motion.div>
  )
}
