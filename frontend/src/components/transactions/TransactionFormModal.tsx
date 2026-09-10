import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { FieldLabel, FormRow, Input, Select } from "@/components/ui/Field"
import { useTransactionMutations } from "@/hooks/useTransactions"
import { useSubscriptions } from "@/hooks/useSubscriptions"
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

function toFormState(t: Transaction): TransactionInput {
  return {
    amount: Number(t.amount),
    type: t.type,
    category: t.category,
    note: t.note ?? "",
    occurred_on: t.occurred_on,
    is_subscription_charge: t.is_subscription_charge,
    subscription_id: t.subscription_id,
  }
}

interface TransactionFormModalProps {
  open: boolean
  onClose: () => void
  editing?: Transaction | null
  onSaved?: () => void
}

export function TransactionFormModal({ open, onClose, editing = null, onSaved }: TransactionFormModalProps) {
  const subs = useSubscriptions()
  const { create, update } = useTransactionMutations()
  const [form, setForm] = useState<TransactionInput>(editing ? toFormState(editing) : emptyForm)

  // Reset the form on the closed->open transition (covers both "edit a different
  // record" and "reopen for a fresh add") without an effect - see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setForm(editing ? toFormState(editing) : emptyForm)
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
    onSaved?.()
    onClose()
  }

  const saving = create.isPending || update.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit transaction" : "Add transaction"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
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
  )
}
