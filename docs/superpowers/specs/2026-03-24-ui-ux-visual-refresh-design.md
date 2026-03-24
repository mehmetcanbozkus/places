# UI/UX Visual Refresh + Favoriler Sistemi — Tasarim Spesifikasyonu

**Tarih:** 2026-03-24
**Yaklasim:** A — Gorsel Yenileme + Favoriler
**Tasarim Dili:** Canli ve renkli — neon renkler, gradient'ler, mikro-animasyonlar
**Animasyon Kutuphanesi:** Motion (motion/react) — projede mevcut

---

## 1. Renk Sistemi ve Genel Estetik

### 1.1 Kategori Bazli Neon Renk Kodlamasi

Her mekan tipi icin farkli neon accent renk. Mapping `Place.primaryType` alanina dayanir (Google Places API'den gelen machine-readable string). `primaryType` undefined ise `Place.types` dizisinin ilk elemani kullanilir; her ikisi de yoksa "diger" kategorisine duser.

**primaryType → Kategori Mapping Tablosu:**

| Kategori | primaryType degerleri | Neon Renk (Dark) | Neon Renk (Light) |
|----------|----------------------|------------------|-------------------|
| Restoran | `restaurant`, `turkish_restaurant`, `italian_restaurant`, `chinese_restaurant`, `japanese_restaurant`, `mexican_restaurant`, `thai_restaurant`, `indian_restaurant`, `seafood_restaurant`, `steak_house`, `pizza_restaurant`, `hamburger_restaurant`, `kebab_shop`, `fast_food_restaurant`, `meal_takeaway` | `oklch(0.75 0.2 45)` | `oklch(0.55 0.2 45)` |
| Kafe | `cafe`, `coffee_shop`, `tea_house`, `bakery` | `oklch(0.75 0.2 145)` | `oklch(0.45 0.18 145)` |
| Bar | `bar`, `night_club`, `pub`, `wine_bar`, `cocktail_bar` | `oklch(0.7 0.25 310)` | `oklch(0.5 0.22 310)` |
| Pastane | `pastry_shop`, `dessert_shop`, `ice_cream_shop`, `confectionery` | `oklch(0.75 0.22 350)` | `oklch(0.55 0.2 350)` |
| Diger | Yukaridaki listelere uymayan tum tipler + undefined | `oklch(0.75 0.18 230)` | `oklch(0.5 0.18 230)` |

> **Not:** Renkler oklch formatinda tanimlanir (mevcut renk sistemiyle tutarli). Dark mode'da daha yuksek luminance, light mode'da daha dusuk luminance kullanilarak her iki temada yeterli kontrast saglanir.

Mapping fonksiyonu `lib/types.ts` icerisinde `getCategoryColor(primaryType?: string, types?: string[]): { dark: string, light: string, category: string }` olarak eklenir.

### 1.2 Gradient Header

- Header arka plani: mevcut `bg-background/80 backdrop-blur-xl` uzerine ince gradient border-bottom (primary → secondary, 1px)
- Arama cubuguna focus durumunda neon glow: `ring-2 ring-primary/50 shadow-[0_0_15px_rgba(255,107,44,0.3)]`
- Logo/baslik alanina subtle accent renk

### 1.3 Genel Glow Efekt Sistemi

Neon glow icin tekrar kullanilabilir shadow utility'leri:
- `glow-sm`: `0 0 8px color/20%`
- `glow-md`: `0 0 15px color/30%`
- `glow-lg`: `0 0 25px color/40%`

Bunlar Tailwind CSS custom utility olarak tanimlanacak veya inline style ile uygulanacak.

---

## 2. Kart Tasarimi ve Mikro-Animasyonlar

### 2.1 Kart Yapisi Yenileme

**Gorsel degisiklikler:**
- Fotografin alt kisminda gradient overlay (siyahtan transparan): mekan adi ve temel bilgi fotografin uzerinde gosterilir
- Acik/kapali badge neon glow efektli: acik → yesil glow, kapali → kirmizi glow
- Karttin ust kenarinda 3px gradient border (mekan tipine gore neon renk)

**Hover mikro-animasyonlari (Motion):**
```tsx
whileHover={{ y: -6, scale: 1.02, boxShadow: `0 0 25px ${categoryColor}40` }}
whileTap={{ scale: 0.98 }}
transition={{ type: "spring", stiffness: 300, damping: 25 }}
```

- Fotograf: hover'da scale 1.08 (mevcut 1.05'ten arttirilir)
- Feature badge'leri hover'da stagger ile fade-in

### 2.2 Ilk Yukleme Animasyonlari

- Mevcut stagger korunur (0.06s)
- Kart giris efekti zengilestirilir:

```tsx
const cardVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
}
```

