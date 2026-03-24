import type { FilterState, SortOption, PriceLevel } from "./types"
import { DEFAULT_FILTERS } from "./types"

const FILTER_KEYS: Record<string, keyof FilterState> = {
  mr: "minRating",
  mrc: "minReviewCount",
  pl: "priceLevels",
  on: "openNow",
  del: "delivery",
  din: "dineIn",
  to: "takeout",
  veg: "servesVegetarianFood",
  out: "outdoorSeating",
  res: "reservable",
  grp: "goodForGroups",
  mus: "liveMusic",
  ckl: "servesCocktails",
  bf: "servesBreakfast",
  lu: "servesLunch",
  dn: "servesDinner",
  br: "servesBrunch",
  alc: "servesAlcohol",
}

export function parseUrlState(searchParams: URLSearchParams) {
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const location =
    lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
  const locationLabel = searchParams.get("q") || ""
  const sort = (searchParams.get("s") as SortOption) || "rating"
  const radius = parseInt(searchParams.get("r") || "3000", 10)

  const filters: FilterState = { ...DEFAULT_FILTERS }

  for (const [urlKey, filterKey] of Object.entries(FILTER_KEYS)) {
    const value = searchParams.get(urlKey)
    if (value === null) continue

    if (filterKey === "minRating") {
      filters.minRating = parseFloat(value)
    } else if (filterKey === "minReviewCount") {
      filters.minReviewCount = parseInt(value, 10)
    } else if (filterKey === "priceLevels") {
      filters.priceLevels = value.split(",") as PriceLevel[]
    } else {
      ;(filters as unknown as Record<string, boolean>)[filterKey] =
        value === "1"
    }
  }

  return { location, locationLabel, sort, radius, filters }
}

export function buildUrlParams(state: {
  location: { lat: number; lng: number } | null
  locationLabel: string
  sort: SortOption
  radius: number
  filters: FilterState
  locationSource: "gps" | "search"
}): URLSearchParams {
  const params = new URLSearchParams()

  if (state.location && state.locationSource === "search") {
    params.set("lat", state.location.lat.toFixed(6))
    params.set("lng", state.location.lng.toFixed(6))
    if (state.locationLabel) params.set("q", state.locationLabel)
  }

  if (state.sort !== "rating") params.set("s", state.sort)
  if (state.radius !== 3000) params.set("r", state.radius.toString())

  const f = state.filters
  if (f.minRating > 0) params.set("mr", f.minRating.toString())
  if (f.minReviewCount > 0) params.set("mrc", f.minReviewCount.toString())
  if (f.priceLevels.length > 0) params.set("pl", f.priceLevels.join(","))

  const boolKeys: [string, keyof FilterState][] = [
    ["on", "openNow"],
    ["del", "delivery"],
    ["din", "dineIn"],
    ["to", "takeout"],
    ["veg", "servesVegetarianFood"],
    ["out", "outdoorSeating"],
    ["res", "reservable"],
    ["grp", "goodForGroups"],
    ["mus", "liveMusic"],
    ["ckl", "servesCocktails"],
    ["bf", "servesBreakfast"],
    ["lu", "servesLunch"],
    ["dn", "servesDinner"],
    ["br", "servesBrunch"],
    ["alc", "servesAlcohol"],
  ]

  for (const [urlKey, filterKey] of boolKeys) {
    if (f[filterKey]) params.set(urlKey, "1")
  }

  return params
}
