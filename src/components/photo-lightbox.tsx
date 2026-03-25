"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence, type PanInfo } from "motion/react"
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react"
import type { PlacePhoto } from "@/lib/types"
import { getPhotoUrl } from "@/lib/types"

interface PhotoLightboxProps {
  photos: PlacePhoto[]
  initialIndex: number
  open: boolean
  onClose: () => void
}

export function PhotoLightbox({
  photos,
  initialIndex,
  open,
  onClose,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [direction, setDirection] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  // Sync initial index when opening
  if (open && !prevOpen) {
    setPrevOpen(open)
    setCurrentIndex(initialIndex)
    setIsZoomed(false)
  } else if (open !== prevOpen) {
    setPrevOpen(open)
  }

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (isZoomed) return
      setDirection(dir)
      setCurrentIndex((prev) => {
        const next = prev + dir
        if (next < 0) return photos.length - 1
        if (next >= photos.length) return 0
        return next
      })
    },
    [photos.length, isZoomed]
  )

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          navigate(-1)
          break
        case "ArrowRight":
          navigate(1)
          break
        case "Escape":
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, navigate, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }
  }, [open])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (isZoomed) return
    const threshold = 50
    if (info.offset.x > threshold) {
      navigate(-1)
    } else if (info.offset.x < -threshold) {
      navigate(1)
    }
  }

  const handleDownload = async () => {
    const photo = photos[currentIndex]
    if (!photo) return
    const url = getPhotoUrl(photo.name, 1200)
    window.open(url, "_blank")
  }

  if (!open || !photos.length) return null

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          {/* Top bar */}
          <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {currentIndex + 1} / {photos.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownload}
                className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                title="Fotoğrafı aç"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Photo */}
          <div className="relative flex h-full w-full items-center justify-center px-4 pt-16 pb-20">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag={!isZoomed ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                className="absolute flex h-full w-full items-center justify-center"
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <Image
                  src={getPhotoUrl(photos[currentIndex].name, 1200)}
                  alt={`Fotoğraf ${currentIndex + 1}`}
                  fill
                  sizes="100vw"
                  className={`object-contain transition-transform duration-300 select-none ${
                    isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                  draggable={false}
                  unoptimized
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          {photos.length > 1 && !isZoomed && (
            <>
              <button
                onClick={() => navigate(-1)}
                className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute right-0 bottom-0 left-0 z-10 p-4">
              <div className="mx-auto flex max-w-lg justify-center gap-1.5 overflow-x-auto">
                {photos.map((photo, i) => (
                  <button
                    key={photo.name}
                    onClick={() => {
                      setDirection(i > currentIndex ? 1 : -1)
                      setCurrentIndex(i)
                    }}
                    className={`relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-md transition-all ${
                      i === currentIndex
                        ? "ring-2 ring-white ring-offset-1 ring-offset-black"
                        : "opacity-50 hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={getPhotoUrl(photo.name, 100)}
                      alt={`Küçük resim ${i + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                      draggable={false}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
