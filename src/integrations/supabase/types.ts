export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audits: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      drops: {
        Row: {
          created_at: string
          eta_at: string
          fisherman_id: string
          id: string
          is_premium: boolean
          landed_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          port_id: string
          public_visible_at: string | null
          status: Database["public"]["Enums"]["drop_status"]
          updated_at: string
          visible_at: string
        }
        Insert: {
          created_at?: string
          eta_at: string
          fisherman_id: string
          id?: string
          is_premium?: boolean
          landed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          port_id: string
          public_visible_at?: string | null
          status?: Database["public"]["Enums"]["drop_status"]
          updated_at?: string
          visible_at?: string
        }
        Update: {
          created_at?: string
          eta_at?: string
          fisherman_id?: string
          id?: string
          is_premium?: boolean
          landed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          port_id?: string
          public_visible_at?: string | null
          status?: Database["public"]["Enums"]["drop_status"]
          updated_at?: string
          visible_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drops_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drops_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen: {
        Row: {
          bio: string | null
          boat_name: string
          boat_registration: string
          created_at: string
          id: string
          license_number: string | null
          phone: string | null
          photo_url: string | null
          siret: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          bio?: string | null
          boat_name: string
          boat_registration: string
          created_at?: string
          id?: string
          license_number?: string | null
          phone?: string | null
          photo_url?: string | null
          siret: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          bio?: string | null
          boat_name?: string
          boat_registration?: string
          created_at?: string
          id?: string
          license_number?: string | null
          phone?: string | null
          photo_url?: string | null
          siret?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      follow_ports: {
        Row: {
          created_at: string
          id: string
          port_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          port_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          port_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ports_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_species: {
        Row: {
          created_at: string
          id: string
          species_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          species_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          species_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications_queue: {
        Row: {
          audience: string
          created_at: string
          drop_id: string
          id: string
          scheduled_at: string
          sent_at: string | null
        }
        Insert: {
          audience: string
          created_at?: string
          drop_id: string
          id?: string
          scheduled_at: string
          sent_at?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          drop_id?: string
          id?: string
          scheduled_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_queue_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          available_units: number
          created_at: string
          description: string | null
          drop_id: string
          id: string
          photo_url: string | null
          species_id: string
          title: string
          total_units: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          available_units: number
          created_at?: string
          description?: string | null
          drop_id: string
          id?: string
          photo_url?: string | null
          species_id: string
          title: string
          total_units: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          available_units?: number
          created_at?: string
          description?: string | null
          drop_id?: string
          id?: string
          photo_url?: string | null
          species_id?: string
          title?: string
          total_units?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      ports: {
        Row: {
          city: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          postal_code: string | null
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          postal_code?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          postal_code?: string | null
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number | null
          quantity: string
          recipe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number | null
          quantity: string
          recipe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number | null
          quantity?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_species: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          quantity: string | null
          recipe_id: string
          species_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          quantity?: string | null
          recipe_id: string
          species_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          quantity?: string | null
          recipe_id?: string
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_species_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cooking_time: number | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          image_url: string | null
          instructions: Json | null
          preparation_time: number | null
          servings: number | null
          title: string
          updated_at: string
        }
        Insert: {
          cooking_time?: number | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          instructions?: Json | null
          preparation_time?: number | null
          servings?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          cooking_time?: number | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          instructions?: Json | null
          preparation_time?: number | null
          servings?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number | null
          bonus_claimed: boolean | null
          claimed_at: string | null
          created_at: string
          id: string
          referred_id: string
          referred_type: string
          referrer_id: string
          referrer_type: string
        }
        Insert: {
          bonus_amount?: number | null
          bonus_claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referred_type: string
          referrer_id: string
          referrer_type: string
        }
        Update: {
          bonus_amount?: number | null
          bonus_claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referred_type?: string
          referrer_id?: string
          referrer_type?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          expires_at: string
          id: string
          offer_id: string
          quantity: number
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          offer_id: string
          quantity: number
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          offer_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          buyer_id: string | null
          completed_at: string | null
          created_at: string
          fisherman_id: string
          id: string
          notes: string | null
          offer_id: string
          quantity: number
          refunded_at: string | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["sale_status"]
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          fisherman_id: string
          id?: string
          notes?: string | null
          offer_id: string
          quantity: number
          refunded_at?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          fisherman_id?: string
          id?: string
          notes?: string | null
          offer_id?: string
          quantity?: number
          refunded_at?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          scientific_name: string | null
          season_end: number | null
          season_start: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scientific_name?: string | null
          season_end?: number | null
          season_start?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scientific_name?: string | null
          season_end?: number | null
          season_start?: number | null
        }
        Relationships: []
      }
      subscription_packages: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          fish_quota: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          fish_quota: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          fish_quota?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_package_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          package_id: string
          remaining_quota: number
          start_date: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          package_id: string
          remaining_quota: number
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          package_id?: string
          remaining_quota?: number
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_package_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_test_user_role: {
        Args: {
          user_email: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium" | "fisherman"
      drop_status: "scheduled" | "landed" | "cancelled"
      reservation_status: "pending" | "confirmed" | "cancelled" | "completed"
      sale_status: "pending" | "completed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "premium", "fisherman"],
      drop_status: ["scheduled", "landed", "cancelled"],
      reservation_status: ["pending", "confirmed", "cancelled", "completed"],
      sale_status: ["pending", "completed", "refunded"],
    },
  },
} as const
