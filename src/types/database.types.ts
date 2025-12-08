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
      banned_ips: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      business_products: {
        Row: {
          business_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          banner_url: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          facebook: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          services: string[] | null
          type: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          services?: string[] | null
          type: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          services?: string[] | null
          type?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          contact_phone: string | null
          created_at: string
          date: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          lat: number | null
          lng: number | null
          location: string | null
          title: string | null
          type: string | null
          user_email: string | null
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          title?: string | null
          type?: string | null
          user_email?: string | null
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          title?: string | null
          type?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          last_read_timestamps: Json | null
          messages: Json | null
          participant_emails: string[] | null
          pet_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_read_timestamps?: Json | null
          messages?: Json | null
          participant_emails?: string[] | null
          pet_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_read_timestamps?: Json | null
          messages?: Json | null
          participant_emails?: string[] | null
          pet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          created_at: string
          id: string
          parent_id: string | null
          pet_id: string | null
          text: string
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id?: string | null
          pet_id?: string | null
          text: string
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string | null
          pet_id?: string | null
          text?: string
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          sender_email: string | null
          text: string | null
          timestamp: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          sender_email?: string | null
          text?: string | null
          timestamp?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          sender_email?: string | null
          text?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: Json | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: Json | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: Json | null
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          adoption_requirements: string | null
          animal_type: string
          breed: string | null
          color: string | null
          comments: Json | null
          contact: string | null
          contact_requests: string[] | null
          created_at: string
          currency: string | null
          date: string | null
          description: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          image_urls: string[] | null
          lat: number | null
          lng: number | null
          location: string | null
          name: string | null
          reunion_date: string | null
          reunion_image_url: string | null
          reunion_story: string | null
          reward: number | null
          share_contact_info: boolean | null
          size: string | null
          status: string
          user_id: string
        }
        Insert: {
          adoption_requirements?: string | null
          animal_type: string
          breed?: string | null
          color?: string | null
          comments?: Json | null
          contact?: string | null
          contact_requests?: string[] | null
          created_at?: string
          currency?: string | null
          date?: string | null
          description?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          image_urls?: string[] | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string | null
          reunion_date?: string | null
          reunion_image_url?: string | null
          reunion_story?: string | null
          reward?: number | null
          share_contact_info?: boolean | null
          size?: string | null
          status: string
          user_id: string
        }
        Update: {
          adoption_requirements?: string | null
          animal_type?: string
          breed?: string | null
          color?: string | null
          comments?: Json | null
          contact?: string | null
          contact_requests?: string[] | null
          created_at?: string
          currency?: string | null
          date?: string | null
          description?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          image_urls?: string[] | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string | null
          reunion_date?: string | null
          reunion_image_url?: string | null
          reunion_story?: string | null
          reward?: number | null
          share_contact_info?: boolean | null
          size?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          country: string | null
          created_at: string
          dni: string | null
          email: string | null
          first_name: string | null
          id: string
          last_ip: string | null
          last_name: string | null
          owned_pets: Json | null
          phone: string | null
          role: string | null
          saved_pet_ids: string[] | null
          status: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_ip?: string | null
          last_name?: string | null
          owned_pets?: Json | null
          phone?: string | null
          role?: string | null
          saved_pet_ids?: string[] | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_ip?: string | null
          last_name?: string | null
          owned_pets?: Json | null
          phone?: string | null
          role?: string | null
          saved_pet_ids?: string[] | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
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
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          post_snapshot: Json | null
          reason: string | null
          reported_email: string | null
          reporter_email: string | null
          status: string | null
          target_id: string | null
          timestamp: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          post_snapshot?: Json | null
          reason?: string | null
          reported_email?: string | null
          reporter_email?: string | null
          status?: string | null
          target_id?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          post_snapshot?: Json | null
          reason?: string | null
          reported_email?: string | null
          reporter_email?: string | null
          status?: string | null
          target_id?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          assignment_history: Json | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          related_report_id: string | null
          response: string | null
          status: string | null
          subject: string | null
          timestamp: string | null
          user_email: string | null
        }
        Insert: {
          assigned_to?: string | null
          assignment_history?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_report_id?: string | null
          response?: string | null
          status?: string | null
          subject?: string | null
          timestamp?: string | null
          user_email?: string | null
        }
        Update: {
          assigned_to?: string | null
          assignment_history?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_report_id?: string | null
          response?: string | null
          status?: string | null
          subject?: string | null
          timestamp?: string | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          points?: number
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          comment: string
          created_at: string
          id: string
          rated_user_id: string
          rater_id: string
          rating: number
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          rated_user_id: string
          rater_id: string
          rating: number
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rated_user_id?: string
          rater_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_email: { Args: never; Returns: string }
      get_weekly_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          rank: number
          total_points: number
          user_id: string
          username: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      match_pets: {
        Args: {
          filter_status: string
          filter_type: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          description: string
          id: string
          image_urls: string[]
          name: string
          similarity: number
          status: string
        }[]
      }
      request_pet_contact: { Args: { pet_id: string }; Returns: undefined }
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
