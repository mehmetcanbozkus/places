import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Navigation,
  Star,
  Clock,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OpenStatusBadge } from "@/components/open-status-badge"
import type { Place, PriceLevel, Review } from "@/lib/types"
import { PRICE_LEVEL_MAP } from "@/lib/constants"
import {
  getPhotoUrl,
  getRatingColor,
  formatReviewCount,
} from "@/lib/place-utils"
import { fetchPlaceDetail } from "@/lib/google-places"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const place = await fetchPlaceDetail(id)

  if (!place) {
    return { title: "Mekan Bulunamadı" }
  }

  const title = place.displayName?.text ?? "Mekan"
  const description = [
    title,
    place.formattedAddress,
    place.rating ? `Puan: ${place.rating}/5` : null,
  ]
    .filter(Boolean)
    .join(" — ")

  return {
    title,
    description,
    openGraph: {
      title,
      description: [
        place.formattedAddress,
        place.rating ? `${place.rating} ★` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      type: "website",
      locale: "tr_TR",
      siteName: "Nerede Yesem?",
    },
    twitter: {
      card: "summary_large_image",
    },
  }
}

function RatingStars({ rating }: { rating: number }) {
  const colors = getRatingColor(rating)
  return (
    <div className="flex items-center gap-1.5">
      <Star className={`h-5 w-5 ${colors.fill} ${colors.text}`} />
      <span className={`text-lg font-bold ${colors.text}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

function FeatureBadge({ label, active }: { label: string; active?: boolean }) {
  if (!active) return null
  return <Badge variant="secondary">{label}</Badge>
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-xl border bg-card/50 p-4">
      <div className="mb-2.5 flex items-center gap-2.5">
        {review.authorAttribution?.photoUri && (
          <Image
            src={review.authorAttribution.photoUri}
            alt={review.authorAttribution.displayName}
            width={36}
            height={36}
            className="rounded-full"
            unoptimized
          />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {review.authorAttribution?.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {review.relativePublishTimeDescription}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-amber-500">
            {review.rating}
          </span>
        </div>
      </div>
      {review.text?.text && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {review.text.text}
        </p>
      )}
    </div>
  )
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const place = await fetchPlaceDetail(id)

  if (!place) notFound()

  const firstPhoto = place.photos?.[0]
  const isOpen = place.currentOpeningHours?.openNow
  const priceLabel = place.priceLevel
    ? PRICE_LEVEL_MAP[place.priceLevel as PriceLevel]
    : null

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background">
      {/* Hero Photo with overlay */}
      <div className="relative aspect-[16/9] w-full bg-muted">
        {firstPhoto ? (
          <>
            <Image
              src={getPhotoUrl(firstPhoto.name, 1200)}
              alt={place.displayName?.text ?? "Mekan fotoğrafı"}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-colors hover:bg-background/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-6 p-6">
        {/* Name, Type, Rating */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {place.displayName?.text}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 text-sm">
            {place.primaryTypeDisplayName?.text && (
              <span className="text-muted-foreground">
                {place.primaryTypeDisplayName.text}
              </span>
            )}
            {place.rating && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <RatingStars rating={place.rating} />
              </>
            )}
            {place.userRatingCount && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{formatReviewCount(place.userRatingCount)} yorum</span>
              </div>
            )}
            {priceLabel && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <Badge variant="outline">{priceLabel}</Badge>
              </>
            )}
          </div>

          {isOpen !== undefined && (
            <OpenStatusBadge isOpen={isOpen} variant="plain" />
          )}
        </div>

        {/* Editorial Summary */}
        {place.editorialSummary?.text && (
          <p className="text-sm leading-relaxed text-muted-foreground italic">
            {place.editorialSummary.text}
          </p>
        )}

        <Separator />

        {/* Contact & Actions */}
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
                className="underline-offset-4 hover:underline"
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
                className="truncate underline-offset-4 hover:underline"
              >
                {new URL(place.websiteUri).hostname}
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {place.googleMapsUri && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Google Maps
                </a>
              </Button>
            )}
            {place.googleMapsLinks?.directionsUri && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={place.googleMapsLinks.directionsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="mr-1.5 h-4 w-4" />
                  Yol Tarifi
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Features */}
        {(place.dineIn ||
          place.delivery ||
          place.takeout ||
          place.reservable ||
          place.outdoorSeating ||
          place.goodForGroups ||
          place.goodForChildren ||
          place.liveMusic ||
          place.servesCocktails ||
          place.servesCoffee ||
          place.allowsDogs) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Özellikler</h2>
              <div className="flex flex-wrap gap-1.5">
                <FeatureBadge label="Restoranda Yemek" active={place.dineIn} />
                <FeatureBadge label="Paket Servis" active={place.delivery} />
                <FeatureBadge label="Gel Al" active={place.takeout} />
                <FeatureBadge label="Rezervasyon" active={place.reservable} />
                <FeatureBadge label="Açık Alan" active={place.outdoorSeating} />
                <FeatureBadge label="Gruplar" active={place.goodForGroups} />
                <FeatureBadge label="Çocuklar" active={place.goodForChildren} />
                <FeatureBadge label="Canlı Müzik" active={place.liveMusic} />
                <FeatureBadge
                  label="Kokteyller"
                  active={place.servesCocktails}
                />
                <FeatureBadge label="Kahve" active={place.servesCoffee} />
                <FeatureBadge label="Evcil Hayvan" active={place.allowsDogs} />
              </div>
            </div>
          </>
        )}

        {/* Opening Hours */}
        {place.regularOpeningHours?.weekdayDescriptions && (
          <>
            <Separator />
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                Çalışma Saatleri
              </h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {place.regularOpeningHours.weekdayDescriptions.map((day, i) => (
                  <li key={i}>{day}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Reviews */}
        {place.reviews && place.reviews.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Yorumlar</h2>
              {place.reviewSummary?.text?.text && (
                <p className="text-sm text-muted-foreground italic">
                  {place.reviewSummary.text.text}
                </p>
              )}
              <div className="space-y-3">
                {place.reviews.slice(0, 5).map((review) => (
                  <ReviewCard key={review.name} review={review} />
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* CTA */}
        <div className="pb-6">
          <Button asChild className="w-full">
            <Link href={`/?place=${id}`}>
              Yakındaki Mekanları Keşfet
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
