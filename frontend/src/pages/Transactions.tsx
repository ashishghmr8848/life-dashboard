import { useMemo, useState } from "react"
import { Plus, Search, Trash2, Wallet } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { FieldLabel, FormRow, Input, Select } from "@/components/ui/Field"
import { useTransactions, useTransactionMutations } from "@/hooks/useTransactions"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { formatCurrency, formatDate, titleCase } from "@/lib/format"
import type { Transaction, TransactionInput, TransactionType } from "@/lib/types"

const emptyForm: TransactionInput = {
  amount: 0,
  type: "debit",
  category: "",
  note: "",
  occurred_on: new Date().toISOString().slice(0, 10),
  is_subscription_charge: false,
  subscription_id: null,
}

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
  const subs = useSubscriptions()
  const { create, update, remove } = useTransactionMutations()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState<TransactionInput>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const rows = (data ?? []).filter((t) => typeFilter === "all" || t.type === typeFilter)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    setForm({
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      note: t.note ?? "",
      occurred_on: t.occurred_on,
      is_subscription_charge: t.is_subscription_charge,
      subscription_id: t.subscription_id,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    const payload: TransactionInput = {
      ...form,
      amount: Number(form.amount),
      note: form.note || null,
      subscription_id: form.subscription_id || null,
    }
    if (editing) {
      await update.mutateAsync({ id: editing.id, payload })
    } else {
      await create.mutateAsync(payload)
    }
    setModalOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await remove.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const saving = create.isPending || update.isPending

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every debit and credit, tagged by category."
        action={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add transaction
          </Button>
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
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
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
            description="Try widening your filters, or add a new transaction."
            action={
              <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add transaction
              </Button>
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
                      <Badge tone={t.type === "debit" ? "critical" : "good"}>{t.type}</Badge>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit transaction" : "Add transaction"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.category || !form.amount}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <FormRow>
          <FieldLabel htmlFor="amount">Amount</FieldLabel>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="type">Type</FieldLabel>
          <Select
            id="type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
          >
            <option value="debit">Debit (money out)</option>
            <option value="credit">Credit (money in)</option>
          </Select>
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <Input
            id="category"
            placeholder="groceries, remittance, subscription…"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="occurred_on">Date</FieldLabel>
          <Input
            id="occurred_on"
            type="date"
            value={form.occurred_on}
            onChange={(e) => setForm({ ...form, occurred_on: e.target.value })}
          />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="note">Note</FieldLabel>
          <Input
            id="note"
            placeholder="Optional"
            value={form.note ?? ""}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </FormRow>
        {!!subs.data?.length && (
          <FormRow className="mb-0">
            <FieldLabel htmlFor="subscription">Linked subscription</FieldLabel>
            <Select
              id="subscription"
              value={form.subscription_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  subscription_id: e.target.value || null,
                  is_subscription_charge: !!e.target.value,
                })
              }
            >
              <option value="">None</option>
              {subs.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormRow>
        )}
      </Modal>

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
