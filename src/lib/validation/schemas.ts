import { z } from 'zod'
import { Constants } from '@/lib/supabase/database.types'

/**
 * Every Server Action validates its FormData with one of these schemas before
 * touching the database. The database has matching CHECK constraints as a
 * second line of defence.
 */

const trimmed = (max: number) => z.string().trim().max(max)
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null))

/** Accepts 01XXXXXXXXX or +8801XXXXXXXXX (spaces/dashes removed); empty → null */
const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(/[\s-]/g, '') : null))
  .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, 'invalid_phone').nullable())

const money = z.coerce.number().finite().min(0).max(100_000_000).multipleOf(0.01)
const positiveMoney = money.refine((v) => v > 0, 'must_be_positive')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date')
const uuid = z.string().uuid()

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
})

export const otpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  token: z.string().trim().regex(/^\d{6,8}$/, 'invalid_code'),
})

export const onboardingSchema = z.object({
  role: z.enum(Constants.public.Enums.user_role),
  full_name: trimmed(120).min(1),
  phone: optionalPhone,
})

export const profileSchema = z.object({
  full_name: trimmed(120).min(1),
  phone: optionalPhone,
})

export const propertySchema = z.object({
  name: trimmed(120).min(1),
  address: optionalText(300),
  area: optionalText(80),
  city: trimmed(60).min(1).default('Dhaka'),
})

export const unitSchema = z.object({
  property_id: uuid,
  label: trimmed(40).min(1),
  floor: optionalText(20),
  default_rent: z
    .union([z.literal(''), money])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
})

export const tenantSchema = z.object({
  unit_id: uuid,
  full_name: trimmed(120).min(1),
  phone: optionalPhone,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().email().max(254).nullable()),
  move_in_date: isoDate,
  rent_amount: positiveMoney,
  service_charge: money.default(0),
  due_day: z.coerce.number().int().min(1).max(28),
  deposit_amount: money.default(0),
  notes: optionalText(500),
})

export const billItemSchema = z.object({
  bill_id: uuid,
  kind: z.enum(Constants.public.Enums.charge_kind),
  label: trimmed(60).min(1),
  amount: positiveMoney,
})

export const recordPaymentSchema = z.object({
  bill_id: uuid,
  amount: positiveMoney,
  method: z.enum(Constants.public.Enums.payment_method).exclude(['online', 'card']),
  paid_at: isoDate,
  reference: optionalText(60),
})

export const voidPaymentSchema = z.object({
  payment_id: uuid,
  reason: trimmed(200).min(1),
})

export const periodSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}-01$/, 'invalid_period'),
})

export const idSchema = z.object({ id: uuid })

/** FormData → plain object (single values only). */
export function formToObject(formData: FormData) {
  const obj: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string' && !key.startsWith('$')) obj[key] = value
  })
  return obj
}
