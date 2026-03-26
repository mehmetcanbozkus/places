import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background">
      {/* Hero skeleton */}
      <Skeleton className="aspect-[16/9] w-full rounded-none" />

      <div className="space-y-6 p-6">
        {/* Name */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-16" />
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Hours */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-48" />
          ))}
        </div>
      </div>
    </main>
  )
}
