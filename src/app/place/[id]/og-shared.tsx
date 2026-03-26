import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { PRICE_LEVEL_SYMBOL } from "@/lib/constants"
import type { PriceLevel } from "@/lib/types"
import { fetchPlaceDetail, fetchPlacePhotoBuffer } from "@/lib/google-places"

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = "image/png"

export async function renderPlaceOGImage(id: string) {
  const place = await fetchPlaceDetail(id)

  const photoName = place?.photos?.[0]?.name
  const photoSrc = photoName
    ? await fetchPlacePhotoBuffer(photoName).then((buf) =>
        buf
          ? `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`
          : null
      )
    : null

  const fontBold = await readFile(
    join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf")
  )

  const name = place?.displayName?.text ?? "Mekan"
  const rating = place?.rating ? place.rating.toFixed(1) : null
  const type = place?.primaryTypeDisplayName?.text ?? ""
  const address = place?.shortFormattedAddress ?? place?.formattedAddress ?? ""
  const price = place?.priceLevel
    ? (PRICE_LEVEL_SYMBOL[place.priceLevel as PriceLevel] ?? "")
    : ""
  const subtitle = [type, price].filter(Boolean).join(" · ")

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#0f172a",
        fontFamily: "Noto Sans",
      }}
    >
      {/* Photo background or gradient fallback */}
      {photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img
          src={photoSrc}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)",
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)",
        }}
      />

      {/* Branding top-right */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 32,
          color: "rgba(255,255,255,0.6)",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        Nerede Yesem?
      </div>

      {/* Content bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "32px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Rating + Type */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {rating && (
            <div
              style={{
                background: "#f59e0b",
                color: "#000",
                fontWeight: 700,
                fontSize: 18,
                padding: "4px 12px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
              }}
            >
              {rating} ★
            </div>
          )}
          {subtitle && (
            <span style={{ color: "#94a3b8", fontSize: 16 }}>{subtitle}</span>
          )}
        </div>

        {/* Place name */}
        <div
          style={{
            color: "#fff",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          {name}
        </div>

        {/* Address */}
        {address && (
          <div style={{ color: "#94a3b8", fontSize: 18 }}>{address}</div>
        )}
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        {
          name: "Noto Sans",
          data: fontBold,
          style: "normal" as const,
          weight: 700,
        },
      ],
    }
  )
}
