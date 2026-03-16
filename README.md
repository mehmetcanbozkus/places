# Places

Discover the best restaurants near you. Search any location, filter by rating, reviews, price, features, and more.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

**Search & Discovery**
- Nearby restaurant search using Google Places API (New)
- Google Maps-style autocomplete location search
- Recent search history with localStorage persistence
- URL state persistence — share filtered results via link

**Filtering & Sorting**
- Quick filter chips (open now, 4.5+, delivery, vegetarian, etc.)
- Advanced filters: rating, review count, price level, service type, meals, features
- Sort by rating, review count, or distance
- Bottom sheet filters on mobile, sidebar on desktop

**Place Details**
- Full-screen photo lightbox with swipe, zoom, and thumbnail strip
- Rating breakdown chart (5/4/3/2/1 star distribution)
- Review filtering by star rating
- Opening hours, contact info, features, editorial summary
- Direct links to Google Maps and website

**Sharing**
- Native share dialog on mobile (WhatsApp, Telegram, etc.)
- Clipboard copy fallback on desktop with toast notification
- Share from card hover or detail panel

**UI/UX**
- Grid and list view toggle
- Blur image placeholders with fade-in transition
- Rating color scale (green/amber/red)
- Pull to refresh on mobile
- Scroll to top button
- Motion animations throughout (stagger, spring, presence)
- Dark/light theme with system detection
- Fully responsive (mobile + tablet + desktop)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript 5.9
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Animations**: [Motion](https://motion.dev/) (Framer Motion)
- **API**: [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Google Cloud project with **Places API (New)** enabled and billing active

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mtcnbzks/places.git
   cd places
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create `.env.local` from the example:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Google Places API key to `.env.local`:
   ```
   GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

5. Run the development server:
   ```bash
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Places API (New)** from the API Library
4. Create an API key from Credentials
5. Enable billing (Google provides $200/month free credit)

## Project Structure

```
app/
  api/places/
    nearby/route.ts       # Nearby Search proxy
    [id]/route.ts         # Place Details proxy
    photo/route.ts        # Photo URL proxy
    autocomplete/route.ts # Autocomplete proxy
    geocode/route.ts      # Text Search geocoding
  page.tsx                # Main page
  layout.tsx              # Root layout with theme + toaster
components/
  places-explorer.tsx     # Main orchestrator component
  place-card.tsx          # Restaurant card (grid view)
  place-list-item.tsx     # Restaurant row (list view)
  place-detail-sheet.tsx  # Detail panel with full info
  photo-lightbox.tsx      # Full-screen photo gallery
  location-search.tsx     # Autocomplete search input
  filters-panel.tsx       # Filter controls
  quick-filters.tsx       # Quick filter chip bar
  rating-breakdown.tsx    # Star distribution chart
  blur-image.tsx          # Image with blur placeholder
  scroll-to-top.tsx       # Floating scroll button
hooks/
  use-recent-searches.ts  # localStorage search history
  use-pull-to-refresh.ts  # Touch gesture hook
lib/
  types.ts                # Types, constants, helpers
  url-state.ts            # URL param serialization
```

## API Routes

All Google API calls are proxied through Next.js route handlers to keep the API key server-side.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/places/nearby` | POST | Search nearby restaurants |
| `/api/places/[id]` | GET | Get place details |
| `/api/places/photo` | GET | Resolve photo URL (302 redirect) |
| `/api/places/autocomplete` | POST | Location autocomplete |
| `/api/places/geocode` | GET | Address to coordinates |

## License

MIT
