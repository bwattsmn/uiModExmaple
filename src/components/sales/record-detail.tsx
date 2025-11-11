'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft,
  CopyPlus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash,
  X,
} from "lucide-react"

import { SALES_FIELD_INDEX, SALES_FIELD_META } from "~/data/sales-fields"
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "~/lib/formatters"
import type { SalesFieldKey, SalesRecord } from "~/types/sales"
import {
  useSelectedView,
  useViewActions,
  useViewCatalog,
  useViewUserId,
} from "~/stores/useBearStore"
import type {
  SectionFieldConfig,
  ViewSection,
  ViewVisibility,
} from "~/stores/useBearStore"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Separator } from "~/components/ui/separator"

type RecordDetailProps = {
  record: SalesRecord
}

type SectionDragData = { type: "section"; sectionId: string }
type FieldDragData = {
  type: "field"
  sectionId: string
  fieldId: string
}
type ColumnDragData = {
  type: "column"
  sectionId: string
  column: number
}

const MIN_SECTION_COLUMNS = 1
const MAX_SECTION_COLUMNS = 4

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const normalizeFields = (
  fields: SectionFieldConfig[],
  columns: number,
): SectionFieldConfig[] => {
  const columnCount = Math.max(columns, MIN_SECTION_COLUMNS)
  return fields.map((field, index) => ({
    ...field,
    order: index,
    column: clampNumber(field.column, 0, columnCount - 1),
    span: clampNumber(field.span, 1, columnCount),
  }))
}

const cloneSections = (sections: ViewSection[]): ViewSection[] =>
  sections.map((section) => ({
    ...section,
    columns: section.columns,
    fields: section.fields.map((field) => ({ ...field })),
  }))

const isSectionDragData = (value: unknown): value is SectionDragData =>
  typeof value === "object" &&
  value !== null &&
  (value as { type?: unknown }).type === "section" &&
  typeof (value as { sectionId?: unknown }).sectionId === "string"

const isFieldDragData = (value: unknown): value is FieldDragData =>
  typeof value === "object" &&
  value !== null &&
  (value as { type?: unknown }).type === "field" &&
  typeof (value as { sectionId?: unknown }).sectionId === "string" &&
  typeof (value as { fieldId?: unknown }).fieldId === "string"

const isColumnDragData = (value: unknown): value is ColumnDragData =>
  typeof value === "object" &&
  value !== null &&
  (value as { type?: unknown }).type === "column" &&
  typeof (value as { sectionId?: unknown }).sectionId === "string" &&
  typeof (value as { column?: unknown }).column === "number"

const toFieldValue = (record: SalesRecord, fieldKey: SalesFieldKey): string => {
  const meta = SALES_FIELD_INDEX.get(fieldKey)
  if (!meta) return String(record[fieldKey])
  const raw = record[fieldKey]
  switch (meta.format) {
    case "currency":
      return formatCurrency(Number(raw), record.currency)
    case "number":
      return formatNumber(Number(raw))
    case "percent":
      return formatPercent(Number(raw))
    case "date":
      return formatDate(String(raw))
    default:
      return String(raw)
  }
}

const ColumnDropZone = ({
  sectionId,
  columnIndex,
  columns,
  isEditing,
}: {
  sectionId: string
  columnIndex: number
  columns: number
  isEditing: boolean
}) => {
  const { setNodeRef } = useDroppable({
    id: `column:${sectionId}:${columnIndex}`,
    data: { type: "column", sectionId, column: columnIndex },
    disabled: !isEditing,
  })

  return (
    <div
      ref={setNodeRef}
      className="pointer-events-none absolute inset-y-0"
      style={{
        left: `${(columnIndex / columns) * 100}%`,
        width: `${100 / columns}%`,
      }}
    />
  )
}

