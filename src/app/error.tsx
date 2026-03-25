"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-semibold">Bir hata olustu</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Beklenmeyen bir hata meydana geldi. Sayfayi yeniden yuklemeyi deneyin.
      </p>
      <Button onClick={() => unstable_retry()} variant="outline">
        Tekrar Dene
      </Button>
    </div>
  )
}
