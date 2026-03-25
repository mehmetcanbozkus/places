"use client"

import { useCallback, useRef, useSyncExternalStore } from "react"
import { flushSync } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { useTheme } from "next-themes"
import { FiltersPanel } from "./filters-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { FilterState, SortOption } from "@/lib/types"
import {
  ChevronLeft,
  Heart,
  LayoutGrid,
  List,
  LocateFixed,
  MapPin,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  UtensilsCrossed,
} from "lucide-react"

interface PlacesHeaderProps {
  activeFilterCount: number
  canUseMyLocation: boolean
  filteredCount: number
  filters: FilterState
  favoritesCount: number
  locationLabel: string
  mobileFiltersOpen: boolean
  mobileSearchOpen: boolean
  onFiltersChange: (filters: FilterState) => void
  onMobileFiltersOpenChange: (open: boolean) => void
  onMobileSearchOpenChange: (open: boolean) => void
  onRadiusChange: (radius: number) => void
  onSortChange: (sort: SortOption) => void
  onToggleFavorites: () => void
  onUseMyLocation: () => void
  onViewModeChange: (viewMode: "grid" | "list") => void
  radius: number
  searchComponent: React.ReactNode
  showFavoritesOnly: boolean
  sort: SortOption
  totalCount: number
  viewMode: "grid" | "list"
}

function subscribe() {
  return () => {}
}

export function PlacesHeader({
  activeFilterCount,
  canUseMyLocation,
  filteredCount,
  filters,
  favoritesCount,
  locationLabel,
  mobileFiltersOpen,
  mobileSearchOpen,
  onFiltersChange,
  onMobileFiltersOpenChange,
  onMobileSearchOpenChange,
  onRadiusChange,
  onSortChange,
  onToggleFavorites,
  onUseMyLocation,
  onViewModeChange,
  radius,
  searchComponent,
  showFavoritesOnly,
  sort,
  totalCount,
  viewMode,
}: PlacesHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const themeToggleRef = useRef<HTMLButtonElement>(null)
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"

    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme)
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    })

    transition.ready.then(() => {
      const button = themeToggleRef.current
      if (!button) return

      const { top, left, width, height } = button.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }, [resolvedTheme, setTheme])

  return (
    <header
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl"
      style={{
        borderBottom: "1px solid transparent",
        borderImage:
          "linear-gradient(to right, var(--primary), var(--secondary)) 1",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {mobileSearchOpen ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 lg:hidden"
              onClick={() => onMobileSearchOpenChange(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">{searchComponent}</div>
          </>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <h1 className="hidden text-lg font-bold tracking-tight sm:block">
                Nerede Yesem?
              </h1>
            </div>

            {locationLabel && (
              <button
                onClick={canUseMyLocation ? onUseMyLocation : undefined}
                disabled={!canUseMyLocation}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors ${
                  canUseMyLocation
                    ? "cursor-pointer hover:border-primary/50 hover:bg-muted"
                    : "cursor-default"
                }`}
                title={canUseMyLocation ? "Mevcut konuma dön" : undefined}
              >
                {canUseMyLocation ? (
                  <LocateFixed className="h-3 w-3 shrink-0" />
                ) : (
                  <MapPin className="h-3 w-3 shrink-0" />
                )}
                <span className="max-w-[120px] truncate sm:max-w-[200px]">
                  {locationLabel}
                </span>
              </button>
            )}

            <div className="hidden min-w-0 flex-1 lg:flex lg:justify-center">
              {searchComponent}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden"
                onClick={() => onMobileSearchOpenChange(true)}
                title="Konum ara"
              >
                <Search className="h-4 w-4" />
              </Button>

              <div className="hidden items-center rounded-lg border p-0.5 sm:flex">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onViewModeChange("grid")}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Kart Görünümü</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onViewModeChange("list")}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Liste Görünümü</TooltipContent>
                </Tooltip>
              </div>

              <Button
                ref={themeToggleRef}
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={toggleTheme}
                title={
                  mounted
                    ? resolvedTheme === "dark"
                      ? "Açık tema"
                      : "Koyu tema"
                    : "Tema değiştir"
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mounted && resolvedTheme === "dark" ? (
                    <motion.span
                      key="moon"
                      initial={{ rotate: -90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 90, scale: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 250,
                        damping: 20,
                        duration: 0.3,
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Moon className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="sun"
                      initial={{ rotate: 90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: -90, scale: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 250,
                        damping: 20,
                        duration: 0.3,
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Sun className="h-4 w-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>

              {favoritesCount > 0 && (
                <motion.button
                  onClick={onToggleFavorites}
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 ${
                    showFavoritesOnly
                      ? "bg-[var(--neon-favorite)] text-white"
                      : "hover:bg-muted"
                  }`}
                  title="Favoriler"
                >
                  <Heart
                    className="h-4 w-4"
                    fill={showFavoritesOnly ? "currentColor" : "none"}
                  />
                  <motion.span
                    key={favoritesCount}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white"
                  >
                    {favoritesCount}
                  </motion.span>
                </motion.button>
              )}

              <Sheet
                open={mobileFiltersOpen}
                onOpenChange={onMobileFiltersOpenChange}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative lg:hidden"
                  >
                    <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                    <span className="xs:inline hidden">Filtre</span>
                    {activeFilterCount > 0 && (
                      <Badge className="ml-1.5 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-6"
                >
                  <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
                  <SheetHeader className="p-0 pb-1">
                    <SheetTitle className="text-base">Filtreler</SheetTitle>
                  </SheetHeader>
                  <div className="mt-3 pb-6">
                    <FiltersPanel
                      filters={filters}
                      onFiltersChange={onFiltersChange}
                      sort={sort}
                      onSortChange={onSortChange}
                      radius={radius}
                      onRadiusChange={onRadiusChange}
                      totalCount={totalCount}
                      filteredCount={filteredCount}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
