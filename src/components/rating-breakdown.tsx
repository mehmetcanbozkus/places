"use client"

import { motion } from "motion/react"
import { Star } from "lucide-react"
import type { Review } from "@/lib/types"
import { getRatingColor, getRatingGlow, formatReviewCount } from "@/lib/types"

interface RatingBreakdownProps {
  reviews: Review[]
  overallRating?: number
  totalCount?: number
  onStarClick?: (star: number | null) => void
  activeFilter?: number | null
}

export function RatingBreakdown({
  reviews,
  overallRating,
  totalCount,
  onStarClick,
  activeFilter,
}: RatingBreakdownProps) {
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  const maxCount = Math.max(...distribution.map((d) => d.count), 1)
  const ratingColor = overallRating ? getRatingColor(overallRating) : null

  return (
    <div className="flex gap-5">
      {/* Overall rating */}
      {overallRating !== undefined && (
        <div className="flex shrink-0 flex-col items-center justify-center">
          <span
            className={`text-3xl font-bold ${ratingColor?.text || ""}`}
            style={{ textShadow: getRatingGlow(overallRating) }}
          >
            {overallRating.toFixed(1)}
          </span>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.round(overallRating)
                    ? `${ratingColor?.fill || "fill-amber-400"} ${ratingColor?.text || "text-amber-400"}`
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          {totalCount !== undefined && (
            <span className="mt-1 text-xs text-muted-foreground">
              {formatReviewCount(totalCount)} yorum
            </span>
          )}
        </div>
      )}

      {/* Bar chart */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        {distribution.map(({ star, count }) => {
          const isActive = activeFilter === star
          return (
            <button
              key={star}
              onClick={() => onStarClick?.(activeFilter === star ? null : star)}
              className={`flex items-center gap-2 rounded px-1 py-0.5 text-xs transition-colors ${
                onStarClick ? "cursor-pointer hover:bg-muted/50" : ""
              } ${isActive ? "bg-muted" : ""}`}
            >
              <span className="w-4 shrink-0 text-right font-medium text-muted-foreground">
                {star}
              </span>
              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(count / maxCount) * 100}%`,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: (5 - star) * 0.08,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-amber-400"
                />
              </div>
              <span className="w-5 shrink-0 text-right text-muted-foreground">
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
