'use client'

import { useMemo } from "react"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

import { DEFAULT_VIEW_SECTIONS } from "~/data/sales-fields"
import type { SalesFieldKey } from "~/types/sales"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const MIN_COLUMNS = 1
const MAX_COLUMNS = 4
const DEFAULT_COLUMNS = 2

export type SectionFieldConfig = {
  id: string
  fieldKey: SalesFieldKey
  column: number
  span: number
  order: number
}

export type ViewSection = {
  id: string
  title: string
  columns: number
  fields: SectionFieldConfig[]
}

export type ViewVisibility = "public" | "private"

export type ViewDefinition = {
  id: string
  name: string
  visibility: ViewVisibility
  ownerId: string
  sections: ViewSection[]
  updatedAt: string
}

type BearStoreState = {
  userId: string
  views: ViewDefinition[]
  selectedViewId: string
  actions: {
    selectView: (viewId: string) => void
    createView: (input: {
      name: string
      visibility: ViewVisibility
      sections: ViewSection[]
    }) => ViewDefinition
    updateView: (
      viewId: string,
      updates: Partial<
        Omit<ViewDefinition, "id" | "ownerId" | "updatedAt">
      > & { sections?: ViewSection[] },
    ) => void
    deleteView: (viewId: string) => void
    upsertMany: (views: ViewDefinition[]) => void
    resetViews: () => void
  }
}

const ensureFieldId = (
  sectionId: string,
  fieldKey: SalesFieldKey,
  index: number,
  candidate?: unknown,
  suffix = "",
) => {
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate
  }
  return `${sectionId}-${fieldKey}-${index}${suffix}`
}

const normalizeSection = (input: unknown, fallbackIndex: number): ViewSection => {
  const raw = (input ?? {}) as Record<string, unknown>
  const id =
    typeof raw.id === "string" && raw.id.trim().length > 0
      ? raw.id
      : `section-${fallbackIndex}`
  const title =
    typeof raw.title === "string" && raw.title.trim().length > 0
      ? raw.title
      : `Section ${fallbackIndex + 1}`
  const columns = clamp(
    Number.isFinite(raw.columns) ? Math.floor(raw.columns as number) : DEFAULT_COLUMNS,
    MIN_COLUMNS,
    MAX_COLUMNS,
  )

  const rawFields =
    Array.isArray((raw as { fields?: unknown }).fields) && raw.fields
      ? (raw.fields as unknown[])
      : Array.isArray((raw as { fieldKeys?: unknown }).fieldKeys)
        ? ((raw as { fieldKeys: SalesFieldKey[] }).fieldKeys ?? []).map((key) => ({
            fieldKey: key,
          }))
        : []

  const seenIds = new Map<string, number>()
  const normalizedFields = rawFields
    .map((field, index): SectionFieldConfig | null => {
      if (field == null) return null
      if (typeof field === "string") {
        return {
          id: ensureFieldId(id, field as SalesFieldKey, index),
          fieldKey: field as SalesFieldKey,
          column: index % columns,
          span: 1,
          order: index,
        }
      }
      const obj = field as Record<string, unknown>
      const fieldKeyCandidate =
        typeof obj.fieldKey === "string"
          ? obj.fieldKey
          : typeof obj.key === "string"
            ? obj.key
            : null
      if (!fieldKeyCandidate) return null
      const fieldKey = fieldKeyCandidate as SalesFieldKey
      const column = clamp(
        Number.isFinite(obj.column) ? Math.floor(obj.column as number) : index % columns,
        0,
        columns - 1,
      )
      const span = clamp(
        Number.isFinite(obj.span) ? Math.floor(obj.span as number) : 1,
        1,
        columns,
      )
      const baseId = ensureFieldId(id, fieldKey, index, obj.id)
      const duplicateCount = seenIds.get(baseId) ?? 0
      seenIds.set(baseId, duplicateCount + 1)
      const uniqueId = duplicateCount === 0 ? baseId : ensureFieldId(id, fieldKey, index, obj.id, `-${duplicateCount}`)
      const order = Number.isFinite(obj.order) ? (obj.order as number) : index
      return {
        id: uniqueId,
        fieldKey,
        column,
        span,
        order,
      }
    })
    .filter((field): field is SectionFieldConfig => field !== null)
    .sort((a, b) => a.order - b.order)
    .map((field, order) => ({
      ...field,
      order,
      column: clamp(field.column, 0, columns - 1),
      span: clamp(field.span, 1, columns),
    }))

  return {
    id,
    title,
    columns,
    fields: normalizedFields,
  }
}

const normalizeSections = (sections: unknown[]): ViewSection[] =>
  sections.map((section, index) => normalizeSection(section, index))

const cloneSections = (sections: ViewSection[]): ViewSection[] =>
  sections.map((section) => ({
    ...section,
    fields: section.fields.map((field) => ({ ...field })),
  }))

const convertDefaultSection = (definition: (typeof DEFAULT_VIEW_SECTIONS)[number], index: number): ViewSection => {
  const columns = clamp(
    Number.isFinite(definition.columns) ? Math.floor(definition.columns ?? DEFAULT_COLUMNS) : DEFAULT_COLUMNS,
    MIN_COLUMNS,
    MAX_COLUMNS,
  )
  const fields = definition.fieldKeys.map((fieldKey, fieldIndex) => ({
    id: `${definition.id}-${fieldKey}-${fieldIndex}`,
    fieldKey,
    column: fieldIndex % columns,
    span: 1,
    order: fieldIndex,
  }))
  return normalizeSection(
    {
      id: definition.id,
      title: definition.title,
      columns,
      fields,
    },
    index,
  )
}

