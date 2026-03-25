"use client"

import { useRef, useState, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PhotoLightbox } from "./photo-lightbox"
import { RatingBreakdown } from "./rating-breakdown"
import {
  Star,
  MessageSquare,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Clock,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
  Leaf,
  TreePine,
  CalendarCheck,
  Users,
  Music,
  Wine,
  Dog,
  Baby,
  Martini,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Share2,
  Images,
  Heart,
  Navigation,
  PenSquare,
  Camera,
  Sparkles,
  CarFront,
} from "lucide-react"
import type { Place } from "@/lib/types"
import {
  getPhotoUrl,
  PRICE_LEVEL_MAP,
  formatReviewCount,
  sharePlace,
  getRatingColor,
} from "@/lib/types"

interface PlaceDetailSheetProps {
  place: Place | null
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  isFavorite?: boolean
  onToggleFavorite?: (placeId: string) => void
}

function PhotoGallery({
  photos,
  onPhotoClick,
}: {
  photos: Place["photos"]
  onPhotoClick: (index: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!photos?.length) return null

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {photos.map((photo, i) => (
          <div
            key={photo.name}
            className="relative aspect-[4/3] w-full flex-shrink-0 cursor-pointer snap-center overflow-hidden rounded-lg bg-muted"
            onClick={() => onPhotoClick(i)}
          >
            <Image
              src={getPhotoUrl(photo.name, 800)}
              alt={`Fotoğraf ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {/* Photo count badge */}
          <button
            onClick={() => onPhotoClick(0)}
            className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <Images className="h-3 w-3" />
            {photos.length} fotoğraf
          </button>
        </>
      )}
    </div>
  )
}

function ReviewCard({
  review,
}: {
  review: Place["reviews"] extends (infer R)[] | undefined ? R : never
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-muted/30 p-4"
    >
      <div className="flex items-start gap-3">
        {review.authorAttribution?.photoUri && (
          <Image
            src={review.authorAttribution.photoUri}
            alt={review.authorAttribution.displayName}
            width={32}
            height={32}
            className="rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">
              {review.authorAttribution?.displayName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {review.relativePublishTimeDescription}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          {review.text?.text && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {review.text.text}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function FeatureBadge({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}) {
  if (!active) return null
  return (
    <Badge variant="secondary" className="gap-1 text-xs font-normal">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export function PlaceDetailSheet({
  place,
  open,
  onOpenChange,
  loading,
  isFavorite,
  onToggleFavorite,
}: PlaceDetailSheetProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [reviewFilter, setReviewFilter] = useState<number | null>(null)
  const [prevPlaceId, setPrevPlaceId] = useState(place?.id)

  // Reset review filter when place changes
  if (place?.id !== prevPlaceId) {
    setPrevPlaceId(place?.id)
    setReviewFilter(null)
  }

  const reviews = place?.reviews
  const filteredReviews = useMemo(() => {
    if (!reviews) return []
    if (reviewFilter === null) return reviews
    return reviews.filter((r) => r.rating === reviewFilter)
  }, [reviews, reviewFilter])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleShare = async () => {
    if (!place) return
    const result = await sharePlace(place)
    if (result === "copied") {
      toast.success("Panoya kopyalandı")
    } else if (result === "failed") {
      toast.error("Paylaşılamadı")
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <ScrollArea className="h-full">
            <div className="p-6">
              <SheetHeader className="sr-only">
                <SheetTitle>
                  {place?.displayName.text || "Mekan Detayı"}
                </SheetTitle>
              </SheetHeader>

              <AnimatePresence mode="wait">
                {loading && !place ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <DetailSkeleton />
                  </motion.div>
                ) : place ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Photos */}
                    <PhotoGallery
                      photos={place.photos}
                      onPhotoClick={openLightbox}
                    />

                    {/* Name, type, rating + share */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold">
                            {place.displayName.text}
                          </h2>
                          {place.primaryTypeDisplayName && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {place.primaryTypeDisplayName.text}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <motion.button
                            onClick={() => onToggleFavorite?.(place.id)}
                            whileTap={{ scale: 1.3 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 10,
                            }}
                            className={`rounded-full p-2 transition-all ${
                              isFavorite
                                ? "text-pink-500"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                            aria-label={
                              isFavorite
                                ? "Favorilerden çıkar"
                                : "Favorilere ekle"
                            }
                            aria-pressed={isFavorite}
                          >
                            <Heart
                              className="h-5 w-5"
                              fill={isFavorite ? "currentColor" : "none"}
                            />
                          </motion.button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={handleShare}
                            title="Paylaş"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        {place.rating !== undefined &&
                          (() => {
                            const rc = getRatingColor(place.rating!)
                            return (
                              <div className="flex items-center gap-1">
                                <Star
                                  className={`h-4 w-4 ${rc.fill} ${rc.text}`}
                                />
                                <span className={`font-semibold ${rc.text}`}>
                                  {place.rating!.toFixed(1)}
                                </span>
                              </div>
                            )
                          })()}
                        {place.userRatingCount !== undefined && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>
                              {formatReviewCount(place.userRatingCount)} yorum
                            </span>
                          </div>
                        )}
                        {place.priceLevel && (
                          <Badge variant="outline">
                            {PRICE_LEVEL_MAP[place.priceLevel]}
                          </Badge>
                        )}
                        {place.currentOpeningHours?.openNow !== undefined && (
                          <Badge
                            variant={
                              place.currentOpeningHours.openNow
                                ? "default"
                                : "secondary"
                            }
                            className={
                              place.currentOpeningHours.openNow
                                ? "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
                                : "bg-red-500/90 text-white hover:bg-red-500/90"
                            }
                          >
                            {place.currentOpeningHours.openNow
                              ? "Açık"
                              : "Kapalı"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Editorial summary */}
                    {place.editorialSummary?.text && (
                      <p className="text-sm leading-relaxed text-muted-foreground italic">
                        {place.editorialSummary.text}
                      </p>
                    )}

                    {/* AI-generated summary */}
                    {place.generativeSummary?.overview?.text && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Özet
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {place.generativeSummary.overview.text}
                        </p>
                      </div>
                    )}

                    {/* Price range */}
                    {place.priceRange?.startPrice && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Fiyat Aralığı:</span>
                        <span>
                          {place.priceRange.startPrice.units ?? "0"}{" "}
                          {place.priceRange.startPrice.currencyCode ?? "TRY"}
                          {place.priceRange.endPrice?.units && (
                            <>
                              {" – "}
                              {place.priceRange.endPrice.units}{" "}
                              {place.priceRange.endPrice.currencyCode ?? "TRY"}
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    <Separator />

                    {/* Contact Info */}
                    <div className="space-y-3">
                      {place.formattedAddress && (
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{place.formattedAddress}</span>
                        </div>
                      )}
                      {place.internationalPhoneNumber && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <a
                            href={`tel:${place.internationalPhoneNumber}`}
                            className="hover:underline"
                          >
                            {place.internationalPhoneNumber}
                          </a>
                        </div>
                      )}
                      {place.websiteUri && (
                        <div className="flex items-center gap-3 text-sm">
                          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <a
                            href={place.websiteUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:underline"
                          >
                            {(() => {
                              try {
                                return new URL(place.websiteUri).hostname
                              } catch {
                                return place.websiteUri
                              }
                            })()}
                          </a>
                        </div>
                      )}
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {(place.googleMapsLinks?.placeUri ||
                          place.googleMapsUri) && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1"
                          >
                            <a
                              href={
                                place.googleMapsLinks?.placeUri ||
                                place.googleMapsUri
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Google Maps
                            </a>
                          </Button>
                        )}
                        {place.googleMapsLinks?.directionsUri && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1"
                          >
                            <a
                              href={place.googleMapsLinks.directionsUri}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Navigation className="mr-2 h-4 w-4" />
                              Yol Tarifi
                            </a>
                          </Button>
                        )}
                      </div>
                      {/* Secondary Google Maps links */}
                      {(place.googleMapsLinks?.writeAReviewUri ||
                        place.googleMapsLinks?.reviewsUri ||
                        place.googleMapsLinks?.photosUri) && (
                        <div className="flex gap-2">
                          {place.googleMapsLinks?.writeAReviewUri && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 text-xs text-muted-foreground"
                            >
                              <a
                                href={place.googleMapsLinks.writeAReviewUri}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <PenSquare className="mr-1.5 h-3.5 w-3.5" />
                                Yorum Yaz
                              </a>
                            </Button>
                          )}
                          {place.googleMapsLinks?.reviewsUri && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 text-xs text-muted-foreground"
                            >
                              <a
                                href={place.googleMapsLinks.reviewsUri}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                                Tüm Yorumlar
                              </a>
                            </Button>
                          )}
                          {place.googleMapsLinks?.photosUri && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 text-xs text-muted-foreground"
                            >
                              <a
                                href={place.googleMapsLinks.photosUri}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Camera className="mr-1.5 h-3.5 w-3.5" />
                                Tüm Fotoğraflar
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Features */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Özellikler</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <FeatureBadge
                          icon={Truck}
                          label="Paket Servis"
                          active={place.delivery}
                        />
                        <FeatureBadge
                          icon={UtensilsCrossed}
                          label="Restoranda Yeme"
                          active={place.dineIn}
                        />
                        <FeatureBadge
                          icon={ShoppingBag}
                          label="Gel-Al"
                          active={place.takeout}
                        />
                        <FeatureBadge
                          icon={CalendarCheck}
                          label="Rezervasyon"
                          active={place.reservable}
                        />
                        <FeatureBadge
                          icon={Leaf}
                          label="Vejetaryen"
                          active={place.servesVegetarianFood}
                        />
                        <FeatureBadge
                          icon={TreePine}
                          label="Açık Alan"
                          active={place.outdoorSeating}
                        />
                        <FeatureBadge
                          icon={Users}
                          label="Gruplar İçin"
                          active={place.goodForGroups}
                        />
                        <FeatureBadge
                          icon={Baby}
                          label="Çocuklar İçin"
                          active={place.goodForChildren}
                        />
                        <FeatureBadge
                          icon={Music}
                          label="Canlı Müzik"
                          active={place.liveMusic}
                        />
                        <FeatureBadge
                          icon={Wine}
                          label="Alkol"
                          active={place.servesBeer || place.servesWine}
                        />
                        <FeatureBadge
                          icon={Martini}
                          label="Kokteyl"
                          active={place.servesCocktails}
                        />
                        <FeatureBadge
                          icon={Coffee}
                          label="Kahve"
                          active={place.servesCoffee}
                        />
                        <FeatureBadge
                          icon={CarFront}
                          label="Araçtan Teslim"
                          active={place.curbsidePickup}
                        />
                        <FeatureBadge
                          icon={Dog}
                          label="Evcil Hayvan"
                          active={place.allowsDogs}
                        />
                      </div>
                    </div>

                    {/* Opening Hours */}
                    {(place.regularOpeningHours?.weekdayDescriptions ||
                      place.currentOpeningHours?.weekdayDescriptions) && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Clock className="h-4 w-4" />
                            Çalışma Saatleri
                          </h3>
                          {(() => {
                            const today = new Date().getDay()
                            const todayIndex = today === 0 ? 6 : today - 1
                            const descriptions =
                              place.regularOpeningHours?.weekdayDescriptions ||
                              place.currentOpeningHours?.weekdayDescriptions ||
                              []
                            return (
                              <div className="overflow-hidden rounded-lg border bg-muted/30">
                                {descriptions.map((desc, i) => {
                                  const colonIndex = desc.indexOf(":")
                                  const dayName =
                                    colonIndex > -1
                                      ? desc.slice(0, colonIndex).trim()
                                      : desc
                                  const hours =
                                    colonIndex > -1
                                      ? desc.slice(colonIndex + 1).trim()
                                      : ""
                                  const isToday = i === todayIndex
                                  const isClosed =
                                    hours.toLowerCase().includes("kapalı") ||
                                    hours.toLowerCase().includes("closed")

                                  return (
                                    <div
                                      key={i}
                                      className={`flex items-center px-3 py-2.5 ${
                                        isToday
                                          ? "border-l-2 border-emerald-500 bg-primary/5"
                                          : "border-l-2 border-transparent"
                                      }`}
                                    >
                                      <div
                                        className={`mr-3 h-1.5 w-1.5 shrink-0 rounded-full ${
                                          isToday
                                            ? "bg-emerald-500"
                                            : isClosed
                                              ? "bg-destructive"
                                              : "bg-muted-foreground/30"
                                        }`}
                                        style={
                                          isToday
                                            ? {
                                                boxShadow:
                                                  "0 0 6px rgb(16 185 129 / 0.6)",
                                              }
                                            : undefined
                                        }
                                      />
                                      <span
                                        className={`w-24 text-sm ${
                                          isToday
                                            ? "font-medium text-foreground"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {dayName}
                                      </span>
                                      <span
                                        className={`ml-auto text-sm ${
                                          isToday
                                            ? "font-medium text-foreground"
                                            : isClosed
                                              ? "text-destructive"
                                              : "text-muted-foreground"
                                        }`}
                                      >
                                        {hours}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                      </>
                    )}

                    {/* Rating Breakdown + Reviews */}
                    {place.reviews && place.reviews.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <MessageSquare className="h-4 w-4" />
                            Yorumlar
                          </h3>

                          {/* AI review summary */}
                          {place.reviewSummary?.text?.text && (
                            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                                <Sparkles className="h-3.5 w-3.5" />
                                Yorum Özeti
                              </div>
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {place.reviewSummary.text.text}
                              </p>
                            </div>
                          )}

                          {/* Rating breakdown */}
                          <RatingBreakdown
                            reviews={place.reviews}
                            overallRating={place.rating}
                            totalCount={place.userRatingCount}
                            onStarClick={setReviewFilter}
                            activeFilter={reviewFilter}
                          />

                          {/* Review filter badges */}
                          <div className="mt-4 mb-3 flex flex-wrap gap-1.5">
                            {[null, 5, 4, 3, 2, 1].map((star) => {
                              const count =
                                star === null
                                  ? place.reviews!.length
                                  : place.reviews!.filter(
                                      (r) => r.rating === star
                                    ).length
                              return (
                                <Badge
                                  key={star ?? "all"}
                                  variant={
                                    reviewFilter === star
                                      ? "default"
                                      : "outline"
                                  }
                                  className="cursor-pointer text-xs"
                                  onClick={() => setReviewFilter(star)}
                                >
                                  {star === null ? "Hepsi" : `${star} ★`} (
                                  {count})
                                </Badge>
                              )
                            })}
                          </div>

                          {/* Reviews list */}
                          <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                              {filteredReviews.length > 0 ? (
                                filteredReviews.map((review) => (
                                  <ReviewCard
                                    key={review.name}
                                    review={review}
                                  />
                                ))
                              ) : (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="py-4 text-center text-sm text-muted-foreground"
                                >
                                  Bu puan için yorum yok
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Photo Lightbox */}
      {place?.photos && (
        <PhotoLightbox
          photos={place.photos}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
