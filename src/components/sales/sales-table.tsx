'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { formatCurrency, formatDate } from "~/lib/formatters"
import type { SalesRecord } from "~/types/sales"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

type SalesTableProps = {
  data: SalesRecord[]
}

const columns: ColumnDef<SalesRecord>[] = [
  {
    accessorKey: "recordNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Record #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground/90">
        {row.original.recordNumber}
      </span>
    ),
  },
  {
    accessorKey: "opportunityName",
    header: "Opportunity",
    cell: ({ row }) => (
      <div className="max-w-xs truncate">{row.original.opportunityName}</div>
    ),
  },
  {
    accessorKey: "accountName",
    header: "Account",
  },
  {
    accessorKey: "contactName",
    header: "Contact",
  },
  {
    accessorKey: "dealStage",
    header: "Stage",
    cell: ({ row }) => <Badge variant="outline">{row.original.dealStage}</Badge>,
  },
  {
    accessorKey: "closeDate",
    header: "Close Date",
    cell: ({ row }) => formatDate(row.original.closeDate),
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      formatCurrency(row.original.totalAmount, row.original.currency),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.priority === "Urgent"
            ? "destructive"
            : row.original.priority === "High"
              ? "secondary"
              : "outline"
        }
      >
        {row.original.priority}
      </Badge>
    ),
  },
]

export function SalesTable({ data }: SalesTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalAmount", desc: true },
  ])
  const [search, setSearch] = useState("")

  const filteredData = useMemo(() => {
    if (!search) return data
    const query = search.toLowerCase()
    return data.filter((record) =>
      [
        record.recordNumber,
        record.opportunityName,
        record.accountName,
        record.contactName,
        record.dealStage,
        record.priority,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [data, search])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          Sales Records
        </CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredData.length.toLocaleString("en-US")} of{" "}
            {data.length.toLocaleString("en-US")} records
          </p>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sales records..."
            className="w-full sm:w-64"
          />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/sales/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

