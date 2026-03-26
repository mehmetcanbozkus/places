import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-semibold">Mekan Bulunamadı</h2>
      <p className="text-sm text-muted-foreground">
        Aradığınız mekan mevcut değil veya kaldırılmış olabilir.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  )
}
