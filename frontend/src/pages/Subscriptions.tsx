import { useState } from "react"
import { Plus, Repeat, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { FieldLabel, FormRow, Input, Select } from "@/components/ui/Field"
import { useSubscriptionMutations, useSubscriptions } from "@/hooks/useSubscriptions"
import { daysUntil, formatCurrency, relativeDueLabel, titleCase } from "@/lib/format"
import type { BillingCycle, Subscription, SubscriptionInput } from "@/lib/types"

const emptyForm: SubscriptionInput = {
  name: "",
  amount: 0,
  billing_cycle: "monthly",
  next_due_date: new Date().toISOString().slice(0, 10),
  active: true,
}

export default function Subscriptions() {
  const [activeOnly, setActiveOnly] = useState(false)
  const { data, isLoading } = useSubscriptions(activeOnly)
  const { create, update, remove } = useSubscriptionMutations()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [form, setForm] = useState<SubscriptionInput>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(s: Subscription) {
    setEditing(s)
    setForm({
      name: s.name,
      amount: Number(s.amount),
      billing_cycle: s.billing_cycle,
      next_due_date: s.next_due_date,
      active: s.active,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    const payload = { ...form, amount: Number(form.amount) }
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
        title="Subscriptions"
        description="Recurring charges, tracked so nothing sneaks up on you."
        action={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add subscription
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
          />
          Active only
        </label>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={<Repeat />}
            title="No subscriptions yet"
            description="Add the recurring charges you want to keep an eye on."
            action={
              <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add subscription
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => {
            const days = daysUntil(s.next_due_date)
            const dueTone = !s.active ? "neutral" : days !== null && days < 0 ? "critical" : days !== null && days <= 3 ? "warning" : "neutral"
            return (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{s.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{titleCase(s.billing_cycle)}</p>
                  </div>
                  <Badge tone={s.active ? "accent" : "neutral"}>{s.active ? "Active" : "Paused"}</Badge>
                </div>
                <p className="mt-4 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatCurrency(s.amount)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge tone={dueTone} className="normal-case">
                    {relativeDueLabel(s.next_due_date)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                    <button
                      aria-label="Delete subscription"
                      onClick={() => setDeleteTarget(s)}
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
        title={editing ? "Edit subscription" : "Add subscription"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.name || !form.amount}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <FormRow>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            placeholder="Netflix, Spotify…"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormRow>
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
          <FieldLabel htmlFor="cycle">Billing cycle</FieldLabel>
          <Select
            id="cycle"
            value={form.billing_cycle}
            onChange={(e) => setForm({ ...form, billing_cycle: e.target.value as BillingCycle })}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="next_due">Next due date</FieldLabel>
          <Input
            id="next_due"
            type="date"
            value={form.next_due_date}
            onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
          />
        </FormRow>
        <FormRow className="mb-0">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
            />
            Active
          </label>
        </FormRow>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete subscription?"
        description={deleteTarget ? `This will permanently remove "${deleteTarget.name}".` : undefined}
        busy={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
