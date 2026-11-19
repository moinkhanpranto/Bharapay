/**
 * Database types — generated from the live Supabase schema.
 * Regenerate after every migration:
 *   npx supabase gen types typescript --project-id dfvmbsiscmzftppvfmyz > src/lib/supabase/database.types.ts
 * (or the Supabase MCP `generate_typescript_types` tool).
 *
 * One manual tweak after regenerating: in `payments.Insert`, make `receipt_no`
 * and `tenant_id` optional — the `payments_before_insert` trigger fills them.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type E = Database['public']['Enums']

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.18' }
  public: {
    Tables: {
      audit_log: {
        Row: { action: string; actor_id: string | null; created_at: string; details: Json | null; entity: string; entity_id: string | null; id: number; landlord_id: string | null }
        Insert: { action: string; actor_id?: string | null; created_at?: string; details?: Json | null; entity: string; entity_id?: string | null; id?: never; landlord_id?: string | null }
        Update: { action?: string; actor_id?: string | null; created_at?: string; details?: Json | null; entity?: string; entity_id?: string | null; id?: never; landlord_id?: string | null }
        Relationships: []
      }
      bill_items: {
        Row: { amount: number; bill_id: string; created_at: string; id: string; kind: E['charge_kind']; label: string; landlord_id: string }
        Insert: { amount: number; bill_id: string; created_at?: string; id?: string; kind: E['charge_kind']; label: string; landlord_id: string }
        Update: { amount?: number; bill_id?: string; created_at?: string; id?: string; kind?: E['charge_kind']; label?: string; landlord_id?: string }
        Relationships: [
          { foreignKeyName: 'bill_items_bill_id_landlord_id_fkey'; columns: ['bill_id', 'landlord_id']; isOneToOne: false; referencedRelation: 'bills'; referencedColumns: ['id', 'landlord_id'] },
        ]
      }
      bills: {
        Row: { amount_due: number; amount_paid: number; created_at: string; due_date: string; id: string; landlord_id: string; note: string | null; period: string; status: E['bill_status']; tenant_id: string; updated_at: string }
        Insert: { amount_due?: number; amount_paid?: number; created_at?: string; due_date: string; id?: string; landlord_id: string; note?: string | null; period: string; status?: E['bill_status']; tenant_id: string; updated_at?: string }
        Update: { amount_due?: number; amount_paid?: number; created_at?: string; due_date?: string; id?: string; landlord_id?: string; note?: string | null; period?: string; status?: E['bill_status']; tenant_id?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'bills_tenant_id_landlord_id_fkey'; columns: ['tenant_id', 'landlord_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id', 'landlord_id'] },
        ]
      }
      payment_events: {
        Row: { event_id: string; event_type: string; id: string; intent_id: string | null; payload: Json; provider: string; received_at: string; result: string | null }
        Insert: { event_id: string; event_type: string; id?: string; intent_id?: string | null; payload: Json; provider: string; received_at?: string; result?: string | null }
        Update: { event_id?: string; event_type?: string; id?: string; intent_id?: string | null; payload?: Json; provider?: string; received_at?: string; result?: string | null }
        Relationships: [
          { foreignKeyName: 'payment_events_intent_id_fkey'; columns: ['intent_id']; isOneToOne: false; referencedRelation: 'payment_intents'; referencedColumns: ['id'] },
        ]
      }
      payment_intents: {
        Row: { amount: number; bill_id: string; created_at: string; created_by: string; currency: string; expires_at: string; failure_reason: string | null; id: string; landlord_id: string; provider: string; provider_ref: string | null; status: E['intent_status']; tenant_id: string; updated_at: string }
        Insert: { amount: number; bill_id: string; created_at?: string; created_by: string; currency?: string; expires_at?: string; failure_reason?: string | null; id?: string; landlord_id: string; provider: string; provider_ref?: string | null; status?: E['intent_status']; tenant_id: string; updated_at?: string }
        Update: { amount?: number; bill_id?: string; created_at?: string; created_by?: string; currency?: string; expires_at?: string; failure_reason?: string | null; id?: string; landlord_id?: string; provider?: string; provider_ref?: string | null; status?: E['intent_status']; tenant_id?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'payment_intents_bill_id_landlord_id_fkey'; columns: ['bill_id', 'landlord_id']; isOneToOne: false; referencedRelation: 'bills'; referencedColumns: ['id', 'landlord_id'] },
          { foreignKeyName: 'payment_intents_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
        ]
      }
      payments: {
        Row: { amount: number; bill_id: string; created_at: string; id: string; intent_id: string | null; landlord_id: string; method: E['payment_method']; paid_at: string; receipt_no: string; recorded_by: string | null; reference: string | null; source: E['payment_source']; tenant_id: string; verified: boolean; void_reason: string | null; voided_at: string | null }
        Insert: { amount: number; bill_id: string; created_at?: string; id?: string; intent_id?: string | null; landlord_id: string; method: E['payment_method']; paid_at?: string; receipt_no?: string; recorded_by?: string | null; reference?: string | null; source?: E['payment_source']; tenant_id?: string; verified?: boolean; void_reason?: string | null; voided_at?: string | null }
        Update: { amount?: number; bill_id?: string; created_at?: string; id?: string; intent_id?: string | null; landlord_id?: string; method?: E['payment_method']; paid_at?: string; receipt_no?: string; recorded_by?: string | null; reference?: string | null; source?: E['payment_source']; tenant_id?: string; verified?: boolean; void_reason?: string | null; voided_at?: string | null }
        Relationships: [
          { foreignKeyName: 'payments_bill_id_landlord_id_fkey'; columns: ['bill_id', 'landlord_id']; isOneToOne: false; referencedRelation: 'bills'; referencedColumns: ['id', 'landlord_id'] },
          { foreignKeyName: 'payments_intent_id_fkey'; columns: ['intent_id']; isOneToOne: true; referencedRelation: 'payment_intents'; referencedColumns: ['id'] },
          { foreignKeyName: 'payments_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
        ]
      }
      profiles: {
        Row: { created_at: string; full_name: string | null; id: string; locale: string; phone: string | null; role: E['user_role'] | null; updated_at: string }
        Insert: { created_at?: string; full_name?: string | null; id: string; locale?: string; phone?: string | null; role?: E['user_role'] | null; updated_at?: string }
        Update: { created_at?: string; full_name?: string | null; id?: string; locale?: string; phone?: string | null; role?: E['user_role'] | null; updated_at?: string }
        Relationships: []
      }
      properties: {
        Row: { address: string | null; archived_at: string | null; area: string | null; city: string; created_at: string; id: string; landlord_id: string; name: string; updated_at: string }
        Insert: { address?: string | null; archived_at?: string | null; area?: string | null; city?: string; created_at?: string; id?: string; landlord_id: string; name: string; updated_at?: string }
        Update: { address?: string | null; archived_at?: string | null; area?: string | null; city?: string; created_at?: string; id?: string; landlord_id?: string; name?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'properties_landlord_id_fkey'; columns: ['landlord_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      tenants: {
        Row: { created_at: string; deposit_amount: number; due_day: number; email: string | null; full_name: string; id: string; landlord_id: string; move_in_date: string; move_out_date: string | null; notes: string | null; phone: string | null; rent_amount: number; service_charge: number; status: E['tenant_status']; unit_id: string; updated_at: string; user_id: string | null }
        Insert: { created_at?: string; deposit_amount?: number; due_day?: number; email?: string | null; full_name: string; id?: string; landlord_id: string; move_in_date?: string; move_out_date?: string | null; notes?: string | null; phone?: string | null; rent_amount: number; service_charge?: number; status?: E['tenant_status']; unit_id: string; updated_at?: string; user_id?: string | null }
        Update: { created_at?: string; deposit_amount?: number; due_day?: number; email?: string | null; full_name?: string; id?: string; landlord_id?: string; move_in_date?: string; move_out_date?: string | null; notes?: string | null; phone?: string | null; rent_amount?: number; service_charge?: number; status?: E['tenant_status']; unit_id?: string; updated_at?: string; user_id?: string | null }
        Relationships: [
          { foreignKeyName: 'tenants_unit_id_landlord_id_fkey'; columns: ['unit_id', 'landlord_id']; isOneToOne: false; referencedRelation: 'units'; referencedColumns: ['id', 'landlord_id'] },
        ]
      }
      units: {
        Row: { created_at: string; default_rent: number | null; floor: string | null; id: string; label: string; landlord_id: string; property_id: string; status: E['unit_status']; updated_at: string }
        Insert: { created_at?: string; default_rent?: number | null; floor?: string | null; id?: string; label: string; landlord_id: string; property_id: string; status?: E['unit_status']; updated_at?: string }
        Update: { created_at?: string; default_rent?: number | null; floor?: string | null; id?: string; label?: string; landlord_id?: string; property_id?: string; status?: E['unit_status']; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'units_property_id_landlord_id_fkey'; columns: ['property_id', 'landlord_id']; isOneToOne: false; referencedRelation: 'properties'; referencedColumns: ['id', 'landlord_id'] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      apply_payment_event: {
        Args: { p_amount: number; p_event_id: string; p_event_type: string; p_intent_id: string; p_method: E['payment_method']; p_payload: Json; p_provider: string; p_provider_ref: string; p_status: E['intent_status'] }
        Returns: string
      }
      claim_tenancies: { Args: never; Returns: number }
      create_payment_intent: {
        Args: { p_bill_id: string; p_provider?: string }
        Returns: Database['public']['Tables']['payment_intents']['Row']
        SetofOptions: { from: '*'; to: 'payment_intents'; isOneToOne: true; isSetofReturn: false }
      }
      generate_monthly_bills: { Args: { p_period?: string }; Returns: number }
    }
    Enums: {
      bill_status: 'unpaid' | 'partial' | 'paid'
      charge_kind: 'rent' | 'gas' | 'electricity' | 'water' | 'service' | 'other'
      intent_status: 'created' | 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired'
      payment_method: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card' | 'online'
      payment_source: 'manual' | 'gateway'
      tenant_status: 'active' | 'ended'
      unit_status: 'vacant' | 'occupied'
      user_role: 'landlord' | 'tenant'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']

/** Row type of a table, e.g. `Tables<'bills'>` */
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
/** Enum type, e.g. `Enums<'payment_method'>` */
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]

export const Constants = {
  public: {
    Enums: {
      bill_status: ['unpaid', 'partial', 'paid'],
      charge_kind: ['rent', 'gas', 'electricity', 'water', 'service', 'other'],
      intent_status: ['created', 'pending', 'succeeded', 'failed', 'cancelled', 'expired'],
      payment_method: ['cash', 'bkash', 'nagad', 'rocket', 'bank', 'card', 'online'],
      payment_source: ['manual', 'gateway'],
      tenant_status: ['active', 'ended'],
      unit_status: ['vacant', 'occupied'],
      user_role: ['landlord', 'tenant'],
    },
  },
} as const
