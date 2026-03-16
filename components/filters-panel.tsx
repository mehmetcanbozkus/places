"use client"

import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Star,
  RotateCcw,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
  Leaf,
  TreePine,
  CalendarCheck,
  Users,
  Music,
  Wine,
  Coffee,
  Sunrise,
  Sun,
  Moon,
  Martini,
} from "lucide-react"
import type { FilterState, PriceLevel, SortOption } from "@/lib/types"
import { DEFAULT_FILTERS } from "@/lib/types"

interface FiltersPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  radius: number
  onRadiusChange: (radius: number) => void
  totalCount: number
  filteredCount: number
}

const RADIUS_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1 km" },
  { value: 1500, label: "1.5 km" },
  { value: 2000, label: "2 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
]

const REVIEW_COUNT_OPTIONS = [
  { value: 0, label: "Hepsi" },
  { value: 10, label: "10+" },
  { value: 50, label: "50+" },
  { value: 100, label: "100+" },
  { value: 500, label: "500+" },
  { value: 1000, label: "1000+" },
]

const PRICE_LEVELS: { value: PriceLevel; label: string }[] = [
  { value: "PRICE_LEVEL_INEXPENSIVE", label: "$" },
  { value: "PRICE_LEVEL_MODERATE", label: "$$" },
  { value: "PRICE_LEVEL_EXPENSIVE", label: "$$$" },
  { value: "PRICE_LEVEL_VERY_EXPENSIVE", label: "$$$$" },
]

function FeatureSwitch({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  radius,
  onRadiusChange,
  totalCount,
  filteredCount,
}: FiltersPanelProps) {
  const update = (partial: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...partial })

  const togglePriceLevel = (level: PriceLevel) => {
    const current = filters.priceLevels
    const next = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level]
    update({ priceLevels: next })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Result count */}
      <div className="text-sm text-muted-foreground">
        {filteredCount === totalCount
          ? `${totalCount} sonuç`
          : `${filteredCount} / ${totalCount} sonuç`}
      </div>

      {/* Radius */}
      <div>
        <label className="mb-2 block text-sm font-medium">Arama Yarıçapı</label>
        <Select
          value={radius.toString()}
          onValueChange={(v) => onRadiusChange(Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-2 block text-sm font-medium">Sıralama</label>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Puana Göre</SelectItem>
            <SelectItem value="reviewCount">Yorum Sayısına Göre</SelectItem>
            <SelectItem value="distance">Mesafeye Göre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Min Rating */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium">Minimum Puan</label>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {filters.minRating > 0 ? filters.minRating.toFixed(1) : "Hepsi"}
          </div>
        </div>
        <Slider
          value={[filters.minRating]}
          onValueChange={([v]) => update({ minRating: v })}
          min={0}
          max={5}
          step={0.5}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Hepsi</span>
          <span>5.0</span>
        </div>
      </div>

      {/* Min Review Count */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Minimum Yorum Sayısı
        </label>
        <div className="flex flex-wrap gap-1.5">
          {REVIEW_COUNT_OPTIONS.map((opt) => (
            <Badge
              key={opt.value}
              variant={
                filters.minReviewCount === opt.value ? "default" : "outline"
              }
              className="cursor-pointer transition-colors"
              onClick={() => update({ minReviewCount: opt.value })}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Level */}
      <div>
        <label className="mb-2 block text-sm font-medium">Fiyat Aralığı</label>
        <div className="flex gap-1.5">
          {PRICE_LEVELS.map((level) => (
            <Badge
              key={level.value}
              variant={
                filters.priceLevels.includes(level.value)
                  ? "default"
                  : "outline"
              }
              className="flex-1 cursor-pointer justify-center py-1.5 transition-colors"
              onClick={() => togglePriceLevel(level.value)}
            >
              {level.label}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Open Now */}
      <FeatureSwitch
        icon={Star}
        label="Şu An Açık"
        checked={filters.openNow}
        onChange={(v) => update({ openNow: v })}
      />

      {/* Service Type */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Servis Tipi
        </label>
        <FeatureSwitch
          icon={Truck}
          label="Paket Servis"
          checked={filters.delivery}
          onChange={(v) => update({ delivery: v })}
        />
        <FeatureSwitch
          icon={UtensilsCrossed}
          label="Restoranda Yeme"
          checked={filters.dineIn}
          onChange={(v) => update({ dineIn: v })}
        />
        <FeatureSwitch
          icon={ShoppingBag}
          label="Gel-Al"
          checked={filters.takeout}
          onChange={(v) => update({ takeout: v })}
        />
        <FeatureSwitch
          icon={CalendarCheck}
          label="Rezervasyon"
          checked={filters.reservable}
          onChange={(v) => update({ reservable: v })}
        />
      </div>

      {/* Meals */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Öğünler
        </label>
        <FeatureSwitch
          icon={Sunrise}
          label="Kahvaltı"
          checked={filters.servesBreakfast}
          onChange={(v) => update({ servesBreakfast: v })}
        />
        <FeatureSwitch
          icon={Coffee}
          label="Brunch"
          checked={filters.servesBrunch}
          onChange={(v) => update({ servesBrunch: v })}
        />
        <FeatureSwitch
          icon={Sun}
          label="Öğle Yemeği"
          checked={filters.servesLunch}
          onChange={(v) => update({ servesLunch: v })}
        />
        <FeatureSwitch
          icon={Moon}
          label="Akşam Yemeği"
          checked={filters.servesDinner}
          onChange={(v) => update({ servesDinner: v })}
        />
      </div>

      {/* Features */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Özellikler
        </label>
        <FeatureSwitch
          icon={Leaf}
          label="Vejetaryen"
          checked={filters.servesVegetarianFood}
          onChange={(v) => update({ servesVegetarianFood: v })}
        />
        <FeatureSwitch
          icon={TreePine}
          label="Açık Alan"
          checked={filters.outdoorSeating}
          onChange={(v) => update({ outdoorSeating: v })}
        />
        <FeatureSwitch
          icon={Users}
          label="Gruplar İçin"
          checked={filters.goodForGroups}
          onChange={(v) => update({ goodForGroups: v })}
        />
        <FeatureSwitch
          icon={Music}
          label="Canlı Müzik"
          checked={filters.liveMusic}
          onChange={(v) => update({ liveMusic: v })}
        />
        <FeatureSwitch
          icon={Wine}
          label="Alkol"
          checked={filters.servesAlcohol}
          onChange={(v) => update({ servesAlcohol: v })}
        />
        <FeatureSwitch
          icon={Martini}
          label="Kokteyl"
          checked={filters.servesCocktails}
          onChange={(v) => update({ servesCocktails: v })}
        />
      </div>

      <Separator />

      {/* Reset */}
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => onFiltersChange(DEFAULT_FILTERS)}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Filtreleri Sıfırla
      </Button>
    </div>
  )
}
