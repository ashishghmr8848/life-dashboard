import axios from "axios"

interface FastApiValidationError {
  msg: string
  loc: (string | number)[]
}

/** Extracts a human-readable message from a FastAPI error response, falling
 * back to `fallback` for anything unrecognized (network error, unexpected shape). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  const detail = error.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const messages = (detail as FastApiValidationError[])
      .map((d) => d.msg)
      .filter(Boolean)
    if (messages.length) return messages.join("; ")
  }
  return fallback
}
