Need to install the following packages:
supabase@2.70.5
Ok to proceed? (y) export type Json =
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
      bank_accounts: {
        Row: {
          account_number: string
          agency: string
          bank_code: string
          cpf_or_cnpj: string
          created_at: string
          holder_name: string
          id: string
          maker_id: string
          pix_key: string | null
        }
        Insert: {
          account_number: string
          agency: string
          bank_code: string
          cpf_or_cnpj: string
          created_at?: string
          holder_name: string
          id?: string
          maker_id: string
          pix_key?: string | null
        }
        Update: {
          account_number?: string
          agency?: string
          bank_code?: string
          cpf_or_cnpj?: string
          created_at?: string
          holder_name?: string
          id?: string
          maker_id?: string
          pix_key?: string | null
        }
        Relationships: []
      }
      chef_portfolio: {
        Row: {
          chef_id: number | null
          created_at: string | null
          id: number
          image_url: string
          title: string | null
        }
        Insert: {
          chef_id?: number | null
          created_at?: string | null
          id?: number
          image_url: string
          title?: string | null
        }
        Update: {
          chef_id?: number | null
          created_at?: string | null
          id?: number
          image_url?: string
          title?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          order_id: number | null
          sender_id: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          order_id?: number | null
          sender_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          order_id?: number | null
          sender_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_offers: {
        Row: {
          cook_id: string | null
          created_at: string | null
          id: number
          order_id: number | null
          price: number | null
          status: string | null
        }
        Insert: {
          cook_id?: string | null
          created_at?: string | null
          id?: number
          order_id?: number | null
          price?: number | null
          status?: string | null
        }
        Update: {
          cook_id?: string | null
          created_at?: string | null
          id?: number
          order_id?: number | null
          price?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_offers_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_offers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          cook_id: string | null
          cook_profit: number | null
          created_at: string | null
          dish_description: string | null
          id: number
          latitude: number | null
          longitude: number | null
          offer_price: number | null
          package_level: string | null
          payment_method: string | null
          people_count: number | null
          platform_fee: number | null
          status: string | null
          total_price: number | null
        }
        Insert: {
          client_id?: string | null
          cook_id?: string | null
          cook_profit?: number | null
          created_at?: string | null
          dish_description?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          offer_price?: number | null
          package_level?: string | null
          payment_method?: string | null
          people_count?: number | null
          platform_fee?: number | null
          status?: string | null
          total_price?: number | null
        }
        Update: {
          client_id?: string | null
          cook_id?: string | null
          cook_profit?: number | null
          created_at?: string | null
          dish_description?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          offer_price?: number | null
          package_level?: string | null
          payment_method?: string | null
          people_count?: number | null
          platform_fee?: number | null
          status?: string | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          chef_net_amount: number | null
          created_at: string | null
          id: number
          mp_payment_id: string | null
          mp_status: string | null
          order_id: number | null
          payer_id: string | null
          platform_fee: number | null
          qr_code_base64: string | null
          ticket_url: string | null
          total_amount: number | null
        }
        Insert: {
          chef_net_amount?: number | null
          created_at?: string | null
          id?: number
          mp_payment_id?: string | null
          mp_status?: string | null
          order_id?: number | null
          payer_id?: string | null
          platform_fee?: number | null
          qr_code_base64?: string | null
          ticket_url?: string | null
          total_amount?: number | null
        }
        Update: {
          chef_net_amount?: number | null
          created_at?: string | null
          id?: number
          mp_payment_id?: string | null
          mp_status?: string | null
          order_id?: number | null
          payer_id?: string | null
          platform_fee?: number | null
          qr_code_base64?: string | null
          ticket_url?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          maker_id: string
          name: string
          price: number
          stl_file_url: string | null
          stock: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          maker_id: string
          name: string
          price: number
          stl_file_url?: string | null
          stock?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          maker_id?: string
          name?: string
          price?: number
          stl_file_url?: string | null
          stock?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          cook_level: string | null
          created_at: string | null
          dish_description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          photo: string | null
          pix_key: string | null
          rating: number | null
          specialty: string | null
          type: string | null
          wallet_balance: number | null
        }
        Insert: {
          cook_level?: string | null
          created_at?: string | null
          dish_description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          photo?: string | null
          pix_key?: string | null
          rating?: number | null
          specialty?: string | null
          type?: string | null
          wallet_balance?: number | null
        }
        Update: {
          cook_level?: string | null
          created_at?: string | null
          dish_description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          photo?: string | null
          pix_key?: string | null
          rating?: number | null
          specialty?: string | null
          type?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      withdraws: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          pix_key: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          pix_key?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          pix_key?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdraws_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
