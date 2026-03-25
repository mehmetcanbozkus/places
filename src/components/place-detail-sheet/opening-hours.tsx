interface OpeningHoursProps {
  descriptions: string[]
}

export function OpeningHours({ descriptions }: OpeningHoursProps) {
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      {descriptions.map((desc, i) => {
        const colonIndex = desc.indexOf(":")
        const dayName =
          colonIndex > -1 ? desc.slice(0, colonIndex).trim() : desc
        const hours = colonIndex > -1 ? desc.slice(colonIndex + 1).trim() : ""
        const isToday = i === todayIndex
        const isClosed =
          hours.toLowerCase().includes("kapal\u0131") ||
          hours.toLowerCase().includes("closed")

        return (
          <div
            key={i}
            className={`flex items-center px-3 py-2.5 ${
              isToday
                ? "border-l-2 border-emerald-500 bg-primary/5"
                : "border-l-2 border-transparent"
            }`}
          >
            <div
              className={`mr-3 h-1.5 w-1.5 shrink-0 rounded-full ${
                isToday
                  ? "bg-emerald-500"
                  : isClosed
                    ? "bg-destructive"
                    : "bg-muted-foreground/30"
              }`}
              style={
                isToday
                  ? {
                      boxShadow: "0 0 6px rgb(16 185 129 / 0.6)",
                    }
                  : undefined
              }
            />
            <span
              className={`w-24 text-sm ${
                isToday
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {dayName}
            </span>
            <span
              className={`ml-auto text-sm ${
                isToday
                  ? "font-medium text-foreground"
                  : isClosed
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {hours}
            </span>
          </div>
        )
      })}
    </div>
  )
}
