/**
 * Shape every Server Action returns to a form (used with React's useActionState).
 *   ok: true  → `message` is a success text to show
 *   ok: false → `error` is a user-facing text, `fieldErrors` per input name
 */
export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | null

export const initialState: ActionState = null

/** Turn a ZodError into { field: firstMessage } */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
