# UI/UX Visual Refresh + Favoriler Sistemi — Tasarim Spesifikasyonu

**Tarih:** 2026-03-24
**Yaklasim:** A — Gorsel Yenileme + Favoriler
**Tasarim Dili:** Canli ve renkli — neon renkler, gradient'ler, mikro-animasyonlar
**Animasyon Kutuphanesi:** Motion (motion/react) — projede mevcut

---

## 1. Renk Sistemi ve Genel Estetik

### 1.1 Kategori Bazli Neon Renk Kodlamasi

Her mekan tipi icin farkli neon accent renk:

| Kategori | Neon Renk | Kullanim |
|----------|-----------|----------|
| Restoran | Elektrik turuncu `#FF6B2C` | Kart ust border, hover glow |
| Kafe | Neon yesil `#39FF14` | Kart ust border, hover glow |
| Bar | Canli mor `#BF40FF` | Kart ust border, hover glow |
| Pastane | Sicak pembe `#FF1493` | Kart ust border, hover glow |
| Diger | Elektrik mavi `#00D4FF` | Kart ust border, hover glow |

Renkler `lib/types.ts` icerisinde bir mapping fonksiyonu ile mekan tipine gore dondurulecek.

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
- Rating sayisi renk kodlu neon glow:
  - 4.5+: yesil neon glow
  - 3.5+: amber neon glow
  - <3.5: kirmizi neon glow

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
- Favori eklendiginde kucuk parcacik efekti (4-6 kucuk kalp burst)

### 4.2 Veri Depolama

- `localStorage` ile (`favorites` key, place ID array olarak)
- Custom hook: `useFavorites()`

```typescript
interface UseFavoritesReturn {
  favorites: string[]           // place ID listesi
  toggle: (placeId: string) => void
  isFavorite: (placeId: string) => boolean
  count: number
}
```

### 4.3 Favori Filtresi

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
| Filtre sonucu bos | Filtre ikonundan parcacik dagilma | "Filtreleri gevset" butonu |
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

- Neon glow efektleri `box-shadow` ile uygulanacak (GPU-accelerated)
- `will-change: transform` sadece aktif animasyonlu elemanlarda
- `whileInView` icin `viewport={{ once: true }}` ile tekrar tetikleme onlenir
- localStorage islemleri senkron — kucuk veri seti (ID array) icin sorun teskil etmez
