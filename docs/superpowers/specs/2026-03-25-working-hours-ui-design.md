# Working Hours Section — Visual Refresh

**Date:** 2026-03-25
**Scope:** Replace the "Çalışma Saatleri" block in `src/components/place-detail-sheet.tsx` (lines 671–705)

## Problem

The current working hours section is a plain list of `<p>` tags with minimal styling. Today's row gets a `bg-primary/10` highlight but the section lacks visual hierarchy, clear alignment, and polish compared to other sections in the detail sheet.

## Chosen Direction

**Bordered Card with Dot Indicators** (Option B from brainstorming). A card-wrapped list with per-row dot indicators, a left accent bar on today, and color-coded closed days.

## Design Details

### Card Wrapper

- `rounded-lg border bg-muted/30 overflow-hidden` wrapping the 7-day list
- Consistent with the review card style already used in the codebase

### Row Layout

Each weekday description is rendered as a flex row:

```
[dot] [day name]                    [hours]
```

- **Dot indicator** (6px circle, left of day name):
  - Today: `bg-emerald-500` with `box-shadow: 0 0 6px` glow
  - Closed day: `bg-destructive`
  - Other days: `bg-muted-foreground/30`
- **Day name**: fixed-width (~90px), left-aligned, `text-sm`
- **Hours**: right-aligned via `ml-auto`, `text-sm`

### Today Highlight

Today's row receives:

- `bg-primary/5` background
- `border-l-2 border-emerald-500` left accent bar
- `font-medium` weight + foreground color (not muted)
- Glowing green dot

### Closed Day Styling

If the hours portion contains "Kapalı":

- Hours text: `text-destructive`
- Dot: `bg-destructive`
- Day name: `text-muted-foreground` (dimmed)

### String Parsing

Split each `weekdayDescription` string on the first `:` character:

```ts
const colonIndex = desc.indexOf(":")
const dayName = colonIndex > -1 ? desc.slice(0, colonIndex).trim() : desc
const hours = colonIndex > -1 ? desc.slice(colonIndex + 1).trim() : ""
```

If the split fails (no colon found), render the full string spanning the entire row as a graceful fallback.

### Section Header

Keeps the existing structure:

```tsx
<h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
  <Clock className="h-4 w-4" />
  Çalışma Saatleri
</h3>
```

No "Şu an açık" badge — the open/closed badge stays in the header area near the rating.

### Today Detection

Reuse existing logic:

```ts
const today = new Date().getDay()
const todayIndex = today === 0 ? 6 : today - 1
```

## Theme Support

Uses only Tailwind semantic colors (`primary`, `muted`, `muted-foreground`, `destructive`, `foreground`) plus `emerald-500` for the today accent. Works in both light and dark modes.

## What Does NOT Change

- The `Açık/Kapalı` badge position in the header
- No new shadcn components required
- No collapsing/expanding behavior
- No new dependencies
- No changes to the `OpeningHours` type or API calls
- Separator placement before/after the section stays the same

## File Changes

| File | Change |
|------|--------|
| `src/components/place-detail-sheet.tsx` | Replace lines 671–705 (Opening Hours block) with the new card-based layout |

## Data Source

- `place.regularOpeningHours?.weekdayDescriptions` (primary)
- `place.currentOpeningHours?.weekdayDescriptions` (fallback)
- Array of 7 strings, one per weekday, format: `"DayName: HH:MM – HH:MM"` or `"DayName: Kapalı"`