- `whileInView` ile scroll'da gorunen kartlar animasyonlu giris yapar

### 2.3 Rating Gosterimi

- Yildizlar dolum animasyonlu (soldan saga fill, stagger 0.1s)
- Rating sayisi renk kodlu neon glow. Mevcut `getRatingColor()` fonksiyonu (Tailwind class donduruyor) korunur ve genisletilir: yeni bir `getRatingGlow()` fonksiyonu eklenir (veya `getRatingColor` return tipi genisletilir) — glow icin inline shadow string dondurecek:
  - 4.5+: yesil neon glow `0 0 12px oklch(0.7 0.2 145 / 0.4)`
  - 3.5+: amber neon glow `0 0 12px oklch(0.7 0.15 85 / 0.4)`
  - <3.5: kirmizi neon glow `0 0 12px oklch(0.6 0.2 25 / 0.4)`

---

## 3. Header, Filtreler ve Arama Deneyimi

### 3.1 Quick Filter Chip'leri

**Aktif chip:**
- Neon gradient arka plan + glow shadow
- `layoutId` ile smooth gecis animasyonu

**Inaktif chip:**
- Ghost style, hover'da neon border glow
- Secim animasyonu: scale spring efekti

**Ikon ekleme:**
Her chip'e ilgili kucuk ikon: Open Now (saat), Delivery (kutu), Vegetarian (yaprak), Outdoor (gunes), vb.

### 3.2 Sidebar Filtre Paneli

- Filtre gruplarina collapse/expand animasyonu (AnimatePresence ile height gecisi)
- Slider'a gradient track rengi (min→max: kirmizidan yesile)
- Aktif filtre sayisi badge'ine pulse animasyonu
- "Filtreleri Temizle" butonuna sweep animasyonu

### 3.3 Arama Autocomplete

- Dropdown acilisinda stagger animasyon (her oneri satiri sirayla)
- Son aramalar bolumune fade-in efekti
- Secim aninda subtle highlight flash

---

## 4. Favoriler Sistemi

### 4.1 Favori Butonu

**Konum:** Her kartta sag ust kosede (share butonunun yaninda), detay sheet'te de ayni buton.

**Animasyonlar:**
- Tiklama: scale 0→1.3→1 spring + renk gecisi (gri → neon pembe/kirmizi)
- **(Stretch goal)** Favori eklendiginde kucuk parcacik efekti: 4-6 adet absolutely-positioned `motion.div` (kucuk kalp) spawn edilir, rastgele yon ve mesafeye dogru animasyonlanir (opacity 1→0, scale 1→0.5), 600ms sonra DOM'dan kaldirilir. Motion'in built-in parcacik sistemi yok, bu nedenle implementasyon karmasikligi yuksek — oncelik dusuktur.

### 4.2 Veri Depolama

- `localStorage` ile (`favorites` key, place ID array olarak)
- Custom hook: `useFavorites()`
- Cross-tab senkronizasyon kapsam disi — mevcut `useRecentSearches` hook'u ile tutarli yaklasim

```typescript
interface UseFavoritesReturn {
  favorites: string[]           // place ID listesi
  toggle: (placeId: string) => void
  isFavorite: (placeId: string) => boolean
  count: number
}
```

### 4.3 Favori Filtresi

**Onemli:** Favoriler filtresi `FilterState` arayuzune EKLENMEZ. Favori durumu yalnizca yerel (localStorage) oldugu icin URL state ile senkronize edilmemelidir. Bunun yerine `places-explorer.tsx` icerisinde ayri bir `showFavoritesOnly: boolean` state olarak yonetilir. Bu state:
- `FilterState`, `DEFAULT_FILTERS`, `countActiveFilters`, `parseUrlState`, `buildUrlParams` fonksiyonlarini ETKiLEMEZ
- Quick filter bar'da ozel bir chip olarak gosterilir (diger filtrelerden bagimsiz)
- `lib/url-state.ts` dosyasinda degisiklik GEREKMEZ

- Quick filter bar'a "Favoriler" chip'i (kalp ikonu, neon pembe)
- Aktifken sadece favorilenen mekanlar gosterilir
- Bos durum: "Henuz favori mekaniniz yok" + animasyonlu kalp + "Kesfetmeye basla" CTA

### 4.4 Favori Sayaci

- Header'da kucuk kalp ikonu + badge (favori sayisi)
- Yeni favori eklendiginde badge'de bounce animasyonu

---

## 5. Bos Durumlar, Yukleme ve Detay Sayfasi

### 5.1 Yukleme Skeleton'lari

- Shimmer efektine neon gradient (primary rengin dusuk opakliginda)
- Skeleton kartlara stagger giris animasyonu
- Grid/list view'a gore dogru skeleton gosterimi

