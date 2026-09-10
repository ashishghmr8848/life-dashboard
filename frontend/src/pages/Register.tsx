import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Wallet } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { FieldLabel, FormRow, Input } from "@/components/ui/Field"
import { useAuth } from "@/context/AuthContext"
import { getApiErrorMessage } from "@/lib/apiError"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({ email, password, full_name: fullName })
      navigate("/", { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't create your account. Try a different email."))
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
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">Create your account</h2>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FieldLabel htmlFor="full_name">Name</FieldLabel>
              <Input
                id="full_name"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormRow>
            <FormRow>
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
            <FormRow className="mb-2">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">At least 8 characters.</p>
            </FormRow>
            {error && <p className="mb-4 text-xs text-[var(--status-critical)]">{error}</p>}
            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
