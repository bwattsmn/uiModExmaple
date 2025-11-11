import salesJson from "~/data/sales.json"
import { SalesTable } from "~/components/sales/sales-table"
import type { SalesRecord } from "~/types/sales"

const salesData = salesJson as SalesRecord[]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-background/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Sales Performance Dashboard
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Browse the sales pipeline, drill into individual records, and build
            tailored detail views. Click any row to open a fully configurable
            record layout.
          </p>
        </header>
        <SalesTable data={salesData} />
      </div>
    </main>
  )
}
