import type { Metadata, Viewport } from "next"
import { Geist_Mono, Noto_Sans } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Nerede Yesem? - Yakınımdaki En İyi Mekanlar",
    template: "%s | Nerede Yesem?",
  },
  description:
    "Yakınızdaki en iyi restoranları, kafeleri ve barları keşfedin. Puanlar, yorumlar ve filtrelerle size en uygun mekanı bulun.",
  openGraph: {
    title: "Nerede Yesem?",
    description: "Yakınızdaki en iyi mekanları keşfedin",
    type: "website",
    locale: "tr_TR",
    siteName: "Nerede Yesem?",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nerede Yesem?",
    description: "Yakınızdaki en iyi mekanları keşfedin",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

const notoSans = Noto_Sans({ variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        notoSans.variable
      )}
    >
      <body>
        <NuqsAdapter>
          <ThemeProvider>{children}</ThemeProvider>
          <Toaster position="bottom-center" />
        </NuqsAdapter>
      </body>
    </html>
  )
}
