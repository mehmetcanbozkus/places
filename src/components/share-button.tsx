"use client"

import { toast } from "sonner"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Place } from "@/lib/types"
import { sharePlace } from "@/lib/place-utils"

interface ShareButtonProps {
  place: Place
  size?: "sm" | "md"
  className?: string
  iconClassName?: string
  stopPropagation?: boolean
  variant?: "icon" | "outline"
}

export function ShareButton({
  place,
  size = "sm",
  className = "",
  iconClassName = "text-muted-foreground",
  stopPropagation = true,
  variant = "icon",
}: ShareButtonProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const padding = size === "sm" ? "p-1.5" : "p-2"

  const handleShare = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    const result = await sharePlace(place)
    if (result === "copied") toast.success("Panoya kopyaland\u0131")
    else if (result === "failed") toast.error("Payla\u015f\u0131lamad\u0131")
  }

  if (variant === "outline") {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`h-9 w-9 ${className}`}
        onClick={handleShare}
        title="Paylaş"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <button
      onClick={handleShare}
      className={`shrink-0 rounded-full ${padding} transition-all hover:bg-muted ${className}`}
      title="Paylaş"
    >
      <Share2 className={`${iconSize} ${iconClassName}`} />
    </button>
  )
}