const SectionContainer = ({
  section,
  children,
  onTitleChange,
  onRemove,
  onRequestAddField,
  onColumnsChange,
  availableFields,
  isEditing,
}: {
  section: ViewSection
  children: React.ReactNode
  onTitleChange: (sectionId: string, title: string) => void
  onRemove: (sectionId: string) => void
  onRequestAddField: (sectionId: string, fieldKey: SalesFieldKey) => void
  onColumnsChange: (sectionId: string, columns: number) => void
  availableFields: SalesFieldKey[]
  isEditing: boolean
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: "section", sectionId: section.id },
    disabled: !isEditing,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-card/80 shadow-sm transition-shadow ${isDragging ? "ring-2 ring-primary/40" : ""}`}
    >
      <CardHeader className="flex flex-col gap-4 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            {isEditing ? (
              <>
                <button
                  {...listeners}
                  {...attributes}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-muted/40 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Drag section"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <Input
                  value={section.title}
                  onChange={(event) => onTitleChange(section.id, event.target.value)}
                  className="max-w-sm border-transparent bg-transparent px-0 text-lg font-semibold tracking-tight focus-visible:border-muted focus-visible:bg-background"
                />
              </>
            ) : (
              <div className="text-lg font-semibold tracking-tight text-foreground">
                {section.title}
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Columns</span>
                <Select
                  value={String(section.columns)}
                  onValueChange={(value) =>
                    onColumnsChange(section.id, Number(value))
                  }
                >
                  <SelectTrigger className="h-8 w-[88px]">
                    <SelectValue placeholder="Columns" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: MAX_SECTION_COLUMNS },
                      (_, index) => index + 1,
                    ).map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={availableFields.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    Add Field
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Available fields</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup className="max-h-64 overflow-auto">
                    {availableFields.length ? (
                      availableFields.map((fieldKey) => {
                        const meta = SALES_FIELD_INDEX.get(fieldKey)
                        if (!meta) return null
                        return (
                          <DropdownMenuItem
                            key={fieldKey}
                            onSelect={() => onRequestAddField(section.id, fieldKey)}
                          >
                            {meta.label}
                          </DropdownMenuItem>
                        )
                      })
                    ) : (
                      <DropdownMenuItem disabled>No fields to add</DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove section"
                onClick={() => onRemove(section.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {section.columns} {section.columns === 1 ? "column" : "columns"}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

const SortableFieldRow = ({
  sectionId,
  field,
  record,
  columns,
  onRemoveField,
  onSpanChange,
  isEditing,
}: {
  sectionId: string
  field: SectionFieldConfig
  record: SalesRecord
  columns: number
  onRemoveField: (sectionId: string, fieldId: string) => void
  onSpanChange: (sectionId: string, fieldId: string, span: number) => void
  isEditing: boolean
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { type: "field", sectionId, fieldId: field.id },
    disabled: !isEditing,
  })

  const meta = SALES_FIELD_INDEX.get(field.fieldKey)

  if (!meta) return null

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `${field.column + 1} / span ${Math.min(field.span, columns)}`,
  }

  const displayValue = toFieldValue(record, field.fieldKey)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border/60 bg-background/50 p-4 transition-colors ${isDragging ? "ring-2 ring-primary/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{meta.label}</p>
          {isEditing ? (
            <p className="text-xs text-muted-foreground">
              Spans {field.span} {field.span === 1 ? "column" : "columns"}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground break-words">
            {displayValue}
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Select
              value={String(field.span)}
              onValueChange={(value) =>
                onSpanChange(sectionId, field.id, Number(value))
              }
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: columns }, (_, index) => index + 1).map(
                  (value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <button
              {...listeners}
              {...attributes}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Drag field"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove field"
              onClick={() => onRemoveField(sectionId, field.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function RecordDetail({ record }: RecordDetailProps) {
  const { publicViews, privateViews, selectedViewId } = useViewCatalog()
  const selectedView = useSelectedView()
  const { selectView, createView, updateView, deleteView, resetViews } =
    useViewActions()
  const userId = useViewUserId()

  const [sections, setSections] = useState<ViewSection[]>(
    cloneSections(selectedView.sections),
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState(selectedView.name)
  const [saveVisibility, setSaveVisibility] =
    useState<ViewVisibility>("private")
  const [isEditing, setIsEditing] = useState(false)
  const [pendingAddField, setPendingAddField] = useState<{
    sectionId: string
    fieldKey: SalesFieldKey
  } | null>(null)
  const [pendingAddColumn, setPendingAddColumn] = useState(0)
  const [pendingAddSpan, setPendingAddSpan] = useState(1)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setSections(cloneSections(selectedView.sections))
    sectionRefs.current = {}
    setIsDirty(false)
    setIsEditing(false)
    setSaveName(selectedView.name)
    setSaveVisibility(
      selectedView.ownerId === userId ? selectedView.visibility : "private",
    )
  }, [selectedView, userId])

  const assignedFieldKeys = useMemo(() => {
    const assigned = new Set<SalesFieldKey>()
    sections.forEach((section) => {
      section.fields.forEach((field) => assigned.add(field.fieldKey))
    })
    return assigned
  }, [sections])

  const availableFields = useMemo(
    () =>
      SALES_FIELD_META.filter((field) => !assignedFieldKeys.has(field.key)).map(
        (field) => field.key,
      ),
    [assignedFieldKeys],
  )

  const isOwner = selectedView.ownerId === userId
  const isDefaultView = selectedView.ownerId === "system"

  const handleToggleEditing = () => {
    setIsEditing((prev) => {
      if (prev) {
        setSections(cloneSections(selectedView.sections))
        sectionRefs.current = {}
        setIsDirty(false)
        setIsSaveDialogOpen(false)
      }
      return !prev
    })
  }

  const handleSectionTitleChange = (sectionId: string, title: string) => {
    if (!isEditing) return
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
    )
    setIsDirty(true)
  }

  const handleAddSection = () => {
    if (!isEditing) return
    const newSection: ViewSection = {
      id: `section-${crypto.randomUUID()}`,
      title: `New Section ${sections.length + 1}`,
      columns: 2,
      fields: [],
    }
    setSections((prev) => [...prev, newSection])
    setIsDirty(true)
  }

  const handleRemoveSection = (sectionId: string) => {
    if (!isEditing) return
    setSections((prev) => prev.filter((section) => section.id !== sectionId))
    delete sectionRefs.current[sectionId]
    setIsDirty(true)
  }

  const handleAddField = (
    sectionId: string,
    fieldKey: SalesFieldKey,
    column: number,
    span: number,
  ) => {
    if (!isEditing) return
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section
        if (section.fields.some((field) => field.fieldKey === fieldKey)) {
          return section
        }
        const clampedColumn = clampNumber(column, 0, section.columns - 1)
        const clampedSpan = clampNumber(span, 1, section.columns)
        const newField: SectionFieldConfig = {
          id: crypto.randomUUID(),
          fieldKey,
          column: clampedColumn,
          span: clampedSpan,
          order: section.fields.length,
        }
        const fields = [...section.fields, newField]
        return {
          ...section,
          fields: normalizeFields(fields, section.columns),
        }
      }),
    )
    setIsDirty(true)
  }

  const handleRemoveField = (sectionId: string, fieldId: string) => {
    if (!isEditing) return
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section
        const fields = section.fields.filter((field) => field.id !== fieldId)
        return {
          ...section,
          fields: normalizeFields(fields, section.columns),
        }
      }),
    )
    setIsDirty(true)
  }

  const handleUpdateFieldSpan = (
    sectionId: string,
    fieldId: string,
    span: number,
  ) => {
    if (!isEditing) return
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section
        const nextSpan = clampNumber(span, 1, section.columns)
        const fields = section.fields.map((field) =>
          field.id === fieldId
            ? { ...field, span: nextSpan }
            : field,
        )
        return {
          ...section,
          fields: normalizeFields(fields, section.columns),
        }
      }),
    )
    setIsDirty(true)
  }

  const handleUpdateSectionColumns = (sectionId: string, columns: number) => {
    if (!isEditing) return
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section
        const nextColumns = clampNumber(
          columns,
          MIN_SECTION_COLUMNS,
          MAX_SECTION_COLUMNS,
        )
        return {
          ...section,
          columns: nextColumns,
          fields: normalizeFields(section.fields, nextColumns),
        }
      }),
    )
    setIsDirty(true)
  }

  const handleResetLayout = () => {
    if (!isEditing) return
    setSections(cloneSections(selectedView.sections))
    sectionRefs.current = {}
    setIsDirty(false)
  }

  const handleRequestAddField = (
    sectionId: string,
    fieldKey: SalesFieldKey,
  ) => {
    if (!isEditing) return
    const section = sections.find((sectionItem) => sectionItem.id === sectionId)
    if (!section) return
    setPendingAddColumn(0)
    setPendingAddSpan(1)
    setPendingAddField({ sectionId, fieldKey })
  }

  const handleConfirmAddField = () => {
    if (!pendingAddField) return
    const section = sections.find(
      (sectionItem) => sectionItem.id === pendingAddField.sectionId,
    )
    if (!section) {
      setPendingAddField(null)
      return
    }
    handleAddField(
      pendingAddField.sectionId,
      pendingAddField.fieldKey,
      pendingAddColumn,
      pendingAddSpan,
    )
    setPendingAddField(null)
  }

  const handleSaveLayout = () => {
    if (!isEditing) return
    if (isOwner && !isDefaultView) {
      updateView(selectedView.id, { sections })
      setIsDirty(false)
      return
    }
    setIsSaveDialogOpen(true)
    setSaveName(`${selectedView.name} Copy`)
    setSaveVisibility("private")
  }

  const handleSaveAs = () => {
    if (!isEditing) return
    setIsSaveDialogOpen(true)
    setSaveName(`${selectedView.name} Copy`)
    setSaveVisibility("private")
  }

  const handleDeleteView = () => {
    if (!isEditing) return
    if (!isOwner || isDefaultView) return
    const confirmDelete = window.confirm(
      "Delete this view? This cannot be undone.",
    )
    if (!confirmDelete) return
    deleteView(selectedView.id)
  }

  const handleResetAllViews = () => {
    if (!isEditing) return
    const confirmReset = window.confirm(
      "Reset views to default? All custom views will be removed.",
    )
    if (!confirmReset) return
    resetViews()
    setPendingAddField(null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (isSectionDragData(activeData) && isSectionDragData(overData)) {
      const oldIndex = sections.findIndex(
        (section) => section.id === activeData.sectionId,
      )
      const newIndex = sections.findIndex(
        (section) => section.id === overData.sectionId,
      )
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
      setSections((prev) => arrayMove(prev, oldIndex, newIndex))
      setIsDirty(true)
      return
    }

    if (!isFieldDragData(activeData)) return

    setSections((prev) => {
      const next = cloneSections(prev)
      const sourceSectionIndex = next.findIndex(
        (section) => section.id === activeData.sectionId,
      )
      if (sourceSectionIndex === -1) return prev
      const sourceSection = next[sourceSectionIndex]
      if (!sourceSection) return prev
      const fieldIndex = sourceSection.fields.findIndex(
        (field) => field.id === activeData.fieldId,
      )
      if (fieldIndex === -1) return prev
      const [movingField] = sourceSection.fields.splice(fieldIndex, 1)
      if (!movingField) return prev

      let targetSectionId = sourceSection.id
      if (isFieldDragData(overData)) {
        targetSectionId = overData.sectionId
      } else if (isColumnDragData(overData)) {
        targetSectionId = overData.sectionId
      }

      const targetSectionIndex = next.findIndex(
        (section) => section.id === targetSectionId,
      )
      if (targetSectionIndex === -1) {
        sourceSection.fields.splice(fieldIndex, 0, movingField)
        return prev
      }

      const targetSection = next[targetSectionIndex]
      if (!targetSection) {
        sourceSection.fields.splice(fieldIndex, 0, movingField)
        return prev
      }
      let insertIndex = targetSection.fields.length

      if (isFieldDragData(overData) && overData.sectionId === targetSection.id) {
        const targetFieldIndex = targetSection.fields.findIndex(
          (field) => field.id === overData.fieldId,
        )
        if (targetFieldIndex !== -1) {
          insertIndex = targetFieldIndex
          if (
            targetSection.id === sourceSection.id &&
            fieldIndex < targetFieldIndex
          ) {
            insertIndex -= 1
          }
        }
      }

      const sectionNode = sectionRefs.current[targetSection.id]
      let targetColumn = clampNumber(
        movingField.column,
        0,
        targetSection.columns - 1,
      )

      if (isColumnDragData(overData) && overData.sectionId === targetSection.id) {
        targetColumn = clampNumber(
          overData.column,
          0,
          targetSection.columns - 1,
        )
      } else if (isFieldDragData(overData)) {
        const referenceField = targetSection.fields.find(
          (field) => field.id === overData.fieldId,
        )
        if (referenceField) {
          targetColumn = clampNumber(
            referenceField.column,
            0,
            targetSection.columns - 1,
          )
        }
      } else if (sectionNode && over.rect) {
        const sectionRect = sectionNode.getBoundingClientRect()
        const centerX = over.rect.left + over.rect.width / 2
        const relativeX = centerX - sectionRect.left
        const columnWidth = sectionRect.width / targetSection.columns
        if (columnWidth > 0) {
          targetColumn = clampNumber(
            Math.floor(relativeX / columnWidth),
            0,
            targetSection.columns - 1,
          )
        }
      }

      const updatedField: SectionFieldConfig = {
        ...movingField,
        column: targetColumn,
        span: clampNumber(movingField.span, 1, targetSection.columns),
      }

      targetSection.fields.splice(
        Math.max(0, Math.min(insertIndex, targetSection.fields.length)),
        0,
        updatedField,
      )

      next[targetSectionIndex] = {
        ...targetSection,
        fields: normalizeFields(targetSection.fields, targetSection.columns),
      }

      if (targetSectionIndex !== sourceSectionIndex) {
        next[sourceSectionIndex] = {
          ...sourceSection,
          fields: normalizeFields(sourceSection.fields, sourceSection.columns),
        }
      }

      return next
    })

    setIsDirty(true)
  }

  const handleSaveDialogSubmit = () => {
    const newView = createView({
      name: saveName.trim() || "Untitled View",
      visibility: saveVisibility,
      sections,
    })
    setIsSaveDialogOpen(false)
    selectView(newView.id)
    setIsDirty(false)
  }

  const summaryFields: Array<{ label: string; value: string | number }> = [
    { label: "Opportunity", value: record.opportunityName },
    { label: "Account", value: record.accountName },
    { label: "Owner", value: record.accountOwner },
    {
      label: "Projected Close",
      value: formatDate(record.closeDate),
    },
    {
      label: "Total",
      value: formatCurrency(record.totalAmount, record.currency),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to table
            </Link>
            <span>•</span>
            <span>{record.recordNumber}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {record.opportunityName}
          </h1>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{record.dealStage}</Badge>
            <Badge
              variant={
                record.priority === "Urgent"
                  ? "destructive"
                  : record.priority === "High"
                    ? "secondary"
                    : "outline"
              }
            >
              {record.priority} Priority
            </Badge>
            <Badge variant="outline">
              {(record.probability * 100).toFixed(0)}% win chance
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={handleToggleEditing}
            className="gap-1"
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? "Done Editing" : "Edit Layout"}
          </Button>
          <Select value={selectedViewId} onValueChange={selectView}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Public views</SelectLabel>
                {publicViews.map((view) => (
                  <SelectItem key={view.id} value={view.id}>
                    {view.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <Separator className="my-1" />
              <SelectGroup>
                <SelectLabel>Your private views</SelectLabel>
                {privateViews.length ? (
                  privateViews.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__no-private" disabled>
                    No private views yet
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleAddSection}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
              <Button variant="outline" onClick={handleResetLayout} disabled={!isDirty}>
                Reset
              </Button>
              <Button onClick={handleSaveLayout} disabled={!isDirty} className="gap-1">
                <Save className="h-4 w-4" />
                Save Layout
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={handleSaveAs} className="gap-2">
                    <CopyPlus className="h-4 w-4" />
                    Save as New View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleResetAllViews}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset All Views
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    disabled={!isOwner || isDefaultView}
                    onSelect={handleDeleteView}
                  >
                    <Trash className="h-4 w-4" />
                    Delete View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </div>
      </div>

      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryFields.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border/50 bg-background/40 p-4"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-base font-medium text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={sections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {sections.map((section) => (
              <SectionContainer
                key={section.id}
                section={section}
                onTitleChange={handleSectionTitleChange}
                onRemove={handleRemoveSection}
                onRequestAddField={handleRequestAddField}
                onColumnsChange={handleUpdateSectionColumns}
                availableFields={availableFields}
                isEditing={isEditing}
              >
                <div className="relative">
                  {isEditing &&
                    Array.from({ length: section.columns }).map((_, column) => (
                      <ColumnDropZone
                        key={`drop-${section.id}-${column}`}
                        sectionId={section.id}
                        columnIndex={column}
                        columns={section.columns}
                        isEditing={isEditing}
                      />
                    ))}
                  <SortableContext
                    items={section.fields.map((field) => field.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div
                      ref={(node) => {
                        sectionRefs.current[section.id] = node
                      }}
                      className="grid gap-3"
                      style={{
                        gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`,
                        gridAutoFlow: "row dense",
                        alignItems: "start",
                      }}
                    >
                      {section.fields.map((field) => (
                        <SortableFieldRow
                          key={field.id}
                          sectionId={section.id}
                          field={field}
                          record={record}
                          columns={section.columns}
                          onRemoveField={handleRemoveField}
                          onSpanChange={handleUpdateFieldSpan}
                          isEditing={isEditing}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              </SectionContainer>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog
        open={pendingAddField !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAddField(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add field</DialogTitle>
            <DialogDescription>
              Choose where this field should appear within the section layout.
            </DialogDescription>
          </DialogHeader>
          {pendingAddField ? (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="add-field-section">Section</Label>
                  <Input
                    id="add-field-section"
                    value={
                      sections.find(
                        (section) => section.id === pendingAddField.sectionId,
                      )?.title ?? ""
                    }
                    readOnly
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="add-field-column">Column</Label>
                    <Select
                      value={String(pendingAddColumn + 1)}
                      onValueChange={(value) =>
                        setPendingAddColumn(Number(value) - 1)
                      }
                    >
                      <SelectTrigger id="add-field-column">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          {
                            length:
                              sections.find(
                                (section) =>
                                  section.id === pendingAddField.sectionId,
                              )?.columns ?? 1,
                          },
                          (_, index) => index + 1,
                        ).map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-field-span">Span</Label>
                    <Select
                      value={String(pendingAddSpan)}
                      onValueChange={(value) =>
                        setPendingAddSpan(Number(value))
                      }
                    >
                      <SelectTrigger id="add-field-span">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          {
                            length:
                              sections.find(
                                (section) =>
                                  section.id === pendingAddField.sectionId,
                              )?.columns ?? 1,
                          },
                          (_, index) => index + 1,
                        ).map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPendingAddField(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmAddField} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add field
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
            <DialogDescription>
              Store this layout for future use. Public views are visible to every
              user of this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="view-name">Name</Label>
              <Input
                id="view-name"
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                placeholder="Quarterly Review"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="view-visibility">Visibility</Label>
              <Select
                value={saveVisibility}
                onValueChange={(value: ViewVisibility) =>
                  setSaveVisibility(value)
                }
              >
                <SelectTrigger id="view-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDialogSubmit} className="gap-1">
              <Save className="h-4 w-4" />
              Save view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

