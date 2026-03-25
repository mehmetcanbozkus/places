import type { PriceLevel, FilterState } from "./types"

export const PRICE_LEVEL_MAP: Record<PriceLevel, string> = {
  PRICE_LEVEL_FREE: "Ücretsiz",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}

export const PRICE_LEVEL_SYMBOL: Record<PriceLevel, string> = {
  PRICE_LEVEL_FREE: "",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}

export const DEFAULT_FILTERS: FilterState = {
  minRating: 0,
  minReviewCount: 0,
  priceLevels: [],
  openNow: false,
  delivery: false,
  dineIn: false,
  takeout: false,
  servesVegetarianFood: false,
  outdoorSeating: false,
  reservable: false,
  goodForGroups: false,
  liveMusic: false,
  servesCocktails: false,
  servesBreakfast: false,
  servesLunch: false,
  servesDinner: false,
  servesBrunch: false,
  servesAlcohol: false,
}

export const RESTAURANT_TYPES = new Set([
  "restaurant",
  "turkish_restaurant",
  "italian_restaurant",
  "chinese_restaurant",
  "japanese_restaurant",
  "mexican_restaurant",
  "thai_restaurant",
  "indian_restaurant",
  "seafood_restaurant",
  "steak_house",
  "pizza_restaurant",
  "hamburger_restaurant",
  "kebab_shop",
  "fast_food_restaurant",
  "meal_takeaway",
])
export const CAFE_TYPES = new Set([
  "cafe",
  "coffee_shop",
  "tea_house",
  "bakery",
])
export const BAR_TYPES = new Set([
  "bar",
  "night_club",
  "pub",
  "wine_bar",
  "cocktail_bar",
])
export const PASTRY_TYPES = new Set([
  "pastry_shop",
  "dessert_shop",
  "ice_cream_shop",
  "confectionery",
])
