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
      ai_conversations: {
        Row: {
          created_at: string
          fisherman_id: string
          id: string
          messages: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          fisherman_id: string
          id?: string
          messages?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          fisherman_id?: string
          id?: string
          messages?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
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
      basket_orders: {
        Row: {
          basket_id: string
          created_at: string
          drop_id: string | null
          fisherman_id: string | null
          id: string
          notes: string | null
          pickup_location: string | null
          pickup_time: string | null
          status: string
          stripe_payment_id: string | null
          total_price_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          basket_id: string
          created_at?: string
          drop_id?: string | null
          fisherman_id?: string | null
          id?: string
          notes?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          status?: string
          stripe_payment_id?: string | null
          total_price_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          basket_id?: string
          created_at?: string
          drop_id?: string | null
          fisherman_id?: string | null
          id?: string
          notes?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          status?: string
          stripe_payment_id?: string | null
          total_price_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "basket_orders_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "client_baskets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_orders_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_orders_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_orders_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      client_baskets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          updated_at: string
          variety_level: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          updated_at?: string
          variety_level?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
          variety_level?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      drop_photos: {
        Row: {
          created_at: string
          display_order: number
          drop_id: string
          id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          drop_id: string
          id?: string
          photo_url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          drop_id?: string
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_photos_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_species: {
        Row: {
          created_at: string | null
          drop_id: string
          id: string
          species_id: string
        }
        Insert: {
          created_at?: string | null
          drop_id: string
          id?: string
          species_id: string
        }
        Update: {
          created_at?: string | null
          drop_id?: string
          id?: string
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_species_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_templates: {
        Row: {
          created_at: string | null
          fisherman_id: string
          icon: string | null
          id: string
          name: string
          payload: Json
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          fisherman_id: string
          icon?: string | null
          id?: string
          name: string
          payload: Json
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          fisherman_id?: string
          icon?: string | null
          id?: string
          name?: string
          payload?: Json
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drop_templates_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_templates_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          created_at: string
          drop_type: string | null
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
          sale_start_time: string
          status: Database["public"]["Enums"]["drop_status"]
          updated_at: string
          visible_at: string
        }
        Insert: {
          created_at?: string
          drop_type?: string | null
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
          sale_start_time: string
          status?: Database["public"]["Enums"]["drop_status"]
          updated_at?: string
          visible_at?: string
        }
        Update: {
          created_at?: string
          drop_type?: string | null
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
          sale_start_time?: string
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
            foreignKeyName: "drops_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
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
      fisherman_sale_points: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          fisherman_id: string
          id: string
          is_primary: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          fisherman_id: string
          id?: string
          is_primary?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          fisherman_id?: string
          id?: string
          is_primary?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fisherman_sale_points_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fisherman_sale_points_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen: {
        Row: {
          address: string | null
          ambassador_slot: number | null
          bio: string | null
          boat_name: string
          boat_registration: string
          can_edit_profile: boolean | null
          city: string | null
          client_message: string | null
          company_name: string | null
          created_at: string
          default_sale_point_id: string | null
          default_time_slot: string | null
          description: string | null
          display_name_preference: string | null
          email: string | null
          facebook_url: string | null
          fishing_methods:
            | Database["public"]["Enums"]["fishing_method"][]
            | null
          fishing_zones: string[] | null
          fishing_zones_geojson: Json | null
          generated_description: string | null
          id: string
          instagram_url: string | null
          is_ambassador: boolean | null
          license_number: string | null
          main_fishing_zone: string | null
          onboarding_data: Json | null
          onboarding_paid_at: string | null
          onboarding_payment_id: string | null
          onboarding_payment_status: string | null
          onboarding_step: number | null
          passion_quote: string | null
          phone: string | null
          photo_boat_1: string | null
          photo_boat_2: string | null
          photo_dock_sale: string | null
          photo_url: string | null
          postal_code: string | null
          siret: string
          slug: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          website_url: string | null
          work_philosophy: string | null
          years_experience: string | null
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          ambassador_slot?: number | null
          bio?: string | null
          boat_name: string
          boat_registration: string
          can_edit_profile?: boolean | null
          city?: string | null
          client_message?: string | null
          company_name?: string | null
          created_at?: string
          default_sale_point_id?: string | null
          default_time_slot?: string | null
          description?: string | null
          display_name_preference?: string | null
          email?: string | null
          facebook_url?: string | null
          fishing_methods?:
            | Database["public"]["Enums"]["fishing_method"][]
            | null
          fishing_zones?: string[] | null
          fishing_zones_geojson?: Json | null
          generated_description?: string | null
          id?: string
          instagram_url?: string | null
          is_ambassador?: boolean | null
          license_number?: string | null
          main_fishing_zone?: string | null
          onboarding_data?: Json | null
          onboarding_paid_at?: string | null
          onboarding_payment_id?: string | null
          onboarding_payment_status?: string | null
          onboarding_step?: number | null
          passion_quote?: string | null
          phone?: string | null
          photo_boat_1?: string | null
          photo_boat_2?: string | null
          photo_dock_sale?: string | null
          photo_url?: string | null
          postal_code?: string | null
          siret: string
          slug?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          website_url?: string | null
          work_philosophy?: string | null
          years_experience?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          ambassador_slot?: number | null
          bio?: string | null
          boat_name?: string
          boat_registration?: string
          can_edit_profile?: boolean | null
          city?: string | null
          client_message?: string | null
          company_name?: string | null
          created_at?: string
          default_sale_point_id?: string | null
          default_time_slot?: string | null
          description?: string | null
          display_name_preference?: string | null
          email?: string | null
          facebook_url?: string | null
          fishing_methods?:
            | Database["public"]["Enums"]["fishing_method"][]
            | null
          fishing_zones?: string[] | null
          fishing_zones_geojson?: Json | null
          generated_description?: string | null
          id?: string
          instagram_url?: string | null
          is_ambassador?: boolean | null
          license_number?: string | null
          main_fishing_zone?: string | null
          onboarding_data?: Json | null
          onboarding_paid_at?: string | null
          onboarding_payment_id?: string | null
          onboarding_payment_status?: string | null
          onboarding_step?: number | null
          passion_quote?: string | null
          phone?: string | null
          photo_boat_1?: string | null
          photo_boat_2?: string | null
          photo_dock_sale?: string | null
          photo_url?: string | null
          postal_code?: string | null
          siret?: string
          slug?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          website_url?: string | null
          work_philosophy?: string | null
          years_experience?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_default_sale_point_id_fkey"
            columns: ["default_sale_point_id"]
            isOneToOne: false
            referencedRelation: "fisherman_sale_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_peche"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen_contacts: {
        Row: {
          contact_group: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          fisherman_id: string
          id: string
          imported_at: string | null
          last_contacted_at: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
        }
        Insert: {
          contact_group?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          fisherman_id: string
          id?: string
          imported_at?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
        }
        Update: {
          contact_group?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          fisherman_id?: string
          id?: string
          imported_at?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_contacts_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_contacts_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen_followers: {
        Row: {
          created_at: string | null
          fisherman_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fisherman_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          fisherman_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_followers_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_followers_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen_messages: {
        Row: {
          body: string
          channel: string | null
          created_at: string | null
          drop_id: string | null
          email_count: number | null
          fisherman_id: string
          id: string
          message_type: string
          recipient_count: number | null
          sent_at: string | null
          sent_to_group: string | null
          sms_cost: number | null
          sms_count: number | null
          status: string | null
          subject: string | null
        }
        Insert: {
          body: string
          channel?: string | null
          created_at?: string | null
          drop_id?: string | null
          email_count?: number | null
          fisherman_id: string
          id?: string
          message_type: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_to_group?: string | null
          sms_cost?: number | null
          sms_count?: number | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          body?: string
          channel?: string | null
          created_at?: string | null
          drop_id?: string | null
          email_count?: number | null
          fisherman_id?: string
          id?: string
          message_type?: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_to_group?: string | null
          sms_cost?: number | null
          sms_count?: number | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_messages_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_messages_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_messages_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen_sms_packs: {
        Row: {
          fisherman_id: string
          id: string
          pack_type: string
          price_paid: number
          purchased_at: string | null
          sms_quantity: number
          stripe_payment_intent_id: string | null
        }
        Insert: {
          fisherman_id: string
          id?: string
          pack_type: string
          price_paid: number
          purchased_at?: string | null
          sms_quantity: number
          stripe_payment_intent_id?: string | null
        }
        Update: {
          fisherman_id?: string
          id?: string
          pack_type?: string
          price_paid?: number
          purchased_at?: string | null
          sms_quantity?: number
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_sms_packs_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_sms_packs_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen_sms_usage: {
        Row: {
          created_at: string | null
          fisherman_id: string
          free_sms_used: number | null
          id: string
          month_year: string
          paid_sms_balance: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fisherman_id: string
          free_sms_used?: number | null
          id?: string
          month_year: string
          paid_sms_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fisherman_id?: string
          free_sms_used?: number | null
          id?: string
          month_year?: string
          paid_sms_balance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_sms_usage_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_sms_usage_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen_species: {
        Row: {
          created_at: string
          fisherman_id: string
          id: string
          is_primary: boolean | null
          species_id: string
        }
        Insert: {
          created_at?: string
          fisherman_id: string
          id?: string
          is_primary?: boolean | null
          species_id: string
        }
        Update: {
          created_at?: string
          fisherman_id?: string
          id?: string
          is_primary?: boolean | null
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_species_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_species_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      fishermen_species_presets: {
        Row: {
          created_at: string | null
          fisherman_id: string
          icon: string | null
          id: string
          name: string
          species_data: Json
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          fisherman_id: string
          icon?: string | null
          id?: string
          name: string
          species_data: Json
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          fisherman_id?: string
          icon?: string | null
          id?: string
          name?: string
          species_data?: Json
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fishermen_species_presets_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishermen_species_presets_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
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
      offer_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          offer_id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          offer_id: string
          photo_url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          offer_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_photos_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
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
          indicative_weight_kg: number | null
          photo_url: string | null
          price_type: string | null
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
          indicative_weight_kg?: number | null
          photo_url?: string | null
          price_type?: string | null
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
          indicative_weight_kg?: number | null
          photo_url?: string | null
          price_type?: string | null
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
      payments: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          started_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: string
          started_at?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          final_weight_kg: number | null
          fisherman_id: string
          id: string
          notes: string | null
          offer_id: string
          paid_method: string | null
          quantity: number
          receipt_pdf_url: string | null
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
          final_weight_kg?: number | null
          fisherman_id: string
          id?: string
          notes?: string | null
          offer_id: string
          paid_method?: string | null
          quantity: number
          receipt_pdf_url?: string | null
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
          final_weight_kg?: number | null
          fisherman_id?: string
          id?: string
          notes?: string | null
          offer_id?: string
          paid_method?: string | null
          quantity?: number
          receipt_pdf_url?: string | null
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
            foreignKeyName: "sales_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
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
          fao_zone: string | null
          fishing_area: Database["public"]["Enums"]["fishing_area"] | null
          fishing_gear: string | null
          id: string
          indicative_price: number | null
          min_size_cm: number | null
          name: string
          presentation: string | null
          price_unit: string | null
          scientific_name: string | null
          season_end: number | null
          season_start: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          fao_zone?: string | null
          fishing_area?: Database["public"]["Enums"]["fishing_area"] | null
          fishing_gear?: string | null
          id?: string
          indicative_price?: number | null
          min_size_cm?: number | null
          name: string
          presentation?: string | null
          price_unit?: string | null
          scientific_name?: string | null
          season_end?: number | null
          season_start?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          fao_zone?: string | null
          fishing_area?: Database["public"]["Enums"]["fishing_area"] | null
          fishing_gear?: string | null
          id?: string
          indicative_price?: number | null
          min_size_cm?: number | null
          name?: string
          presentation?: string | null
          price_unit?: string | null
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
      support_requests: {
        Row: {
          admin_response: string | null
          category: Database["public"]["Enums"]["support_category"]
          created_at: string
          fisherman_id: string
          id: string
          message: string
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          category: Database["public"]["Enums"]["support_category"]
          created_at?: string
          fisherman_id: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          fisherman_id?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "fishermen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_fisherman_id_fkey"
            columns: ["fisherman_id"]
            isOneToOne: false
            referencedRelation: "public_fishermen"
            referencedColumns: ["id"]
          },
        ]
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
      zones_especes: {
        Row: {
          created_at: string
          id: string
          species_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          species_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          species_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_especes_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_especes_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_peche"
            referencedColumns: ["id"]
          },
        ]
      }
      zones_peche: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          region: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          region: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          region?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_fishermen: {
        Row: {
          bio: string | null
          boat_name: string | null
          boat_registration: string | null
          company_name: string | null
          created_at: string | null
          description: string | null
          facebook_url: string | null
          fishing_methods:
            | Database["public"]["Enums"]["fishing_method"][]
            | null
          fishing_zones: string[] | null
          fishing_zones_geojson: Json | null
          generated_description: string | null
          id: string | null
          instagram_url: string | null
          is_ambassador: boolean | null
          main_fishing_zone: string | null
          photo_boat_1: string | null
          photo_boat_2: string | null
          photo_dock_sale: string | null
          photo_url: string | null
          slug: string | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          boat_name?: string | null
          boat_registration?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          fishing_methods?:
            | Database["public"]["Enums"]["fishing_method"][]
            | null
          fishing_zones?: string[] | null
          fishing_zones_geojson?: Json | null
          generated_description?: string | null
          id?: string | null
          instagram_url?: string | null
          is_ambassador?: boolean | null
          main_fishing_zone?: string | null
          photo_boat_1?: string | null
          photo_boat_2?: string | null
          photo_dock_sale?: string | null
          photo_url?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          boat_name?: string | null
          boat_registration?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          fishing_methods?:
            | Database["public"]["Enums"]["fishing_method"][]
            | null
          fishing_zones?: string[] | null
          fishing_zones_geojson?: Json | null
          generated_description?: string | null
          id?: string | null
          instagram_url?: string | null
          is_ambassador?: boolean | null
          main_fishing_zone?: string | null
          photo_boat_1?: string | null
          photo_boat_2?: string | null
          photo_dock_sale?: string | null
          photo_url?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_test_user_role: {
        Args: {
          user_email: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      archive_expired_drops: { Args: never; Returns: undefined }
      count_users: { Args: never; Returns: number }
      count_verified_fishermen: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_monthly_free_sms: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "premium" | "fisherman"
      drop_status: "scheduled" | "landed" | "cancelled" | "completed"
      fishing_area: "mediterranee" | "atlantique" | "manche" | "all"
      fishing_method:
        | "palangre"
        | "filet"
        | "ligne"
        | "casier"
        | "chalut"
        | "seine"
        | "hamecon"
        | "nasse"
        | "autre"
      reservation_status: "pending" | "confirmed" | "cancelled" | "completed"
      sale_status: "pending" | "completed" | "refunded"
      support_category:
        | "profile_modification"
        | "technical"
        | "commercial"
        | "other"
      support_status: "pending" | "in_progress" | "resolved" | "rejected"
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
      drop_status: ["scheduled", "landed", "cancelled", "completed"],
      fishing_area: ["mediterranee", "atlantique", "manche", "all"],
      fishing_method: [
        "palangre",
        "filet",
        "ligne",
        "casier",
        "chalut",
        "seine",
        "hamecon",
        "nasse",
        "autre",
      ],
      reservation_status: ["pending", "confirmed", "cancelled", "completed"],
      sale_status: ["pending", "completed", "refunded"],
      support_category: [
        "profile_modification",
        "technical",
        "commercial",
        "other",
      ],
      support_status: ["pending", "in_progress", "resolved", "rejected"],
    },
  },
} as const
