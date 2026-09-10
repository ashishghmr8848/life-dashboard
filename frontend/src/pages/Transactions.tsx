import { useMemo, useState } from "react"
import { ArrowUpRight, Plus, Search, Trash2, Wallet } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { FieldLabel, Input, Select } from "@/components/ui/Field"
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal"
import { useTransactions, useTransactionMutations } from "@/hooks/useTransactions"
import { formatCurrency, formatDate, titleCase, transactionTypeLabel } from "@/lib/format"
import type { Transaction, TransactionType } from "@/lib/types"

export default function Transactions() {
  const [category, setCategory] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filters = useMemo(
    () => ({
      category: category || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
    [category, startDate, endDate],
  )

  const { data, isLoading } = useTransactions(filters)
  const { remove } = useTransactionMutations()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [createType, setCreateType] = useState<TransactionType>("debit")
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const rows = (data ?? []).filter((t) => typeFilter === "all" || t.type === typeFilter)

  function openCreate(type: TransactionType) {
    setEditing(null)
    setCreateType(type)
    setModalOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await remove.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every expense and income, tagged by category."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowUpRight className="h-4 w-4" />}
              onClick={() => openCreate("credit")}
            >
              Add income
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => openCreate("debit")}>
              Add expense
            </Button>
          </div>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <FieldLabel>Category</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                placeholder="e.g. groceries"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-36">
            <FieldLabel>Type</FieldLabel>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransactionType | "all")}>
              <option value="all">All</option>
              <option value="debit">Expense</option>
              <option value="credit">Income</option>
            </Select>
          </div>
          <div className="w-40">
            <FieldLabel>From</FieldLabel>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="w-40">
            <FieldLabel>To</FieldLabel>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !rows.length ? (
          <EmptyState
            icon={<Wallet />}
            title="No transactions match"
            description="Try widening your filters, or add a new expense or income."
            action={
              <div className="flex items-center gap-2">
                <Button variant="secondary" icon={<ArrowUpRight className="h-4 w-4" />} onClick={() => openCreate("credit")}>
                  Add income
                </Button>
                <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => openCreate("debit")}>
                  Add expense
                </Button>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Note</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--surface-card-hover)]"
                    onClick={() => openEdit(t)}
                  >
                    <td className="px-5 py-3 text-[var(--text-secondary)] tabular-nums">
                      {formatDate(t.occurred_on)}
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                      {titleCase(t.category)}
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-[var(--text-muted)]">
                      {t.note || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={t.type === "debit" ? "critical" : "good"}>{transactionTypeLabel(t.type)}</Badge>
                    </td>
                    <td
                      className={
                        "px-5 py-3 text-right font-semibold tabular-nums " +
                        (t.type === "debit" ? "text-[var(--status-critical)]" : "text-[var(--status-good-text)]")
                      }
                    >
                      {t.type === "debit" ? "−" : "+"}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        aria-label="Delete transaction"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(t)
                        }}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--status-critical)]/10 hover:text-[var(--status-critical)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TransactionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        defaultType={createType}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete transaction?"
        description={
          deleteTarget
            ? `This will permanently remove "${titleCase(deleteTarget.category)}" (${formatCurrency(deleteTarget.amount)}).`
            : undefined
        }
        busy={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
