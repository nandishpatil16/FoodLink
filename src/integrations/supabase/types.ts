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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      donation_events: {
        Row: {
          actor_id: string | null
          created_at: string
          donation_id: string
          id: string
          note: string
          status: Database["public"]["Enums"]["donation_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          donation_id: string
          id?: string
          note?: string
          status: Database["public"]["Enums"]["donation_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          donation_id?: string
          id?: string
          note?: string
          status?: Database["public"]["Enums"]["donation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donation_events_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          accepted_at: string | null
          category: string
          collected_at: string | null
          created_at: string
          delivered_at: string | null
          description: string
          donor_address: string
          donor_id: string
          donor_org_name: string
          donor_phone: string
          id: string
          lat: number | null
          lng: number | null
          photo_url: string | null
          pickup_deadline: string
          pickup_note: string | null
          pickup_time: string | null
          prepared_at: string
          quantity_unit: string
          quantity_value: number
          receiver_contact_person: string | null
          receiver_id: string | null
          receiver_org_name: string | null
          receiver_phone: string | null
          status: Database["public"]["Enums"]["donation_status"]
          team_size: number | null
          title: string
          vehicle_number: string | null
        }
        Insert: {
          accepted_at?: string | null
          category?: string
          collected_at?: string | null
          created_at?: string
          delivered_at?: string | null
          description?: string
          donor_address?: string
          donor_id: string
          donor_org_name?: string
          donor_phone?: string
          id?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          pickup_deadline: string
          pickup_note?: string | null
          pickup_time?: string | null
          prepared_at?: string
          quantity_unit?: string
          quantity_value?: number
          receiver_contact_person?: string | null
          receiver_id?: string | null
          receiver_org_name?: string | null
          receiver_phone?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          team_size?: number | null
          title: string
          vehicle_number?: string | null
        }
        Update: {
          accepted_at?: string | null
          category?: string
          collected_at?: string | null
          created_at?: string
          delivered_at?: string | null
          description?: string
          donor_address?: string
          donor_id?: string
          donor_org_name?: string
          donor_phone?: string
          id?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          pickup_deadline?: string
          pickup_note?: string | null
          pickup_time?: string | null
          prepared_at?: string
          quantity_unit?: string
          quantity_value?: number
          receiver_contact_person?: string | null
          receiver_id?: string | null
          receiver_org_name?: string | null
          receiver_phone?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          team_size?: number | null
          title?: string
          vehicle_number?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string
          ai_review: Json | null
          city: string
          contact_person: string
          created_at: string
          documents: Json
          email: string
          id: string
          lat: number | null
          license_number: string
          lng: number | null
          name: string
          org_type: string
          owner_id: string
          phone: string
          pickup_radius_km: number
          pincode: string
          role: Database["public"]["Enums"]["app_role"]
          service_area: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          address?: string
          ai_review?: Json | null
          city?: string
          contact_person?: string
          created_at?: string
          documents?: Json
          email?: string
          id?: string
          lat?: number | null
          license_number?: string
          lng?: number | null
          name: string
          org_type?: string
          owner_id: string
          phone?: string
          pickup_radius_km?: number
          pincode?: string
          role: Database["public"]["Enums"]["app_role"]
          service_area?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          address?: string
          ai_review?: Json | null
          city?: string
          contact_person?: string
          created_at?: string
          documents?: Json
          email?: string
          id?: string
          lat?: number | null
          license_number?: string
          lng?: number | null
          name?: string
          org_type?: string
          owner_id?: string
          phone?: string
          pickup_radius_km?: number
          pincode?: string
          role?: Database["public"]["Enums"]["app_role"]
          service_area?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      pickup_codes: {
        Row: {
          code: string
          created_at: string
          donation_id: string
          donor_id: string
        }
        Insert: {
          code: string
          created_at?: string
          donation_id: string
          donor_id: string
        }
        Update: {
          code?: string
          created_at?: string
          donation_id?: string
          donor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_codes_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_verified: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      urgency_score: {
        Args: {
          _category: string
          _pickup_deadline: string
          _prepared_at: string
          _quantity: number
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "donor" | "receiver" | "admin"
      donation_status:
        | "AVAILABLE"
        | "ACCEPTED"
        | "PICKUP_SCHEDULED"
        | "COLLECTED"
        | "DELIVERED"
        | "COMPLETED"
        | "EXPIRED"
        | "CANCELLED"
        | "FLAGGED"
      verification_status:
        | "PENDING"
        | "UNDER_REVIEW"
        | "VERIFIED"
        | "REJECTED"
        | "SUSPENDED"
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
      app_role: ["donor", "receiver", "admin"],
      donation_status: [
        "AVAILABLE",
        "ACCEPTED",
        "PICKUP_SCHEDULED",
        "COLLECTED",
        "DELIVERED",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED",
        "FLAGGED",
      ],
      verification_status: [
        "PENDING",
        "UNDER_REVIEW",
        "VERIFIED",
        "REJECTED",
        "SUSPENDED",
      ],
    },
  },
} as const
