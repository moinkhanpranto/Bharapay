import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

const control =
  'w-full h-12 rounded-2xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-danger'

type FieldProps = { label: string; name: string; hint?: string; error?: string; optionalLabel?: string }

function FieldWrapper({ label, name, hint, error, optionalLabel, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
        {optionalLabel && <span className="ml-1 font-normal text-ink-muted">({optionalLabel})</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function TextField({
  label,
  name,
  hint,
  error,
  optionalLabel,
  className,
  ...props
}: FieldProps & Omit<ComponentProps<'input'>, 'name'>) {
  return (
    <FieldWrapper {...{ label, name, hint, error, optionalLabel }}>
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={cn(control, className)}
        {...props}
      />
    </FieldWrapper>
  )
}

export function SelectField({
  label,
  name,
  hint,
  error,
  optionalLabel,
  children,
  className,
  ...props
}: FieldProps & Omit<ComponentProps<'select'>, 'name'>) {
  return (
    <FieldWrapper {...{ label, name, hint, error, optionalLabel }}>
      <select
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        className={cn(control, 'appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235b6577' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  )
}

export function TextAreaField({
  label,
  name,
  hint,
  error,
  optionalLabel,
  className,
  ...props
}: FieldProps & Omit<ComponentProps<'textarea'>, 'name'>) {
  return (
    <FieldWrapper {...{ label, name, hint, error, optionalLabel }}>
      <textarea
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        className={cn(control, 'h-auto min-h-24 py-3', className)}
        {...props}
      />
    </FieldWrapper>
  )
}

/** Chip-style radio group, e.g. payment method or rent due day. */
export function ChoiceChips({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: { value: string; label: string }[]
  defaultValue?: string
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="peer sr-only" />
            <span className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand-strong peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
