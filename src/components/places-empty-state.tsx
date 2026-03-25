"use client"

import { motion } from "motion/react"
import { Heart, RefreshCw, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FavoritesEmptyProps {
  onShowAll: () => void
  reducedMotion: boolean | null
}

export function FavoritesEmptyState({
  onShowAll,
  reducedMotion,
}: FavoritesEmptyProps) {
  return (
    <>
      <motion.div
        animate={reducedMotion ? undefined : { scale: [1, 1.1, 1] }}
        transition={
          reducedMotion ? undefined : { repeat: Infinity, duration: 1.5 }
        }
      >
        <Heart className="h-16 w-16 text-pink-300" />
      </motion.div>
      <h3 className="mt-4 text-lg font-semibold">Henüz Favori Mekanınız Yok</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Beğendiğiniz mekanlardaki kalp ikonuna tıklayarak favorilerinize
        ekleyin.
      </p>
      <Button variant="outline" onClick={onShowAll} className="mt-4" size="sm">
        Keşfetmeye Başla
      </Button>
    </>
  )
}

interface FilterEmptyProps {
  onClearFilters: () => void
  reducedMotion: boolean | null
}

export function FilterEmptyState({
  onClearFilters,
  reducedMotion,
}: FilterEmptyProps) {
  return (
    <>
      <motion.div
        animate={reducedMotion ? undefined : { x: [-4, 4, -4] }}
        transition={
          reducedMotion ? undefined : { repeat: Infinity, duration: 1.5 }
        }
      >
        <SearchX className="h-16 w-16 text-muted-foreground/30" />
      </motion.div>
      <h3 className="mt-4 text-lg font-semibold">Filtrelere Uygun Sonuç Yok</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Aktif filtrelere uygun mekan bulunamadı. Filtreleri genişletmeyi
        deneyin.
      </p>
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="mt-4"
        size="sm"
      >
        Filtreleri Temizle
      </Button>
    </>
  )
}

interface NoResultsEmptyProps {
  onRetry: () => void
}

export function NoResultsEmptyState({ onRetry }: NoResultsEmptyProps) {
  return (
    <>
      <SearchX className="h-16 w-16 text-muted-foreground/30" />
      <h3 className="mt-4 text-lg font-semibold">Sonuç Bulunamadı</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Bu alanda mekan bulunamadı. Arama yarıçapını artırmayı deneyin.
      </p>
      <Button onClick={onRetry} className="mt-4" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Tekrar Ara
      </Button>
    </>
  )
}
