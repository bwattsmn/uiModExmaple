import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "~/components/ui/button"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          404 — Not Found
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          We couldn&apos;t find that sales record
        </h1>
        <p className="max-w-md text-muted-foreground">
          The record you requested may have been removed or never existed. Head
          back to the main table to pick another record.
        </p>
        <Button asChild className="mt-4 gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Return to sales table
          </Link>
        </Button>
      </div>
    </main>
  )
}


