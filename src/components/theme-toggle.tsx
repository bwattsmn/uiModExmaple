'use client'

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 opacity-50"
        aria-hidden="true"
      >
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const currentTheme = (resolvedTheme ?? theme ?? "light") as "light" | "dark"
  const isDark = currentTheme === "dark"

  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative h-9 w-9"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all",
          isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "rotate-0 scale-100" : "rotate-90 scale-0",
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}


