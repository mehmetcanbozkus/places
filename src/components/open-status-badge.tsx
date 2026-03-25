import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface OpenStatusBadgeProps {
  isOpen: boolean
  variant?: "overlay" | "inline" | "plain"
}

export function OpenStatusBadge({
  isOpen,
  variant = "overlay",
}: OpenStatusBadgeProps) {
  if (variant === "inline") {
    return (
      <Badge
        variant="secondary"
        className={`h-5 px-1.5 text-[10px] ${
          isOpen
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/15 text-red-600 dark:text-red-400"
        }`}
      >
        <Clock className="mr-0.5 h-2.5 w-2.5" />
        {isOpen ? "A\u00e7\u0131k" : "Kapal\u0131"}
      </Badge>
    )
  }

  if (variant === "plain") {
    return (
      <Badge
        variant={isOpen ? "default" : "secondary"}
        className={
          isOpen
            ? "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
            : "bg-red-500/90 text-white hover:bg-red-500/90"
        }
      >
        {isOpen ? "A\u00e7\u0131k" : "Kapal\u0131"}
      </Badge>
    )
  }

  // overlay (default)
  return (
    <Badge
      variant={isOpen ? "default" : "secondary"}
      className={
        isOpen
          ? "bg-emerald-500/90 text-white shadow-[0_0_10px_oklch(0.7_0.2_145_/_0.4)] backdrop-blur-sm hover:bg-emerald-500/90"
          : "bg-red-500/90 text-white shadow-[0_0_10px_oklch(0.6_0.2_25_/_0.4)] backdrop-blur-sm hover:bg-red-500/90"
      }
    >
      <Clock className="mr-1 h-3 w-3" />
      {isOpen ? "A\u00e7\u0131k" : "Kapal\u0131"}
    </Badge>
  )
}
