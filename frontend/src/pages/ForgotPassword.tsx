import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Wallet } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { FieldLabel, FormRow, Input } from "@/components/ui/Field"
import { useAuth } from "@/context/AuthContext"
import { authApi } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/apiError"

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  // Step 1: request a passcode. Step 2: enter it + a new password. Kept as
  // one page/component rather than two routes - there's no reason to leave
  // a history entry for "requested a code" the back button could return to.
  const [step, setStep] = useState<"request" | "reset">("request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await authApi.forgotPassword({ email })
      setInfo(result.detail)
      setStep("reset")
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't request a passcode. Try again."))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await resetPassword({ email, code, new_password: newPassword })
      navigate("/", { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid or expired passcode."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--surface-page)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
            <Wallet className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Life Dashboard</h1>
        </div>

        <Card className="p-6">
          {step === "request" ? (
            <>
              <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
                Reset your password
              </h2>
              <p className="mb-5 text-sm text-[var(--text-muted)]">
                Enter your account email and we'll send a 6-digit passcode to it.
              </p>
              <form onSubmit={handleRequestCode}>
                <FormRow className="mb-2">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormRow>
                {error && <p className="mb-4 text-xs text-[var(--status-critical)]">{error}</p>}
                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Send passcode"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
                Enter your passcode
              </h2>
              {info && <p className="mb-5 text-sm text-[var(--text-muted)]">{info}</p>}
              <form onSubmit={handleResetPassword}>
                <FormRow>
                  <FieldLabel htmlFor="code">6-digit passcode</FieldLabel>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </FormRow>
                <FormRow className="mb-2">
                  <FieldLabel htmlFor="new_password">New password</FieldLabel>
                  <Input
                    id="new_password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">At least 8 characters.</p>
                </FormRow>
                {error && <p className="mb-4 text-xs text-[var(--status-critical)]">{error}</p>}
                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={submitting}>
                  {submitting ? "Resetting…" : "Reset password"}
                </Button>
                <button
                  type="button"
                  className="mt-3 w-full text-center text-xs text-[var(--text-muted)] hover:underline"
                  onClick={() => {
                    setStep("request")
                    setCode("")
                    setNewPassword("")
                    setError(null)
                  }}
                >
                  Use a different email or resend the passcode
                </button>
              </form>
            </>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
