import { useState } from "react"
import { CalendarCheck2, CalendarClock, ClipboardList, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageSpinner } from "@/components/ui/Spinner"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { FieldLabel, FormRow, Input, Textarea } from "@/components/ui/Field"
import { usePlanMutations, usePlans } from "@/hooks/usePlans"
import { formatDate } from "@/lib/format"
import type { Plan, PlanInput } from "@/lib/types"

const emptyForm: PlanInput = { title: "", description: "", linked_date: null }

export default function Plans() {
  const { data, isLoading } = usePlans()
  const { create, update, remove } = usePlanMutations()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<PlanInput>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(p: Plan) {
    setEditing(p)
    setForm({
      title: p.title,
      description: p.description ?? "",
      linked_date: p.linked_date ? p.linked_date.slice(0, 10) : null,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      description: form.description || null,
      linked_date: form.linked_date || null,
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
        title="Plans"
        description="Freeform notes and things on the calendar."
        action={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add plan
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={<ClipboardList />}
            title="No plans yet"
            description="Jot down anything you want to track or revisit."
            action={
              <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add plan
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                  {p.title}
                  {p.calendar_event_id && (
                    <CalendarCheck2
                      className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
                      aria-label="Synced to Google Calendar"
                    />
                  )}
                </p>
                <button
                  aria-label="Delete plan"
                  onClick={() => setDeleteTarget(p)}
                  className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--status-critical)]/10 hover:text-[var(--status-critical)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {p.description && (
                <p className="mt-2 line-clamp-3 text-sm text-[var(--text-secondary)]">{p.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                {p.linked_date ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatDate(p.linked_date)}
                  </span>
                ) : (
                  <span />
                )}
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit plan" : "Add plan"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.title}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <FormRow>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormRow>
        <FormRow className="mb-0">
          <FieldLabel htmlFor="linked_date">Linked date</FieldLabel>
          <Input
            id="linked_date"
            type="date"
            value={form.linked_date ?? ""}
            onChange={(e) => setForm({ ...form, linked_date: e.target.value || null })}
          />
        </FormRow>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete plan?"
        description={deleteTarget ? `This will permanently remove "${deleteTarget.title}".` : undefined}
        busy={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
