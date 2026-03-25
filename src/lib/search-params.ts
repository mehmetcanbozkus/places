import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  createParser,
} from "nuqs"

const sortOptions = ["rating", "reviewCount", "distance"] as const

// Custom boolean parser: accepts "1"/"true" on read, writes "1" for backward compat
export const parseAsLegacyBoolean = createParser({
  parse: (value: string) => value === "1" || value === "true",
  serialize: (value: boolean) => (value ? "1" : ""),
  eq: (a, b) => a === b,
})

// Custom parser for PriceLevel[] <-> comma-separated string
export const parseAsPriceLevels = createParser({
  parse: (value: string) => value.split(",").filter(Boolean),
  serialize: (value: string[]) => value.join(","),
  eq: (a, b) => a.join(",") === b.join(","),
})

export const searchParamsParsers = {
  // Location
  lat: parseAsFloat,
  lng: parseAsFloat,
  q: parseAsString,

  // Search/sort
  s: parseAsStringLiteral(sortOptions).withDefault("rating"),
  r: parseAsInteger.withDefault(3000),

  // Filters
  mr: parseAsFloat.withDefault(0),
  mrc: parseAsInteger.withDefault(0),
  pl: parseAsPriceLevels,
  on: parseAsLegacyBoolean,
  del: parseAsLegacyBoolean,
  din: parseAsLegacyBoolean,
  to: parseAsLegacyBoolean, // takeout (URL key is "to", maps to FilterState.takeout)
  veg: parseAsLegacyBoolean,
  out: parseAsLegacyBoolean,
  res: parseAsLegacyBoolean,
  grp: parseAsLegacyBoolean,
  mus: parseAsLegacyBoolean,
  ckl: parseAsLegacyBoolean,
  bf: parseAsLegacyBoolean,
  lu: parseAsLegacyBoolean,
  dn: parseAsLegacyBoolean,
  br: parseAsLegacyBoolean,
  alc: parseAsLegacyBoolean,

  // Place detail
  place: parseAsString,
}
