export interface Place {
  id: string
  name: string
  displayName: LocalizedText
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: LatLng
  rating?: number
  userRatingCount?: number
  priceLevel?: PriceLevel
  primaryType?: string
  primaryTypeDisplayName?: LocalizedText
  types?: string[]
  photos?: PlacePhoto[]
  currentOpeningHours?: OpeningHours
  regularOpeningHours?: OpeningHours
  editorialSummary?: LocalizedText
  reviews?: Review[]
  websiteUri?: string
  googleMapsUri?: string
  internationalPhoneNumber?: string
  businessStatus?: string
  delivery?: boolean
  dineIn?: boolean
  takeout?: boolean
  reservable?: boolean
  servesVegetarianFood?: boolean
  outdoorSeating?: boolean
  goodForGroups?: boolean
  goodForChildren?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  liveMusic?: boolean
  servesCocktails?: boolean
  servesCoffee?: boolean
  servesBreakfast?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
  servesBrunch?: boolean
  servesDessert?: boolean
  allowsDogs?: boolean
  menuForChildren?: boolean
  restroom?: boolean
  goodForWatchingSports?: boolean
  parkingOptions?: ParkingOptions
  paymentOptions?: PaymentOptions
  accessibilityOptions?: AccessibilityOptions
  curbsidePickup?: boolean
  googleMapsLinks?: GoogleMapsLinks
  generativeSummary?: GenerativeSummary
  reviewSummary?: ReviewSummary
  priceRange?: PriceRange
}

export interface LocalizedText {
  text: string
  languageCode?: string
}

export interface LatLng {
  latitude: number
  longitude: number
}

export interface PlacePhoto {
  name: string
  widthPx: number
  heightPx: number
  authorAttributions?: AuthorAttribution[]
}

export interface AuthorAttribution {
  displayName: string
  uri: string
  photoUri: string
}

export interface Review {
  name: string
  relativePublishTimeDescription: string
  text?: LocalizedText
  originalText?: LocalizedText
  rating: number
  authorAttribution: AuthorAttribution
  publishTime: string
}

export interface OpeningHours {
  openNow?: boolean
  weekdayDescriptions?: string[]
  periods?: Period[]
}

export interface Period {
  open: TimePoint
  close?: TimePoint
}

export interface TimePoint {
  day: number
  hour: number
  minute: number
}

export interface ParkingOptions {
  freeParkingLot?: boolean
  paidParkingLot?: boolean
  freeStreetParking?: boolean
  paidStreetParking?: boolean
  valetParking?: boolean
  freeGarageParking?: boolean
  paidGarageParking?: boolean
}

export interface PaymentOptions {
  acceptsCreditCards?: boolean
  acceptsDebitCards?: boolean
  acceptsCashOnly?: boolean
  acceptsNfc?: boolean
}

export interface AccessibilityOptions {
  wheelchairAccessibleParking?: boolean
  wheelchairAccessibleEntrance?: boolean
  wheelchairAccessibleRestroom?: boolean
  wheelchairAccessibleSeating?: boolean
}

export interface GoogleMapsLinks {
  directionsUri?: string
  placeUri?: string
  writeAReviewUri?: string
  reviewsUri?: string
  photosUri?: string
}

export interface GenerativeSummary {
  overview?: LocalizedText
  disclosureText?: LocalizedText
}

export interface ReviewSummary {
  text?: LocalizedText
  reviewsUri?: string
}

export interface Money {
  currencyCode?: string
  units?: string
  nanos?: number
}

export interface PriceRange {
  startPrice?: Money
  endPrice?: Money
}

export type PriceLevel =
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE"

export interface FilterState {
  minRating: number
  minReviewCount: number
  priceLevels: PriceLevel[]
  openNow: boolean
  delivery: boolean
  dineIn: boolean
  takeout: boolean
  servesVegetarianFood: boolean
  outdoorSeating: boolean
  reservable: boolean
  goodForGroups: boolean
  liveMusic: boolean
  servesCocktails: boolean
  servesBreakfast: boolean
  servesLunch: boolean
  servesDinner: boolean
  servesBrunch: boolean
  servesAlcohol: boolean
}

export type SortOption = "rating" | "reviewCount" | "distance"

export interface CategoryColor {
  dark: string
  light: string
  category: string
}
