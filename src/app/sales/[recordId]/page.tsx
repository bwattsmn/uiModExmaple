import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { RecordDetail } from "~/components/sales/record-detail"
import salesJson from "~/data/sales.json"
import type { SalesRecord } from "~/types/sales"

const SALES_RECORDS = salesJson as SalesRecord[]

export function generateStaticParams() {
  return SALES_RECORDS.map((record) => ({
    recordId: record.id,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ recordId: string }>
}): Promise<Metadata> {
  const { recordId } = await params
  const record = SALES_RECORDS.find((item) => item.id === recordId)
  if (!record) {
    return {
      title: "Record not found • Sales Dashboard",
    }
  }
  return {
    title: `${record.opportunityName} • Sales Dashboard`,
    description: `Detailed sales view for ${record.opportunityName}.`,
  }
}

export default async function SalesRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>
}) {
  const { recordId } = await params
  const record = SALES_RECORDS.find((item) => item.id === recordId)

  if (!record) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-background/60 pb-16">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <RecordDetail record={record} />
      </div>
    </main>
  )
}

