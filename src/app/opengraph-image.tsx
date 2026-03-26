import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Nerede Yesem? - Yakınımdaki En İyi Mekanlar"

export default async function OGImage() {
  const fontBold = await readFile(
    join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf")
  )

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        fontFamily: "Noto Sans",
      }}
    >
      {/* Decorative accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at 30% 40%, rgba(245,158,11,0.15) 0%, transparent 50%)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -1,
          }}
        >
          Nerede Yesem?
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#94a3b8",
          }}
        >
          Yakınızdaki en iyi mekanları keşfedin
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans",
          data: fontBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  )
}
