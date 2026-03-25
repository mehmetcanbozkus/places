"use client"

import { motion } from "motion/react"
import { Heart } from "lucide-react"

interface FavoriteButtonProps {
  isFavorite: boolean
  onToggle: () => void
  size?: "sm" | "md"
  className?: string
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = "sm",
  className = "",
}: FavoriteButtonProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"
  const padding = size === "sm" ? "p-1.5" : "p-2"

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 1.3 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={`shrink-0 rounded-full transition-all ${padding} ${
        isFavorite ? "text-pink-500" : "text-muted-foreground"
      } ${className}`}
      aria-label={
        isFavorite ? "Favorilerden \u00e7\u0131kar" : "Favorilere ekle"
      }
      aria-pressed={isFavorite}
    >
      <Heart className={iconSize} fill={isFavorite ? "currentColor" : "none"} />
    </motion.button>
  )
}
