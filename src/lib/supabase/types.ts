export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          available_balance: number | null
          balance: number | null
          color: string | null
          created_at: string
          credit_limit: number | null
          currency: Database["public"]["Enums"]["currency_code"]
          description: string | null
          goal_amount: number | null
          icon: string | null
          id: string
          include_in_total: boolean
          is_archived: boolean
          name: string
          owed_to_me: number | null
          sort_order: number
          total_debt: number | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          balance?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          goal_amount?: number | null
          icon?: string | null
          id?: string
          include_in_total?: boolean
          is_archived?: boolean
          name: string
          owed_to_me?: number | null
          sort_order?: number
          total_debt?: number | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number | null
          balance?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          goal_amount?: number | null
          icon?: string | null
          id?: string
          include_in_total?: boolean
          is_archived?: boolean
          name?: string
          owed_to_me?: number | null
          sort_order?: number
          total_debt?: number | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          is_active: boolean
          period: Database["public"]["Enums"]["budget_period"]
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean
          period?: Database["public"]["Enums"]["budget_period"]
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean
          period?: Database["public"]["Enums"]["budget_period"]
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          parent_id: string | null
          sort_order: number
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          date: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          rate: number
          to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Insert: {
          created_at?: string
          date?: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate: number
          to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Update: {
          created_at?: string
          date?: string
          from_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate?: number
          to_currency?: Database["public"]["Enums"]["currency_code"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_currency: Database["public"]["Enums"]["currency_code"]
          first_name: string
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          first_name: string
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          first_name?: string
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_rules: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          from_account_id: string | null
          id: string
          is_active: boolean
          last_generated: string | null
          next_occurrence: string
          note: string | null
          start_date: string
          to_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          from_account_id?: string | null
          id?: string
          is_active?: boolean
          last_generated?: string | null
          next_occurrence: string
          note?: string | null
          start_date: string
          to_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          from_account_id?: string | null
          id?: string
          is_active?: boolean
          last_generated?: string | null
          next_occurrence?: string
          note?: string | null
          start_date?: string
          to_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          affects_balance: boolean
          amount: number
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          date: string
          description: string | null
          exchange_rate: number | null
          from_account_id: string | null
          id: string
          import_batch_id: string | null
          is_recurring_instance: boolean
          note: string | null
          recurring_rule_id: string | null
          to_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          affects_balance?: boolean
          amount: number
          category_id?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          date?: string
          description?: string | null
          exchange_rate?: number | null
          from_account_id?: string | null
          id?: string
          import_batch_id?: string | null
          is_recurring_instance?: boolean
          note?: string | null
          recurring_rule_id?: string | null
          to_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          affects_balance?: boolean
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          date?: string
          description?: string | null
          exchange_rate?: number | null
          from_account_id?: string | null
          id?: string
          import_batch_id?: string | null
          is_recurring_instance?: boolean
          note?: string | null
          recurring_rule_id?: string | null
          to_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      budget_progress: {
        Row: {
          budget_id: string | null
          budgeted: number | null
          category_id: string | null
          category_name: string | null
          category_type: Database["public"]["Enums"]["category_type"] | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          percent_used: number | null
          period: Database["public"]["Enums"]["budget_period"] | null
          remaining: number | null
          spent: number | null
          user_id: string | null
        }
        Relationships: []
      }
      monthly_summary: {
        Row: {
          average_per_transaction: number | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          total: number | null
          transaction_count: number | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "regular" | "debt" | "savings"
      budget_period: "weekly" | "monthly" | "yearly"
      category_type: "expense" | "income"
      currency_code: "MXN" | "USD"
      recurrence_frequency:
        | "daily"
        | "every_2_days"
        | "weekdays"
        | "weekends"
        | "weekly"
        | "every_2_weeks"
        | "every_4_weeks"
        | "monthly"
        | "every_2_months"
        | "every_3_months"
        | "every_6_months"
        | "yearly"
      transaction_type: "income" | "expense" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> =
  (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