const DEFAULT_VIEW_ID = "view-default"
const USER_ID = "local-user"

const DEFAULT_VIEW: ViewDefinition = {
  id: DEFAULT_VIEW_ID,
  name: "Default Layout",
  visibility: "public",
  ownerId: "system",
  sections: cloneSections(
    DEFAULT_VIEW_SECTIONS.map((section, index) => convertDefaultSection(section, index)),
  ),
  updatedAt: new Date(0).toISOString(),
}

const createDefaultView = (): ViewDefinition => ({
  ...DEFAULT_VIEW,
  sections: cloneSections(DEFAULT_VIEW.sections),
})

export const useBearStore = create<BearStoreState>()(
  persist(
    (set, get) => ({
      userId: USER_ID,
      views: [createDefaultView()],
      selectedViewId: DEFAULT_VIEW_ID,
      actions: {
        selectView: (viewId) => {
          const existingViewIds = new Set(get().views.map((view) => view.id))
          set({
            selectedViewId: existingViewIds.has(viewId)
              ? viewId
              : DEFAULT_VIEW_ID,
          })
        },
        createView: ({ name, visibility, sections }) => {
          const normalizedSections = cloneSections(
            normalizeSections(sections ?? []),
          )
          const newView: ViewDefinition = {
            id: crypto.randomUUID(),
            name,
            visibility,
            ownerId: USER_ID,
            sections: normalizedSections,
            updatedAt: new Date().toISOString(),
          }
          set((state) => ({
            views: [
              ...state.views.filter((view) => view.id !== newView.id),
              newView,
            ],
            selectedViewId: newView.id,
          }))
          return newView
        },
        updateView: (viewId, updates) => {
          set((state) => {
            const nextViews = state.views.map((view) => {
              if (view.id !== viewId) return view
              const sections = updates.sections
                ? cloneSections(normalizeSections(updates.sections))
                : view.sections
              return {
                ...view,
                ...updates,
                sections,
                updatedAt: new Date().toISOString(),
              }
            })
            return { views: nextViews }
          })
        },
        deleteView: (viewId) => {
          if (viewId === DEFAULT_VIEW_ID) return
          set((state) => {
            const nextViews = state.views.filter((view) => view.id !== viewId)
            const currentSelected =
              state.selectedViewId === viewId
                ? DEFAULT_VIEW_ID
                : state.selectedViewId
            const ensuredDefaults =
              nextViews.find((view) => view.id === DEFAULT_VIEW_ID) != null
                ? nextViews
                : [DEFAULT_VIEW, ...nextViews]
            return {
              views: ensuredDefaults,
              selectedViewId: currentSelected,
            }
          })
        },
        upsertMany: (views) => {
          set((state) => {
            const existingById = new Map(state.views.map((view) => [view.id, view]))
            for (const view of views) {
              existingById.set(view.id, {
                ...view,
                sections: cloneSections(normalizeSections(view.sections ?? [])),
              })
            }
            if (!existingById.has(DEFAULT_VIEW_ID)) {
              existingById.set(DEFAULT_VIEW_ID, DEFAULT_VIEW)
            }
            return { views: Array.from(existingById.values()) }
          })
        },
        resetViews: () => {
          set({
            views: [createDefaultView()],
            selectedViewId: DEFAULT_VIEW_ID,
          })
        },
      },
    }),
    {
      name: "sales-view-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state: BearStoreState) => ({
        userId: state.userId,
        selectedViewId: state.selectedViewId,
        views: state.views,
      }),
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<BearStoreState> | undefined
        if (!typedState) return currentState
        const mergedViews: ViewDefinition[] = (typedState.views ?? []).map(
          (view, index) => ({
            ...view,
            sections: cloneSections(normalizeSections(view.sections ?? [])),
            updatedAt: view.updatedAt ?? new Date().toISOString(),
            id:
              typeof view.id === "string" && view.id.length > 0
                ? view.id
                : `legacy-view-${index}`,
            ownerId:
              typeof view.ownerId === "string" && view.ownerId.length > 0
                ? view.ownerId
                : USER_ID,
          }),
        )
        if (!mergedViews.some((view) => view.id === DEFAULT_VIEW_ID)) {
          mergedViews.unshift(createDefaultView())
        }
        return {
          ...currentState,
          userId: typedState.userId ?? currentState.userId,
          selectedViewId:
            typeof typedState.selectedViewId === "string"
              ? typedState.selectedViewId
              : currentState.selectedViewId,
          views: mergedViews.map((view) => ({
            ...view,
            sections: cloneSections(view.sections),
          })),
        }
      },
    },
  ),
)

export const useViewActions = () => useBearStore((state) => state.actions)

export const useSelectedView = () => {
  const selectedViewId = useBearStore((state) => state.selectedViewId)
  const views = useBearStore((state) => state.views)
  return views.find((view) => view.id === selectedViewId) ?? DEFAULT_VIEW
}

export const useViewCatalog = () => {
  const views = useBearStore((state) => state.views)
  const userId = useBearStore((state) => state.userId)
  const selectedViewId = useBearStore((state) => state.selectedViewId)
  return useMemo(() => {
    const publicViews = views.filter((view) => view.visibility === "public")
    const privateViews = views.filter(
      (view) => view.visibility === "private" && view.ownerId === userId,
    )
    return { publicViews, privateViews, selectedViewId }
  }, [views, userId, selectedViewId])
}

export const useViewUserId = () => useBearStore((state) => state.userId)

