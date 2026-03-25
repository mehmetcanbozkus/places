"use client"

import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Star,
  Truck,
  ShoppingBag,
  Leaf,
  TreePine,
  Users,
  CalendarCheck,
  Music,
  Wine,
  UtensilsCrossed,
  Heart,
} from "lucide-react"
import type { FilterState } from "@/lib/types"

interface QuickFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  showFavoritesOnly?: boolean
  onToggleFavorites?: () => void
  favoritesCount?: number
}

const CHIPS: {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  toggle: (f: FilterState) => FilterState
  isActive: (f: FilterState) => boolean
}[] = [
  {
    key: "openNow",
    label: "Açık",
    icon: Clock,
    toggle: (f) => ({ ...f, openNow: !f.openNow }),
    isActive: (f) => f.openNow,
  },
  {
    key: "rating45",
    label: "4.5+",
    icon: Star,
    toggle: (f) => ({ ...f, minRating: f.minRating >= 4.5 ? 0 : 4.5 }),
    isActive: (f) => f.minRating >= 4.5,
  },
  {
    key: "delivery",
    label: "Paket Servis",
    icon: Truck,
    toggle: (f) => ({ ...f, delivery: !f.delivery }),
    isActive: (f) => f.delivery,
  },
  {
    key: "dineIn",
    label: "Restoran",
    icon: UtensilsCrossed,
    toggle: (f) => ({ ...f, dineIn: !f.dineIn }),
    isActive: (f) => f.dineIn,
  },
  {
    key: "takeout",
    label: "Gel-Al",
    icon: ShoppingBag,
    toggle: (f) => ({ ...f, takeout: !f.takeout }),
    isActive: (f) => f.takeout,
  },
  {
    key: "vegetarian",
    label: "Vejetaryen",
    icon: Leaf,
    toggle: (f) => ({
      ...f,
      servesVegetarianFood: !f.servesVegetarianFood,
    }),
    isActive: (f) => f.servesVegetarianFood,
  },
  {
    key: "outdoor",
    label: "Açık Alan",
    icon: TreePine,
    toggle: (f) => ({ ...f, outdoorSeating: !f.outdoorSeating }),
    isActive: (f) => f.outdoorSeating,
  },
  {
    key: "reservable",
    label: "Rezervasyon",
    icon: CalendarCheck,
    toggle: (f) => ({ ...f, reservable: !f.reservable }),
    isActive: (f) => f.reservable,
  },
  {
    key: "groups",
    label: "Gruplar",
    icon: Users,
    toggle: (f) => ({ ...f, goodForGroups: !f.goodForGroups }),
    isActive: (f) => f.goodForGroups,
  },
  {
    key: "liveMusic",
    label: "Canlı Müzik",
    icon: Music,
    toggle: (f) => ({ ...f, liveMusic: !f.liveMusic }),
    isActive: (f) => f.liveMusic,
  },
  {
    key: "alcohol",
    label: "Alkol",
    icon: Wine,
    toggle: (f) => ({ ...f, servesAlcohol: !f.servesAlcohol }),
    isActive: (f) => f.servesAlcohol,
  },
]

export function QuickFilters({
  filters,
  onFiltersChange,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoritesCount = 0,
}: QuickFiltersProps) {
  return (
    <div
      className="sticky top-[56px] z-30 bg-background/80 px-4 py-2 backdrop-blur-xl lg:px-6"
      style={{ scrollbarWidth: "none" }}
    >
      <div
        className="scrollbar-hide mx-auto flex max-w-7xl gap-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Favorites chip — separate from FilterState */}
        {favoritesCount > 0 && (
          <motion.div whileTap={{ scale: 0.95 }} className="shrink-0">
            <Badge
              variant={showFavoritesOnly ? "default" : "outline"}
              className={`cursor-pointer gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors transition-shadow duration-200 ${
                showFavoritesOnly
                  ? "bg-[var(--neon-favorite)] text-white shadow-[0_0_12px_var(--neon-favorite)] hover:bg-[var(--neon-favorite)]"
                  : "hover:shadow-sm"
              }`}
              onClick={onToggleFavorites}
            >
              <Heart
                className="h-3 w-3"
                fill={showFavoritesOnly ? "currentColor" : "none"}
              />
              Favoriler ({favoritesCount})
            </Badge>
          </motion.div>
        )}

        {CHIPS.map((chip) => {
          const active = chip.isActive(filters)
          const Icon = chip.icon
          return (
            <motion.div
              key={chip.key}
              whileTap={{ scale: 0.95 }}
              className="shrink-0"
            >
              <Badge
                variant={active ? "default" : "outline"}
                className={`cursor-pointer gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors transition-shadow duration-200 ${
                  active
                    ? "shadow-[0_0_10px_var(--primary)] hover:shadow-[0_0_14px_var(--primary)]"
                    : "hover:shadow-sm"
                }`}
                onClick={() => onFiltersChange(chip.toggle(filters))}
              >
                <Icon className="h-3 w-3" />
                {chip.label}
              </Badge>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
