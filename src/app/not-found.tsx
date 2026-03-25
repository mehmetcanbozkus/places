import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-semibold">Sayfa Bulunamadi</h2>
      <p className="text-sm text-muted-foreground">
        Aradiginiz sayfa mevcut degil.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Ana Sayfaya Don</Link>
      </Button>
    </div>
  )
}
