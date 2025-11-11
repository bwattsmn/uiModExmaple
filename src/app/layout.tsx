import "~/styles/globals.css"

import { Geist } from "next/font/google"
import type { Metadata } from "next"

import { ThemeToggle } from "~/components/theme-toggle"
import { ThemeProvider } from "~/components/theme-provider"
import { cn } from "~/lib/utils"

export const metadata: Metadata = {
  title: "Sales Dashboard",
  description: "Interactive sales workspace powered by the T3 stack.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geist.variable)}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="pointer-events-none fixed right-4 top-4 z-50">
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
