import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

export type SortDir = "asc" | "desc"

export interface ColumnDef<TData> {
  key: string
  header: string
  /** If false, column header is not clickable for sorting. Defaults to true. */
  sortable?: boolean
  /** Custom cell renderer. Receives the row and its index. */
  cell?: (row: TData, index: number) => React.ReactNode
  /** CSS class applied to both th and td */
  className?: string
  /** Label shown in mobile card view. Defaults to `header`. */
  mobileLabel?: string
  /** If true, this column is treated as action buttons and rendered at the bottom of mobile cards. */
  isAction?: boolean
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  /** Callback when a sortable column header is clicked */
  onSort?: (key: string, dir: SortDir) => void
  sortKey?: string
  sortDir?: SortDir
  page?: number
  pageSize?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  /** Render prop for per-row action buttons */
  actions?: (row: TData, index: number) => React.ReactNode
  /** Slot rendered above the table (search/filter bar) */
  children?: React.ReactNode
  className?: string
  /** Message shown when data is empty */
  emptyMessage?: string
}

function SortIcon({ active, dir }: { active: boolean; dir?: SortDir }) {
  if (!active) return <ChevronsUpDown className="ml-1 inline-block h-3.5 w-3.5 text-muted-foreground/50" />
  if (dir === "asc") return <ChevronUp className="ml-1 inline-block h-3.5 w-3.5 text-foreground" />
  return <ChevronDown className="ml-1 inline-block h-3.5 w-3.5 text-foreground" />
}

export function DataTable<TData>({
  columns,
  data,
  onSort,
  sortKey,
  sortDir,
  page = 1,
  pageSize = 20,
  totalCount,
  onPageChange,
  actions,
  children,
  className,
  emptyMessage = "Sem dados para mostrar.",
}: DataTableProps<TData>) {
  const total = totalCount ?? data.length
  const pageCount = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  function handleHeaderClick(col: ColumnDef<TData>) {
    if (!col.sortable && col.sortable !== undefined) return
    if (!onSort) return
    const nextDir: SortDir =
      sortKey === col.key && sortDir === "asc" ? "desc" : "asc"
    onSort(col.key, nextDir)
  }

  const dataCols = columns.filter((c) => !c.isAction)
  const actionCol = columns.find((c) => c.isAction)

  function renderCellValue(col: ColumnDef<TData>, row: TData, i: number): React.ReactNode {
    if (col.cell) return col.cell(row, i)
    const val = (row as Record<string, unknown>)[col.key]
    return val !== undefined && val !== null ? String(val) : "—"
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Filter/search slot */}
      {children && <div>{children}</div>}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => {
                const isSortable = col.sortable !== false && !!onSort
                const isActive = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left font-medium text-muted-foreground select-none",
                      isSortable && "cursor-pointer hover:text-foreground",
                      col.className,
                    )}
                    onClick={isSortable ? () => handleHeaderClick(col) : undefined}
                  >
                    {col.header}
                    {isSortable && <SortIcon active={isActive} dir={isActive ? sortDir : undefined} />}
                  </th>
                )
              })}
              {actions && !actionCol && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-px whitespace-nowrap">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions && !actionCol ? 1 : 0)}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3", col.className)}
                    >
                      {col.isAction
                        ? (actions ? actions(row, i) : renderCellValue(col, row, i))
                        : renderCellValue(col, row, i)}
                    </td>
                  ))}
                  {actions && !actionCol && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {actions(row, i)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card stack */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          data.map((row, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 text-sm"
            >
              {dataCols.map((col) => {
                const label = col.mobileLabel ?? col.header
                const value = renderCellValue(col, row, i)
                return (
                  <div key={col.key} className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="text-right font-medium">{value}</span>
                  </div>
                )
              })}
              {/* Action column or actions prop */}
              {(actionCol || actions) && (
                <div className="mt-2 flex gap-2 justify-end border-t border-border pt-2">
                  {actionCol
                    ? renderCellValue(actionCol, row, i)
                    : actions!(row, i)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && onPageChange && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            {start}–{end} de {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
