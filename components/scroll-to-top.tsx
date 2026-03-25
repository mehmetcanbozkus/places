"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowUp } from "lucide-react"

export function ScrollToTop() {
  const [show, setShow] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          setShow(scrollY > 400)
          // Calculate scroll progress (0-1) for the ring indicator
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight
          setScrollProgress(
            docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0
          )
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  // SVG circle parameters for progress ring
  const size = 48
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 260, damping: 22 }
          }
          whileHover={reducedMotion ? undefined : { scale: 1.1 }}
          whileTap={reducedMotion ? undefined : { scale: 0.92 }}
          onClick={scrollToTop}
          className="fixed right-5 bottom-5 z-30 flex items-center justify-center rounded-full bg-background/80 shadow-lg backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_0_24px_var(--primary),0_0_48px_color-mix(in_oklch,var(--primary)_40%,transparent)]"
          style={{ width: size, height: size }}
          title="Yukari cik"
          aria-label="Sayfanin basina don"
        >
          {/* Progress ring */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted-foreground/15"
            />
            {/* Progress arc with neon gradient */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#scrollGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - scrollProgress)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-[stroke-dashoffset] duration-150 ease-out"
            />
            <defs>
              <linearGradient
                id="scrollGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--neon-restaurant)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Arrow icon */}
          <ArrowUp className="h-5 w-5 text-primary" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
