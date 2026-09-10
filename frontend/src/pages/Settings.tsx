import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertCircle, CalendarCheck2, CheckCircle2, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { PageSpinner } from "@/components/ui/Spinner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useGoogleIntegrationMutations, useGoogleStatus } from "@/hooks/useGoogleIntegration"
import { formatDate } from "@/lib/format"
import type { GoogleSyncResult } from "@/lib/types"

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: status, isLoading } = useGoogleStatus()
  const { connect, disconnect, sync } = useGoogleIntegrationMutations()

  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [syncResult, setSyncResult] = useState<GoogleSyncResult | null>(null)

  // After the OAuth round-trip, the backend redirects back here with
  // ?google=connected or ?google=error - surface that once, then drop it from
  // the URL so a refresh doesn't re-show a stale banner.
  const redirectStatus = searchParams.get("google")
  useEffect(() => {
    if (redirectStatus) {
      const next = new URLSearchParams(searchParams)
      next.delete("google")
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDisconnect() {
    await disconnect.mutateAsync()
    setConfirmDisconnect(false)
  }

  async function handleSync() {
    setSyncResult(null)
    const result = await sync.mutateAsync()
    setSyncResult(result)
  }

  return (
    <>
      <PageHeader title="Settings" description="Connections and integrations." />

      {redirectStatus === "connected" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--status-good)]/30 bg-[var(--status-good)]/10 px-4 py-3 text-sm text-[var(--status-good-text)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Google Calendar connected.
        </div>
      )}
      {redirectStatus === "error" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--status-critical)]/30 bg-[var(--status-critical)]/10 px-4 py-3 text-sm text-[var(--status-critical)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Couldn't connect Google Calendar. Try again, or check the backend log if it keeps failing.
        </div>
      )}

      <Card>
        <CardHeader
          title="Google Calendar"
          subtitle="Push subscription and plan due-dates to your calendar as reminders."
        />
        <div className="px-5 pb-5 pt-4">
          {isLoading ? (
            <PageSpinner />
          ) : status?.connected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge tone="good">Connected</Badge>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {status.google_email ?? "Google account"}
                  </span>
                  {status.connected_at && (
                    <span className="text-xs text-[var(--text-muted)]">
                      since {formatDate(status.connected_at)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    icon={<RefreshCw className="h-4 w-4" />}
                    onClick={handleSync}
                    disabled={sync.isPending}
                  >
                    {sync.isPending ? "Syncing…" : "Sync now"}
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDisconnect(true)}>
                    Disconnect
                  </Button>
                </div>
              </div>

              {syncResult && (
                <div className="mt-4 rounded-lg bg-[var(--surface-sunken)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  Synced {syncResult.subscriptions_synced} subscription
                  {syncResult.subscriptions_synced === 1 ? "" : "s"} and {syncResult.plans_synced} plan
                  {syncResult.plans_synced === 1 ? "" : "s"}.
                  {syncResult.errors.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-[var(--status-critical)]">
                      {syncResult.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <p className="mt-4 text-xs text-[var(--text-muted)]">
                New and edited subscriptions and plans sync automatically. Use "Sync now" to push
                anything created before you connected, or to retry after a hiccup.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <CalendarCheck2 className="h-4 w-4" />
                <span className="text-sm">Not connected</span>
              </div>
              <Button variant="primary" onClick={() => connect.mutate()} disabled={connect.isPending}>
                {connect.isPending ? "Redirecting…" : "Connect Google Calendar"}
              </Button>
              {connect.isError && (
                <p className="text-xs text-[var(--status-critical)]">
                  Couldn't start the connection. Google Calendar may not be configured on this server yet.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Google Calendar?"
        description="Future changes to subscriptions and plans will stop syncing. Events already on your calendar are left as-is."
        confirmLabel="Disconnect"
        busy={disconnect.isPending}
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </>
  )
}
