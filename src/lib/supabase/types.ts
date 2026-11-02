// Generated from the Supabase schema (trimmed to the tables Velta uses).
// Regenerate with the Supabase MCP / CLI after schema changes.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type CurrencyCode = Database["public"]["Enums"]["currency_code"]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      buckets: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          percent: number
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          percent?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          percent?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funds: {
        Row: {
          amount: number
          color: string | null
          created_at: string
          currency: CurrencyCode
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          color?: string | null
          created_at?: string
          currency?: CurrencyCode
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          color?: string | null
          created_at?: string
          currency?: CurrencyCode
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planned_items: {
        Row: {
          amount: number
          bucket_id: string | null
          created_at: string
          currency: CurrencyCode
          end_date: string | null
          frequency: Database["public"]["Enums"]["plan_frequency"]
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["plan_kind"]
          logo_domain: string | null
          name: string
          note: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bucket_id?: string | null
          created_at?: string
          currency?: CurrencyCode
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["plan_frequency"]
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["plan_kind"]
          logo_domain?: string | null
          name: string
          note?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          bucket_id?: string | null
          created_at?: string
          currency?: CurrencyCode
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["plan_frequency"]
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["plan_kind"]
          logo_domain?: string | null
          name?: string
          note?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_items_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_currency: CurrencyCode
          first_name: string
          fx_auto: boolean
          fx_updated_at: string | null
          horizon_months: number
          id: string
          include_income: boolean
          last_name: string | null
          safety_buffer: number
          updated_at: string
          usd_mxn_rate: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: CurrencyCode
          first_name: string
          fx_auto?: boolean
          fx_updated_at?: string | null
          horizon_months?: number
          id: string
          include_income?: boolean
          last_name?: string | null
          safety_buffer?: number
          updated_at?: string
          usd_mxn_rate?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: CurrencyCode
          first_name?: string
          fx_auto?: boolean
          fx_updated_at?: string | null
          horizon_months?: number
          id?: string
          include_income?: boolean
          last_name?: string | null
          safety_buffer?: number
          updated_at?: string
          usd_mxn_rate?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      currency_code: "MXN" | "USD"
      plan_frequency:
        | "one_time"
        | "monthly"
        | "bimonthly"
        | "quarterly"
        | "semiannual"
        | "annual"
      plan_kind: "expense" | "income"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
