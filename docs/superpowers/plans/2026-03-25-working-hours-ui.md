# Working Hours UI Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain "Çalışma Saatleri" section with a polished bordered card layout featuring dot indicators, today highlighting, and closed-day styling.

**Architecture:** Single component change in `place-detail-sheet.tsx`. Parse existing `weekdayDescriptions` strings to separate day names from hours for two-column alignment. Use Tailwind semantic colors for theme compatibility.

**Tech Stack:** React, Tailwind CSS, Lucide icons (already in use)

**Spec:** `docs/superpowers/specs/2026-03-25-working-hours-ui-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/place-detail-sheet.tsx` | Modify lines 671–705 | Replace Opening Hours block with new card layout |

No new files. No new dependencies.

---

### Task 1: Replace the Opening Hours block with the new card layout

**Files:**
- Modify: `src/components/place-detail-sheet.tsx:671-705`

- [ ] **Step 1: Read the current Opening Hours block**

Read `src/components/place-detail-sheet.tsx` lines 671–705 to confirm the exact code to replace. The block starts with the `{/* Opening Hours */}` comment and the conditional check for `weekdayDescriptions`.

- [ ] **Step 2: Replace the Opening Hours block**

Replace lines 671–705 (from `{/* Opening Hours */}` through the closing `</>`) with the following:

```tsx
                    {/* Opening Hours */}
                    {(place.regularOpeningHours?.weekdayDescriptions ||
                      place.currentOpeningHours?.weekdayDescriptions) && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Clock className="h-4 w-4" />
                            Çalışma Saatleri
                          </h3>
                          {(() => {
                            const today = new Date().getDay()
                            const todayIndex = today === 0 ? 6 : today - 1
                            const descriptions =
                              place.regularOpeningHours?.weekdayDescriptions ||
                              place.currentOpeningHours?.weekdayDescriptions ||
                              []
                            return (
                              <div className="overflow-hidden rounded-lg border bg-muted/30">
                                {descriptions.map((desc, i) => {
                                  const colonIndex = desc.indexOf(":")
                                  const dayName =
                                    colonIndex > -1
                                      ? desc.slice(0, colonIndex).trim()
                                      : desc
                                  const hours =
                                    colonIndex > -1
                                      ? desc.slice(colonIndex + 1).trim()
                                      : ""
                                  const isToday = i === todayIndex
                                  const isClosed =
                                    hours.toLowerCase().includes("kapalı") ||
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
                                                boxShadow:
                                                  "0 0 6px rgb(16 185 129 / 0.6)",
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
                          })()}
                        </div>
                      </>
                    )}
```

- [ ] **Step 3: Verify the dev server compiles without errors**

Run: `bun run dev`

Open the app in the browser, navigate to any place detail sheet, and scroll to the "Çalışma Saatleri" section. Verify:
- Card wrapper with rounded border and muted background is visible
- Today's row has a green left border, green glowing dot, and bold text
- Closed days (if any) show red text for hours and a red dot
- Other days have muted text with neutral dots
- Day names are left-aligned, hours are right-aligned
- Both light and dark themes render correctly

- [ ] **Step 4: Commit**

```bash
git add src/components/place-detail-sheet.tsx
git commit -m "feat: redesign working hours section with card layout and indicators"
```