### 5.2 Bos Durumlar

| Durum | Animasyon | Mesaj |
|-------|-----------|-------|
| Sonuc bulunamadi | Buyutec saga-sola hareket | Oneri mesaji |
| Filtre sonucu bos | Filtre ikonu titresim animasyonu (shake) | "Filtreleri gevset" butonu |
| Favoriler bos | Kalbin atma animasyonu | "Kesfetmeye basla" CTA |

### 5.3 Detay Sheet Iyilestirme

- Acilis animasyonu: sagdan slide + fade + scale (0.95→1)
- Fotograf galerisi: aktif foto index gostergesi (dot indicator, neon aktif dot)
- Ozellik badge'lerine renkli ikonlar ve neon glow
- Review kartlarina hover efekti ve stagger giris animasyonu
- Calisma saatleri: bugunun satiri vurgulanmis (neon accent border)

### 5.4 Scroll-to-Top Butonu

- Neon gradient arka plan, hover'da glow efekt
- Gorunme/kaybolma: scale + fade (AnimatePresence ile)

---

## 6. Teknik Notlar

### Etkilenen Dosyalar

| Dosya | Degisiklik |
|-------|-----------|
| `app/globals.css` | Neon renk degiskenleri, glow utility'leri |
| `lib/types.ts` | Kategori renk mapping fonksiyonu |
| `components/place-card.tsx` | Kart yapisi, hover animasyonlari, favori butonu |
| `components/place-list-item.tsx` | Liste gorunumune favori butonu, neon accent |
| `components/places-explorer.tsx` | Favori state, favori filtresi, header sayac, bos durumlar |
| `components/quick-filters.tsx` | Ikonlar, neon stiller, animasyonlar |
| `components/filters-panel.tsx` | Collapse animasyonu, gradient slider |
| `components/place-detail-sheet.tsx` | Foto index, neon badge'ler, favori butonu |
| `components/blur-image.tsx` | Neon shimmer gradient |
| `components/scroll-to-top.tsx` | Neon gradient, AnimatePresence |
| `components/location-search.tsx` | Autocomplete animasyonlari, focus glow |
| `components/rating-breakdown.tsx` | Neon glow rating |
| `hooks/use-favorites.ts` | **YENi DOSYA** — favori hook'u |

### Bagimliliklar

- Mevcut: `motion`, `lucide-react`, `sonner`, `shadcn/ui`, `tailwindcss`
- Yeni bagimlilik gerekmez

### Performans Hususlari

- Neon glow efektleri: Statik glow icin `box-shadow` CSS kullanilir (hover state degisikligi, animasyonlu degil). Animasyonlu glow gereken yerlerde (pulse, giris efekti) `::after` pseudo-element uzerine sabit blur shadow koyulur ve `opacity` animasyonlanir — bu GPU-composited'dir. `box-shadow` degeri animasyonlanMAZ (paint tetikler).
- `will-change: transform` sadece aktif animasyonlu elemanlarda
- `whileInView` kullanimi: Sadece ilk yukleme sonrasi ek sonuclar (ornegin "daha fazla goster" ile yuklenen kartlar) icin kullanilir. Ilk batch mevcut parent stagger pattern'i ile animasyonlanir — iki sistem catismaz.
- localStorage islemleri senkron — kucuk veri seti (ID array) icin sorun teskil etmez (500 favori ~14KB, limit gereksiz)

### Erisebilirlik

- Tum animasyonlar `prefers-reduced-motion: reduce` medya sorgusunu saygiyla karsilar. Motion kutuphanesinin `useReducedMotion()` hook'u kullanilir.
- Reduced motion aktifken: spring animasyonlar yerine anlik gecis, glow pulse'lar devre disi, stagger gecikmeleri sifirlanir, parcacik efektleri atlanir. Statik glow shadow'lar korunur (bunlar animasyon degil, stil).
- Favori butonu icin `aria-label="Favorilere ekle"` / `aria-label="Favorilerden cikar"` ve `aria-pressed` durumu eklenir.

### Autocomplete Animasyonlari Kapsami

Section 3.3'teki animasyonlar yalnizca uygulama icerisinde olusturulan custom dropdown icin gecerlidir (son aramalar ve adres onerileri). Google Places Autocomplete harici widget kullanilmiyor — tum oneri listeleri kendi `LocationSearch` component'i tarafindan render edilir.

### PlaceCard Props Degisikligi

`PlaceCard` component'ine eklenen yeni prop'lar:

```typescript
interface PlaceCardProps {
  // ... mevcut prop'lar
  isFavorite: boolean
  onToggleFavorite: (placeId: string) => void
  categoryColor: string  // oklch renk degeri
}
```

Ayni prop'lar `PlaceListItem` icin de gecerlidir.
