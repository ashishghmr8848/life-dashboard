import { useState } from "react"
import { Plus, Target, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Meter } from "@/components/ui/Meter"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { FieldLabel, FormRow, Input } from "@/components/ui/Field"
import { useGoalMutations, useGoals } from "@/hooks/useGoals"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Goal, GoalInput } from "@/lib/types"

const emptyForm: GoalInput = {
  name: "",
  target_amount: 0,
  current_amount: 0,
  target_date: null,
}

export default function Goals() {
  const { data, isLoading } = useGoals()
  const { create, update, remove } = useGoalMutations()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalInput>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(g: Goal) {
    setEditing(g)
    setForm({
      name: g.name,
      target_amount: Number(g.target_amount),
      current_amount: Number(g.current_amount),
      target_date: g.target_date,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount),
      target_date: form.target_date || null,
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
        title="Goals"
        description="Savings you're working toward."
        action={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add goal
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={<Target />}
            title="No goals yet"
            description="Set a target and track your progress toward it."
            action={
              <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add goal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((g) => {
            const target = Number(g.target_amount)
            const current = Number(g.current_amount)
            const pct = target > 0 ? (current / target) * 100 : 0
            const complete = pct >= 100
            return (
              <Card key={g.id} className="p-5">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-[var(--text-primary)]">{g.name}</p>
                  {complete && <Badge tone="good">Reached</Badge>}
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatCurrency(current)}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / {formatCurrency(target)}</span>
                </p>
                <Meter value={pct} tone={complete ? "good" : "accent"} className="mt-3" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">
                    {g.target_date ? `Target: ${formatDate(g.target_date)}` : "No target date"}
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(g)}>
                      Edit
                    </Button>
                    <button
                      aria-label="Delete goal"
                      onClick={() => setDeleteTarget(g)}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--status-critical)]/10 hover:text-[var(--status-critical)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit goal" : "Add goal"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.name || !form.target_amount}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <FormRow>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            placeholder="Emergency fund, Trip to Nepal…"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="target_amount">Target amount</FieldLabel>
          <Input
            id="target_amount"
            type="number"
            step="0.01"
            min="0"
            value={form.target_amount || ""}
            onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })}
          />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="current_amount">Current amount</FieldLabel>
          <Input
            id="current_amount"
            type="number"
            step="0.01"
            min="0"
            value={form.current_amount ?? 0}
            onChange={(e) => setForm({ ...form, current_amount: Number(e.target.value) })}
          />
        </FormRow>
        <FormRow className="mb-0">
          <FieldLabel htmlFor="target_date">Target date</FieldLabel>
          <Input
            id="target_date"
            type="date"
            value={form.target_date ?? ""}
            onChange={(e) => setForm({ ...form, target_date: e.target.value || null })}
          />
        </FormRow>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete goal?"
        description={deleteTarget ? `This will permanently remove "${deleteTarget.name}".` : undefined}
        busy={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
