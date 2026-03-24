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
} from "@/lib/types"

interface PlaceCardProps {
  place: Place
  userLocation?: { lat: number; lng: number } | null
  onClick: () => void
}

export function PlaceCard({ place, userLocation, onClick }: PlaceCardProps) {
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await sharePlace(place)
    if (result === "copied") {
      toast.success("Panoya kopyalandı")
    } else if (result === "failed") {
      toast.error("Paylaşılamadı")
    }
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
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
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Open/Closed badge */}
        {isOpen !== undefined && (
          <div className="absolute top-3 left-3">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={
                isOpen
                  ? "bg-emerald-500/90 text-white backdrop-blur-sm hover:bg-emerald-500/90"
                  : "bg-red-500/90 text-white backdrop-blur-sm hover:bg-red-500/90"
              }
            >
              <Clock className="mr-1 h-3 w-3" />
              {isOpen ? "Açık" : "Kapalı"}
            </Badge>
          </div>
        )}

        {/* Top right: distance + share */}
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
            className="rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-black/70"
            title="Paylaş"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name and type */}
        <h3 className="truncate text-base leading-tight font-semibold">
          {place.displayName.text}
        </h3>
        {place.primaryTypeDisplayName && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {place.primaryTypeDisplayName.text}
          </p>
        )}

        {/* Rating, reviews, price */}
        <div className="mt-2.5 flex items-center gap-3 text-sm">
          {place.rating !== undefined && ratingColor && (
            <div className="flex items-center gap-1">
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
